/** @type {import('next').NextConfig} */
const { copyFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Disable all server-side features
  experimental: {
    serverActions: false
  },
  // Define environment variables to be available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw',
  },
  // Copy env.js to the output directory
  onBuildComplete: async () => {
    try {
      const outDir = join(__dirname, 'out');
      
      // Ensure output directory exists
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }
      
      // Copy env.js to output directory
      copyFileSync(
        join(__dirname, 'public', 'env.js'),
        join(outDir, 'env.js')
      );
      console.log('Successfully copied env.js to output directory');
    } catch (error) {
      console.error('Error copying env.js:', error);
    }
  }
}

module.exports = nextConfig