import { createClient } from "@/lib/supabase/client"
import type { Memory, MemoryCluster, SimilarMemory } from "@/types/memory"
import { validateMemoryContent, isAIResponse } from "./memory-validation"

// Ensure this only runs on the server
if (typeof window !== "undefined") {
  throw new Error("Memory system can only be used on the server-side")
}

// Only import OpenAI on the server
let openai: any = null
try {
  const OpenAI = require("openai").default
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ""
  })
} catch (error) {
  console.warn("OpenAI not available:", error)
}

// NOTE: All functions now require a Supabase client (with session/cookies) as the first parameter.
// This is required for RLS-protected operations (e.g., memory_clusters, memories).
// Do NOT use a generic client; always pass a session-aware client from the API route.

// Re-export types for convenience
export type { Memory, MemoryCluster, SimilarMemory }

// Generate embedding for text content
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    if (typeof text !== "string" || !text.trim()) {
      console.error("[Embedding] Invalid input for embedding:", text)
      throw new Error("Embedding input must be a non-empty string")
    }
    // Truncate to 8192 characters (OpenAI limit)
    const safeText = text.slice(0, 8192)
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: safeText,
      encoding_format: "float"
    })
    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

// Extract semantic tags from memory content
export const extractSemanticTags = async (
  content: string
): Promise<string[]> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "Extract 3-5 relevant semantic tags from the following text. Return only the tags as a JSON array of strings. Tags should be single words or short phrases that capture the key concepts."
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.3,
      max_tokens: 100
    })

    const tagsText = response.choices[0].message.content
    if (!tagsText) return []

    try {
      const tags = JSON.parse(tagsText)
      return Array.isArray(tags) ? tags.slice(0, 5) : []
    } catch {
      // Fallback: extract simple tags
      const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5)
      return words
    }
  } catch (error) {
    console.error("Error extracting semantic tags:", error)
    return []
  }
}

// Determine memory type based on content
export const determineMemoryType = (content: string): string => {
  if (isAIResponse(content)) {
    throw new Error(
      "Content appears to be an AI response, not user information"
    )
  }
  const lowerContent = content.toLowerCase()

  if (
    lowerContent.includes("code") ||
    lowerContent.includes("programming") ||
    lowerContent.includes("function")
  ) {
    return "technical"
  } else if (
    lowerContent.includes("prefer") ||
    lowerContent.includes("like") ||
    lowerContent.includes("dislike")
  ) {
    return "preference"
  } else if (
    lowerContent.includes("name") ||
    lowerContent.includes("work") ||
    lowerContent.includes("job")
  ) {
    return "personal"
  } else if (
    lowerContent.includes("project") ||
    lowerContent.includes("task") ||
    lowerContent.includes("goal")
  ) {
    return "project"
  } else {
    return "general"
  }
}

// Calculate importance score based on content and context
export const calculateImportanceScore = (
  content: string,
  memoryType: string
): number => {
  let score = 0.5 // Base score

  // Boost for personal information
  if (memoryType === "personal") score += 0.2

  // Boost for preferences
  if (memoryType === "preference") score += 0.15

  // Boost for technical details
  if (memoryType === "technical") score += 0.1

  // Boost for longer, more detailed memories
  if (content.length > 100) score += 0.1

  // Boost for memories with specific details
  if (
    content.includes("because") ||
    content.includes("since") ||
    content.includes("when")
  ) {
    score += 0.1
  }

  return Math.min(score, 1.0)
}

// Simple in-memory cache to prevent duplicate processing in the same session
const processedContentCache = new Map<string, Set<string>>()

