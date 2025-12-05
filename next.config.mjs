/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force client-side rendering for all pages
  experimental: {
    // Disable SSR/SSG features to enforce CSR
  },
  // Disable static page generation
  output: 'standalone',
};

export default nextConfig;
