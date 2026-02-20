import { NextRequest, NextResponse } from 'next/server';
import { getClients, updateClient } from '@/lib/google-sheets';
import { sendAcceptanceNotification } from '@/lib/email';
import { getServiceAuth } from '@/lib/service-auth';

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

// This endpoint is accessed by clients clicking the acceptance link in email
// It doesn't require authentication (public link)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return new NextResponse(renderPage('Błąd', 'Brak identyfikatora klienta.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const serviceAuth = await getServiceAuth();
    if (!serviceAuth) {
      console.error('Regulation acceptance: Service account authentication failed. Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars.');
      return new NextResponse(
        renderPage(
          'Błąd',
          `Przepraszamy, wystąpił problem techniczny z rejestracją akceptacji.<br><br>
           Prosimy o kontakt ze studiem w celu potwierdzenia akceptacji regulaminu.`
        ),
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const clients = await getClients(serviceAuth, SHEETS_ID);
    const client = clients.find((c) => c.id === clientId);

    if (!client) {
      return new NextResponse(
        renderPage('Błąd', 'Nie znaleziono klienta.'),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    if (client.regulationsAccepted) {
      return new NextResponse(
        renderPage(
          'Regulamin już zaakceptowany',
          `<strong>${client.firstName}</strong>, regulamin został już wcześniej zaakceptowany.<br><br>
           Data akceptacji: <strong>${client.regulationsAcceptedDate}</strong><br><br>
           Do zobaczenia na zajęciach!`
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const now = new Date().toISOString().split('T')[0];

    await updateClient(serviceAuth, SHEETS_ID, {
      ...client,
      regulationsAccepted: true,
      regulationsAcceptedDate: now,
    });

    // Send notification to owner
    try {
      await sendAcceptanceNotification(
        `${client.firstName} ${client.lastName}`,
        client.email,
        now
      );
    } catch {
      // Don't fail if notification email fails
    }

    return new NextResponse(
      renderPage(
        'Dziękujemy!',
        `Dziękujemy <strong>${client.firstName}</strong> za akceptację regulaminu Heal Pilates Studio!<br><br>
         Data akceptacji: <strong>${now}</strong><br><br>
         Do zobaczenia na zajęciach!`
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error) {
    console.error('Regulation acceptance error:', error);
    return new NextResponse(
      renderPage(
        'Błąd',
        `Przepraszamy, wystąpił problem z rejestracją akceptacji regulaminu.<br><br>
         Prosimy o kontakt ze studiem.`
      ),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

function renderPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Heal Pilates Studio</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          background: #FAF9F7;
          color: #1A1A1A;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          padding: 40px 24px;
          max-width: 480px;
        }
        .logo {
          font-family: Georgia, serif;
          font-size: 36px;
          font-weight: 700;
          color: #2C3E2D;
          letter-spacing: 6px;
          margin-bottom: 4px;
        }
        .logo-sub {
          font-size: 11px;
          letter-spacing: 4px;
          color: #B8A88A;
          margin-bottom: 40px;
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 40px 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .check {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #2C3E2D;
          color: white;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        h1 {
          color: #2C3E2D;
          font-size: 24px;
          margin-bottom: 16px;
        }
        p {
          line-height: 1.7;
          font-size: 15px;
          color: #555;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">HEAL</div>
        <div class="logo-sub">PILATES STUDIO</div>
        <div class="card">
          <div class="check">✓</div>
          <h1>${title}</h1>
          <p>${message}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
