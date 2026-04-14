import type { NextConfig } from 'next';
const withPWA = require('next-pwa');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@senatic/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
