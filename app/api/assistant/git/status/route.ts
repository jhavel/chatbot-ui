import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout } = await execAsync("git status --short")
    return NextResponse.json({ success: true, status: stdout })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
