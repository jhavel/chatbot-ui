import { getRelevantMemories, saveEnhancedMemory } from "@/lib/memory-system"

describe("Memory Integration Tests", () => {
  const testUserId = "test-user-id-123"

  test("should save and retrieve memories", async () => {
    // Test memory saving
    const memory = await saveEnhancedMemory(
      "User prefers TypeScript over JavaScript",
      testUserId
    )
    expect(memory).toBeDefined()

    // Test memory retrieval
    const relevantMemories = await getRelevantMemories(
      testUserId,
      "What programming language do I prefer?",
      3,
      0.3
    )
    expect(relevantMemories.length).toBeGreaterThan(0)
  })

  test("should handle personal information correctly", async () => {
    // Save personal information
    await saveEnhancedMemory(
      "My name is John and I work as a software engineer",
      testUserId
    )

    // Test retrieval of personal information
    const relevantMemories = await getRelevantMemories(
      testUserId,
      "What is my name?",
      3,
      0.3
    )
    
    expect(relevantMemories.length).toBeGreaterThan(0)
    expect(relevantMemories[0].content).toContain("John")
  })

  test("should handle preferences correctly", async () => {
    // Save preferences
    await saveEnhancedMemory(
      "I prefer dark mode and TypeScript for development",
      testUserId
    )

    // Test retrieval of preferences
    const relevantMemories = await getRelevantMemories(
      testUserId,
      "What are my preferences?",
      3,
      0.3
    )
    
    expect(relevantMemories.length).toBeGreaterThan(0)
    expect(relevantMemories[0].content).toContain("dark mode")
  })

  test("should work with low similarity thresholds", async () => {
    // Save a memory
    await saveEnhancedMemory(
      "I like to use React for frontend development",
      testUserId
    )

    // Test with very low threshold
    const relevantMemories = await getRelevantMemories(
      testUserId,
      "frontend framework",
      3,
      0.1
    )
    
    expect(relevantMemories.length).toBeGreaterThan(0)
  })

  test("should handle errors gracefully", async () => {
    // Test with invalid user ID
    const relevantMemories = await getRelevantMemories(
      "invalid-user-id",
      "test query",
      3,
      0.3
    )
    
    // Should return empty array instead of throwing
    expect(Array.isArray(relevantMemories)).toBe(true)
  })
}) 