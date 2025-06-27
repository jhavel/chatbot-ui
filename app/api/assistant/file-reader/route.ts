import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import fs from "fs/promises"
import path from "path"
import {
  getAssistantMemoryContext,
  saveAssistantMemory
} from "@/lib/assistant-memory-helpers"

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(cookies())
    const { filePath } = await req.json()

    // Resolve securely
    const resolvedPath = path.resolve(process.cwd(), filePath)

    // Get memory context for file reading
    const memoryContext = await getAssistantMemoryContext(
      supabase,
      `reading file ${filePath}`,
      2,
      0.3
    )

    const content = await fs.readFile(resolvedPath, "utf-8")

    // Save file reading interaction as memory
    await saveAssistantMemory(
      supabase,
      `User read file: ${filePath}. File size: ${content.length} characters.`
    )

    // Include memory context in response if available
    const response: any = { success: true, content }
    if (memoryContext) {
      response.memoryContext = memoryContext
    }

    return NextResponse.json(response)
  } catch (err) {
    return NextResponse.json({ success: false, content: "Error reading file." })
  }
}
