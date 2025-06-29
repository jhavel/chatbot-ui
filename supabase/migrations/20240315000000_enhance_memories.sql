--------------- ENHANCED MEMORIES ---------------

-- Add new columns to memories table for semantic clustering and relevance scoring
ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE memories ADD COLUMN IF NOT EXISTS cluster_id UUID;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS relevance_score REAL DEFAULT 1.0;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS semantic_tags TEXT[] DEFAULT '{}';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS memory_type TEXT DEFAULT 'general';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS importance_score REAL DEFAULT 0.5;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS memories_cluster_id_idx ON memories(cluster_id);
CREATE INDEX IF NOT EXISTS memories_relevance_score_idx ON memories(relevance_score DESC);
CREATE INDEX IF NOT EXISTS memories_access_count_idx ON memories(access_count DESC);
CREATE INDEX IF NOT EXISTS memories_last_accessed_idx ON memories(last_accessed DESC);
CREATE INDEX IF NOT EXISTS memories_semantic_tags_idx ON memories USING GIN (semantic_tags);
CREATE INDEX IF NOT EXISTS memories_memory_type_idx ON memories(memory_type);

-- Create memory clusters table
CREATE TABLE IF NOT EXISTS memory_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    centroid_embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    memory_count INTEGER DEFAULT 0,
    average_relevance_score REAL DEFAULT 0.0
);

-- Create indexes for memory_clusters
CREATE INDEX IF NOT EXISTS memory_clusters_user_id_idx ON memory_clusters(user_id);
CREATE INDEX IF NOT EXISTS memory_clusters_centroid_embedding_idx ON memory_clusters USING hnsw (centroid_embedding vector_cosine_ops);

-- Enable RLS for memory_clusters
ALTER TABLE memory_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own memory clusters"
    ON memory_clusters
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Add trigger to update memory_clusters.memory_count
CREATE OR REPLACE FUNCTION update_cluster_memory_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE memory_clusters 
        SET memory_count = memory_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.cluster_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE memory_clusters 
        SET memory_count = memory_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.cluster_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.cluster_id != NEW.cluster_id THEN
            -- Decrement old cluster
            UPDATE memory_clusters 
            SET memory_count = memory_count - 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.cluster_id;
            -- Increment new cluster
            UPDATE memory_clusters 
            SET memory_count = memory_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.cluster_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cluster_memory_count_trigger ON memories;
CREATE TRIGGER update_cluster_memory_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_cluster_memory_count();

-- Function to find similar memories
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
        1 - (m.embedding <=> query_embedding) as similarity
    FROM memories m
    WHERE m.user_id = user_id_param
        AND m.embedding IS NOT NULL
        AND 1 - (m.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY similarity DESC, m.relevance_score DESC, m.access_count DESC
    LIMIT match_count;
END;
$$;

-- Function to update memory access statistics
CREATE OR REPLACE FUNCTION update_memory_access(memory_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE memories 
    SET access_count = access_count + 1,
        last_accessed = CURRENT_TIMESTAMP,
        relevance_score = LEAST(relevance_score * 1.1, 2.0) -- Boost relevance, cap at 2.0
    WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decay memory relevance over time
CREATE OR REPLACE FUNCTION decay_memory_relevance()
RETURNS VOID AS $$
BEGIN
    UPDATE memories 
    SET relevance_score = GREATEST(relevance_score * 0.95, 0.1) -- Decay by 5%, minimum 0.1
    WHERE last_accessed < CURRENT_TIMESTAMP - INTERVAL '7 days'
        AND relevance_score > 0.1;
END;
$$ LANGUAGE plpgsql; 