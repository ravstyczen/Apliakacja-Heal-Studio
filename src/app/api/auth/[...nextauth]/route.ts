import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force NEXTAUTH_URL to production domain on Vercel so OAuth callbacks
// don't use the preview-deployment-specific VERCEL_URL.
// Uses dynamic key access to prevent Next.js webpack from replacing
// process.env.NEXTAUTH_URL with a build-time value.
const NEXTAUTH_KEY = 'NEXTAUTH_URL';
if (process.env.VERCEL && !process.env[NEXTAUTH_KEY]) {
  process.env[NEXTAUTH_KEY] = 'https://apliakacja-heal-studio.vercel.app';
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
