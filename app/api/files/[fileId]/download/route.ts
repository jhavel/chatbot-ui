import { createClient } from "@/lib/supabase/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const supabase = createClient(cookies())
    const profile = await getServerProfile()

    // Get file metadata
    const { data: file, error } = await supabase
      .from("files")
      .select("name, file_path, user_id")
      .eq("id", params.fileId)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Check if user owns the file
    if (file.user_id !== profile.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get signed URL for download
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("files")
        .createSignedUrl(file.file_path, 60 * 5) // 5 minutes

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError)
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      )
    }

    // Download the file
    const downloadResponse = await fetch(signedUrlData.signedUrl)

    if (!downloadResponse.ok) {
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      )
    }

    const fileBuffer = await downloadResponse.arrayBuffer()

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Length": fileBuffer.byteLength.toString()
      }
    })
  } catch (error: any) {
    console.error("File download error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to download file" },
      { status: 500 }
    )
  }
}
