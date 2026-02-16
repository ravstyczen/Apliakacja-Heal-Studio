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
            <h3>Heal Pilates Studio – Regulamin</h3>
            <p style="font-size:13px; color:#555; margin-bottom:12px;">Adres: ul. Stanisława Kostki-Potockiego 2/1, 02-958 Warszawa</p>

            <h4 style="color:#2C3E2D; font-size:14px; margin:16px 0 8px;">Regulamin korzystania i dokonywania rezerwacji sesji</h4>
            <ol>
              <li>Niniejszy regulamin określa zasady korzystania z usług Heal Pilates Studio, w tym dokonywania rezerwacji sesji oraz warunki uczestnictwa w zajęciach.</li>
              <li>Korzystanie z usług studia oznacza akceptację niniejszego regulaminu.</li>
              <li>Studio prowadzi zajęcia metodą Pilates Klasyczny w formie sesji indywidualnych oraz grupowych.</li>
            </ol>

            <h4 style="color:#2C3E2D; font-size:14px; margin:16px 0 8px;">Rodzaje sesji</h4>
            <ul style="padding-left:20px;">
              <li><strong>Sesje Indywidualne</strong> – sesje prowadzone wyłącznie dla jednej osoby.</li>
              <li><strong>Sesje Duo</strong> – sesje grupowe prowadzone dla dwóch osób.</li>
              <li><strong>Sesje Trio</strong> – sesje grupowe prowadzone dla trzech osób.</li>
            </ul>
            <p style="font-size:14px;">Zajęcia prowadzone są przez wykwalifikowanych nauczycieli metody Pilates.</p>

            <h4 style="color:#2C3E2D; font-size:14px; margin:16px 0 8px;">Rezerwacje i rezygnacje</h4>
            <ul style="padding-left:20px;">
              <li>Rezerwacji sesji można dokonać telefonicznie, komunikatorem u instruktora lub osobiście w siedzibie studia, w razie nieobecności instruktora sesję można rezerwować i odwoływać u instruktora pełniącego zastępstwo.</li>
              <li>Odwołanie sesji bez opłaty możliwe jest do 24 godzin przed rozpoczęciem zajęć.</li>
              <li>W przypadku rezygnacji po tym czasie pełna opłata za zajęcia jest wymagana.</li>
              <li>Studio dokona wszelkich starań, celem odbycia sesji w przypadku choroby lub nieobecności instruktora. Wówczas jego pracę przejmie inny instruktor, o równym stopniu profesjonalizmu. Studio zastrzega sobie jednak prawo do odwołania zajęć z przyczyn niezależnych, o czym niezwłocznie poinformuje uczestników.</li>
            </ul>

            <h4 style="color:#2C3E2D; font-size:14px; margin:16px 0 8px;">Ceny i płatności</h4>
            <ul style="padding-left:20px;">
              <li>Ceny sesji zależą od instruktora prowadzącego i określone są w odrębnym cenniku.</li>
              <li>Płatności można dokonywać gotówką, BLIK-iem (na nr telefonu 696567234) lub kartą płatniczą na miejscu.</li>
              <li>Brak płatności za zarezerwowaną sesję uniemożliwia dokonywanie kolejnych rezerwacji.</li>
            </ul>

            <h4 style="color:#2C3E2D; font-size:14px; margin:16px 0 8px;">Zasady uczestnictwa</h4>
            <ul style="padding-left:20px;">
              <li>Uczestnik zobowiązany jest do punktualnego przybycia na zajęcia w odpowiednim do ich wykonywania stroju.</li>
              <li>W przypadku spóźnienia, czas zajęć nie ulega wydłużeniu.</li>
              <li>Uczestnik zobowiązany jest do informowania instruktora na bieżąco o wszelkich problemach zdrowotnych, w tym kontuzjach, chorobach.</li>
              <li>Studio nie ponosi odpowiedzialności za urazy wynikłe z zatajenia informacji o stanie zdrowia.</li>
            </ul>

            <h4 style="color:#2C3E2D; font-size:14px; margin:16px 0 8px;">Odpowiedzialność</h4>
            <ul style="padding-left:20px;">
              <li>Uczestnicy korzystają z usług Heal Pilates Studio na własną odpowiedzialność, zgodnie ze wskazaniami zdrowotnymi.</li>
              <li>Studio dokłada starań, by zapewnić bezpieczeństwo, jednak nie ponosi odpowiedzialności za rzeczy pozostawione w studiu.</li>
            </ul>
          </div>

          <p>Klikając poniższy przycisk, akceptujesz powyższy regulamin Heal Pilates Studio.</p>

          <div class="text-center">
            <a href="${acceptUrl}" class="accept-btn">Akceptuję regulamin</a>
          </div>
        </div>
        <div class="footer">
          <p>Heal Pilates Studio<br>ul. Stanisława Kostki-Potockiego 2/1, 02-958 Warszawa</p>
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
