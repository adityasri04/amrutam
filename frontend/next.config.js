/** @type {import('next').NextType} */
const nextConfig = {
  // Enable experimental features for Next.js 14
  experimental: {
    serverComponentsExternalPackages: ['@amrutam/shared']
  },
  
  // Configure rewrites for API calls
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://amrutam-backend.onrender.com/api/:path*'
          : 'http://localhost:8000/api/:path*'
      }
    ];
  },
  
  // Environment variables for build
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Build output configuration
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: ['localhost', 'amrutam-backend.onrender.com'],
    unoptimized: true
  }
};

module.exports = nextConfig;
