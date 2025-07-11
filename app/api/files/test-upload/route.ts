import { createClient } from "@/lib/supabase/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(cookies())
    const profile = await getServerProfile()

    console.log("Profile user_id:", profile.user_id)
    console.log("Profile:", profile)

    const formData = await req.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const tags = formData.get("tags") as string
    const workspace_id = formData.get("workspace_id") as string

    console.log("Form data:", {
      fileName: file?.name,
      name,
      description,
      tags,
      workspace_id
    })

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      )
    }

    // Parse tags from string to array
    const tagsArray = tags
      ? tags
          .split(",")
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      : []

    // Create file record
    const fileRecord = {
      user_id: profile.user_id,
      name: name,
      description: description || "",
      file_path: "", // Will be set after upload
      type: file.type || "application/octet-stream",
      size: file.size,
      tokens: 0, // Will be calculated during processing
      tags: tagsArray,
      uploaded_by: profile.display_name || profile.username,
      uploaded_at: new Date().toISOString(),
      related_entity_id: null,
      related_entity_type: null,
      folder_id: null
    }

    console.log("File record to insert:", fileRecord)

    // Test the insert using the debug function
    const { data: debugResult, error: debugError } = await supabase.rpc(
      "debug_file_insert",
      {
        p_user_id: profile.user_id,
        p_name: fileRecord.name,
        p_description: fileRecord.description,
        p_file_path: fileRecord.file_path,
        p_type: fileRecord.type,
        p_size: fileRecord.size,
        p_tokens: fileRecord.tokens,
        p_tags: fileRecord.tags,
        p_uploaded_by: fileRecord.uploaded_by,
        p_uploaded_at: fileRecord.uploaded_at,
        p_related_entity_id: fileRecord.related_entity_id,
        p_related_entity_type: fileRecord.related_entity_type,
        p_folder_id: fileRecord.folder_id
      }
    )

    if (debugError) {
      console.error("Debug function error:", debugError)
      return NextResponse.json(
        {
          error: `Debug function error: ${debugError.message}`,
          details: debugError
        },
        { status: 500 }
      )
    }

    if (!debugResult || debugResult.length === 0) {
      return NextResponse.json(
        { error: "No result from debug function" },
        { status: 500 }
      )
    }

    const result = debugResult[0]
    if (!result.success) {
      console.error("File insert failed:", result.error_message)
      return NextResponse.json(
        { error: `File insert failed: ${result.error_message}` },
        { status: 500 }
      )
    }

    // Get the created file
    const { data: createdFile, error: fetchError } = await supabase
      .from("files")
      .select("*")
      .eq("id", result.file_id)
      .single()

    if (fetchError) {
      console.error("Fetch created file error:", fetchError)
      return NextResponse.json(
        { error: `Fetch error: ${fetchError.message}`, details: fetchError },
        { status: 500 }
      )
    }

    console.log("Created file:", createdFile)

    // Create file workspace relationship
    if (workspace_id) {
      const { error: workspaceError } = await supabase
        .from("file_workspaces")
        .insert([
          {
            user_id: profile.user_id,
            file_id: createdFile.id,
            workspace_id: workspace_id
          }
        ])

      if (workspaceError) {
        console.error("Workspace error:", workspaceError)
        return NextResponse.json(
          {
            error: `Workspace error: ${workspaceError.message}`,
            details: workspaceError
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      file: createdFile
    })
  } catch (error: any) {
    console.error("Test upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file", details: error },
      { status: 500 }
    )
  }
}
