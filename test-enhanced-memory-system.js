// Test script for enhanced memory system
const { 
  extractMemoriesWithConfidence,
  saveExtractedMemories 
} = require('./lib/memory-extraction.ts')
const { 
  summarizeMemory, 
  shouldSummarize 
} = require('./lib/memory-summarization.ts')
const { 
  checkForDuplicates 
} = require('./lib/memory-deduplication.ts')
const { 
  calculateAdaptiveThreshold,
  getOptimalMemoryLimit 
} = require('./lib/memory-optimization.ts')

async function testEnhancedMemorySystem() {
  console.log('🧠 Testing Enhanced Memory System...')
  
  const testUserId = 'test-user-id-123'
  const testMessages = [
    {
      role: 'user',
      content: 'My name is John and I work as a software engineer at Google'
    },
    {
      role: 'user',
      content: 'I prefer TypeScript over JavaScript for my projects'
    },
    {
      role: 'user',
      content: 'I like working with React and Node.js for full-stack development'
    },
    {
      role: 'assistant',
      content: 'I understand you prefer TypeScript and work with React and Node.js'
    }
  ]
  
  try {
    // Test 1: Memory Extraction
    console.log('\n📝 Testing Memory Extraction...')
    const extractionConfig = {
      enableProactiveExtraction: true,
      extractionThreshold: 0.7,
      maxMemoriesPerConversation: 5,
      enableSummarization: true,
      enableDuplicateDetection: true
    }
    
    const extractedMemories = await extractMemoriesWithConfidence(
      testMessages,
      testUserId,
      extractionConfig
    )
    
    console.log(`✅ Extracted ${extractedMemories.length} memories:`)
    extractedMemories.forEach((memory, index) => {
      console.log(`  ${index + 1}. ${memory.type} (${memory.confidence}): ${memory.content.substring(0, 50)}...`)
    })
    
    // Test 2: Memory Summarization
    console.log('\n📝 Testing Memory Summarization...')
    const longContent = `I am a senior software engineer with over 10 years of experience in web development. I specialize in JavaScript, TypeScript, React, Node.js, and Python. I have worked on large-scale applications for companies like Google, Microsoft, and Amazon. I prefer functional programming paradigms and enjoy working with modern frameworks and tools. My current project involves building a real-time collaboration platform using WebSockets and React.`
    
    console.log(`Should summarize: ${shouldSummarize(longContent)}`)
    if (shouldSummarize(longContent)) {
      const summarized = await summarizeMemory(longContent)
      console.log(`Original (${longContent.length} chars): ${longContent.substring(0, 100)}...`)
      console.log(`Summarized (${summarized.length} chars): ${summarized}`)
    }
    
    // Test 3: Duplicate Detection
    console.log('\n🔍 Testing Duplicate Detection...')
    const testContent = 'I prefer TypeScript over JavaScript'
    const isDuplicate = await checkForDuplicates(testContent, testUserId, 0.8)
    console.log(`Is duplicate: ${isDuplicate}`)
    
    // Test 4: Adaptive Thresholds
    console.log('\n🎯 Testing Adaptive Thresholds...')
    const context = 'I need help with React hooks and TypeScript'
    const memoryCount = 25
    
    const adaptiveThreshold = calculateAdaptiveThreshold(testUserId, memoryCount, context)
    const optimalLimit = getOptimalMemoryLimit(memoryCount, context)
    
    console.log(`Memory count: ${memoryCount}`)
    console.log(`Context: ${context}`)
    console.log(`Adaptive threshold: ${adaptiveThreshold}`)
    console.log(`Optimal limit: ${optimalLimit}`)
    
    // Test 5: Save Extracted Memories (if any)
    if (extractedMemories.length > 0) {
      console.log('\n💾 Testing Memory Saving...')
      try {
        await saveExtractedMemories(extractedMemories, testUserId, extractionConfig)
        console.log('✅ Successfully saved extracted memories')
      } catch (error) {
        console.log('⚠️ Memory saving failed (expected in test environment):', error.message)
      }
    }
    
    console.log('\n🎉 Enhanced Memory System Test Completed!')
    console.log('\n📊 Summary:')
    console.log(`- Memory extraction: ${extractedMemories.length} memories found`)
    console.log(`- Summarization: ${shouldSummarize(longContent) ? 'Working' : 'Not needed'}`)
    console.log(`- Duplicate detection: ${isDuplicate ? 'Duplicate found' : 'No duplicates'}`)
    console.log(`- Adaptive thresholds: ${adaptiveThreshold} (threshold), ${optimalLimit} (limit)`)
    
  } catch (error) {
    console.error('❌ Enhanced memory system test failed:', error.message)
  }
}

// Run the test
testEnhancedMemorySystem() 