/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.designboom.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thebourbonconcierge.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'robbreport.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn11.bigcommerce.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'musubikiln.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.etsystatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'jeroenmarkies.co.uk',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.guggenheim.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd3rf6j5nx5r04a.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'outland.art',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thehouseofwhisky.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.seadn.io',
        pathname: '/**',
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