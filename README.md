# AI Curator

A Next.js application for AI-powered artwork curation and sales.

## Local Development

### Prerequisites

- Node.js 18+ 
- npm 9+
- A Supabase account with project

### Setup

1. Clone the repository:
   ```
   git clone [your-repo-url]
   cd aicurator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Run the development server:
   ```
   npm run dev:all
   ```

   This will start both the Next.js app and the local Netlify Functions server.

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The application requires specific tables in your Supabase database:
- `profiles`: Stores user profile information
- `user_preferences`: Stores user preferences for artwork
- `user_settings`: Stores user application settings
- `artworks`: Stores artwork information
- `artwork_images`: Stores artwork image URLs

You can find the SQL migrations in the `supabase/migrations` directory.

## Building for Production

```
npm run build
```

This will create a static export in the `out` directory.

## Deploying to Netlify

1. Run the Netlify setup script:
   ```
   npm run setup-netlify
   ```

2. Push your code to GitHub

3. In the Netlify dashboard:
   - Connect to your GitHub repository
   - Set build command to: `npm install --include=dev && npm install sharp && npm run build`
   - Set publish directory to: `out`

4. Add the following environment variables in the Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. Deploy your site

## Project Structure

- `app/`: Next.js app router pages and API routes
- `components/`: React components
- `netlify/`: Netlify functions and plugins
- `public/`: Static assets
- `scripts/`: Build and setup scripts
- `supabase/`: Supabase migrations and functions

## License

[Specify your license here]
