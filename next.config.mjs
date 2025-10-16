// next.config.mjs

import withBundleAnalyzer from '@next/bundle-analyzer'

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  experimental: {

    serverActions: {
      bodySizeLimit: '5mb',
      allowedOrigins: ['localhost:3000', 'realmotor.jp', 'www.realmotor.jp']
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
        source: '/chats/:chatId',
        destination: '/chats',
      },

    ]
  }
}

export default withAnalyzer(nextConfig)





