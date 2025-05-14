-- Function to insert a basic artwork record
-- This is meant to be executed on your Supabase instance

CREATE OR REPLACE FUNCTION insert_basic_artwork(
  p_user_id UUID,
  p_title TEXT,
  p_category TEXT
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  title TEXT,
  category TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO artworks (
    user_id,
    title,
    category,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_title,
    p_category,
    'pending',
    NOW(),
    NOW()
  )
  RETURNING id, user_id, title, category, status, created_at;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_basic_artwork TO authenticated;

-- Example of how to call this function from your app:
-- const { data, error } = await supabase.rpc('insert_basic_artwork', {
--   p_user_id: 'user-id-here',
--   p_title: 'Artwork Title',
--   p_category: 'paintings'
-- }); 