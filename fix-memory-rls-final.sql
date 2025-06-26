-- FINAL RLS fix for memory system
-- This script completely fixes all RLS policies for both memories and memory_clusters tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's see what policies currently exist
SELECT 'Current policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('memories', 'memory_clusters')
ORDER BY tablename, policyname;

-- Drop ALL existing policies for both tables (comprehensive cleanup)
DROP POLICY IF EXISTS "Allow full access to own memories" ON memories;
DROP POLICY IF EXISTS "Allow full access to own memory clusters" ON memory_clusters;
DROP POLICY IF EXISTS "Allow select own memories" ON memories;
DROP POLICY IF EXISTS "Allow insert own memories" ON memories;
DROP POLICY IF EXISTS "Allow update own memories" ON memories;
DROP POLICY IF EXISTS "Allow delete own memories" ON memories;
DROP POLICY IF EXISTS "Allow select own memory clusters" ON memory_clusters;
DROP POLICY IF EXISTS "Allow insert own memory clusters" ON memory_clusters;
DROP POLICY IF EXISTS "Allow update own memory clusters" ON memory_clusters;
DROP POLICY IF EXISTS "Allow delete own memory clusters" ON memory_clusters;
DROP POLICY IF EXISTS "memories_select_policy" ON memories;
DROP POLICY IF EXISTS "memories_insert_policy" ON memories;
DROP POLICY IF EXISTS "memories_update_policy" ON memories;
DROP POLICY IF EXISTS "memories_delete_policy" ON memories;
DROP POLICY IF EXISTS "memory_clusters_select_policy" ON memory_clusters;
DROP POLICY IF EXISTS "memory_clusters_insert_policy" ON memory_clusters;
DROP POLICY IF EXISTS "memory_clusters_update_policy" ON memory_clusters;
DROP POLICY IF EXISTS "memory_clusters_delete_policy" ON memory_clusters;

-- Ensure RLS is enabled on both tables
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_clusters ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for memories table
CREATE POLICY "memories_select_policy"
    ON memories
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "memories_insert_policy"
    ON memories
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "memories_update_policy"
    ON memories
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "memories_delete_policy"
    ON memories
    FOR DELETE
    USING (user_id = auth.uid());

-- Create comprehensive policies for memory_clusters table
CREATE POLICY "memory_clusters_select_policy"
    ON memory_clusters
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "memory_clusters_insert_policy"
    ON memory_clusters
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "memory_clusters_update_policy"
    ON memory_clusters
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "memory_clusters_delete_policy"
    ON memory_clusters
    FOR DELETE
    USING (user_id = auth.uid());

-- Verify the policies were created
SELECT 'New policies created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('memories', 'memory_clusters')
ORDER BY tablename, policyname;

-- Show final policy status
SELECT 'Final policy summary:' as info;
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename IN ('memories', 'memory_clusters')
GROUP BY tablename
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 'RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('memories', 'memory_clusters')
ORDER BY tablename;

-- Show confirmation
SELECT 'RLS policies have been successfully created for memories and memory_clusters tables' as status; 