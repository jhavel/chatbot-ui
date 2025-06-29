import { createClient } from "@/lib/supabase/client"
import {
  getRelevantMemories,
  getMemoryClusters,
  getMemoriesByCluster,
  getMemoryStats,
  updateMemoryAccess
} from "@/lib/memory-system"
import { validateMemoryContent } from "../lib/memory-validation"

const supabase = createClient()

export const getMemoriesByUserId = async (user_id: string) => {
  const { data, error } = await supabase
    .from("memories")
    .select(
      `
      id, 
      content, 
      created_at, 
      COALESCE(relevance_score, 1.0) as relevance_score, 
      COALESCE(access_count, 0) as access_count, 
      last_accessed, 
      COALESCE(semantic_tags, '{}') as semantic_tags, 
      COALESCE(memory_type, 'general') as memory_type, 
      COALESCE(importance_score, 0.5) as importance_score, 
      COALESCE(reviewed, false) as reviewed,
      reviewed_at,
      reviewed_by,
      user_id
    `
    )
    .eq("user_id", user_id)
    .order("relevance_score", { ascending: false })

  if (error) throw error
  return data
}

export const saveMemory = async (content: string, user_id: string) => {
  if (!validateMemoryContent(content)) {
    console.warn("❌ Memory content validation failed - skipping save")
    return
  }

  try {
    // Import the memory system function directly
    const { saveEnhancedMemory } = await import("@/lib/memory-system")
    return await saveEnhancedMemory(supabase, content, user_id)
  } catch (error) {
    console.error("[Memory Save Error]", error)
    // Fallback to simple save if enhanced system fails
    const { error: fallbackError } = await supabase
      .from("memories")
      .insert([{ content, user_id }])
    if (fallbackError)
      console.error("[Fallback Memory Save Error]", fallbackError.message)
  }
}

// Enhanced functions that call memory system directly
export const getContextualMemories = async (
  user_id: string,
  context: string,
  limit: number = 5,
  similarityThreshold: number = 0.6
) => {
  const { getRelevantMemoriesWithTracking } = await import(
    "@/lib/memory-system"
  )
  return await getRelevantMemoriesWithTracking(
    supabase,
    user_id,
    context,
    limit,
    similarityThreshold
  )
}

export const getUserMemoryClusters = async (user_id: string) => {
  return await getMemoryClusters(supabase, user_id)
}

export const getMemoriesInCluster = async (
  clusterId: string,
  user_id: string
) => {
  return await getMemoriesByCluster(supabase, clusterId, user_id)
}

export const getUserMemoryStats = async (user_id: string) => {
  return await getMemoryStats(supabase, user_id)
}

export const markMemoryAccessed = async (memoryId: string) => {
  return await updateMemoryAccess(supabase, memoryId)
}
