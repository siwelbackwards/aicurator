# AI Curator - Deployment Guide

## Development Setup

### Prerequisites
- Node.js 18+ installed
- npm installed
- Supabase project configured
- Environment variables set in `.env`

### Starting Development Environment

**Option 1: Using the managed script (Recommended)**
```bash
npm run dev:managed
```

**Option 2: Using concurrently**
```bash
npm run dev:all
```

**Option 3: Manual (two separate terminals)**
```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Netlify functions dev server
npm run dev:functions
```

### Development URLs
- **Next.js App**: http://localhost:3000
- **Netlify Functions**: http://localhost:9000/.netlify/functions/
- **Admin Dashboard**: http://localhost:3000/admin/artworks
- **Form Submission**: http://localhost:3000/sell/new

## Production Deployment to Netlify

### 1. Environment Variables
Ensure these are set in Netlify dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Build Configuration
The project is configured with:
- **Build command**: `npm run build`
- **Publish directory**: `.next` (automatic with @netlify/plugin-nextjs)
- **Functions directory**: `netlify/functions`
- **Node version**: 18

### 3. Netlify Plugins
The following plugins are configured in `netlify.toml`:
- `@netlify/plugin-nextjs` - Next.js integration
- `@netlify/plugin-lighthouse` - Performance monitoring
- `./netlify/plugins/inject-env` - Environment variable injection

### 4. Production Endpoints
In production, the app automatically uses:
- **API Functions**: `/.netlify/functions/submit-artwork`
- **Admin Functions**: `/.netlify/functions/admin-artworks`
- **Status Updates**: `/.netlify/functions/admin-artwork-status`

### 5. Deploy Process
1. Push code to your connected Git repository
2. Netlify will automatically:
   - Install dependencies
   - Run `npm run build`
   - Deploy the `.next` directory
   - Deploy functions from `netlify/functions`

## Key Features

### Development
- ✅ Hot reload for both Next.js and functions
- ✅ Automatic endpoint detection (localhost vs production)
- ✅ CORS properly configured for development
- ✅ Error handling and user feedback

### Production
- ✅ Netlify Functions for server-side operations
- ✅ Next.js App Router with dynamic routes
- ✅ Supabase integration with RLS bypass for admin functions
- ✅ Image upload to Supabase Storage
- ✅ Security headers and CSP configuration

## Troubleshooting

### Development Issues

**"Failed to fetch" error in development:**
- Ensure both servers are running (`npm run dev:all`)
- Check that port 9000 is not blocked
- Verify Netlify dev server is responding: `curl http://localhost:9000/.netlify/functions/admin-artworks`

**Admin dashboard not loading:**
- Check browser console for endpoint errors
- Verify user has admin permissions in Supabase
- Ensure auth token is valid

**Form submission fails:**
- Check that all required fields are filled
- Verify image upload is working
- Check browser network tab for specific error messages

### Production Issues

**Functions not working:**
- Verify environment variables are set in Netlify
- Check Netlify function logs in dashboard
- Ensure Supabase service role key has proper permissions

**Images not uploading:**
- Check Supabase Storage bucket permissions
- Verify CORS settings in Supabase
- Check file size limits

**404 errors for new product/artwork pages:**
- This was fixed by enabling `dynamicParams = true` in both `/app/product/[id]/page.tsx` and `/app/artwork/[id]/page.tsx`
- New products will be generated on-demand when first accessed
- No rebuild required for new content

## Testing

### Test Development Server
```bash
node test-dev-server.js
```

This will test:
- OPTIONS requests (CORS)
- Admin artworks endpoint
- Submit artwork endpoint

### Manual Testing
1. **Admin Dashboard**: Visit `/admin/artworks` and verify artworks load
2. **Form Submission**: Submit a test artwork at `/sell/new`
3. **Image Upload**: Test image upload functionality
4. **Status Updates**: Test approve/reject functionality in admin panel 