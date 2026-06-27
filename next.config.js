/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  experimental: {
    // Keep mongoose (and bcryptjs) out of the Edge bundle — Node.js only
    serverComponentsExternalPackages: ['mongoose', 'bcryptjs'],
  },
};

module.exports = nextConfig;
