# Deploying to Netlify

## Environment Variables Setup

When deploying this application to Netlify, you need to set up the following environment variables in the Netlify UI:

1. Go to Site settings > Environment variables
2. Add the following variables with your actual values:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `OPENAI_API_KEY` - Your OpenAI API key (if using OpenAI features)

## Notes on Secret Detection

To avoid issues with Netlify's secret scanning:

1. We use placeholder values during build time in `next.config.js`
2. The real values are injected at runtime via Netlify environment variables
3. We've configured Netlify to ignore certain paths during secrets scanning with the `SECRETS_SCAN_OMIT_PATHS` setting in `netlify.toml`

If you still encounter issues with secrets scanning, you can:

1. Make sure you are not hardcoding any API keys or sensitive values in your code
2. Set `SECRETS_SCAN_ENABLED=false` in your Netlify environment variables (only do this if you're certain no actual secrets are being exposed) 