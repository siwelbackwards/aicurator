/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
    domains: ['cpzzmpgbyzcqbwkaaqdy.supabase.co', 'images.unsplash.com'],
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
    minimumCacheTTL: 1800,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  staticPageGenerationTimeout: 300,
  trailingSlash: true,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    'react-syntax-highlighter',
    'swagger-client',
    'swagger-ui-react',
    'openai',
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
    '@supabase/ssr'
  ],
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimisticClientCache: true,
    externalDir: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  swcMinify: true,
};

module.exports = nextConfig;