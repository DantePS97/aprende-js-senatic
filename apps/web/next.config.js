/** @type {import('next').NextConfig} */
const path = require('path');

module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@senatic/shared'],
  // Required for monorepos: tells Next.js file tracer to resolve from the repo
  // root so it can find shared packages and route-group manifests correctly on Vercel
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};
