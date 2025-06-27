import { createClient } from "@/lib/supabase/client"
import { getMemoryStats } from "@/lib/memory-system"

const supabase = createClient()

export const calculateAdaptiveThreshold = (
  user_id: string,
  memoryCount: number,
  context: string
): number => {
  let baseThreshold = 0.6

  // Lower threshold for users with fewer memories
  if (memoryCount < 10) {
    baseThreshold = 0.4
  } else if (memoryCount < 50) {
    baseThreshold = 0.5
  }

  // Lower threshold for technical contexts
  if (
    context.toLowerCase().includes("code") ||
    context.toLowerCase().includes("programming") ||
    context.toLowerCase().includes("development")
  ) {
    baseThreshold -= 0.1
  }

  // Lower threshold for personal contexts
  if (
    context.toLowerCase().includes("name") ||
    context.toLowerCase().includes("prefer") ||
    context.toLowerCase().includes("like") ||
    context.toLowerCase().includes("work")
  ) {
    baseThreshold -= 0.1
  }

  // Lower threshold for project contexts
  if (
    context.toLowerCase().includes("project") ||
    context.toLowerCase().includes("task") ||
    context.toLowerCase().includes("goal")
  ) {
    baseThreshold -= 0.05
  }

  return Math.max(baseThreshold, 0.2) // Minimum threshold
}

export const getOptimalMemoryLimit = (
  memoryCount: number,
  context: string
): number => {
  let baseLimit = 5

  // Increase limit for users with more memories
  if (memoryCount > 100) {
    baseLimit = 8
  } else if (memoryCount > 50) {
    baseLimit = 6
  }

  // Increase limit for technical contexts
  if (
    context.toLowerCase().includes("code") ||
    context.toLowerCase().includes("programming")
  ) {
    baseLimit += 2
  }

  // Increase limit for complex queries
  if (context.length > 100) {
    baseLimit += 1
  }

  return Math.min(baseLimit, 10) // Maximum limit
}

export const pruneLowRelevanceMemories = async (
  user_id: string,
  relevanceThreshold: number = 0.3
): Promise<number> => {
  try {
    // Get memories with low relevance scores
    const { data: lowRelevanceMemories, error } = await supabase
      .from("memories")
      .select("id, content, relevance_score, access_count, last_accessed")
      .eq("user_id", user_id)
      .lt("relevance_score", relevanceThreshold)
      .order("relevance_score", { ascending: true })

    if (error || !lowRelevanceMemories) {
      console.error("Error fetching low relevance memories:", error)
      return 0
    }

    let prunedCount = 0

    for (const memory of lowRelevanceMemories) {
      // Only prune if it hasn't been accessed recently and has low access count
      const lastAccessed = memory.last_accessed
        ? new Date(memory.last_accessed)
        : new Date(0)
      const daysSinceAccess =
        (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceAccess > 30 && memory.access_count < 3) {
        // Archive the memory instead of deleting (soft delete)
        const { error: archiveError } = await supabase
          .from("memories")
          .update({
            relevance_score: 0.1, // Mark as archived
            updated_at: new Date().toISOString()
          })
          .eq("id", memory.id)
          .eq("user_id", user_id)

        if (!archiveError) {
          prunedCount++
          console.log(
            `📦 Archived low relevance memory: ${memory.content.substring(0, 50)}...`
          )
        }
      }
    }

    console.log(`✅ Pruned ${prunedCount} low relevance memories`)
    return prunedCount
  } catch (error) {
    console.error("Error pruning low relevance memories:", error)
    return 0
  }
}

export const consolidateSimilarMemories = async (
  user_id: string,
  similarityThreshold: number = 0.9
): Promise<number> => {
  try {
    // Import the deduplication function
    const { consolidateSimilarMemories: consolidate } = await import(
      "./memory-deduplication"
    )
    return await consolidate(user_id, similarityThreshold)
  } catch (error) {
    console.error("Error consolidating memories:", error)
    return 0
  }
}

export const optimizeMemorySystem = async (
  user_id: string
): Promise<{
  pruned: number
  consolidated: number
  totalMemories: number
}> => {
  try {
    // Get current memory stats
    const stats = await getMemoryStats(supabase, user_id)
    const totalMemories = stats?.totalMemories || 0

    console.log(
      `🔧 Starting memory optimization for user ${user_id} (${totalMemories} memories)`
    )

    // Prune low relevance memories
    const prunedCount = await pruneLowRelevanceMemories(user_id, 0.3)

    // Consolidate similar memories
    const consolidatedCount = await consolidateSimilarMemories(user_id, 0.9)

    // Update memory relevance scores (decay old memories)
    const { error: decayError } = await supabase.rpc("decay_memory_relevance")
    if (decayError) {
      console.error("Error decaying memory relevance:", decayError)
    }

    console.log(
      `✅ Memory optimization completed: ${prunedCount} pruned, ${consolidatedCount} consolidated`
    )

    return {
      pruned: prunedCount,
      consolidated: consolidatedCount,
      totalMemories
    }
  } catch (error) {
    console.error("Error optimizing memory system:", error)
    return {
      pruned: 0,
      consolidated: 0,
      totalMemories: 0
    }
  }
}

export const getMemoryEfficiencyMetrics = async (
  user_id: string
): Promise<{
  totalMemories: number
  avgRelevanceScore: number
  lowRelevanceCount: number
  duplicateCount: number
  efficiencyScore: number
}> => {
  try {
    const stats = await getMemoryStats(supabase, user_id)
    const totalMemories = stats?.totalMemories || 0
    const avgRelevanceScore = stats?.avgRelevanceScore || 0

    // Count low relevance memories
    const { data: lowRelevanceMemories } = await supabase
      .from("memories")
      .select("id")
      .eq("user_id", user_id)
      .lt("relevance_score", 0.4)

    const lowRelevanceCount = lowRelevanceMemories?.length || 0

    // Estimate duplicate count (memories with very high similarity)
    const { data: allMemories } = await supabase
      .from("memories")
      .select("id, content")
      .eq("user_id", user_id)

    let duplicateCount = 0
    if (allMemories) {
      const processedIds = new Set<string>()

      for (const memory of allMemories) {
        if (processedIds.has(memory.id)) continue

        // Find very similar memories
        const { findSimilarMemories } = await import("./memory-deduplication")
        const similarMemories = await findSimilarMemories(
          memory.content,
          user_id,
          0.95
        )

        const unprocessedSimilar = similarMemories.filter(
          similar => !processedIds.has(similar.id) && similar.id !== memory.id
        )

        duplicateCount += unprocessedSimilar.length

        processedIds.add(memory.id)
        unprocessedSimilar.forEach(similar => processedIds.add(similar.id))
      }
    }

    // Calculate efficiency score (0-100)
    const efficiencyScore = Math.max(
      0,
      Math.min(
        100,
        avgRelevanceScore * 50 +
          Math.max(0, 1 - lowRelevanceCount / totalMemories) * 30 +
          Math.max(0, 1 - duplicateCount / totalMemories) * 20
      )
    )

    return {
      totalMemories,
      avgRelevanceScore,
      lowRelevanceCount,
      duplicateCount,
      efficiencyScore: Math.round(efficiencyScore)
    }
  } catch (error) {
    console.error("Error getting memory efficiency metrics:", error)
    return {
      totalMemories: 0,
      avgRelevanceScore: 0,
      lowRelevanceCount: 0,
      duplicateCount: 0,
      efficiencyScore: 0
    }
  }
}
