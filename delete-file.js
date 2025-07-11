const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Create Supabase client with production credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deleteFile(fileId) {
  try {
    console.log(`Attempting to delete file: ${fileId}`)
    
    // First, let's check if the file exists
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()
    
    if (fetchError) {
      console.error('Error fetching file:', fetchError)
      return
    }
    
    if (!file) {
      console.log('File not found')
      return
    }
    
    console.log('Found file:', file.name)
    
    // Delete the file (this will cascade to related tables)
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
    
    if (deleteError) {
      console.error('Error deleting file:', deleteError)
      return
    }
    
    console.log('File deleted successfully!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Get file ID from command line argument or use the one from your error
const fileId = process.argv[2] || '4fd8ab5c-b481-4e6d-a243-3514532a987a'

if (!fileId) {
  console.log('Usage: node delete-file.js <file-id>')
  process.exit(1)
}

deleteFile(fileId) 