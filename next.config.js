/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'static.designboom.com',
      },
      {
        protocol: 'https',
        hostname: 'thebourbonconcierge.com',
      },
      {
        protocol: 'https',
        hostname: 'robbreport.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn11.bigcommerce.com',
      },
      {
        protocol: 'https',
        hostname: 'musubikiln.com',
      },
      {
        protocol: 'https',
        hostname: 'i.etsystatic.com',
      },
      {
        protocol: 'https',
        hostname: 'jeroenmarkies.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'www.guggenheim.org',
      },
      {
        protocol: 'https',
        hostname: 'd3rf6j5nx5r04a.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'outland.art',
      },
      {
        protocol: 'https',
        hostname: 'thehouseofwhisky.com',
      },
      {
        protocol: 'https',
        hostname: 'i.seadn.io',
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