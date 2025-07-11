const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixFileDeletion() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('Applying database migrations to fix file deletion...')

  try {
    // Migration 1: Fix storage deletion function
    console.log('Applying migration 1: Fix storage deletion function...')
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop the existing function
        DROP FUNCTION IF EXISTS delete_storage_object(TEXT, TEXT);

        -- Create a new function that uses environment variables
        CREATE OR REPLACE FUNCTION delete_storage_object(bucket TEXT, object TEXT, OUT status INT, OUT content TEXT)
        RETURNS RECORD
        LANGUAGE 'plpgsql'
        SECURITY DEFINER
        AS $$
        DECLARE
          project_url TEXT;
          service_role_key TEXT;
          url TEXT;
        BEGIN
          -- Get the project URL from environment variable
          project_url := current_setting('app.supabase_url', true);
          IF project_url IS NULL THEN
            -- Fallback to the original URL if environment variable is not set
            project_url := 'https://mronjhmefodcxkoneyti.supabase.co';
          END IF;
          
          -- Get the service role key from environment variable
          service_role_key := current_setting('app.supabase_service_role_key', true);
          IF service_role_key IS NULL THEN
            -- Fallback to the original key if environment variable is not set
            service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb25qaG1lZm9kY3hrb25leXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODMwNTQxNywiZXhwIjoyMDYzODgxNDE3fQ.1HSSsZssgkqz4VsLo3Mr-mkULAsHx7qCc-RV0XggysY';
          END IF;
          
          url := project_url || '/storage/v1/object/' || bucket || '/' || object;
          
          SELECT
              INTO status, content
                   result.status::INT, result.content::TEXT
              FROM extensions.http((
            'DELETE',
            url,
            ARRAY[extensions.http_header('authorization','Bearer ' || service_role_key)],
            NULL,
            NULL)::extensions.http_request) AS result;
        END;
        $$;
      `
    })

    if (error1) {
      console.error('Error applying migration 1:', error1)
      return
    }

    // Migration 2: Disable problematic trigger
    console.log('Applying migration 2: Disable problematic trigger...')
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop the trigger
        DROP TRIGGER IF EXISTS delete_old_file ON files;

        -- Create a new trigger that only logs the deletion without trying to delete from storage
        CREATE OR REPLACE FUNCTION log_file_deletion()
        RETURNS TRIGGER
        LANGUAGE 'plpgsql'
        SECURITY DEFINER
        AS $$
        BEGIN
          IF TG_OP = 'DELETE' THEN
            -- Just log the deletion, don't try to delete from storage
            -- Storage deletion is handled in the API route
            RAISE NOTICE 'File deleted from database: %', OLD.file_path;
          END IF;
          IF TG_OP = 'DELETE' THEN
            RETURN OLD;
          END IF;
          RETURN NEW;
        END;
        $$;

        -- Create the new trigger
        CREATE TRIGGER log_file_deletion
        BEFORE DELETE ON files
        FOR EACH ROW
        EXECUTE PROCEDURE log_file_deletion();
      `
    })

    if (error2) {
      console.error('Error applying migration 2:', error2)
      return
    }

    console.log('✅ Database migrations applied successfully!')
    console.log('File deletion should now work correctly.')

  } catch (error) {
    console.error('Error applying migrations:', error)
  }
}

fixFileDeletion() 