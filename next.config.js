/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.staticflickr.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: '**.etsystatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '**.seadn.io',
      },
      {
        protocol: 'https',
        hostname: '**.designboom.com',
      },
      {
        protocol: 'https',
        hostname: '**.thebourbonconcierge.com',
      },
      {
        protocol: 'https',
        hostname: '**.robbreport.com',
      },
      {
        protocol: 'https',
        hostname: '**.musubikiln.com',
      },
      {
        protocol: 'https',
        hostname: '**.jeroenmarkies.co.uk',
      },
      {
        protocol: 'https',
        hostname: '**.thehouseofwhisky.com',
      },
      {
        protocol: 'https',
        hostname: '**.guggenheim.org',
      },
      {
        protocol: 'https',
        hostname: '**.outland.art',
      }
    ]
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  trailingSlash: true,
  distDir: 'out'
};

module.exports = nextConfig;