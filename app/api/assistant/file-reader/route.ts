import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const { filePath } = await req.json()

    // Resolve securely
    const resolvedPath = path.resolve(process.cwd(), filePath)

    const content = await fs.readFile(resolvedPath, "utf-8")

    return NextResponse.json({ success: true, content })
  } catch (err) {
    return NextResponse.json({ success: false, content: "Error reading file." })
  }
}
