import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import {
  getAssistantMemoryContext,
  saveAssistantMemory
} from "@/lib/assistant-memory-helpers"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get memory context for git operations
    const memoryContext = await getAssistantMemoryContext(
      "git status check",
      2,
      0.3
    )

    const { stdout } = await execAsync("git status --short")

    // Save git status check as memory
    await saveAssistantMemory(
      `User checked git status. Status: ${stdout.trim() || "clean working directory"}`
    )

    const response: any = { success: true, status: stdout }
    if (memoryContext) {
      response.memoryContext = memoryContext
    }

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
