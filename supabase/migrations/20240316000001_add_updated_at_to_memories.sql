-- Add updated_at column to memories table
ALTER TABLE memories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Create index for updated_at
CREATE INDEX IF NOT EXISTS memories_updated_at_idx ON memories(updated_at DESC); 