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