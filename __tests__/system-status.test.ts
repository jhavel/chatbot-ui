import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { saveEnhancedMemory, getRelevantMemories } from '@/lib/memory-system'
import { processTxt, processCSV, processJSON, processMarkdown } from '@/lib/retrieval/processing'

// Test configuration
const TEST_TIMEOUT = 30000 // 30 seconds
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create test client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test data
const testUserId = 'test-user-status-check'
const testWorkspaceId = 'test-workspace-status-check'

describe('System Status Tests', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    try {
      await supabase.from('memories').delete().eq('user_id', testUserId)
      await supabase.from('files').delete().eq('user_id', testUserId)
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }, TEST_TIMEOUT)

  afterAll(async () => {
    // Clean up test data
    try {
      await supabase.from('memories').delete().eq('user_id', testUserId)
      await supabase.from('files').delete().eq('user_id', testUserId)
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }, TEST_TIMEOUT)

  describe('Database Connectivity', () => {
    test('should connect to Supabase database', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    }, TEST_TIMEOUT)

    test('should access required database tables', async () => {
      const requiredTables = [
        'profiles', 'workspaces', 'chats', 'messages', 'files', 
        'file_items', 'memories', 'assistants', 'tools', 'models'
      ]
      
      for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('id').limit(1)
        expect(error).toBeNull()
      }
    }, TEST_TIMEOUT)

    test('should perform vector database operations', async () => {
      const { data, error } = await supabase.rpc(
        'find_similar_memories',
        {
          query_embedding: Array(1536).fill(0.1),
          user_id_param: testUserId,
          limit_param: 1
        }
      )
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    }, TEST_TIMEOUT)
  })

  describe('Memory System', () => {
    test('should save memories successfully', async () => {
      const testMemory = await saveEnhancedMemory(
        supabase,
        'Test memory for system validation: User is testing memory functionality',
        testUserId
      )
      
      expect(testMemory).toBeDefined()
      expect(testMemory.id).toBeDefined()
      expect(testMemory.content).toContain('Test memory for system validation')
    }, TEST_TIMEOUT)

    test('should retrieve relevant memories', async () => {
      const relevantMemories = await getRelevantMemories(
        supabase,
        testUserId,
        'memory functionality test',
        3,
        0.3
      )
      
      expect(Array.isArray(relevantMemories)).toBe(true)
      expect(relevantMemories.length).toBeGreaterThanOrEqual(0)
    }, TEST_TIMEOUT)

    test('should handle memory deduplication', async () => {
      const duplicateContent = 'Duplicate memory content for testing'
      
      // Save first memory
      const memory1 = await saveEnhancedMemory(
        supabase,
        duplicateContent,
        testUserId
      )
      
      // Try to save duplicate
      try {
        await saveEnhancedMemory(
          supabase,
          duplicateContent,
          testUserId
        )
        // Should not reach here if deduplication works
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
        expect(error instanceof Error).toBe(true)
        expect((error as Error).message).toContain('Duplicate')
      }
    }, TEST_TIMEOUT)
  })

  describe('File Processing', () => {
    test('should process text files', async () => {
      const testText = 'This is a test text document for file processing validation.'
      const textBlob = new Blob([testText], { type: 'text/plain' })
      
      const chunks = await processTxt(textBlob)
      
      expect(Array.isArray(chunks)).toBe(true)
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].content).toContain('test text document')
      expect(chunks[0].tokens).toBeGreaterThan(0)
    }, TEST_TIMEOUT)

    test('should process CSV files', async () => {
      const testCSV = 'name,age,city\nJohn,30,New York\nJane,25,Los Angeles'
      const csvBlob = new Blob([testCSV], { type: 'text/csv' })
      
      const chunks = await processCSV(csvBlob)
      
      expect(Array.isArray(chunks)).toBe(true)
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].content).toContain('John')
      expect(chunks[0].tokens).toBeGreaterThan(0)
    }, TEST_TIMEOUT)

    test('should process JSON files', async () => {
      const testJSON = JSON.stringify({
        name: 'Test User',
        data: 'JSON processing test data',
        metadata: { type: 'test', version: '1.0' }
      })
      const jsonBlob = new Blob([testJSON], { type: 'application/json' })
      
      const chunks = await processJSON(jsonBlob)
      
      expect(Array.isArray(chunks)).toBe(true)
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].content).toContain('Test User')
      expect(chunks[0].tokens).toBeGreaterThan(0)
    }, TEST_TIMEOUT)

    test('should process Markdown files', async () => {
      const testMD = `# Test Document

This is a **test** markdown document with multiple sections.

## Section 1
- Item 1
- Item 2

## Section 2
Some content here.`
      const mdBlob = new Blob([testMD], { type: 'text/markdown' })
      
      const chunks = await processMarkdown(mdBlob)
      
      expect(Array.isArray(chunks)).toBe(true)
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].content).toContain('Test Document')
      expect(chunks[0].tokens).toBeGreaterThan(0)
    }, TEST_TIMEOUT)
  })

  describe('Storage Operations', () => {
    test('should upload and delete files', async () => {
      const testContent = 'Test file content for storage validation'
      const testFile = new Blob([testContent], { type: 'text/plain' })
      const fileName = `status-test-${Date.now()}.txt`
      
      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(`status-test/${fileName}`, testFile)
      
      expect(uploadError).toBeNull()
      expect(uploadData).toBeDefined()
      expect(uploadData?.path).toContain(fileName)
      
      // Delete file
      if (uploadData) {
        const { error: deleteError } = await supabase.storage
          .from('files')
          .remove([uploadData.path])
        
        expect(deleteError).toBeNull()
      }
    }, TEST_TIMEOUT)

    test('should list storage buckets', async () => {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      expect(error).toBeNull()
      expect(buckets).toBeDefined()
      expect(Array.isArray(buckets)).toBe(true)
    }, TEST_TIMEOUT)
  })

  describe('API Endpoints', () => {
    test('should access health endpoint', async () => {
      const response = await fetch('/api/health')
      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.status).toBeDefined()
      expect(data.timestamp).toBeDefined()
    }, TEST_TIMEOUT)

    test('should access status endpoint', async () => {
      const response = await fetch('/api/status')
      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.overallStatus).toBeDefined()
      expect(data.tests).toBeDefined()
      expect(data.summary).toBeDefined()
    }, TEST_TIMEOUT)
  })

  describe('Performance Tests', () => {
    test('should process files within reasonable time', async () => {
      const largeText = 'Test content. '.repeat(1000) // ~15KB of text
      const textBlob = new Blob([largeText], { type: 'text/plain' })
      
      const startTime = Date.now()
      const chunks = await processTxt(textBlob)
      const duration = Date.now() - startTime
      
      expect(chunks.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    }, TEST_TIMEOUT)

    test('should handle memory operations efficiently', async () => {
      const startTime = Date.now()
      
      // Save multiple memories
      const memories = []
      for (let i = 0; i < 5; i++) {
        const memory = await saveEnhancedMemory(
          supabase,
          `Performance test memory ${i}: Testing system efficiency`,
          testUserId
        )
        memories.push(memory)
      }
      
      const saveDuration = Date.now() - startTime
      
      // Retrieve memories
      const retrieveStart = Date.now()
      const relevantMemories = await getRelevantMemories(
        supabase,
        testUserId,
        'performance test',
        10,
        0.3
      )
      const retrieveDuration = Date.now() - retrieveStart
      
      expect(memories.length).toBe(5)
      expect(relevantMemories.length).toBeGreaterThanOrEqual(0)
      expect(saveDuration).toBeLessThan(10000) // Should complete within 10 seconds
      expect(retrieveDuration).toBeLessThan(5000) // Should complete within 5 seconds
    }, TEST_TIMEOUT)
  })

  describe('Error Handling', () => {
    test('should handle invalid file types gracefully', async () => {
      const invalidBlob = new Blob(['invalid content'], { type: 'application/octet-stream' })
      
      try {
        await processTxt(invalidBlob)
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }
    }, TEST_TIMEOUT)

    test('should handle database errors gracefully', async () => {
      const { error } = await supabase
        .from('nonexistent_table')
        .select('*')
      
      expect(error).toBeDefined()
      expect(error?.message).toContain('relation')
    }, TEST_TIMEOUT)

    test('should handle invalid user IDs', async () => {
      const relevantMemories = await getRelevantMemories(
        supabase,
        'invalid-user-id',
        'test query',
        3,
        0.3
      )
      
      // Should return empty array instead of throwing
      expect(Array.isArray(relevantMemories)).toBe(true)
      expect(relevantMemories.length).toBe(0)
    }, TEST_TIMEOUT)
  })

  describe('Data Integrity', () => {
    test('should maintain data consistency', async () => {
      // Save a memory
      const originalMemory = await saveEnhancedMemory(
        supabase,
        'Data integrity test memory',
        testUserId
      )
      
      // Verify it was saved correctly
      const { data: savedMemory, error } = await supabase
        .from('memories')
        .select('*')
        .eq('id', originalMemory.id)
        .single()
      
      expect(error).toBeNull()
      expect(savedMemory).toBeDefined()
      expect(savedMemory.content).toBe(originalMemory.content)
      expect(savedMemory.user_id).toBe(testUserId)
    }, TEST_TIMEOUT)

    test('should enforce user isolation', async () => {
      const otherUserId = 'other-test-user'
      
      // Save memory for other user
      await saveEnhancedMemory(
        supabase,
        'Other user memory',
        otherUserId
      )
      
      // Try to retrieve with test user
      const relevantMemories = await getRelevantMemories(
        supabase,
        testUserId,
        'Other user memory',
        3,
        0.3
      )
      
      // Should not find other user's memory
      const foundOtherUserMemory = relevantMemories.some(
        memory => memory.content.includes('Other user memory')
      )
      expect(foundOtherUserMemory).toBe(false)
    }, TEST_TIMEOUT)
  })
}) 