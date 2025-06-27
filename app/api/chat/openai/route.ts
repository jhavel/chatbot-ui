console.log("🔥 OpenAI route hit")

import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"
import { getContextualMemories, saveMemory } from "@/db/memories"
import { fileTools } from "@/lib/tools/fileTools"
import { OpenAIStream, StreamingTextResponse } from "ai"
import {
  extractMemoriesWithConfidence,
  saveExtractedMemories,
  MemoryExtractionConfig
} from "@/lib/memory-extraction"
import {
  calculateAdaptiveThreshold,
  getOptimalMemoryLimit
} from "@/lib/memory-optimization"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Configuration for proactive memory extraction
const memoryExtractionConfig: MemoryExtractionConfig = {
  enableProactiveExtraction: true, // ENABLED to save all user messages
  extractionThreshold: 0.7, // Only extract memories with 70%+ confidence
  maxMemoriesPerConversation: 5,
  enableSummarization: true,
  enableDuplicateDetection: false // Disabled since we bypassed it
}

// Optimized memory retrieval with better context extraction
const getOptimizedContext = (messages: any[]): string => {
  // Extract key terms and topics from recent messages
  const recentMessages = messages.slice(-5) // Last 5 messages
  const contextWords: string[] = []

  for (const message of recentMessages) {
    const content = message.content.toLowerCase()

    // Extract key terms (simple keyword extraction)
    const words = content.split(/\s+/)
    const keyTerms = words.filter(
      (word: string) =>
        word.length > 2 &&
        ![
          "the",
          "and",
          "but",
          "for",
          "are",
          "with",
          "this",
          "that",
          "have",
          "they",
          "will",
          "from",
          "said",
          "each",
          "which",
          "their",
          "time",
          "would",
          "there",
          "could",
          "other",
          "than",
          "first",
          "been",
          "call",
          "who",
          "its",
          "now",
          "find",
          "down",
          "day",
          "did",
          "get",
          "come",
          "made",
          "may",
          "part",
          "you",
          "your",
          "what",
          "how",
          "why",
          "when",
          "where"
        ].includes(word)
    )

    contextWords.push(...keyTerms.slice(0, 15)) // Top 15 words per message
  }

  // Also include the full content of the last user message for better context
  const lastUserMessage = messages.filter(m => m.role === "user").pop()
  if (lastUserMessage) {
    contextWords.push(lastUserMessage.content.toLowerCase())
  }

  return contextWords.join(" ")
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

    // PROACTIVE MEMORY EXTRACTION - NEW FEATURE
    if (memoryExtractionConfig.enableProactiveExtraction) {
      try {
        console.log("🧠 Starting proactive memory extraction...")

        // Extract memories from current conversation
        const extractedMemories = await extractMemoriesWithConfidence(
          messages,
          profile.user_id,
          memoryExtractionConfig
        )

        if (extractedMemories.length > 0) {
          console.log(
            `💡 Extracted ${extractedMemories.length} potential memories`
          )

          // Save extracted memories with enhanced processing
          await saveExtractedMemories(
            extractedMemories,
            profile.user_id,
            memoryExtractionConfig,
            supabase
          )
        }
      } catch (error) {
        console.error("❌ Error in proactive memory extraction:", error)
      }
    }

    // Get memory count for adaptive thresholds
    const { getMemoryStats } = await import("@/lib/memory-system")
    const memoryStats = await getMemoryStats(profile.user_id)
    const memoryCount = memoryStats?.totalMemories || 0

    // Use adaptive similarity threshold
    const similarityThreshold = calculateAdaptiveThreshold(
      profile.user_id,
      memoryCount,
      currentContext
    )

    // Use optimal memory limit
    const memoryLimit = getOptimalMemoryLimit(memoryCount, currentContext)

    console.log(
      `🎯 Using adaptive threshold: ${similarityThreshold}, limit: ${memoryLimit}`
    )

    const relevantMemories = await getContextualMemories(
      profile.user_id,
      currentContext,
      memoryLimit,
      similarityThreshold
    )

    console.log("🔍 Found relevant memories:", relevantMemories.length)
    if (relevantMemories.length === 0) {
      console.log("⚠️ No memories found - this might indicate:")
      console.log("   - No memories exist for this user")
      console.log("   - Similarity threshold is still too high")
      console.log("   - Context extraction isn't working well")
      console.log("   - Embeddings aren't being generated properly")
      console.log("   - RLS policies might be blocking access")

      // Try with even lower threshold for debugging
      console.log("🔍 Trying with very low threshold (0.1) for debugging...")
      const debugMemories = await getContextualMemories(
        profile.user_id,
        currentContext,
        5,
        0.1
      )
      console.log("🔍 Debug memories found:", debugMemories.length)
      if (debugMemories.length > 0) {
        console.log("✅ Memories exist but threshold was too high!")
        relevantMemories.push(...debugMemories)
      }
    }
    relevantMemories.forEach((memory, index) => {
      console.log(
        `  Memory ${index + 1}:`,
        memory.content.substring(0, 50) + "...",
        `(similarity: ${memory.similarity})`
      )
    })

    // Create more explicit memory context for GPT-4 Turbo
    if (relevantMemories.length > 0) {
      const memoryContext = relevantMemories
        .map(memory => `• ${memory.content}`)
        .join("\n")

      const systemPrompt = chatSettings.model?.includes("gpt-4o")
        ? `You have access to the following relevant memories about the user:\n\n${memoryContext}\n\nUse this information to provide more personalized and contextual responses. If the memories are relevant to the current conversation, reference them naturally in your response.\n\nIMPORTANT: When you learn new personal information about the user (preferences, experiences, facts about them, etc.), incorporate this information naturally into your responses. The system will automatically save important personal details for future reference.`
        : `IMPORTANT: Use these user memories to personalize your response:\n\n${memoryContext}\n\nALWAYS reference relevant memories when responding. If the user asks about themselves or their preferences, use the memories above to provide personalized answers.\n\nCRITICAL: When you learn new personal information about the user (preferences, experiences, facts about them, etc.), incorporate this information naturally into your responses. The system will automatically save important personal details for future reference.`

      memoryMessages = [
        {
          role: "system",
          content: systemPrompt
        }
      ]
    } else {
      // No existing memories - encourage memory creation
      const memoryCreationPrompt = chatSettings.model?.includes("gpt-4o")
        ? `You are a helpful AI assistant with memory capabilities. When you learn new personal information about the user (preferences, experiences, facts about them, etc.), incorporate this information naturally into your responses. The system will automatically save important personal details for future reference.`
        : `You are a helpful AI assistant with memory capabilities. When you learn new personal information about the user (preferences, experiences, facts about them, etc.), incorporate this information naturally into your responses. The system will automatically save important personal details for future reference.`

      memoryMessages = [
        {
          role: "system",
          content: memoryCreationPrompt
        }
      ]
    }

    console.log(
      "🧠 Injected contextual memory messages:",
      memoryMessages.length,
      "memories"
    )
    console.log("📝 Relevant memories found:", relevantMemories.length)

    // LEGACY MEMORY EXTRACTION ENABLED FOR TESTING
    // This provides a fallback method for memory saving
    const importantInfo = extractImportantInfo(messages)
    console.log(
      "💡 Extracted important info (legacy):",
      importantInfo.length,
      "items"
    )

    for (const info of importantInfo) {
      try {
        await saveMemory(info, profile.user_id, supabase)
        console.log("💾 Saved memory (legacy):", info.substring(0, 50) + "...")
      } catch (error) {
        console.error("Error saving memory:", error)
      }
    }
  } catch (e) {
    console.error("Error loading contextual memories:", e)
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

    // Log headers and status for debugging
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
          controller.enqueue(encoder.encode("data: [DONE]\n"))
          controller.close()
        }
      })
      return new StreamingTextResponse(stream, { status: response.status })
    }

    // Manually proxy the OpenAI response stream to the client
    if (!response.body) {
      return new Response("No response body from OpenAI", { status: 500 })
    }
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      }
    })
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

    console.error("❌ OpenAI API error:", errorMessage)

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

