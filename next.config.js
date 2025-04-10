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
  // Use placeholder values during build
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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