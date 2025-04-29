const fs = require('fs');
const path = require('path');

const configContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cpzzmpgbyzcqbwkaaqdy.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  staticPageGenerationTimeout: 180,
  trailingSlash: true,
};

module.exports = nextConfig;`;

fs.writeFileSync(path.join(__dirname, 'next.config.js'), configContent, 'utf8');
console.log('Successfully created next.config.js file with Supabase hostname'); 