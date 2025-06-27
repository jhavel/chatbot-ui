import { getRelevantMemories } from "@/lib/memory-system"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export const checkForDuplicates = async (
  content: string,
  user_id: string,
  similarityThreshold: number = 0.8
): Promise<boolean> => {
  try {
    const similarMemories = await getRelevantMemories(
      user_id,
      content,
      3,
      similarityThreshold
    )

    return similarMemories.length > 0
  } catch (error) {
    console.error("Error checking for duplicates:", error)
    return false
  }
}

export const findSimilarMemories = async (
  content: string,
  user_id: string,
  similarityThreshold: number = 0.7
): Promise<Array<{ id: string; content: string; similarity: number }>> => {
  try {
    const similarMemories = await getRelevantMemories(
      user_id,
      content,
      5,
      similarityThreshold
    )

    return similarMemories.map(memory => ({
      id: memory.id,
      content: memory.content,
      similarity: memory.similarity
    }))
  } catch (error) {
    console.error("Error finding similar memories:", error)
    return []
  }
}

export const mergeSimilarMemories = async (
  newContent: string,
  existingMemoryId: string,
  user_id: string
): Promise<void> => {
  try {
    // Get the existing memory
    const { data: existingMemory, error: fetchError } = await supabase
      .from("memories")
      .select("*")
      .eq("id", existingMemoryId)
      .eq("user_id", user_id)
      .single()

    if (fetchError || !existingMemory) {
      console.error("Error fetching existing memory:", fetchError)
      return
    }

    // Create merged content
    const mergedContent = `${existingMemory.content}\n\nAdditional information: ${newContent}`

    // Update the existing memory with merged content
    const { error: updateError } = await supabase
      .from("memories")
      .update({
        content: mergedContent,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingMemoryId)
      .eq("user_id", user_id)

    if (updateError) {
      console.error("Error updating merged memory:", updateError)
      return
    }

    console.log(`✅ Merged memory ${existingMemoryId} with new content`)
  } catch (error) {
    console.error("Error merging memories:", error)
  }
}

export const consolidateSimilarMemories = async (
  user_id: string,
  similarityThreshold: number = 0.9
): Promise<number> => {
  try {
    // Get all memories for the user
    const { data: memories, error } = await supabase
      .from("memories")
      .select("id, content, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true })

    if (error || !memories) {
      console.error("Error fetching memories for consolidation:", error)
      return 0
    }

    let consolidatedCount = 0
    const processedIds = new Set<string>()

    for (const memory of memories) {
      if (processedIds.has(memory.id)) continue

      // Find similar memories
      const similarMemories = await findSimilarMemories(
        memory.content,
        user_id,
        similarityThreshold
      )

      // Filter out already processed memories and the current memory
      const unprocessedSimilar = similarMemories.filter(
        similar => !processedIds.has(similar.id) && similar.id !== memory.id
      )

      if (unprocessedSimilar.length > 0) {
        // Merge all similar memories into the first one
        for (const similar of unprocessedSimilar) {
          await mergeSimilarMemories(similar.content, memory.id, user_id)
          processedIds.add(similar.id)
          consolidatedCount++
        }
      }

      processedIds.add(memory.id)
    }

    console.log(`✅ Consolidated ${consolidatedCount} similar memories`)
    return consolidatedCount
  } catch (error) {
    console.error("Error consolidating memories:", error)
    return 0
  }
}

export const removeDuplicateMemories = async (
  user_id: string,
  similarityThreshold: number = 0.95
): Promise<number> => {
  try {
    // Get all memories for the user
    const { data: memories, error } = await supabase
      .from("memories")
      .select("id, content, created_at, relevance_score")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true })

    if (error || !memories) {
      console.error("Error fetching memories for deduplication:", error)
      return 0
    }

    let removedCount = 0
    const processedIds = new Set<string>()

    for (const memory of memories) {
      if (processedIds.has(memory.id)) continue

      // Find very similar memories (high threshold for removal)
      const similarMemories = await findSimilarMemories(
        memory.content,
        user_id,
        similarityThreshold
      )

      // Filter out already processed memories and the current memory
      const unprocessedSimilar = similarMemories.filter(
        similar => !processedIds.has(similar.id) && similar.id !== memory.id
      )

      if (unprocessedSimilar.length > 0) {
        // Remove duplicates, keeping the one with higher relevance score
        for (const similar of unprocessedSimilar) {
          // Get the similar memory's full data to compare relevance scores
          const { data: similarMemoryData } = await supabase
            .from("memories")
            .select("relevance_score")
            .eq("id", similar.id)
            .single()

          if (similarMemoryData) {
            // Keep the memory with higher relevance score, remove the other
            const memoryToKeep =
              memory.relevance_score >= similarMemoryData.relevance_score
                ? memory.id
                : similar.id
            const memoryToRemove =
              memoryToKeep === memory.id ? similar.id : memory.id

            // Remove the duplicate
            const { error: deleteError } = await supabase
              .from("memories")
              .delete()
              .eq("id", memoryToRemove)
              .eq("user_id", user_id)

            if (!deleteError) {
              removedCount++
              console.log(`🗑️ Removed duplicate memory ${memoryToRemove}`)
            }
          }

          processedIds.add(similar.id)
        }
      }

      processedIds.add(memory.id)
    }

    console.log(`✅ Removed ${removedCount} duplicate memories`)
    return removedCount
  } catch (error) {
    console.error("Error removing duplicate memories:", error)
    return 0
  }
}
