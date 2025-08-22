-- Fix RLS policy for admin_trending_products table
-- This script provides multiple options to resolve the RLS issue

-- Option 1: Update existing policy to allow authenticated users with admin role
-- (This is the safest option if you want to keep strict admin-only access)

DROP POLICY IF EXISTS "Admins can manage trending products" ON public.admin_trending_products;

CREATE POLICY "Admins can manage trending products" ON public.admin_trending_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        ) OR
        -- Allow service role to bypass RLS entirely
        auth.role() = 'service_role'
    );

-- Option 2: Alternative - Create a more permissive policy for authenticated users
-- (Use this if you want any authenticated user to manage trending products)
-- Uncomment the lines below if you prefer this approach:

/*
DROP POLICY IF EXISTS "Admins can manage trending products" ON public.admin_trending_products;

CREATE POLICY "Authenticated users can manage trending products" ON public.admin_trending_products
    FOR ALL USING (
        auth.uid() IS NOT NULL OR
        auth.role() = 'service_role'
    );
*/

-- Option 3: If you want to temporarily disable RLS for testing
-- (NOT recommended for production - only for debugging)

/*
ALTER TABLE public.admin_trending_products DISABLE ROW LEVEL SECURITY;
*/

-- Verify the current user is an admin
-- Run this query in your Supabase SQL editor to check:

SELECT
    auth.uid() as current_user_id,
    p.role as user_role,
    p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = auth.uid();

-- If the user doesn't have admin role, update their profile:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'your-user-id-here';

-- Test the fix by trying to insert a record:
-- INSERT INTO public.admin_trending_products (artwork_id, display_order)
-- VALUES ('some-artwork-id', 1);

-- Check if the policy is working:
SELECT * FROM public.admin_trending_products LIMIT 5;
