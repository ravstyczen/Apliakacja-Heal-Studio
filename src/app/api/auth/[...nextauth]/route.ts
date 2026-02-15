import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const PRODUCTION_HOST = 'apliakacja-heal-studio.vercel.app';

// NextAuth v4 App Router ignores NEXTAUTH_URL and derives the OAuth
// callback URL from req.url. On Vercel preview deployments this creates
// a mismatch with the Google-registered redirect URI.
// Fix: rewrite the request URL to the production domain before NextAuth
// processes it, so the redirect_uri always matches what's registered.
function rewriteToProductionUrl(req: Request): Request {
  const url = new URL(req.url);
  if (url.host !== PRODUCTION_HOST) {
    url.host = PRODUCTION_HOST;
    url.protocol = 'https:';
    return new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
  }
  return req;
}

export async function GET(
  req: Request,
  ctx: { params: { nextauth: string[] } }
) {
  return NextAuth(authOptions)(rewriteToProductionUrl(req), ctx);
}

export async function POST(
  req: Request,
  ctx: { params: { nextauth: string[] } }
) {
  return NextAuth(authOptions)(rewriteToProductionUrl(req), ctx);
}
