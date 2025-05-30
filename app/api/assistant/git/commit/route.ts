import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json(
        { error: "Missing commit message" },
        { status: 400 }
      )
    }

    const { stdout, stderr } = await execAsync(`git commit -m "${message}"`)

    if (stderr) {
      console.error("Git stderr:", stderr)
    }

    return NextResponse.json({ success: true, output: stdout.trim() })
  } catch (err: any) {
    console.error("Git commit error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
