/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000'),
  },
};

module.exports = nextConfig;
