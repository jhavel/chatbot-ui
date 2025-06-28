// Test script for intelligent memory system
const { 
  IntelligentMemorySystem,
  ConversationAnalyzer,
  IntelligentMemoryExtractor 
} = require('./lib/intelligent-memory-system.ts')

async function testIntelligentMemorySystem() {
  console.log('🧠 Testing Intelligent Memory System...')
  
  const system = new IntelligentMemorySystem()
  const analyzer = new ConversationAnalyzer()
  const extractor = new IntelligentMemoryExtractor()
  
  const testUserId = 'test-user-id-123'
  
  // Test 1: Simple question (should skip processing)
  console.log('\n📝 Test 1: Simple Question')
  const simpleQuestion = [
    { role: 'user', content: 'Where were we?' }
  ]
  
  const startTime1 = Date.now()
  const result1 = await system.handleConversation(simpleQuestion, testUserId)
  const processingTime1 = Date.now() - startTime1
  
  console.log(`✅ Result: ${result1.shouldProcess ? 'PROCESSED' : 'SKIPPED'}`)
  console.log(`⏱️  Processing time: ${processingTime1}ms`)
  console.log(`🎯 Priority: ${result1.processingPriority}`)
  console.log(`📊 Candidates: ${result1.candidatesCount}`)
  
  // Test 2: Personal information (should process)
  console.log('\n📝 Test 2: Personal Information')
  const personalInfo = [
    { role: 'user', content: 'My name is John and I work as a software engineer at Google' }
  ]
  
  const startTime2 = Date.now()
  const result2 = await system.handleConversation(personalInfo, testUserId)
  const processingTime2 = Date.now() - startTime2
  
  console.log(`✅ Result: ${result2.shouldProcess ? 'PROCESSED' : 'SKIPPED'}`)
  console.log(`⏱️  Processing time: ${processingTime2}ms`)
  console.log(`🎯 Priority: ${result2.processingPriority}`)
  console.log(`📊 Candidates: ${result2.candidatesCount}`)
  
  // Test 3: Technical conversation (should process)
  console.log('\n📝 Test 3: Technical Conversation')
  const technicalConversation = [
    { role: 'user', content: 'I need help with React hooks and TypeScript' },
    { role: 'assistant', content: 'I can help you with React hooks and TypeScript!' },
    { role: 'user', content: 'I prefer using functional components over class components' }
  ]
  
  const startTime3 = Date.now()
  const result3 = await system.handleConversation(technicalConversation, testUserId)
  const processingTime3 = Date.now() - startTime3
  
  console.log(`✅ Result: ${result3.shouldProcess ? 'PROCESSED' : 'SKIPPED'}`)
  console.log(`⏱️  Processing time: ${processingTime3}ms`)
  console.log(`🎯 Priority: ${result3.processingPriority}`)
  console.log(`📊 Candidates: ${result3.candidatesCount}`)
  
  // Test 4: Complex conversation (should process with high priority)
  console.log('\n📝 Test 4: Complex Conversation')
  const complexConversation = [
    { role: 'user', content: 'I\'m a senior software engineer with 10 years of experience' },
    { role: 'assistant', content: 'That\'s impressive! What technologies do you work with?' },
    { role: 'user', content: 'I specialize in JavaScript, TypeScript, React, and Node.js. I\'ve worked at Google and Microsoft, and I\'m currently building a real-time collaboration platform using WebSockets and React. I prefer functional programming paradigms and enjoy working with modern frameworks.' }
  ]
  
  const startTime4 = Date.now()
  const result4 = await system.handleConversation(complexConversation, testUserId)
  const processingTime4 = Date.now() - startTime4
  
  console.log(`✅ Result: ${result4.shouldProcess ? 'PROCESSED' : 'SKIPPED'}`)
  console.log(`⏱️  Processing time: ${processingTime4}ms`)
  console.log(`🎯 Priority: ${result4.processingPriority}`)
  console.log(`📊 Candidates: ${result4.candidatesCount}`)
  
  // Test 5: Conversation analysis
  console.log('\n📝 Test 5: Conversation Analysis')
  const context1 = await analyzer.analyzeConversation(simpleQuestion)
  const context2 = await analyzer.analyzeConversation(personalInfo)
  const context3 = await analyzer.analyzeConversation(complexConversation)
  
  console.log('Simple question context:', {
    intent: context1.userIntent,
    complexity: context1.complexity,
    personalInfo: context1.containsPersonalInfo
  })
  
  console.log('Personal info context:', {
    intent: context2.userIntent,
    complexity: context2.complexity,
    personalInfo: context2.containsPersonalInfo
  })
  
  console.log('Complex conversation context:', {
    intent: context3.userIntent,
    complexity: context3.complexity,
    personalInfo: context3.containsPersonalInfo
  })
  
  // Performance summary
  console.log('\n📊 Performance Summary:')
  console.log(`Simple question: ${processingTime1}ms (${result1.shouldProcess ? 'PROCESSED' : 'SKIPPED'})`)
  console.log(`Personal info: ${processingTime2}ms (${result2.shouldProcess ? 'PROCESSED' : 'SKIPPED'})`)
  console.log(`Technical conversation: ${processingTime3}ms (${result3.shouldProcess ? 'PROCESSED' : 'SKIPPED'})`)
  console.log(`Complex conversation: ${processingTime4}ms (${result4.shouldProcess ? 'PROCESSED' : 'SKIPPED'})`)
  
  const avgProcessingTime = (processingTime1 + processingTime2 + processingTime3 + processingTime4) / 4
  console.log(`\n🎯 Average processing time: ${avgProcessingTime.toFixed(1)}ms`)
  console.log(`🚀 Target: < 2000ms`)
  console.log(`✅ Performance: ${avgProcessingTime < 2000 ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'}`)
  
  // Memory extraction efficiency
  const totalCandidates = result1.candidatesCount + result2.candidatesCount + result3.candidatesCount + result4.candidatesCount
  console.log(`\n🧠 Memory extraction efficiency:`)
  console.log(`Total candidates: ${totalCandidates}`)
  console.log(`Target: < 12 (3 per conversation max)`)
  console.log(`✅ Efficiency: ${totalCandidates <= 12 ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'}`)
  
  console.log('\n🎉 Intelligent Memory System Test Completed!')
}

// Run the test
testIntelligentMemorySystem().catch(console.error) 