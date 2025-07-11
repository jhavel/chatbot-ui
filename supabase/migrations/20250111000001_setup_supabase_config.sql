-- Set up Supabase configuration settings
-- This migration configures the app settings that will be used by the storage deletion functions

-- Create a function to set up the configuration
CREATE OR REPLACE FUNCTION setup_supabase_config()
RETURNS VOID AS $$
BEGIN
  -- Set the Supabase URL configuration
  -- This will be set by the application during runtime
  PERFORM set_config('app.supabase_url', 'https://mronjhmefodcxkoneyti.supabase.co', false);
  
  -- Note: The service role key will be set by the application during runtime
  -- to avoid hardcoding it in the migration files
END;
$$ LANGUAGE plpgsql;

-- Call the setup function
SELECT setup_supabase_config();

-- Drop the setup function as it's no longer needed
DROP FUNCTION setup_supabase_config(); 