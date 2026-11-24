/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wallet-web-app/types', '@wallet-web-app/config', '@wallet-web-app/ui'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'api.dicebear.com' }],
  },
};
module.exports = nextConfig;
