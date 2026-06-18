import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { Instructor } from './types';
import { getInstructorByEmail } from './instructors-data';
import { getInstructorsFromSheet } from './google-sheets';
import { getServiceAuth } from './service-auth';

interface AuthResult {
  instructor: Instructor | null;
  email: string | null;
}

async function findInstructorByEmail(email: string): Promise<Instructor | null> {
  const hardcoded = getInstructorByEmail(email);
  if (hardcoded) return hardcoded;

  try {
    const sheetsId = process.env.GOOGLE_SHEETS_ID;
    if (!sheetsId) return null;
    const serviceToken = await getServiceAuth();
    if (!serviceToken) return null;
    const sheetInstructors = await getInstructorsFromSheet(serviceToken, sheetsId);
    return sheetInstructors.find((i) => i.email === email) || null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedInstructor(
  request?: Request
): Promise<AuthResult> {
  // 1. Try NextAuth session (web app with cookies)
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const instructor = (session as any).instructor as Instructor | null;
    return { instructor, email: session.user.email };
  }

  // 2. Try Bearer token (iOS app sends Google ID token)
  if (request) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.slice(7);
      try {
        const res = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        );
        if (res.ok) {
          const payload = await res.json();
          if (payload.email && payload.email_verified !== 'false') {
            const instructor = await findInstructorByEmail(payload.email);
            return { instructor, email: payload.email };
          }
        }
      } catch {
        // Token verification failed
      }
    }
  }

  return { instructor: null, email: null };
}
