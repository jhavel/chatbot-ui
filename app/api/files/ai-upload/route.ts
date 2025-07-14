import { createClient } from "@/lib/supabase/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import mammoth from "mammoth"

// Function to analyze file content and generate metadata
async function analyzeFileWithAI(file: File, fileContent?: string) {
  try {
    const profile = await getServerProfile()

    // Determine file type and create appropriate analysis prompt
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    const fileType = file.type

    let analysisPrompt = `Analyze this file and provide the following information in JSON format:
{
  "title": "A concise, descriptive title (max 100 chars)",
  "description": "A brief description of the file content (max 500 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "document|image|code|data|presentation|other"
}

File name: ${file.name}
File type: ${fileType}
File size: ${formatFileSize(file.size)}

`

    // Add content analysis for text-based files
    if (
      fileContent &&
      (fileType.startsWith("text/") ||
        fileExtension === "md" ||
        fileExtension === "txt" ||
        fileExtension === "json" ||
        fileExtension === "csv")
    ) {
      analysisPrompt += `File content preview (first 2000 characters):
${fileContent.substring(0, 2000)}${fileContent.length > 2000 ? "..." : ""}

`
    }

    // Add specific analysis for different file types
    if (fileType.startsWith("image/")) {
      analysisPrompt += `This is an image file. Analyze based on the filename and provide relevant tags for image content.`
    } else if (fileType.includes("pdf") || fileType.includes("document")) {
      analysisPrompt += `This appears to be a document. Focus on document type and potential content categories.`
    } else if (
      fileType.includes("spreadsheet") ||
      fileExtension === "xlsx" ||
      fileExtension === "csv"
    ) {
      analysisPrompt += `This appears to be a spreadsheet or data file. Focus on data analysis and business categories.`
    } else if (fileType.includes("presentation") || fileExtension === "pptx") {
      analysisPrompt += `This appears to be a presentation file. Focus on presentation topics and business categories.`
    }

    analysisPrompt += `

Please provide only valid JSON output.`

    // Call OpenAI API to analyze the file
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${profile.openai_api_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that analyzes files and generates metadata. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const analysis = data.choices[0]?.message?.content

    if (!analysis) {
      throw new Error("No analysis received from AI")
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(analysis)
      return {
        title: parsed.title || file.name,
        description: parsed.description || `Uploaded file: ${file.name}`,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        category: parsed.category || "other"
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", analysis)
      // Fallback to basic metadata
      return {
        title: file.name,
        description: `Uploaded file: ${file.name}`,
        tags: [fileExtension || "file"],
        category: "other"
      }
    }
  } catch (error) {
    console.error("AI analysis error:", error)
    // Fallback to basic metadata
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    return {
      title: file.name,
      description: `Uploaded file: ${file.name}`,
      tags: [fileExtension || "file"],
      category: "other"
    }
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Function to extract text content from file
async function extractFileContent(file: File): Promise<string> {
  try {
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    // For text-based files, extract content
    if (
      file.type.startsWith("text/") ||
      fileExtension === "md" ||
      fileExtension === "txt" ||
      fileExtension === "json" ||
      fileExtension === "csv"
    ) {
      const text = await file.text()
      return text
    }

    // For other file types, return empty string
    return ""
  } catch (error) {
    console.error("Error extracting file content:", error)
    return ""
  }
}

// Server-side file creation function
async function createFileServerSide(
  supabase: any,
  file: File,
  fileRecord: any,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) {
  const fileExtension = file.name.split(".").pop()

  if (fileExtension === "docx") {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({
      arrayBuffer
    })

    return createDocXFileServerSide(
      supabase,
      result.value,
      file,
      fileRecord,
      workspace_id,
      embeddingsProvider
    )
  } else {
    return createRegularFileServerSide(
      supabase,
      file,
      fileRecord,
      workspace_id,
      embeddingsProvider
    )
  }
}

// Server-side regular file creation
async function createRegularFileServerSide(
  supabase: any,
  file: File,
  fileRecord: any,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) {
  // Sanitize filename
  let validFilename = fileRecord.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase()
  const extension = file.name.split(".").pop()
  const extensionIndex = validFilename.lastIndexOf(".")
  const baseName = validFilename.substring(
    0,
    extensionIndex < 0 ? undefined : extensionIndex
  )
  const maxBaseNameLength = 100 - (extension?.length || 0) - 1
  if (baseName.length > maxBaseNameLength) {
    fileRecord.name = baseName.substring(0, maxBaseNameLength) + "." + extension
  } else {
    fileRecord.name = baseName + "." + extension
  }

  // Create file record
  const { data: createdFile, error } = await supabase
    .from("files")
    .insert([fileRecord])
    .select("*")
    .single()

  if (error) {
    console.error("File creation error:", error)
    throw new Error(error.message)
  }

  // Create file-workspace relationship
  const { error: workspaceError } = await supabase
    .from("file_workspaces")
    .insert([
      {
        user_id: createdFile.user_id,
        file_id: createdFile.id,
        workspace_id
      }
    ])

  if (workspaceError) {
    console.error("File workspace creation error:", workspaceError)
    throw new Error(workspaceError.message)
  }

  // Upload file to storage
  const fileName = `${createdFile.user_id}/${createdFile.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("files")
    .upload(fileName, file)

  if (uploadError) {
    console.error("File upload error:", uploadError)
    throw new Error(uploadError.message)
  }

  // Update file with path
  const { error: updateError } = await supabase
    .from("files")
    .update({ file_path: fileName })
    .eq("id", createdFile.id)

  if (updateError) {
    console.error("File path update error:", updateError)
    throw new Error(updateError.message)
  }

  // Process file for embeddings
  const formData = new FormData()
  formData.append("file_id", createdFile.id)
  formData.append("embeddingsProvider", embeddingsProvider)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/retrieval/process`,
    {
      method: "POST",
      body: formData
    }
  )

  if (!response.ok) {
    const jsonText = await response.text()
    const json = JSON.parse(jsonText)
    console.error(
      `Error processing file:${createdFile.id}, status:${response.status}, response:${json.message}`
    )
    // Clean up on processing error
    await supabase.from("files").delete().eq("id", createdFile.id)
    throw new Error(`Failed to process file: ${json.message}`)
  }

  // Get the final file record
  const { data: finalFile, error: fetchError } = await supabase
    .from("files")
    .select("*")
    .eq("id", createdFile.id)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  return finalFile
}

// Server-side DOCX file creation
async function createDocXFileServerSide(
  supabase: any,
  text: string,
  file: File,
  fileRecord: any,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) {
  // Create file record
  const { data: createdFile, error } = await supabase
    .from("files")
    .insert([fileRecord])
    .select("*")
    .single()

  if (error) {
    console.error("DOCX file creation error:", error)
    throw new Error(error.message)
  }

  // Create file-workspace relationship
  const { error: workspaceError } = await supabase
    .from("file_workspaces")
    .insert([
      {
        user_id: createdFile.user_id,
        file_id: createdFile.id,
        workspace_id
      }
    ])

  if (workspaceError) {
    console.error("DOCX file workspace creation error:", workspaceError)
    throw new Error(workspaceError.message)
  }

  // Upload file to storage
  const fileName = `${createdFile.user_id}/${createdFile.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("files")
    .upload(fileName, file)

  if (uploadError) {
    console.error("DOCX file upload error:", uploadError)
    throw new Error(uploadError.message)
  }

  // Update file with path
  const { error: updateError } = await supabase
    .from("files")
    .update({ file_path: fileName })
    .eq("id", createdFile.id)

  if (updateError) {
    console.error("DOCX file path update error:", updateError)
    throw new Error(updateError.message)
  }

  // Process DOCX file for embeddings
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/retrieval/process/docx`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        fileId: createdFile.id,
        embeddingsProvider,
        fileExtension: "docx"
      })
    }
  )

  if (!response.ok) {
    const jsonText = await response.text()
    const json = JSON.parse(jsonText)
    console.error(
      `Error processing DOCX file:${createdFile.id}, status:${response.status}, response:${json.message}`
    )
    // Clean up on processing error
    await supabase.from("files").delete().eq("id", createdFile.id)
    throw new Error(`Failed to process DOCX file: ${json.message}`)
  }

  // Get the final file record
  const { data: finalFile, error: fetchError } = await supabase
    .from("files")
    .select("*")
    .eq("id", createdFile.id)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  return finalFile
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(cookies())
    const profile = await getServerProfile()

    const formData = await req.formData()
    const file = formData.get("file") as File
    const workspace_id = formData.get("workspace_id") as string
    const folder_id = formData.get("folder_id") as string
    const related_entity_id = formData.get("related_entity_id") as string
    const related_entity_type = formData.get("related_entity_type") as string
    const embeddingsProvider =
      (formData.get("embeddingsProvider") as string) || "openai"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!workspace_id) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      )
    }

    // Validate workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, user_id")
      .eq("id", workspace_id)
      .single()

    if (workspaceError || !workspace) {
      console.error("Workspace validation error:", workspaceError)
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      )
    }

    if (workspace.user_id !== profile.user_id) {
      console.error("Workspace access denied:", {
        workspaceUserId: workspace.user_id,
        profileUserId: profile.user_id
      })
      return NextResponse.json(
        { error: "Access denied to workspace" },
        { status: 403 }
      )
    }

    // Extract file content for AI analysis
    const fileContent = await extractFileContent(file)

    // Analyze file with AI to generate metadata
    const aiAnalysis = await analyzeFileWithAI(file, fileContent)

    console.log("AI Analysis Result:", aiAnalysis)

    // Create file record with AI-generated metadata
    const fileRecord = {
      user_id: profile.user_id,
      name: aiAnalysis.title,
      description: aiAnalysis.description,
      file_path: "", // Will be set after upload
      type: file.type || "application/octet-stream",
      size: file.size,
      tokens: 0, // Will be calculated during processing
      tags: [...aiAnalysis.tags, aiAnalysis.category],
      uploaded_by: profile.display_name || profile.username,
      uploaded_at: new Date().toISOString(),
      related_entity_id: related_entity_id || null,
      related_entity_type: related_entity_type || null,
      folder_id: folder_id || null,
      sharing: "private" // Ensure sharing is set
    }

    console.log("Creating file with record:", {
      ...fileRecord,
      user_id: fileRecord.user_id // Log user_id for debugging
    })

    // Create the file using server-side logic
    const createdFile = await createFileServerSide(
      supabase,
      file,
      fileRecord,
      workspace_id,
      embeddingsProvider as "openai" | "local"
    )

    return NextResponse.json({
      success: true,
      file: createdFile,
      aiAnalysis: aiAnalysis
    })
  } catch (error: any) {
    console.error("AI file upload error:", error)

    // Provide more specific error messages
    if (error.message?.includes("row-level security policy")) {
      return NextResponse.json(
        {
          error:
            "Access denied. Please ensure you have permission to upload files to this workspace.",
          details: error.message
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}
