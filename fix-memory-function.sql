-- Fix the type mismatch in find_similar_memories function
-- Run this in your Supabase SQL editor

CREATE OR REPLACE FUNCTION find_similar_memories(
    query_embedding vector(1536),
    user_id_param UUID,
    match_count INTEGER DEFAULT 5,
    similarity_threshold REAL DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    relevance_score REAL,
    access_count INTEGER,
    last_accessed TIMESTAMPTZ,
    similarity REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.relevance_score,
        m.access_count,
        m.last_accessed,
        (1 - (m.embedding <=> query_embedding))::REAL as similarity
    FROM memories m
    WHERE m.user_id = user_id_param
        AND m.embedding IS NOT NULL
        AND (1 - (m.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY similarity DESC, m.relevance_score DESC, m.access_count DESC
    LIMIT match_count;
END;
$$; 