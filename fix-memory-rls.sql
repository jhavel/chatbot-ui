-- Fix RLS policies for memory system
-- Drop existing policies and recreate them properly

-- Fix memory_clusters RLS policies
DROP POLICY IF EXISTS "Allow full access to own memory clusters" ON memory_clusters;

-- Create separate policies for SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Allow select own memory clusters"
    ON memory_clusters
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Allow insert own memory clusters"
    ON memory_clusters
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow update own memory clusters"
    ON memory_clusters
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow delete own memory clusters"
    ON memory_clusters
    FOR DELETE
    USING (user_id = auth.uid());

-- Fix memories RLS policies (in case they're missing)
DROP POLICY IF EXISTS "Allow full access to own memories" ON memories;

CREATE POLICY "Allow select own memories"
    ON memories
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Allow insert own memories"
    ON memories
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow update own memories"
    ON memories
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow delete own memories"
    ON memories
    FOR DELETE
    USING (user_id = auth.uid());

-- Verify RLS is enabled
ALTER TABLE memory_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Test the policies by checking if they exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('memory_clusters', 'memories')
ORDER BY tablename, policyname; 