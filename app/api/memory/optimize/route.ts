import { NextRequest, NextResponse } from "next/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import {
  optimizeMemorySystem,
  getMemoryEfficiencyMetrics,
  pruneLowRelevanceMemories,
  consolidateSimilarMemories
} from "@/lib/memory-optimization"
import {
  removeDuplicateMemories,
  cleanupDuplicateMemories
} from "@/lib/memory-deduplication"

export async function POST(request: NextRequest) {
  try {
    const profile = await getServerProfile()
    const { action, options } = await request.json()

    console.log(
      `🔧 Memory optimization request: ${action} for user ${profile.user_id}`
    )

    switch (action) {
      case "full_optimization":
        // Run complete memory optimization
        const optimizationResult = await optimizeMemorySystem(profile.user_id)
        return NextResponse.json({
          success: true,
          action: "full_optimization",
          result: optimizationResult
        })

      case "prune_memories":
        // Prune low relevance memories
        const relevanceThreshold = options?.relevanceThreshold || 0.3
        const prunedCount = await pruneLowRelevanceMemories(
          profile.user_id,
          relevanceThreshold
        )
        return NextResponse.json({
          success: true,
          action: "prune_memories",
          prunedCount,
          relevanceThreshold
        })

      case "consolidate_memories":
        // Consolidate similar memories
        const similarityThreshold = options?.similarityThreshold || 0.9
        const consolidatedCount = await consolidateSimilarMemories(
          profile.user_id,
          similarityThreshold
        )
        return NextResponse.json({
          success: true,
          action: "consolidate_memories",
          consolidatedCount,
          similarityThreshold
        })

      case "remove_duplicates":
        // Remove duplicate memories (semantic similarity based)
        const duplicateThreshold = options?.duplicateThreshold || 0.95
        const removedCount = await removeDuplicateMemories(
          profile.user_id,
          duplicateThreshold
        )
        return NextResponse.json({
          success: true,
          action: "remove_duplicates",
          removedCount,
          duplicateThreshold
        })

      case "cleanup_duplicates":
        // Clean up exact duplicates (content-based)
        const cleanupCount = await cleanupDuplicateMemories(profile.user_id)
        return NextResponse.json({
          success: true,
          action: "cleanup_duplicates",
          removedCount: cleanupCount
        })

      case "get_metrics":
        // Get memory efficiency metrics
        const metrics = await getMemoryEfficiencyMetrics(profile.user_id)
        return NextResponse.json({
          success: true,
          action: "get_metrics",
          metrics
        })

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Supported actions: full_optimization, prune_memories, consolidate_memories, remove_duplicates, cleanup_duplicates, get_metrics"
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("❌ Memory optimization error:", error)
    return NextResponse.json(
      { error: "Internal server error during memory optimization" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const profile = await getServerProfile()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "metrics") {
      // Get memory efficiency metrics
      const metrics = await getMemoryEfficiencyMetrics(profile.user_id)
      return NextResponse.json({
        success: true,
        metrics
      })
    }

    return NextResponse.json(
      { error: "Invalid action. Use ?action=metrics" },
      { status: 400 }
    )
  } catch (error) {
    console.error("❌ Memory optimization GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
