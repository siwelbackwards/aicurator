-- Enable the vector extension if not already enabled
create extension if not exists vector;

-- Drop existing function if it exists
drop function if exists match_artworks;

-- Function to match artworks based on embedding similarity
create or replace function match_artworks (
  query_embedding vector(1536)
)
returns table (
  id uuid,
  title text,
  description text,
  artist_name text,
  category text,
  images jsonb,
  price float,
  similarity float
)
language sql
stable
as $$
  select
    id,
    title,
    description,
    artist_name,
    category,
    images,
    price,
    1 - (content_embedding <=> query_embedding) as similarity
  from artworks
  where content_embedding is not null
  order by content_embedding <=> query_embedding
  limit 10;
$$;