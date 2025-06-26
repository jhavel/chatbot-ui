import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openrouter_api_key, "OpenRouter")

    const openai = new OpenAI({
      apiKey: profile.openrouter_api_key || "",
      baseURL: "https://openrouter.ai/api/v1"
    })

    const response = await openai.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      max_tokens: undefined,
      stream: true
    })

    const stream = OpenAIStream(response as any)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenRouter API Key not found. Please set it in your profile settings."
    }
    // Stream the error message in SSE format
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const errorData = `data: ${JSON.stringify({ choices: [{ delta: { content: errorMessage } }] })}\n`
        controller.enqueue(encoder.encode(errorData))
        controller.enqueue(encoder.encode("data: [DONE]\n"))
        controller.close()
      }
    })
    return new StreamingTextResponse(stream, { status: errorCode })
  }
}
