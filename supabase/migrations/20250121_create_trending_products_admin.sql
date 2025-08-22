-- Create admin-managed trending products table
-- This allows admins to manually select and order trending products on the homepage

-- Create the admin_trending_products table
CREATE TABLE IF NOT EXISTS public.admin_trending_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique artwork_id and enforce display order constraints
    UNIQUE(artwork_id),
    CHECK (display_order >= 1 AND display_order <= 8)
);

-- Add RLS (Row Level Security)
ALTER TABLE public.admin_trending_products ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all records
CREATE POLICY "Admins can manage trending products" ON public.admin_trending_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create policy for public read access (only active products)
CREATE POLICY "Public can view active trending products" ON public.admin_trending_products
    FOR SELECT USING (is_active = true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_trending_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_trending_products_updated_at
    BEFORE UPDATE ON public.admin_trending_products
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_trending_products_updated_at();

-- Create a view for easy access to trending products with artwork details
CREATE OR REPLACE VIEW public.trending_products_view AS
SELECT
    atp.id,
    atp.artwork_id,
    atp.display_order,
    atp.is_active,
    atp.created_at,
    atp.updated_at,
    a.title,
    a.artist_name,
    a.price,
    a.currency,
    a.description,
    a.category,
    a.status,
    -- Get primary image
    (SELECT file_path FROM public.artwork_images
     WHERE artwork_id = a.id AND is_primary = true
     LIMIT 1) as primary_image_path,
    -- Get all images
    ARRAY_AGG(ai.file_path) as image_paths
FROM public.admin_trending_products atp
JOIN public.artworks a ON atp.artwork_id = a.id
LEFT JOIN public.artwork_images ai ON a.id = ai.artwork_id
WHERE atp.is_active = true AND a.status = 'approved'
GROUP BY atp.id, atp.artwork_id, atp.display_order, atp.is_active, atp.created_at, atp.updated_at,
         a.id, a.title, a.artist_name, a.price, a.currency, a.description, a.category, a.status
ORDER BY atp.display_order ASC;

-- Add comments for documentation
COMMENT ON TABLE public.admin_trending_products IS 'Stores admin-selected trending products for the homepage, ordered by display_order';
COMMENT ON COLUMN public.admin_trending_products.display_order IS 'Position in the trending products list (1-8)';
COMMENT ON VIEW public.trending_products_view IS 'View combining trending product selections with artwork details';
