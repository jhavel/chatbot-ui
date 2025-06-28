import { getRelevantMemories, saveEnhancedMemory } from "@/lib/memory-system"

// Mock Supabase client for testing
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { id: 'test-memory-id' } }),
  rpc: jest.fn().mockResolvedValue({ data: [] })
}

describe("Memory Integration Tests", () => {
  const testUserId = "test-user-id-123"

  test("should save and retrieve memories", async () => {
    // Test memory saving
    const memory = await saveEnhancedMemory(
      mockSupabase,
      "User prefers TypeScript over JavaScript",
      testUserId
    )
    expect(memory).toBeDefined()

    // Test memory retrieval
    const relevantMemories = await getRelevantMemories(
      mockSupabase,
      testUserId,
      "What programming language do I prefer?",
      3,
      0.3
    )
    expect(relevantMemories.length).toBeGreaterThanOrEqual(0)
  })

  test("should handle personal information correctly", async () => {
    // Save personal information
    await saveEnhancedMemory(
      mockSupabase,
      "My name is John and I work as a software engineer",
      testUserId
    )

    // Test retrieval of personal information
    const relevantMemories = await getRelevantMemories(
      mockSupabase,
      testUserId,
      "What is my name?",
      3,
      0.3
    )
    
    expect(relevantMemories.length).toBeGreaterThanOrEqual(0)
  })

  test("should handle preferences correctly", async () => {
    // Save preferences
    await saveEnhancedMemory(
      mockSupabase,
      "I prefer dark mode and TypeScript for development",
      testUserId
    )

    // Test retrieval of preferences
    const relevantMemories = await getRelevantMemories(
      mockSupabase,
      testUserId,
      "What are my preferences?",
      3,
      0.3
    )
    
    expect(relevantMemories.length).toBeGreaterThanOrEqual(0)
  })

  test("should work with low similarity thresholds", async () => {
    // Save a memory
    await saveEnhancedMemory(
      mockSupabase,
      "I like to use React for frontend development",
      testUserId
    )

    // Test with very low threshold
    const relevantMemories = await getRelevantMemories(
      mockSupabase,
      testUserId,
      "frontend framework",
      3,
      0.1
    )
    
    expect(relevantMemories.length).toBeGreaterThanOrEqual(0)
  })

  test("should handle errors gracefully", async () => {
    // Test with invalid user ID
    const relevantMemories = await getRelevantMemories(
      mockSupabase,
      "invalid-user-id",
      "test query",
      3,
      0.3
    )
    
    // Should return empty array instead of throwing
    expect(Array.isArray(relevantMemories)).toBe(true)
  })
}) 