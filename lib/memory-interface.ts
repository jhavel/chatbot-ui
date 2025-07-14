import { createClient } from "@/lib/supabase/client"
import { saveEnhancedMemory } from "@/lib/memory-system"
import { validateMemoryContent } from "./memory-validation"

// Audit function for memory operations
const auditMemorySave = (
  user_id: string,
  source: string,
  content: string,
  context: any,
  status: "attempt" | "saved" | "rejected" | "error",
  error?: any
) => {
  console.log(`[AUDIT] Memory Save Attempt:`, {
    user_id,
    source,
    content: content.substring(0, 100) + "...",
    context,
    status,
    error: error?.message,
    stack: error?.stack
  })
}

// Unified memory save function with context support
export const saveMemoryUnified = async (
  supabase: any,
  options: {
    content: string
    user_id: string
    source: "user" | "ai" | "system"
    context?: any
    validationLevel?: "strict" | "normal" | "lenient"
  }
) => {
  const {
    content,
    user_id,
    source,
    context = {},
    validationLevel = "normal"
  } = options

  try {
    // Audit the attempt
    auditMemorySave(user_id, source, content, context, "attempt")

    // Validate content based on level
    if (!validateMemoryContent(content, validationLevel)) {
      auditMemorySave(
        user_id,
        source,
        content,
        context,
        "rejected",
        new Error("Validation failed")
      )
      throw new Error("Memory content validation failed")
    }

    // Extract context string for quality scoring
    const contextString =
      typeof context === "string"
        ? context
        : context.conversation
          ? context.conversation
          : context.topics
            ? context.topics.join(", ")
            : ""

    // Save memory with context
    const memory = await saveEnhancedMemory(
      supabase,
      content,
      user_id,
      contextString
    )

    // Audit successful save
    auditMemorySave(user_id, source, content, context, "saved")

    return memory
  } catch (error) {
    // Audit error
    auditMemorySave(user_id, source, content, context, "error", error)
    throw error
  }
}

// Batch memory save function
export const saveMemoriesBatch = async (
  supabase: any,
  memories: Array<{
    content: string
    user_id: string
    source: "user" | "ai" | "system"
    context?: any
  }>
) => {
  const results = []
  const errors = []

  for (const memory of memories) {
    try {
      const result = await saveMemoryUnified(supabase, memory)
      results.push(result)
    } catch (error) {
      errors.push({ memory, error })
      console.error("Error saving memory in batch:", error)
    }
  }

  return { results, errors }
}

// Memory quality assessment
export const assessMemoryQuality = (
  content: string,
  context: string = ""
): {
  score: number
  reasons: string[]
  recommendation: "save" | "skip" | "review"
} => {
  const reasons: string[] = []
  let score = 0.5 // Base score

  // Content length analysis
  const wordCount = content.split(/\s+/).length
  if (wordCount < 5) {
    score -= 0.3
    reasons.push("Content too short")
  } else if (wordCount > 200) {
    score += 0.1
    reasons.push("Detailed content")
  }

  // Personal information detection
  if (
    /my name is|i am|i'm|i work as|my job is|i live in|i'm from/i.test(
      content.toLowerCase()
    )
  ) {
    score += 0.4
    reasons.push("Contains personal information")
  }

  // Preference detection
  if (
    /i like|i prefer|i love|i hate|i enjoy|my favorite/i.test(
      content.toLowerCase()
    )
  ) {
    score += 0.3
    reasons.push("Contains preferences")
  }

  // Project information detection
  if (
    /project|goal|objective|deadline|timeline|i'm working on/i.test(
      content.toLowerCase()
    )
  ) {
    score += 0.3
    reasons.push("Contains project information")
  }

  // Question detection (negative)
  if (
    /^(what|how|when|where|why|who|which|do you|can you|could you)/i.test(
      content.trim()
    )
  ) {
    score -= 0.5
    reasons.push("Appears to be a question")
  }

  // Context relevance
  if (context && content.toLowerCase().includes(context.toLowerCase())) {
    score += 0.2
    reasons.push("Contextually relevant")
  }

  // Determine recommendation
  let recommendation: "save" | "skip" | "review"
  if (score >= 0.7) {
    recommendation = "save"
  } else if (score <= 0.3) {
    recommendation = "skip"
  } else {
    recommendation = "review"
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    reasons,
    recommendation
  }
}

// Memory cleanup and optimization
export const optimizeMemorySystem = async (user_id: string) => {
  try {
    const supabase = createClient()

    // Import optimization functions
    const { optimizeMemorySystem: optimizeMemories } = await import(
      "./memory-optimization"
    )

    const result = await optimizeMemories(user_id)

    console.log(`🧹 Memory optimization completed for user ${user_id}:`, result)

    return result
  } catch (error) {
    console.error("Error optimizing memory system:", error)
    throw error
  }
}

// Memory statistics
export const getMemoryStats = async (user_id: string) => {
  try {
    const supabase = createClient()

    // Import stats function
    const { getMemoryStats: getStats } = await import("./memory-system")

    const stats = await getStats(supabase, user_id)

    return stats
  } catch (error) {
    console.error("Error getting memory stats:", error)
    return {
      totalMemories: 0,
      totalClusters: 0,
      avgRelevanceScore: 0,
      typeDistribution: {}
    }
  }
}
