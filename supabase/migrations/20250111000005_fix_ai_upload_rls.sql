--------------- FIX AI UPLOAD RLS POLICIES ---------------

-- Ensure RLS is enabled on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the main files policy to ensure it's correct
DROP POLICY IF EXISTS "Allow full access to own files" ON files;

CREATE POLICY "Allow full access to own files"
    ON files
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Ensure file_workspaces RLS is enabled
ALTER TABLE file_workspaces ENABLE ROW LEVEL SECURITY;

-- Drop and recreate file_workspaces policy
DROP POLICY IF EXISTS "Allow full access to own file_workspaces" ON file_workspaces;

CREATE POLICY "Allow full access to own file_workspaces"
    ON file_workspaces
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Add a function to test file insertion with proper error handling
CREATE OR REPLACE FUNCTION test_file_insert(
  p_user_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_file_path TEXT,
  p_type TEXT,
  p_size INTEGER,
  p_tokens INTEGER,
  p_tags TEXT[] DEFAULT '{}',
  p_uploaded_by TEXT DEFAULT NULL,
  p_uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  p_related_entity_id UUID DEFAULT NULL,
  p_related_entity_type TEXT DEFAULT NULL,
  p_folder_id UUID DEFAULT NULL,
  p_sharing TEXT DEFAULT 'private'
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  file_id UUID,
  auth_uid UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_file_id UUID;
  v_error TEXT;
  v_auth_uid UUID;
BEGIN
  -- Get current auth.uid() for debugging
  v_auth_uid := auth.uid();
  
  BEGIN
    INSERT INTO files (
      user_id,
      name,
      description,
      file_path,
      type,
      size,
      tokens,
      tags,
      uploaded_by,
      uploaded_at,
      related_entity_id,
      related_entity_type,
      folder_id,
      sharing
    ) VALUES (
      p_user_id,
      p_name,
      p_description,
      p_file_path,
      p_type,
      p_size,
      p_tokens,
      p_tags,
      p_uploaded_by,
      p_uploaded_at,
      p_related_entity_id,
      p_related_entity_type,
      p_folder_id,
      p_sharing
    ) RETURNING id INTO v_file_id;
    
    RETURN QUERY SELECT TRUE, NULL, v_file_id, v_auth_uid;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN QUERY SELECT FALSE, v_error, NULL::UUID, v_auth_uid;
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION test_file_insert TO authenticated;

-- Add a function to check RLS status
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    schemaname || '.' || tablename as table_name,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
  FROM pg_tables t
  WHERE schemaname = 'public' 
    AND tablename IN ('files', 'file_workspaces', 'workspaces')
  ORDER BY tablename;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_rls_status TO authenticated; 