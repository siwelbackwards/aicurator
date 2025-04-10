/** @type {import('next').NextConfig} */
const { copyFileSync } = require('fs');
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
      {
        protocol: 'http',
        hostname: '**',
      }
    ]
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
  // Use placeholder values during build
  env: {
    // Use placeholder values during build time
    NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder-url.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key'
  },
  // Copy env.js to the output directory
  onBuildComplete: async () => {
    try {
      copyFileSync(
        join(__dirname, 'public', 'env.js'),
        join(__dirname, 'out', 'env.js')
      );
      console.log('Successfully copied env.js to output directory');
    } catch (error) {
      console.error('Error copying env.js:', error);
    }
  }
}

module.exports = nextConfig