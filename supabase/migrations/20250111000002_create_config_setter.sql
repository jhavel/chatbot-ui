-- Create a function to set the Supabase service role key configuration
-- This allows the application to set the key without hardcoding it in migrations

CREATE OR REPLACE FUNCTION set_supabase_service_role_key(service_key TEXT)
RETURNS VOID AS $$
BEGIN
  -- Set the service role key configuration
  PERFORM set_config('app.supabase_service_role_key', service_key, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_supabase_service_role_key(TEXT) TO authenticated; 