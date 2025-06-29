console.log("🔥 OpenAI route hit")

import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"
import { getContextualMemories } from "@/db/memories"
import { fileTools } from "@/lib/tools/fileTools"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { intelligentMemorySystem } from "@/lib/intelligent-memory-system"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const runtime: ServerRuntime = "edge"

// Optimized context extraction - only extract meaningful context
const getOptimizedContext = (messages: any[]): string => {
  // Only use the last 2 messages for context to reduce processing
  const recentMessages = messages.slice(-2)

  return recentMessages
    .map(msg => {
      const content = msg.content || ""
      // Limit context length to prevent excessive processing
      return content.length > 200 ? content.substring(0, 200) + "..." : content
    })
    .join(" ")
    .trim()
}

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  // Create a server-side Supabase client
  const supabase = createRouteHandlerClient({ cookies })

  let memoryMessages: ChatCompletionCreateParamsBase["messages"] = []

  try {
    const profile = await getServerProfile()
    console.log("👤 User profile:", profile.user_id)

    // Use optimized context extraction
    const currentContext = getOptimizedContext(messages)
    console.log(
      "📝 Optimized context:",
      currentContext.substring(0, 100) + "..."
    )

    // INTELLIGENT MEMORY PROCESSING - NEW EFFICIENT SYSTEM
    const startTime = Date.now()
    const memoryResult = await intelligentMemorySystem.handleConversation(
      messages,
      profile.user_id
    )
    const processingTime = Date.now() - startTime

    console.log(`🧠 Intelligent memory processing:`, {
      shouldProcess: memoryResult.shouldProcess,
      priority: memoryResult.processingPriority,
      candidates: memoryResult.candidatesCount,
      processingTime: `${processingTime}ms`
    })

    // Only proceed with memory retrieval if we have meaningful context
    if (currentContext.length > 10) {
      // Get memory count for adaptive thresholds
      const memoryStats = await intelligentMemorySystem.getMemoryStats(
        profile.user_id
      )
      const memoryCount = memoryStats.totalMemories

      // Use adaptive similarity threshold based on memory count
      const similarityThreshold =
        memoryCount > 50 ? 0.7 : memoryCount > 20 ? 0.6 : 0.5

      // Use optimal memory limit
      const memoryLimit = Math.min(
        5,
        Math.max(2, Math.floor(memoryCount / 10) + 1)
      )

      console.log(
        `🎯 Memory retrieval: threshold=${similarityThreshold}, limit=${memoryLimit}`
      )

      const relevantMemories = await getContextualMemories(
        profile.user_id,
        currentContext,
        memoryLimit,
        similarityThreshold
      )

      console.log("🔍 Found relevant memories:", relevantMemories.length)

      // Create memory context only if we have relevant memories
      if (relevantMemories.length > 0) {
        const memoryContext = relevantMemories
          .map(memory => `• ${memory.content}`)
          .join("\n")

        const systemPrompt = chatSettings.model?.includes("gpt-4o")
          ? `You have access to the following relevant memories about the user:\n\n${memoryContext}\n\nUse this information to provide more personalized and contextual responses. If the memories are relevant to the current conversation, reference them naturally in your response.`
          : `IMPORTANT: Use these user memories to personalize your response:\n\n${memoryContext}\n\nReference relevant memories when responding to provide personalized answers.`

        memoryMessages = [
          {
            role: "system",
            content: systemPrompt
          }
        ]
      }
    }

    // If no memories found, use a simple prompt
    if (memoryMessages.length === 0) {
      memoryMessages = [
        {
          role: "system",
          content:
            "You are a helpful AI assistant. Provide clear, accurate, and helpful responses."
        }
      ]
    }

    console.log(
      "🧠 Memory context prepared:",
      memoryMessages.length,
      "messages"
    )
  } catch (e) {
    console.error("Error in intelligent memory processing:", e)
    // Fallback to simple system message
    memoryMessages = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant. Provide clear, accurate, and helpful responses."
      }
    ]
  }

  const finalMessages = [...memoryMessages, ...messages]

  try {
    const profile = await getServerProfile()
    checkApiKey(profile.openai_api_key, "OpenAI")

    // Use fetch to call OpenAI API directly for streaming
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${profile.openai_api_key}`,
        "Content-Type": "application/json",
        ...(profile.openai_organization_id
          ? { "OpenAI-Organization": profile.openai_organization_id }
          : {})
      },
      body: JSON.stringify({
        model: chatSettings.model,
        messages: finalMessages,
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
        stream: true
      })
    })

    console.log("[OpenAI] Response status:", response.status)

    // If the response is not ok, stream an error
    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI API error:", errorText)
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const errorData = `data: ${JSON.stringify({ choices: [{ delta: { content: errorText } }] })}\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      })
      return new StreamingTextResponse(stream)
    }

    // Create a stream of the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error("No response body")
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
                  break
                }
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`)
                    )
                  }
                } catch (e) {
                  console.error("Error parsing chunk:", e)
                }
              }
            }
          }
        } catch (error) {
          console.error("Streaming error:", error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [
                  {
                    delta: {
                      content:
                        "Sorry, I encountered an error. Please try again."
                    }
                  }
                ]
              })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      }
    })

    // Return a StreamingTextResponse, which can be consumed by the client
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error("Error in OpenAI API call:", error)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const errorData = `data: ${JSON.stringify({
          choices: [
            {
              delta: {
                content: "Sorry, I encountered an error. Please try again."
              }
            }
          ]
        })}\n`
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      }
    })
    return new StreamingTextResponse(stream)
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 30
