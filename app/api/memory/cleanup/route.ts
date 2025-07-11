import { NextRequest } from "next/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { createClient } from "@/lib/supabase/client"
import {
  removeDuplicateMemories,
  cleanupDuplicateMemories,
  consolidateSimilarMemories
} from "@/lib/memory-deduplication"
import {
  summarizeMemory,
  summarizeMemoryWithType,
  shouldSummarize
} from "@/lib/memory-summarization"
import {
  determineMemoryType,
  calculateImportanceScore,
  extractSemanticTags
} from "@/lib/memory-system"

const supabase = createClient()

export async function POST(request: NextRequest) {
  try {
    const profile = await getServerProfile()
    const { action, options } = await request.json()

    console.log(
      `🧹 Memory cleanup request: ${action} for user ${profile.user_id}`
    )

    let result
    let status = 200

    switch (action) {
      case "comprehensive_cleanup":
        result = await performComprehensiveCleanup(profile.user_id, options)
        break
      case "remove_duplicates": {
        const duplicateThreshold = options?.duplicateThreshold || 0.95
        const removedCount = await removeDuplicateMemories(
          profile.user_id,
          duplicateThreshold
        )
        result = {
          success: true,
          action: "remove_duplicates",
          removedCount,
          duplicateThreshold
        }
        break
      }
      case "cleanup_exact_duplicates": {
        const cleanupCount = await cleanupDuplicateMemories(profile.user_id)
        result = {
          success: true,
          action: "cleanup_exact_duplicates",
          removedCount: cleanupCount
        }
        break
      }
      case "consolidate_similar": {
        const similarityThreshold = options?.similarityThreshold || 0.9
        const consolidatedCount = await consolidateSimilarMemories(
          profile.user_id,
          similarityThreshold
        )
        result = {
          success: true,
          action: "consolidate_similar",
          consolidatedCount,
          similarityThreshold
        }
        break
      }
      case "summarize_long_memories":
        result = await summarizeLongMemories(profile.user_id, options)
        break
      case "reclassify_memories":
        result = await reclassifyMemories(profile.user_id, options)
        break
      case "mark_reviewed": {
        const memoryIds = options?.memoryIds || []
        const markedCount = await markMemoriesAsReviewed(
          memoryIds,
          profile.user_id
        )
        result = {
          success: true,
          action: "mark_reviewed",
          markedCount
        }
        break
      }
      default:
        result = {
          error:
            "Invalid action. Supported actions: comprehensive_cleanup, remove_duplicates, cleanup_exact_duplicates, consolidate_similar, summarize_long_memories, reclassify_memories, mark_reviewed"
        }
        status = 400
    }
    return new Response(JSON.stringify(result), {
      status,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("❌ Memory cleanup error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error during memory cleanup" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

async function performComprehensiveCleanup(user_id: string, options: any = {}) {
  console.log(`🔧 Starting comprehensive memory cleanup for user ${user_id}`)

  const results = {
    duplicatesRemoved: 0,
    similarConsolidated: 0,
    memoriesSummarized: 0,
    memoriesReclassified: 0,
    memoriesMarkedReviewed: 0,
    totalMemories: 0
  }

  try {
    // Get total memories count
    const { data: memories } = await supabase
      .from("memories")
      .select("id")
      .eq("user_id", user_id)
    results.totalMemories = memories?.length || 0

    // Step 1: Remove exact duplicates
    console.log("Step 1: Removing exact duplicates...")
    results.duplicatesRemoved = await cleanupDuplicateMemories(user_id)

    // Step 2: Remove semantic duplicates
    console.log("Step 2: Removing semantic duplicates...")
    const semanticDuplicatesRemoved = await removeDuplicateMemories(
      user_id,
      options.duplicateThreshold || 0.95
    )
    results.duplicatesRemoved += semanticDuplicatesRemoved

    // Step 3: Consolidate similar memories
    console.log("Step 3: Consolidating similar memories...")
    results.similarConsolidated = await consolidateSimilarMemories(
      user_id,
      options.similarityThreshold || 0.9
    )

    // Step 4: Summarize long memories
    console.log("Step 4: Summarizing long memories...")
    const summarizeResult = await summarizeLongMemories(user_id, options)
    results.memoriesSummarized = summarizeResult.summarizedCount

    // Step 5: Reclassify memories
    console.log("Step 5: Reclassifying memories...")
    const reclassifyResult = await reclassifyMemories(user_id, options)
    results.memoriesReclassified = reclassifyResult.reclassifiedCount

    // Step 6: Mark all processed memories as reviewed
    console.log("Step 6: Marking memories as reviewed...")
    const { data: allMemories } = await supabase
      .from("memories")
      .select("id")
      .eq("user_id", user_id)
      .eq("reviewed", false)

    if (allMemories && allMemories.length > 0) {
      const memoryIds = allMemories.map(m => m.id)
      results.memoriesMarkedReviewed = await markMemoriesAsReviewed(
        memoryIds,
        user_id
      )
    }

    console.log(`✅ Comprehensive cleanup completed:`, results)

    return {
      success: true,
      action: "comprehensive_cleanup",
      results
    }
  } catch (error) {
    console.error("Error during comprehensive cleanup:", error)
    return {
      error: "Failed to perform comprehensive cleanup"
    }
  }
}

async function summarizeLongMemories(user_id: string, options: any = {}) {
  try {
    const { data: memories } = await supabase
      .from("memories")
      .select("id, content, memory_type")
      .eq("user_id", user_id)
      .eq("reviewed", false)

    if (!memories) return { summarizedCount: 0 }

    let summarizedCount = 0
    const minLength = options.minLength || 200

    for (const memory of memories) {
      if (
        memory.content.length > minLength &&
        shouldSummarize(memory.content)
      ) {
        try {
          const summarizedContent = memory.memory_type
            ? await summarizeMemoryWithType(memory.content, memory.memory_type)
            : await summarizeMemory(memory.content)

          // Update the memory with summarized content
          const { error: updateError } = await supabase
            .from("memories")
            .update({
              content: summarizedContent,
              updated_at: new Date().toISOString()
            })
            .eq("id", memory.id)
            .eq("user_id", user_id)

          if (!updateError) {
            summarizedCount++
            console.log(
              `📝 Summarized memory ${memory.id}: ${memory.content.substring(0, 50)}...`
            )
          }
        } catch (error) {
          console.error(`Error summarizing memory ${memory.id}:`, error)
        }
      }
    }

    return { summarizedCount }
  } catch (error) {
    console.error("Error summarizing long memories:", error)
    return { summarizedCount: 0 }
  }
}

async function reclassifyMemories(user_id: string, options: any = {}) {
  try {
    const { data: memories } = await supabase
      .from("memories")
      .select("id, content, memory_type, semantic_tags, importance_score")
      .eq("user_id", user_id)
      .eq("reviewed", false)

    if (!memories) return { reclassifiedCount: 0 }

    let reclassifiedCount = 0

    for (const memory of memories) {
      try {
        // Reclassify memory type
        const newMemoryType = determineMemoryType(memory.content)

        // Recalculate importance score
        const newImportanceScore = calculateImportanceScore(
          memory.content,
          newMemoryType
        )

        // Extract new semantic tags
        const newSemanticTags = await extractSemanticTags(memory.content)

        // Check if any changes are needed
        const needsUpdate =
          newMemoryType !== memory.memory_type ||
          newImportanceScore !== memory.importance_score ||
          JSON.stringify(newSemanticTags.sort()) !==
            JSON.stringify(memory.semantic_tags?.sort() || [])

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from("memories")
            .update({
              memory_type: newMemoryType,
              importance_score: newImportanceScore,
              semantic_tags: newSemanticTags,
              updated_at: new Date().toISOString()
            })
            .eq("id", memory.id)
            .eq("user_id", user_id)

          if (!updateError) {
            reclassifiedCount++
            console.log(
              `🏷️ Reclassified memory ${memory.id}: ${memory.memory_type} → ${newMemoryType}`
            )
          }
        }
      } catch (error) {
        console.error(`Error reclassifying memory ${memory.id}:`, error)
      }
    }

    return { reclassifiedCount }
  } catch (error) {
    console.error("Error reclassifying memories:", error)
    return { reclassifiedCount: 0 }
  }
}

async function markMemoriesAsReviewed(
  memoryIds: string[],
  reviewer_id: string
): Promise<number> {
  try {
    if (memoryIds.length === 0) return 0

    const { data, error } = await supabase.rpc("mark_memories_reviewed", {
      memory_ids: memoryIds,
      reviewer_id: reviewer_id
    })

    if (error) {
      console.error("Error marking memories as reviewed:", error)
      return 0
    }

    console.log(`✅ Marked ${data} memories as reviewed`)
    return data || 0
  } catch (error) {
    console.error("Error marking memories as reviewed:", error)
    return 0
  }
}
