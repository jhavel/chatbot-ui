-- Disable the file deletion trigger that's causing issues
-- We're handling storage deletion in the API route, so this trigger is redundant

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