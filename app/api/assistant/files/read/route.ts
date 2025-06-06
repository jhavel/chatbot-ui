import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  const { filePath } = await req.json()

  if (!filePath) {
    return NextResponse.json(
      { success: false, error: "Missing filePath" },
      { status: 400 }
    )
  }

  const absolutePath = path.resolve(process.cwd(), filePath)

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json(
      { success: false, error: "File not found" },
      { status: 404 }
    )
  }

  const content = fs.readFileSync(absolutePath, "utf8")

  return NextResponse.json({ success: true, content })
}
