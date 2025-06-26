#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

console.log('🧠 Setting up Enhanced Memory System for Cloud Supabase...')

try {
  // Check if we have a linked project by looking for the config
  console.log('🔍 Checking for linked Supabase project...')
  
  // Try to get project info directly
  try {
    const projectInfo = execSync('supabase projects list --json', { encoding: 'utf8' })
    console.log('✅ Found Supabase projects')
    
    // Check if we can generate types
    console.log('🔧 Generating TypeScript types...')
    execSync('supabase gen types typescript --linked > supabase/types.ts', { stdio: 'inherit' })
    
    console.log('✅ Enhanced Memory System setup complete!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Go to your Supabase dashboard → SQL Editor')
    console.log('2. Copy and paste the SQL from complete-memory-setup.sql')
    console.log('3. Run the SQL to create indexes, functions, and triggers')
    console.log('4. Set your OPENAI_API_KEY in your environment variables')
    console.log('5. Visit /memories to see the new interface')
    console.log('')
    console.log('🎉 New features available:')
    console.log('  • Semantic memory clustering')
    console.log('  • Contextual memory retrieval')
    console.log('  • Relevance scoring and decay')
    console.log('  • Memory type classification')
    console.log('  • Enhanced memory visualization')
    
  } catch (error) {
    console.log('❌ Error accessing Supabase project')
    console.log('')
    console.log('📋 To link your project:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Copy your project ID from the URL')
    console.log('3. Run: supabase link --project-ref YOUR_PROJECT_ID')
    console.log('4. Run: supabase login (if needed)')
    console.log('')
    process.exit(1)
  }
  
} catch (error) {
  console.error('❌ Error setting up Enhanced Memory System:', error.message)
  process.exit(1)
} 