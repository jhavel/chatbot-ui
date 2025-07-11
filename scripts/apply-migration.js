const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function applyMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('Applying database migration to fix file deletion...')

  const migrationSQL = `
    -- Create a direct delete function that bypasses the problematic trigger
    CREATE OR REPLACE FUNCTION delete_file_direct(file_id UUID, user_id UUID)
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Delete related entities first
      DELETE FROM file_workspaces WHERE file_id = $1;
      DELETE FROM collection_files WHERE file_id = $1;
      DELETE FROM assistant_files WHERE file_id = $1;
      DELETE FROM chat_files WHERE file_id = $1;
      
      -- Delete the file record directly (bypassing the trigger)
      DELETE FROM files WHERE id = $1 AND user_id = $2;
      
      RETURN FOUND;
    END;
    $$;
  `

  try {
    // Execute the SQL directly using the REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql: migrationSQL })
    })

    if (response.ok) {
      console.log('✅ Migration applied successfully!')
    } else {
      const error = await response.text()
      console.error('❌ Migration failed:', error)
    }
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
  }
}

applyMigration() 