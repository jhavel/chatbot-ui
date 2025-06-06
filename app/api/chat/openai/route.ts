console.log("🔥 OpenAI route hit")

import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"
import { getMemories } from "@/lib/supabase/memories"
import { fileTools } from "@/lib/tools/fileTools"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  let memoryMessages: ChatCompletionCreateParamsBase["messages"] = []

  try {
    const memories = await getMemories()
    memoryMessages = memories.map(entry => ({
      role: "system",
      content: `Memory: ${entry.content}`
    }))
    console.log("🧠 Injected memory messages:", memoryMessages)
  } catch (e) {
    console.error("Error loading memories:", e)
  }

  const finalMessages = [...memoryMessages, ...messages]

  try {
    const profile = await getServerProfile()
    checkApiKey(profile.openai_api_key, "OpenAI")

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    const response = await openai.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: finalMessages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      max_tokens:
        chatSettings.model === "gpt-4-vision-preview" ||
        chatSettings.model === "gpt-4o"
          ? 4096
          : null,
      tools: fileTools.map(({ name, description, parameters }) => ({
        type: "function",
        function: { name, description, parameters }
      })),
      stream: false
    })

    const toolCall = response.choices?.[0]?.message?.tool_calls?.[0]

    if (toolCall) {
      const tool = fileTools.find(t => t.name === toolCall.function.name)

      if (!tool) {
        return new Response(JSON.stringify({ message: "Unknown tool" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      }

      const args = JSON.parse(toolCall.function.arguments)
      const result = await tool.function(args)

      const followup = await openai.chat.completions.create({
        model: chatSettings.model,
        messages: [
          ...finalMessages,
          response.choices[0].message,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          }
        ]
      })

      return new Response(
        JSON.stringify({ message: followup.choices[0].message }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    return new Response(
      JSON.stringify({ message: response.choices[0].message }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenAI API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "OpenAI API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
      headers: { "Content-Type": "application/json" }
    })
  }
}
