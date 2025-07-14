#!/usr/bin/env node

/**
 * Debug script for status system
 * Tests the status system with proper authentication to identify issues
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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugStatus() {
  try {
    console.log('🔍 Debugging status system...')

    // Test 1: Check storage buckets (no auth required)
    console.log('\n📦 Test 1: Storage Bucket Check')
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      
      if (bucketError) {
        console.error('❌ Storage bucket check failed:', bucketError.message)
        console.error('Error details:', bucketError)
        return
      }
      
      console.log('✅ Storage buckets found:', buckets?.map(b => b.name))
      
      const filesBucket = buckets?.find(bucket => bucket.name === 'files')
      if (!filesBucket) {
        console.error('❌ Storage bucket "files" not found')
        console.log('Available buckets:', buckets?.map(b => b.name))
        return
      }
      
      console.log('✅ Files bucket found:', filesBucket)
    } catch (error) {
      console.error('❌ Storage bucket check error:', error.message)
      console.error('Error details:', error)
      return
    }

    // Test 2: Check if there are any users
    console.log('\n👥 Test 2: User Check')
    try {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .limit(1)

      if (usersError) {
        console.error('❌ User check failed:', usersError.message)
        console.error('Error details:', usersError)
        return
      }

      if (!users || users.length === 0) {
        console.log('⚠️ No users found in the system')
        console.log('This explains why the status endpoint shows authentication failures')
        console.log('To test the full status system, you need to:')
        console.log('1. Start the development server: npm run dev')
        console.log('2. Visit http://localhost:3000')
        console.log('3. Sign up or sign in to create a user account')
        console.log('4. Then run the status check again')
        return
      }

      const testUser = users[0]
      const name = testUser.username || testUser.display_name || testUser.id || 'User';
      console.log(`✅ User found: ${name} (${testUser.id})`)

      // Test 3: Check storage permissions with user
      console.log('\n🔐 Test 3: Storage Permissions Check')
      try {
        const testPath = `status-tests/${testUser.id}/test-permissions.txt`
        const testFile = new Blob(["Test permissions"], { type: "text/plain" })
        
        // Try to upload a test file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("files")
          .upload(testPath, testFile, {
            cacheControl: "0",
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Upload permission error:', uploadError.message)
          console.error('Error details:', uploadError)
          return
        }

        console.log('✅ Upload permission granted')

        // Try to download the file
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from("files")
          .download(testPath)

        if (downloadError) {
          console.error('❌ Download permission error:', downloadError.message)
          console.error('Error details:', downloadError)
        } else {
          console.log('✅ Download permission granted')
        }

        // Clean up
        const { error: deleteError } = await supabase.storage
          .from("files")
          .remove([testPath])

        if (deleteError) {
          console.warn('⚠️ Delete permission error:', deleteError.message)
        } else {
          console.log('✅ Delete permission granted')
        }

      } catch (error) {
        console.error('❌ Storage permissions test error:', error.message)
        console.error('Error details:', error)
      }

      // Test 4: Check storage policies
      console.log('\n📋 Test 4: Storage Policies Check')
      try {
        // List files in the status-tests directory
        const { data: files, error: listError } = await supabase.storage
          .from('files')
          .list('status-tests', {
            limit: 10,
            offset: 0
          })

        if (listError) {
          console.error('❌ List files error:', listError.message)
          console.error('Error details:', listError)
        } else {
          console.log('✅ List files permission granted')
          console.log('Files found:', files?.length || 0)
        }

      } catch (error) {
        console.error('❌ Storage policies test error:', error.message)
        console.error('Error details:', error)
      }

      // Test 5: Simulate the exact status test
      console.log('\n🧪 Test 5: Simulate Status Test')
      try {
        const testFile = new Blob(["Test file content for status check"], {
          type: "text/plain"
        })
        const fileName = `status-test-${Date.now()}.txt`
        const testPath = `status-tests/${testUser.id}/${fileName}`

        console.log(`📁 Testing file upload to path: ${testPath}`)

        // Upload test file to storage only
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("files")
          .upload(testPath, testFile, {
            cacheControl: "0",
            upsert: false
          })

        if (uploadError) {
          console.error("❌ Upload error:", uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        console.log("✅ File uploaded successfully")

        // Verify the file was uploaded by trying to download it
        const { data: downloadData, error: downloadError } =
          await supabase.storage.from("files").download(testPath)

        if (downloadError) {
          console.error("❌ Download verification error:", downloadError)
          throw new Error(
            `File upload verification failed: ${downloadError.message}`
          )
        }

        console.log("✅ File download verification successful")

        // Clean up test file immediately
        const { error: deleteError } = await supabase.storage
          .from("files")
          .remove([testPath])

        if (deleteError) {
          console.warn("⚠️ Failed to clean up test file:", deleteError.message)
        } else {
          console.log("✅ Test file cleaned up successfully")
        }

        console.log('🎉 All status tests passed!')

      } catch (error) {
        console.error('❌ Status test simulation failed:', error.message)
        console.error('Error details:', error)
        
        // Provide more specific error information
        if (error instanceof Error) {
          console.error('Error name:', error.name)
          console.error('Error stack:', error.stack)
        }
      }

    } catch (error) {
      console.error('❌ User check error:', error.message)
      console.error('Error details:', error)
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    console.error('Error details:', error)
    process.exit(1)
  }
}

// Run debug
debugStatus()
  .then(() => {
    console.log('\n✅ Debug completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error)
    process.exit(1)
  }) 