// Save enhanced memory with semantic analysis and clustering
export const saveEnhancedMemory = async (
  supabase: any,
  content: string,
  user_id: string
): Promise<Memory> => {
  try {
    if (!validateMemoryContent(content)) {
      console.warn("❌ Memory content validation failed - skipping save")
      throw new Error("Memory content validation failed")
    }

    // Check if this exact content was already processed for this user in this session
    const contentHash = content.trim().toLowerCase()
    const userCache = processedContentCache.get(user_id) || new Set()
    if (userCache.has(contentHash)) {
      console.log(
        `⏭️ Content already processed in this session: ${content.substring(0, 50)}...`
      )
      throw new Error("Content already processed in this session")
    }
    userCache.add(contentHash)
    processedContentCache.set(user_id, userCache)

    console.log(`🧠 Memory save attempt: ${content.substring(0, 50)}...`)
    console.log(`👤 User: ${user_id}`)

    // Check for duplicates first
    const { checkForDuplicates } = await import("./memory-deduplication")
    const isDuplicate = await checkForDuplicates(content, user_id, 0.98)

    if (isDuplicate) {
      console.log(
        `❌ Duplicate detected - skipping save: ${content.substring(0, 50)}...`
      )
      throw new Error("Duplicate memory detected")
    }

    console.log(`✅ No duplicates found - proceeding with save`)

    // Generate embedding
    const embedding = await generateEmbedding(content)

    // Extract semantic tags
    const semanticTags = await extractSemanticTags(content)

    // Determine memory type
    const memoryType = determineMemoryType(content)

    // Calculate importance score
    const importanceScore = calculateImportanceScore(content, memoryType)

    // Try to find or create cluster
    const clusterId = await findOrCreateCluster(
      supabase,
      embedding,
      user_id,
      semanticTags,
      memoryType
    )

    // Save memory (with or without cluster)
    const { data, error } = await supabase
      .from("memories")
      .insert([
        {
          content,
          user_id,
          embedding,
          semantic_tags: semanticTags,
          memory_type: memoryType,
          importance_score: importanceScore,
          relevance_score: 1.0,
          cluster_id: clusterId // This can be null if cluster creation failed
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Error saving enhanced memory:", error)
      throw error
    }

    console.log(`✅ Memory saved successfully: ${data.id}`)
    console.log(
      `📊 Memory details: type=${memoryType}, importance=${importanceScore}, tags=${semanticTags.join(", ")}`
    )

    return data
  } catch (error) {
    console.error("❌ Error saving enhanced memory:", error)
    throw error
  }
}

// Find or create appropriate memory cluster
export const findOrCreateCluster = async (
  supabase: any,
  embedding: number[],
  user_id: string,
  semanticTags: string[],
  memoryType: string
): Promise<string | null> => {
  try {
    const { data: existingClusters } = (await supabase.rpc(
      "find_similar_clusters",
      {
        query_embedding: embedding,
        user_id_param: user_id,
        match_count: 3,
        similarity_threshold: 0.7 // Lowered for better grouping
      }
    )) as { data: any[] }

    if (existingClusters && existingClusters.length > 0) {
      // Use the most similar cluster
      return existingClusters[0].id
    } else {
      console.log(
        "[Cluster] No existing cluster found, will attempt to create new cluster."
      )
    }

    // Try to create new cluster
    try {
      const clusterName = `${memoryType.charAt(0).toUpperCase() + memoryType.slice(1)} Cluster`
      const clusterDescription = `Cluster for ${memoryType} memories with tags: ${semanticTags.join(", ")}`
      // Do NOT include id in the insert payload, so Postgres will use uuid_generate_v4()
      const insertPayload = {
        user_id,
        name: clusterName,
        description: clusterDescription,
        centroid_embedding: embedding
      }
      const { data: newCluster, error } = await supabase
        .from("memory_clusters")
        .insert([insertPayload])
        .select()
        .single()
      if (error) {
        console.error("[Cluster] Error creating cluster:", error)
        // Return null to indicate cluster creation failed
        return null
      }
      return newCluster.id
    } catch (clusterError) {
      console.error("[Cluster] Exception in cluster creation:", clusterError)
      // Return null to indicate cluster creation failed
      return null
    }
  } catch (error) {
    console.error("Error finding or creating cluster:", error)
    // Return null to indicate cluster creation failed
    return null
  }
}

// Adaptive memory retrieval based on current context
export const getRelevantMemories = async (
  supabase: any,
  user_id: string,
  currentContext: string,
  limit: number = 5,
  similarityThreshold: number = 0.6
): Promise<SimilarMemory[]> => {
  try {
    // Generate embedding for current context
    const contextEmbedding = await generateEmbedding(currentContext)

    // Find similar memories using the database function
    const { data: similarMemories, error } = await supabase.rpc(
      "find_similar_memories",
      {
        query_embedding: contextEmbedding,
        user_id_param: user_id,
        match_count: limit,
        similarity_threshold: similarityThreshold
      }
    )

    if (error) {
      console.error("Database error in getRelevantMemories:", error)
      throw error
    }

    // Filter out very low similarity memories and sort by relevance
    const filteredMemories = (similarMemories || [])
      .filter((memory: any) => memory.similarity >= similarityThreshold)
      .sort((a: any, b: any) => {
        // Sort by similarity first, then by relevance score, then by access count
        if (Math.abs(a.similarity - b.similarity) > 0.1) {
          return b.similarity - a.similarity
        }
        if (Math.abs(a.relevance_score - b.relevance_score) > 0.1) {
          return b.relevance_score - a.relevance_score
        }
        return b.access_count - a.access_count
      })
      .slice(0, limit)

    return filteredMemories
  } catch (error) {
    console.error("Error retrieving relevant memories:", error)
    return []
  }
}

// Update memory access statistics
export const updateMemoryAccess = async (
  supabase: any,
  memoryId: string
): Promise<void> => {
  try {
    const { error } = await supabase.rpc("update_memory_access", {
      memory_id: memoryId
    })

    if (error) throw error
  } catch (error) {
    console.error("Error updating memory access:", error)
  }
}

// Get memory clusters for a user
export const getMemoryClusters = async (
  supabase: any,
  user_id: string
): Promise<MemoryCluster[]> => {
  try {
    const { data, error } = await supabase
      .from("memory_clusters")
      .select("*")
      .eq("user_id", user_id)
      .order("memory_count", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error getting memory clusters:", error)
    return []
  }
}

// Get memories by cluster
export const getMemoriesByCluster = async (
  supabase: any,
  clusterId: string,
  user_id: string
): Promise<Memory[]> => {
  try {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("cluster_id", clusterId)
      .eq("user_id", user_id)
      .order("relevance_score", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error getting memories by cluster:", error)
    return []
  }
}

// Decay memory relevance (should be called periodically)
export const decayMemoryRelevance = async (supabase: any): Promise<void> => {
  try {
    const { error } = await supabase.rpc("decay_memory_relevance")

    if (error) throw error
  } catch (error) {
    console.error("Error decaying memory relevance:", error)
  }
}

// Get memory statistics
export const getMemoryStats = async (supabase: any, user_id: string) => {
  try {
    const { data: memories } = await supabase
      .from("memories")
      .select(
        "id, content, relevance_score, access_count, memory_type, importance_score, created_at"
      )
      .eq("user_id", user_id)

    const { data: clusters } = await supabase
      .from("memory_clusters")
      .select("memory_count, average_relevance_score")
      .eq("user_id", user_id)

    if (!memories || !clusters) return null

    const totalMemories = memories.length
    const totalClusters = clusters.length
    const avgRelevanceScore =
      memories.reduce((sum: number, m: any) => sum + m.relevance_score, 0) /
      totalMemories
    const avgImportanceScore =
      memories.reduce((sum: number, m: any) => sum + m.importance_score, 0) /
      totalMemories
    const totalAccesses = memories.reduce(
      (acc: number, m: any) => acc + m.access_count,
      0
    )

    // Compute type distribution
    const typeDistribution = memories.reduce(
      (acc: Record<string, number>, m: any) => {
        acc[m.memory_type] = (acc[m.memory_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Get top 5 most relevant memories
    const mostRelevantMemories = memories
      .slice()
      .sort((a: any, b: any) => b.relevance_score - a.relevance_score)
      .slice(0, 5)
      .map((m: any) => ({
        id: m.id,
        content: m.content,
        relevance_score: m.relevance_score,
        memory_type: m.memory_type,
        created_at: m.created_at
      }))

    return {
      totalMemories,
      totalClusters,
      avgRelevanceScore,
      avgImportanceScore,
      totalAccessCount: totalAccesses,
      typeDistribution,
      mostRelevantMemories
    }
  } catch (error) {
    console.error("Error getting memory stats:", error)
    return null
  }
}

// Enhanced memory retrieval with access tracking
export const getRelevantMemoriesWithTracking = async (
  supabase: any,
  user_id: string,
  currentContext: string,
  limit: number = 5,
  similarityThreshold: number = 0.6
): Promise<SimilarMemory[]> => {
  try {
    const memories = await getRelevantMemories(
      supabase,
      user_id,
      currentContext,
      limit,
      similarityThreshold
    )

    // Update access statistics for retrieved memories
    for (const memory of memories) {
      await updateMemoryAccess(supabase, memory.id)
    }

    return memories
  } catch (error) {
    console.error("Error retrieving memories with tracking:", error)
    return []
  }
}
