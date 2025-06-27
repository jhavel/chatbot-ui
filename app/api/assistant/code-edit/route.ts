import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { handleCodeEditRequest } from "@/app/api/assistant/coding-agent/chat-helpers"
import {
  getAssistantMemoryContext,
  saveAssistantMemory
} from "@/lib/assistant-memory-helpers"

export async function POST(req: Request) {
  const supabase = createClient(cookies())
  const { instruction, fileName } = await req.json()

  // Get memory context for code editing
  const memoryContext = await getAssistantMemoryContext(
    supabase,
    `code edit: ${instruction} for file ${fileName}`,
    3,
    0.4
  )

  const { diff } = await handleCodeEditRequest(instruction, fileName)

  // Save code editing interaction as memory
  await saveAssistantMemory(
    supabase,
    `User requested code edit: ${instruction} for file ${fileName}. Diff generated successfully.`
  )

  // Include memory context in response if available
  let content = `Here is the proposed diff:\n\n${diff}`
  if (memoryContext) {
    content = `User Context:\n${memoryContext}\n\n${content}`
  }

  return NextResponse.json({
    content
  })
}
