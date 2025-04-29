/** @type {import('next').NextConfig} */
const { copyFileSync, existsSync, mkdirSync } = require('fs');
const { join, resolve } = require('path');
const path = require('path');

// Get Supabase URL from environment variable or use default
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co';
// Extract the hostname from the URL
const supabaseHostname = supabaseUrl.replace(/^https?:\/\//, '');

const nextConfig = {
  // Restore static export for Netlify deployment
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/**',
      },
      // Allow images from any domain during development
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Add placeholder for fallback images
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Specify page extensions to limit what files are considered pages
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Disable all server-side features
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'aicurator.netlify.app']
    }
  },
  // Define environment variables to be available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw',
  },
  // Handle API and authentication routes for static export
  trailingSlash: true,
  // Skip specific pages/paths that may cause build errors
  excludeDefaultMomentLocales: true,
  webpack: (config, { dev, isServer }) => {
    // Apply custom webpack configurations here if needed
    
    // This helps prevent false references to non-existent pages
    // during static export builds
    if (!dev && !isServer) {
      // Ignore specific paths that don't exist to prevent build errors
      Object.assign(config.resolve.alias, {
        './pages/api/auth/[...nextauth]': require.resolve('./scripts/empty-module.js'),
      });
    }
    
    // Fix for missing pages/api/auth/[...nextauth].js
    if (!isServer) {
      // Set up fallbacks for Node.js modules that might be imported
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Create an alias for the missing NextAuth file
      config.resolve.alias = {
        ...config.resolve.alias,
        './pages/api/auth/[...nextauth]': path.resolve(__dirname, './scripts/empty-module.js'),
      };
    }
    
    return config;
  }
}

module.exports = nextConfig