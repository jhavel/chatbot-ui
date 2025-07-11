import { createClient } from "@/lib/supabase/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { NextRequest, NextResponse } from "next/server"
import { createFileBasedOnExtension } from "@/db/files"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(cookies())
    const profile = await getServerProfile()

    const formData = await req.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const tags = formData.get("tags") as string
    const folder_id = formData.get("folder_id") as string
    const workspace_id = formData.get("workspace_id") as string
    const related_entity_id = formData.get("related_entity_id") as string
    const related_entity_type = formData.get("related_entity_type") as string
    const embeddingsProvider =
      (formData.get("embeddingsProvider") as string) || "openai"

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
      related_entity_id: related_entity_id || null,
      related_entity_type: related_entity_type || null,
      folder_id: folder_id || null
    }

    // Create the file using existing logic
    const createdFile = await createFileBasedOnExtension(
      file,
      fileRecord,
      workspace_id,
      embeddingsProvider as "openai" | "local"
    )

    return NextResponse.json({
      success: true,
      file: createdFile
    })
  } catch (error: any) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}
