export interface Memory {
  id: string
  content: string
  user_id: string
  created_at: string
  embedding?: number[]
  cluster_id?: string
  relevance_score: number
  access_count: number
  last_accessed: string
  semantic_tags: string[]
  memory_type: string
  importance_score: number
  reviewed?: boolean
  reviewed_at?: string
  reviewed_by?: string
}

export interface MemoryCluster {
  id: string
  user_id: string
  name: string
  description?: string
  centroid_embedding?: number[]
  created_at: string
  updated_at?: string
  memory_count: number
  average_relevance_score: number
}

export interface SimilarMemory {
  id: string
  content: string
  relevance_score: number
  access_count: number
  last_accessed: string
  similarity: number
}

export interface MemoryStats {
  totalMemories: number
  totalClusters: number
  avgRelevanceScore: number
  totalAccessCount: number
  typeDistribution: Record<string, number>
  mostRelevantMemories: Array<{
    id: string
    content: string
    relevance_score: number
    memory_type: string
    created_at: string
  }>
}
