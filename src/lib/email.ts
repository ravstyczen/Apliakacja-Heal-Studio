import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendRegulationsEmail(
  clientEmail: string,
  clientName: string,
  clientId: string
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const acceptUrl = `${appUrl}/api/regulations/accept?clientId=${encodeURIComponent(clientId)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          background-color: #FAF9F7;
          color: #1A1A1A;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          font-family: 'Georgia', serif;
          font-size: 32px;
          font-weight: 700;
          color: #2C3E2D;
          letter-spacing: 4px;
        }
        .logo-sub {
          font-size: 12px;
          letter-spacing: 3px;
          color: #B8A88A;
          margin-top: 4px;
        }
        .content {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        h2 {
          color: #2C3E2D;
          font-size: 20px;
          margin-bottom: 20px;
        }
        p {
          line-height: 1.7;
          margin-bottom: 16px;
          font-size: 15px;
        }
        .regulations {
          background: #FAF9F7;
          border-left: 3px solid #2C3E2D;
          padding: 20px;
          margin: 24px 0;
          border-radius: 0 8px 8px 0;
        }
        .regulations h3 {
          color: #2C3E2D;
          margin-top: 0;
          font-size: 16px;
        }
        .regulations ol {
          padding-left: 20px;
        }
        .regulations li {
          margin-bottom: 10px;
          font-size: 14px;
          line-height: 1.6;
        }
        .accept-btn {
          display: inline-block;
          background: #2C3E2D;
          color: white !important;
          text-decoration: none;
          padding: 14px 40px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          margin: 24px 0;
          text-align: center;
        }
        .accept-btn:hover {
          background: #3D5340;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          font-size: 13px;
          color: #999;
        }
        .text-center {
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">HEAL</div>
          <div class="logo-sub">PILATES STUDIO</div>
        </div>
        <div class="content">
          <h2>Witaj ${clientName}!</h2>
          <p>Dziękujemy za zainteresowanie zajęciami w Heal Pilates Studio. Przed rozpoczęciem ćwiczeń prosimy o zapoznanie się z regulaminem studia i jego akceptację.</p>

          <div class="regulations">
            <h3>Regulamin Heal Pilates Studio</h3>
            <ol>
              <li><strong>Rezerwacje i odwoływanie sesji:</strong> Sesje należy rezerwować z wyprzedzeniem. Odwołanie sesji jest możliwe najpóźniej 24 godziny przed planowanym terminem. W przypadku późniejszego odwołania lub nieobecności, sesja jest traktowana jako odbyta.</li>
              <li><strong>Punktualność:</strong> Prosimy o przybycie 5-10 minut przed planowaną sesją. Spóźnienie powoduje skrócenie czasu treningu bez zmiany jego ceny.</li>
              <li><strong>Zdrowie i bezpieczeństwo:</strong> Klient zobowiązany jest poinformować instruktora o wszelkich dolegliwościach zdrowotnych, kontuzjach lub ciąży przed rozpoczęciem sesji.</li>
              <li><strong>Strój i higiena:</strong> Na zajęcia należy przybyć w wygodnym stroju sportowym. Ćwiczymy w skarpetkach lub boso. Prosimy o zachowanie higieny osobistej.</li>
              <li><strong>Płatności:</strong> Płatność za sesje dokonywana jest zgodnie z obowiązującym cennikiem. Cennik może ulec zmianie z miesięcznym wyprzedzeniem.</li>
              <li><strong>Odpowiedzialność:</strong> Studio nie ponosi odpowiedzialności za rzeczy wartościowe pozostawione na terenie studia. Klient ćwiczy na własną odpowiedzialność.</li>
              <li><strong>Dane osobowe:</strong> Dane osobowe klientów są przetwarzane zgodnie z RODO w celu realizacji usług studia.</li>
              <li><strong>Postanowienia końcowe:</strong> Studio zastrzega sobie prawo do zmiany regulaminu. O zmianach klienci zostaną poinformowani drogą mailową.</li>
            </ol>
          </div>

          <p>Klikając poniższy przycisk, akceptujesz powyższy regulamin Heal Pilates Studio.</p>

          <div class="text-center">
            <a href="${acceptUrl}" class="accept-btn">Akceptuję regulamin</a>
          </div>
        </div>
        <div class="footer">
          <p>Heal Pilates Studio<br>ul. St. Kostki Potockiego 2/1, 02-958 Warszawa</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Heal Pilates Studio" <${process.env.SMTP_USER}>`,
    to: clientEmail,
    subject: 'Regulamin Heal Pilates Studio - Akceptacja',
    html: htmlContent,
  });
}

export async function sendAcceptanceNotification(
  clientName: string,
  clientEmail: string,
  acceptedDate: string
): Promise<void> {
  const ownerEmail = 'puchalskaagi@gmail.com';

  await transporter.sendMail({
    from: `"Heal Pilates Studio" <${process.env.SMTP_USER}>`,
    to: ownerEmail,
    subject: `Akceptacja regulaminu - ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2C3E2D;">Akceptacja regulaminu</h2>
        <p>Klient <strong>${clientName}</strong> (${clientEmail}) zaakceptował regulamin Heal Pilates Studio.</p>
        <p>Data akceptacji: <strong>${acceptedDate}</strong></p>
      </div>
    `,
  });
}
