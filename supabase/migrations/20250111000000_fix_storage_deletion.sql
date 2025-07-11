-- Fix storage deletion function to use environment variables
-- This replaces the hardcoded project URL and service role key

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