/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    domains: ['yjiguvbovteakpnkkjtb.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yjiguvbovteakpnkkjtb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

module.exports = nextConfig;