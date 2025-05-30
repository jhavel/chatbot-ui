import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(req: Request) {
  try {
    const { filePath } = await req.json()

    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 })
    }

    const { stdout, stderr } = await execAsync(`git add ${filePath}`)

    if (stderr) {
      console.error("Git stderr:", stderr)
    }

    return NextResponse.json({ success: true, output: stdout.trim() })
  } catch (err: any) {
    console.error("Git add error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
