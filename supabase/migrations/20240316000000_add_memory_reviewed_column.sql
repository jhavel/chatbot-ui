-- Add reviewed column to memories table
ALTER TABLE memories ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Create index for reviewed status
CREATE INDEX IF NOT EXISTS memories_reviewed_idx ON memories(reviewed);

-- Function to mark memories as reviewed
CREATE OR REPLACE FUNCTION mark_memory_reviewed(memory_id UUID, reviewer_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE memories 
    SET reviewed = TRUE,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = reviewer_id
    WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark multiple memories as reviewed
CREATE OR REPLACE FUNCTION mark_memories_reviewed(memory_ids UUID[], reviewer_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE memories 
    SET reviewed = TRUE,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = reviewer_id
    WHERE id = ANY(memory_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql; 