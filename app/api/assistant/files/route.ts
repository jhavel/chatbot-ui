import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const { path: filePath, operation, pattern, replacement } = await req.json()

    console.log("🔧 File update request received:", {
      filePath,
      operation,
      pattern,
      replacement
    })

    if (!filePath || !operation || !pattern || !replacement) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      )
    }

    const absolutePath = path.resolve(process.cwd(), filePath)

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { status: "error", message: `File not found: ${absolutePath}` },
        { status: 404 }
      )
    }

    const fileContent = fs.readFileSync(absolutePath, "utf8")

    let updatedContent = fileContent

    if (operation === "replace") {
      const regex = new RegExp(pattern, "g")
      updatedContent = fileContent.replace(regex, replacement)
    } else {
      return NextResponse.json(
        { status: "error", message: `Unsupported operation: ${operation}` },
        { status: 400 }
      )
    }

    fs.writeFileSync(absolutePath, updatedContent, "utf8")

    return NextResponse.json({ status: "success", updated: true })
  } catch (error: any) {
    console.error("❌ Error in file update:", error)
    return NextResponse.json(
      { status: "error", message: error.message || "Unknown error" },
      { status: 500 }
    )
  }
}
