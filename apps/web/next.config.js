/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa');
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@senatic/shared'],
  // Required for monorepos: tells Next.js file tracer to resolve from the repo
  // root so it can find shared packages and route-group manifests correctly on Vercel
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

module.exports = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
