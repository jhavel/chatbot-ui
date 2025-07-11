--------------- FIX FILE RLS POLICIES ---------------

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow full access to own files" ON files;
DROP POLICY IF EXISTS "Allow view access to non-private files" ON files;

-- Recreate policies with proper handling of new columns
CREATE POLICY "Allow full access to own files"
    ON files
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow view access to non-private files"
    ON files
    FOR SELECT
    USING (sharing <> 'private');

-- Ensure file_workspaces policies are correct
DROP POLICY IF EXISTS "Allow full access to own file_workspaces" ON file_workspaces;

CREATE POLICY "Allow full access to own file_workspaces"
    ON file_workspaces
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Add a function to help with debugging RLS issues
CREATE OR REPLACE FUNCTION debug_file_insert(
  p_user_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_file_path TEXT,
  p_type TEXT,
  p_size INTEGER,
  p_tokens INTEGER,
  p_tags TEXT[],
  p_uploaded_by TEXT,
  p_uploaded_at TIMESTAMPTZ,
  p_related_entity_id UUID,
  p_related_entity_type TEXT,
  p_folder_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  file_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_file_id UUID;
  v_error TEXT;
BEGIN
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
      folder_id
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
      p_folder_id
    ) RETURNING id INTO v_file_id;
    
    RETURN QUERY SELECT TRUE, NULL, v_file_id;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN QUERY SELECT FALSE, v_error, NULL::UUID;
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION debug_file_insert TO authenticated; 