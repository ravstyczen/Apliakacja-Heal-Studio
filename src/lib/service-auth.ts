import { google } from 'googleapis';

export async function getServiceAuth(): Promise<string | null> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
          /\\n/g,
          '\n'
        ),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar',
      ],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return (token as any).token || null;
  } catch {
    return null;
  }
}
