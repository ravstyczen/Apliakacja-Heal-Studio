import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Create handler per-request to guarantee NEXTAUTH_URL is set before
// NextAuth reads it. This prevents preview deployments from using
// the deployment-specific VERCEL_URL as the OAuth callback.
function ensureProductionUrl() {
  const key = 'NEXTAUTH_URL';
  if (!process.env[key]) {
    process.env[key] = 'https://apliakacja-heal-studio.vercel.app';
  }
}

export async function GET(
  req: Request,
  ctx: { params: { nextauth: string[] } }
) {
  ensureProductionUrl();
  return NextAuth(authOptions)(req, ctx);
}

export async function POST(
  req: Request,
  ctx: { params: { nextauth: string[] } }
) {
  ensureProductionUrl();
  return NextAuth(authOptions)(req, ctx);
}
