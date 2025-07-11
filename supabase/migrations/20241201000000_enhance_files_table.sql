--------------- ENHANCE FILES TABLE ---------------

-- Add new columns to files table
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by TEXT,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS related_entity_type TEXT;

-- Add constraints
ALTER TABLE files 
ADD CONSTRAINT files_url_length CHECK (char_length(url) <= 2000),
ADD CONSTRAINT files_uploaded_by_length CHECK (char_length(uploaded_by) <= 255),
ADD CONSTRAINT files_related_entity_type_length CHECK (char_length(related_entity_type) <= 100);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS files_tags_idx ON files USING GIN (tags);
CREATE INDEX IF NOT EXISTS files_uploaded_at_idx ON files (uploaded_at DESC);
CREATE INDEX IF NOT EXISTS files_related_entity_idx ON files (related_entity_id, related_entity_type);
CREATE INDEX IF NOT EXISTS files_name_search_idx ON files USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS files_description_search_idx ON files USING gin(to_tsvector('english', description));

-- Create a function to search files with multiple criteria
CREATE OR REPLACE FUNCTION search_files(
  p_user_id UUID,
  p_search_query TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_file_types TEXT[] DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_related_entity_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'uploaded_at',
  p_sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  file_path TEXT,
  url TEXT,
  tags TEXT[],
  type TEXT,
  size INTEGER,
  tokens INTEGER,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ,
  related_entity_id UUID,
  related_entity_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id UUID,
  folder_id UUID,
  sharing TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.description,
    f.file_path,
    f.url,
    f.tags,
    f.type,
    f.size,
    f.tokens,
    f.uploaded_by,
    f.uploaded_at,
    f.related_entity_id,
    f.related_entity_type,
    f.created_at,
    f.updated_at,
    f.user_id,
    f.folder_id,
    f.sharing
  FROM files f
  WHERE f.user_id = p_user_id
    AND (p_search_query IS NULL OR 
         to_tsvector('english', f.name || ' ' || f.description) @@ plainto_tsquery('english', p_search_query))
    AND (p_tags IS NULL OR f.tags && p_tags)
    AND (p_file_types IS NULL OR f.type = ANY(p_file_types))
    AND (p_related_entity_id IS NULL OR f.related_entity_id = p_related_entity_id)
    AND (p_related_entity_type IS NULL OR f.related_entity_type = p_related_entity_type)
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'name' AND p_sort_order = 'ASC' THEN f.name
      WHEN p_sort_by = 'name' AND p_sort_order = 'DESC' THEN f.name
      WHEN p_sort_by = 'size' AND p_sort_order = 'ASC' THEN f.size::TEXT
      WHEN p_sort_by = 'size' AND p_sort_order = 'DESC' THEN f.size::TEXT
      WHEN p_sort_by = 'uploaded_at' AND p_sort_order = 'ASC' THEN f.uploaded_at::TEXT
      WHEN p_sort_by = 'uploaded_at' AND p_sort_order = 'DESC' THEN f.uploaded_at::TEXT
      ELSE f.uploaded_at::TEXT
    END ASC,
    CASE 
      WHEN p_sort_by = 'name' AND p_sort_order = 'DESC' THEN f.name
      WHEN p_sort_by = 'size' AND p_sort_order = 'DESC' THEN f.size::TEXT
      WHEN p_sort_by = 'uploaded_at' AND p_sort_order = 'DESC' THEN f.uploaded_at::TEXT
      ELSE NULL
    END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create a function to get file statistics
CREATE OR REPLACE FUNCTION get_file_stats(p_user_id UUID)
RETURNS TABLE (
  total_files BIGINT,
  total_size BIGINT,
  total_tokens BIGINT,
  file_types JSON,
  tag_counts JSON,
  recent_uploads BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_files,
    COALESCE(SUM(size), 0)::BIGINT as total_size,
    COALESCE(SUM(tokens), 0)::BIGINT as total_tokens,
    (SELECT json_object_agg(type, count) 
     FROM (SELECT type, COUNT(*) as count 
           FROM files 
           WHERE user_id = p_user_id 
           GROUP BY type) t) as file_types,
    (SELECT json_object_agg(tag, count) 
     FROM (SELECT unnest(tags) as tag, COUNT(*) as count 
           FROM files 
           WHERE user_id = p_user_id AND tags IS NOT NULL
           GROUP BY tag) t) as tag_counts,
    (SELECT COUNT(*)::BIGINT 
     FROM files 
     WHERE user_id = p_user_id 
       AND uploaded_at >= CURRENT_TIMESTAMP - INTERVAL '7 days') as recent_uploads
  FROM files 
  WHERE user_id = p_user_id;
END;
$$;

-- Create a function to get related files
CREATE OR REPLACE FUNCTION get_related_files(
  p_file_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  type TEXT,
  similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.description,
    f.type,
    CASE 
      WHEN f.tags && (SELECT tags FROM files WHERE id = p_file_id) THEN 0.8
      WHEN f.type = (SELECT type FROM files WHERE id = p_file_id) THEN 0.6
      ELSE 0.3
    END as similarity_score
  FROM files f
  WHERE f.id != p_file_id
    AND f.user_id = (SELECT user_id FROM files WHERE id = p_file_id)
  ORDER BY similarity_score DESC, f.uploaded_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_files(UUID, TEXT, TEXT[], TEXT[], UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_related_files(UUID, INTEGER) TO authenticated; 