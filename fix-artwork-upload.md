# Fix for Artwork Upload Database Issues

This document explains the solution to the issue where artwork uploads fail to get saved to the `artworks` table in Supabase.

## Problem

When uploading artworks through the `/sell/new` page, the items never appear in the admin counter or in the artworks table. The console shows errors:

- `Basic artwork insert failed: {}`
- `RPC insert failed: {}`

## Solution

The solution involves two parts:

1. **Improved Frontend Code**: We've enhanced the database insertion code to:
   - Use more complete data structures
   - Provide better fallback options
   - Improve error handling and logging
   - Try multiple insertion methods

2. **Database Function**: We need to add a SQL function to the Supabase database that allows a more direct way to insert records.

## Implementation Steps

### 1. Apply Frontend Changes

The changes to `app/sell/new/page.tsx` have already been applied. These include:
- Using a more complete artwork data object
- Better error handling
- Multiple fallback mechanisms
- Improved logging

### 2. Add Database Function

You need to add the SQL function to your Supabase instance:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the content from `supabase/functions/insert_basic_artwork.sql`
5. Run the query to create the function

### 3. Check Database Permissions

Make sure your database permissions allow:
- Authenticated users to insert into the `artworks` table
- Authenticated users to insert into the `artwork_images` table

To do this:

1. Go to the Authentication settings in Supabase
2. Check the Row Level Security (RLS) policies for both tables
3. Ensure there's a policy allowing inserts for authenticated users

Example policy for artworks table:
```sql
CREATE POLICY "Users can insert their own artworks"
ON artworks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

Example policy for artwork_images table:
```sql
CREATE POLICY "Users can insert their own artwork images"
ON artwork_images
FOR INSERT
TO authenticated
WITH CHECK (artwork_id IN (
  SELECT id FROM artworks WHERE user_id = auth.uid()
));
```

### 4. Test the Upload

After applying these changes, test the upload functionality again. The frontend code will now:
1. Try a complete data insert
2. If that fails, try a minimal data insert
3. If that fails, try the SQL function
4. Log detailed error information for debugging

## Troubleshooting

If uploads still fail:
1. Check the browser console for more detailed error messages
2. Verify that the user has the correct permissions in the profiles table
3. Check if there are any database constraints being violated
4. Ensure the Supabase connection is working correctly 