// LEGACY: Keep the old extraction function for backward compatibility
const extractImportantInfo = (messages: any[]): string[] => {
  const importantInfo: string[] = []

  // Look for user messages that contain personal information
  for (const message of messages) {
    if (message.role === "user") {
      const content = message.content.toLowerCase()

      // Check for personal information patterns
      if (
        content.includes("my name is") ||
        content.includes("i am") ||
        content.includes("i'm") ||
        content.includes("call me") ||
        content.includes("my name's")
      ) {
        importantInfo.push(message.content)
      }

      // Check for preferences and likes/dislikes
      if (
        content.includes("i like") ||
        content.includes("i prefer") ||
        content.includes("i don't like") ||
        content.includes("i love") ||
        content.includes("i hate") ||
        content.includes("i enjoy") ||
        content.includes("my favorite") ||
        content.includes("i'm into") ||
        content.includes("i'm interested in")
      ) {
        importantInfo.push(message.content)
      }

      // Check for work/project information
      if (
        content.includes("i work") ||
        content.includes("my job") ||
        content.includes("my project") ||
        content.includes("i'm a") ||
        content.includes("i do") ||
        content.includes("my role") ||
        content.includes("my company") ||
        content.includes("my team")
      ) {
        importantInfo.push(message.content)
      }

      // Check for technical information and skills
      if (
        content.includes("code") ||
        content.includes("programming") ||
        content.includes("function") ||
        content.includes("technology") ||
        content.includes("framework") ||
        content.includes("language") ||
        content.includes("stack") ||
        content.includes("tools") ||
        content.includes("libraries")
      ) {
        importantInfo.push(message.content)
      }

      // Check for personal details
      if (
        content.includes("i live") ||
        content.includes("my location") ||
        content.includes("i'm from") ||
        content.includes("my age") ||
        (content.includes("i'm") &&
          (content.includes("years old") || content.includes("old")))
      ) {
        importantInfo.push(message.content)
      }

      // Check for goals and aspirations
      if (
        content.includes("i want to") ||
        content.includes("i'm trying to") ||
        content.includes("my goal") ||
        content.includes("i hope to") ||
        content.includes("i plan to") ||
        content.includes("i'm working on")
      ) {
        importantInfo.push(message.content)
      }

      // Check for personal experiences
      if (
        content.includes("i experienced") ||
        content.includes("i went through") ||
        content.includes("i had") ||
        content.includes("i learned") ||
        content.includes("i discovered") ||
        content.includes("i found out")
      ) {
        importantInfo.push(message.content)
      }
    }
  }

  return importantInfo
}

export const dynamic = "force-dynamic"
export const maxDuration = 30
export const runtime = "edge"
