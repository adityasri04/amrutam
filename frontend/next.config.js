/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://amrutam-backend.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
