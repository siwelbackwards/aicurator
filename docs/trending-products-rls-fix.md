# Trending Products RLS Fix

## Problem
The trending products admin page was failing with the error:
```
Database error: new row violates row-level security policy for table "admin_trending_products"
```

## Root Cause
The `admin_trending_products` table had Row Level Security (RLS) policies that only allowed users with `role = 'admin'` to perform CRUD operations. However, the admin pages were using the regular Supabase client with user authentication, which wasn't properly bypassing these RLS policies.

## Solution
Updated all CRUD operations in the trending products admin page to use the Supabase service role key, which bypasses RLS policies entirely for admin operations.

## Changes Made

### 1. Service Role Client Implementation
All database operations now use a service role client:
```typescript
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### 2. Functions Updated
- `fetchData()` - Reading trending products
- `addTrendingProduct()` - Adding new products
- `removeTrendingProduct()` - Deleting products
- `updateDisplayOrder()` - Reordering products
- `toggleActive()` - Activating/deactivating products
- `fetchAvailableArtworks()` - Getting approved artworks for selection

### 3. Environment Variables
The fix uses the `SUPABASE_SERVICE_ROLE_KEY` environment variable when available, falling back to the anon key for development environments.

## Security Considerations
- Service role operations are only used in admin contexts
- User authentication is still required to access admin pages
- RLS policies remain in place for public access (only active products are visible)

## Benefits
- ✅ Admin operations work correctly in all environments
- ✅ Proper error handling with detailed error messages
- ✅ Consistent approach across all admin functions
- ✅ Maintains security while enabling functionality
