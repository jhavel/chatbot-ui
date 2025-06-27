// Simple test script to verify memory system functionality
const { saveEnhancedMemory, getRelevantMemories } = require('./lib/memory-system.ts')

async function testMemorySystem() {
  console.log('🧠 Testing Memory System...')
  
  const testUserId = 'test-user-id-123'
  
  try {
    // Test 1: Save a memory
    console.log('📝 Saving test memory...')
    const memory = await saveEnhancedMemory(
      'My name is John and I work as a software engineer',
      testUserId
    )
    console.log('✅ Memory saved:', memory ? 'SUCCESS' : 'FAILED')
    
    // Test 2: Retrieve memories
    console.log('🔍 Retrieving memories...')
    const relevantMemories = await getRelevantMemories(
      testUserId,
      'What is my name?',
      3,
      0.3
    )
    console.log('✅ Memories retrieved:', relevantMemories.length)
    
    if (relevantMemories.length > 0) {
      console.log('📋 First memory:', relevantMemories[0].content.substring(0, 50) + '...')
    }
    
    console.log('🎉 Memory system test completed!')
    
  } catch (error) {
    console.error('❌ Memory system test failed:', error.message)
  }
}

testMemorySystem() 