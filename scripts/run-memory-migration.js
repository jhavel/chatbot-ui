#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

console.log('🧠 Setting up Enhanced Memory System...')

try {
  // Run the migration
  console.log('📦 Running database migration...')
  execSync('supabase migration up', { stdio: 'inherit' })
  
  // Generate types
  console.log('🔧 Generating TypeScript types...')
  execSync('supabase gen types typescript --local > supabase/types.ts', { stdio: 'inherit' })
  
  console.log('✅ Enhanced Memory System setup complete!')
  console.log('')
  console.log('🎉 New features available:')
  console.log('  • Semantic memory clustering')
  console.log('  • Contextual memory retrieval')
  console.log('  • Relevance scoring and decay')
  console.log('  • Memory type classification')
  console.log('  • Enhanced memory visualization')
  console.log('')
  console.log('📱 Visit /memories to see the new interface')
  
} catch (error) {
  console.error('❌ Error setting up Enhanced Memory System:', error.message)
  process.exit(1)
} 