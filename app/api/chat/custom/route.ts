import { ChatSettings } from "@/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages, customModelId } = json as {
    chatSettings: ChatSettings
    messages: any[]
    customModelId: string
  }

  try {
    const supabaseAdmin = createAdminClient()

    const { data: customModel, error } = await supabaseAdmin
      .from("models")
      .select("*")
      .eq("id", customModelId)
      .single()

    if (!customModel) {
      throw new Error(error.message)
    }

    const custom = new OpenAI({
      apiKey: customModel.api_key || "",
      baseURL: customModel.base_url
    })

    const response = await custom.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      stream: true
    })

    const stream = OpenAIStream(response as any)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "Custom API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "Custom API Key is incorrect. Please fix it in your profile settings."
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
