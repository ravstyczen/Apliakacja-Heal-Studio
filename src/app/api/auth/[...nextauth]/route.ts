import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force NEXTAUTH_URL to production domain on Vercel so OAuth callbacks
// don't use the preview-deployment-specific VERCEL_URL.
if (process.env.VERCEL && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL =
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://apliakacja-heal-studio.vercel.app';
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
