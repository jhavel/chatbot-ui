import { getRelevantMemories } from "@/lib/memory-system"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { saveMemoryUnified } from "./memory-interface"
import { createClient } from "@/lib/supabase/client"

export const getAssistantMemoryContext = async (
  supabase: any,
  context: string,
  limit: number = 3,
  similarityThreshold: number = 0.4
) => {
  try {
    const profile = await getServerProfile()
    const relevantMemories = await getRelevantMemories(
      supabase,
      profile.user_id,
      context,
      limit,
      similarityThreshold
    )

    if (relevantMemories.length === 0) {
      return ""
    }

    return `\n\nUser Context:\n${relevantMemories
      .map(m => `• ${m.content}`)
      .join("\n")}\n`
  } catch (error) {
    console.error("Error getting assistant memory context:", error)
    return ""
  }
}

export const saveAssistantMemory = async (supabase: any, content: string) => {
  try {
    const profile = await getServerProfile()
    await saveMemoryUnified(supabase, {
      content,
      user_id: profile.user_id,
      source: "assistant",
      context: { function: "saveAssistantMemory" }
    })
    console.log("🧠 Assistant memory saved:", content.substring(0, 50) + "...")
  } catch (error) {
    console.error("Failed to save assistant memory:", error)
  }
}

export const getAssistantMemoryContextWithDebug = async (
  supabase: any,
  context: string,
  limit: number = 3,
  similarityThreshold: number = 0.4
) => {
  try {
    const profile = await getServerProfile()
    console.log("🔍 Assistant memory retrieval details:")
    console.log("  - Context:", context.substring(0, 100) + "...")
    console.log("  - Threshold:", similarityThreshold)
    console.log("  - User ID:", profile.user_id)

    const relevantMemories = await getRelevantMemories(
      supabase,
      profile.user_id,
      context,
      limit,
      similarityThreshold
    )

    console.log("  - Found memories:", relevantMemories.length)
    relevantMemories.forEach((memory, index) => {
      console.log(`  - Memory ${index + 1}:`, {
        content: memory.content.substring(0, 50) + "...",
        similarity: memory.similarity,
        relevance_score: memory.relevance_score
      })
    })

    if (relevantMemories.length === 0) {
      return ""
    }

    return `\n\nUser Context:\n${relevantMemories
      .map(m => `• ${m.content}`)
      .join("\n")}\n`
  } catch (error) {
    console.error("Error getting assistant memory context:", error)
    return ""
  }
}
