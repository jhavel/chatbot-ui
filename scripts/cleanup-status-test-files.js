#!/usr/bin/env node

/**
 * Cleanup script for status test files
 * Removes any test files left behind from status checks
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from the project root
dotenv.config({ path: join(__dirname, '..', '.env.local') })
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('📝 Setup instructions:')
  console.error('1. Create a .env.local file in the project root')
  console.error('2. Add your Supabase environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('3. Run this script again')
  console.error('')
  console.error('💡 Note: The service role key is required for cleanup operations')
  console.error('   You can find it in your Supabase dashboard under Settings > API')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupStatusTestFiles() {
  try {
    console.log('🧹 Starting cleanup of status test files...')

    // List all files in the status-tests directory
    const { data: files, error: listError } = await supabase.storage
      .from('files')
      .list('status-tests', {
        limit: 1000,
        offset: 0
      })

    if (listError) {
      console.error('❌ Error listing status test files:', listError.message)
      return
    }

    if (!files || files.length === 0) {
      console.log('✅ No status test files found to clean up')
      return
    }

    console.log(`📁 Found ${files.length} status test files`)

    // Group files by user directory
    const filesByUser = {}
    files.forEach(file => {
      const pathParts = file.name.split('/')
      if (pathParts.length >= 2) {
        const userId = pathParts[0]
        if (!filesByUser[userId]) {
          filesByUser[userId] = []
        }
        filesByUser[userId].push(file.name)
      }
    })

    let totalDeleted = 0

    // Delete files for each user
    for (const [userId, userFiles] of Object.entries(filesByUser)) {
      console.log(`👤 Cleaning up files for user: ${userId} (${userFiles.length} files)`)

      const { error: deleteError } = await supabase.storage
        .from('files')
        .remove(userFiles.map(file => `status-tests/${file}`))

      if (deleteError) {
        console.error(`❌ Error deleting files for user ${userId}:`, deleteError.message)
      } else {
        console.log(`✅ Deleted ${userFiles.length} files for user ${userId}`)
        totalDeleted += userFiles.length
      }
    }

    console.log(`🎉 Cleanup completed! Deleted ${totalDeleted} status test files`)

    // Also clean up any old status-test files in the root status-test directory
    const { data: oldFiles, error: oldListError } = await supabase.storage
      .from('files')
      .list('status-test', {
        limit: 1000,
        offset: 0
      })

    if (!oldListError && oldFiles && oldFiles.length > 0) {
      console.log(`📁 Found ${oldFiles.length} old status test files to clean up`)

      const oldFilePaths = oldFiles.map(file => `status-test/${file.name}`)
      const { error: oldDeleteError } = await supabase.storage
        .from('files')
        .remove(oldFilePaths)

      if (oldDeleteError) {
        console.error('❌ Error deleting old status test files:', oldDeleteError.message)
      } else {
        console.log(`✅ Deleted ${oldFiles.length} old status test files`)
        totalDeleted += oldFiles.length
      }
    }

    console.log(`🎉 Total cleanup completed! Deleted ${totalDeleted} test files`)

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    process.exit(1)
  }
}

// Run cleanup
cleanupStatusTestFiles()
  .then(() => {
    console.log('✅ Cleanup script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error)
    process.exit(1)
  }) 