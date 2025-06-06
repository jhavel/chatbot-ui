import { NextResponse } from "next/server"
import { handleCodeEditRequest } from "@/app/api/assistant/coding-agent/chat-helpers"

export async function POST(req: Request) {
  const { instruction, fileName } = await req.json()

  const { diff } = await handleCodeEditRequest(instruction, fileName)

  return NextResponse.json({
    content: `Here is the proposed diff:\n\n${diff}`
  })
}
