// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Direct test of memory system functionality
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Create a 1536-dimensional test vector
function createTestVector() {
  const vector = []
  for (let i = 0; i < 1536; i++) {
    vector.push(Math.random() * 2 - 1) // Random values between -1 and 1
  }
  return vector
}

async function testMemoryDirect() {
  console.log('🧠 Testing Memory System Directly...')
  console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
  console.log('🔧 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
  
  try {
    // Test 1: Check if we can access the memories table
    console.log('📊 Checking memories table access...')
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error accessing memories table:', error.message)
      console.log('🔧 This might indicate RLS policy issues')
      return
    }
    
    console.log('✅ Memories table accessible')
    console.log('📋 Found memories:', memories ? memories.length : 0)
    
    // Test 2: Check if we can access memory_clusters table
    console.log('📊 Checking memory_clusters table access...')
    const { data: clusters, error: clusterError } = await supabase
      .from('memory_clusters')
      .select('*')
      .limit(1)
    
    if (clusterError) {
      console.error('❌ Error accessing memory_clusters table:', clusterError.message)
      console.log('🔧 This might indicate RLS policy issues')
    } else {
      console.log('✅ Memory clusters table accessible')
      console.log('📋 Found clusters:', clusters ? clusters.length : 0)
    }
    
    // Test 3: Check if the find_similar_memories function exists
    console.log('🔍 Checking find_similar_memories function...')
    const testVector = createTestVector()
    const { data: functionTest, error: functionError } = await supabase
      .rpc('find_similar_memories', {
        query_embedding: testVector,
        user_id_param: '5643e5dc-5f17-4ff3-b692-cc26313d9495',
        limit_param: 5,
        similarity_threshold: 0.3
      })
    
    if (functionError) {
      console.error('❌ Error calling find_similar_memories:', functionError.message)
      console.log('🔧 This might indicate missing database function')
    } else {
      console.log('✅ find_similar_memories function accessible')
      console.log('📋 Function returned:', functionTest ? functionTest.length : 0, 'results')
      if (functionTest && functionTest.length > 0) {
        console.log('📋 First result:', {
          id: functionTest[0].id,
          content: functionTest[0].content.substring(0, 50) + '...',
          similarity: functionTest[0].similarity,
          relevance_score: functionTest[0].relevance_score
        })
      }
    }
    
    console.log('🎉 Direct memory system test completed!')
    
  } catch (error) {
    console.error('❌ Direct memory system test failed:', error.message)
  }
}

testMemoryDirect() 