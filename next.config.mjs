// next.config.mjs

import withBundleAnalyzer from '@next/bundle-analyzer'

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {

  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    cssChunking: true,
  },

  transpilePackages: [
    'react-native-safe-area-context',
    'react-native-svg',
  ],

  images: {
    domains: [
      'storage.googleapis.com',
      'firebasestorage.googleapis.com',
      'flagcdn.com',
    ],
  },



  async rewrites() {
    return [
      {
        source: '/chats/:path*',
        destination: '/chats',
      },
    ]
  },
}

export default withAnalyzer(nextConfig)
