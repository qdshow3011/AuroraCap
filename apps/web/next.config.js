/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  // Disabled Turbopack due to internal error
  i18n,
  // Performance optimizations
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  // Enable SWC minification
  swcMinify: true,
  // Enable HTTP/2 push
  experimental: {
    // Enable React 18 server components
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Build optimizations
  productionBrowserSourceMaps: false,
  // Enable gzip compression
  compress: true,
};

module.exports = nextConfig;