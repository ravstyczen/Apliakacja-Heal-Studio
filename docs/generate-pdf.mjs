import PDFDocument from 'pdfkit';
import { createWriteStream, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, 'Instrukcja-HEAL-Pilates-Studio.pdf');
const imgDir = resolve(__dirname, 'screenshots');

// Register fonts with Polish diacritics support
const FONT_REGULAR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

const COLORS = {
  primary: '#2C3E2D',
  accent: '#B8A88A',
  dark: '#1A1A1A',
  gray: '#666666',
  lightGray: '#999999',
  blockquoteBg: '#FAF8F5',
  blockquoteBorder: '#B8A88A',
  white: '#FFFFFF',
};

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 55, bottom: 55, left: 50, right: 50 },
  info: {
    Title: 'HEAL Pilates Studio - Instrukcja dla instruktora',
    Author: 'HEAL Pilates Studio',
  },
  bufferPages: true,
});

const stream = createWriteStream(outputPath);
doc.pipe(stream);

const PW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
const ML = doc.page.margins.left;
let y;

function checkPage(needed = 60) {
  if (y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    y = doc.page.margins.top;
  }
}

function heading2(text) {
  checkPage(50);
  y += 10;
  doc.font(FONT_BOLD).fontSize(16).fillColor(COLORS.primary);
  doc.text(text, ML, y, { width: PW });
  y += doc.heightOfString(text, { width: PW }) + 4;
  doc.moveTo(ML, y).lineTo(ML + PW, y).stroke('#dddddd');
  y += 14;
}

function heading3(text) {
  checkPage(35);
  y += 6;
  doc.font(FONT_BOLD).fontSize(12.5).fillColor('#3D5340');
  doc.text(text, ML, y, { width: PW });
  y += doc.heightOfString(text, { width: PW }) + 8;
}

function para(text, opts = {}) {
  const { fontSize = 10.5, color = COLORS.dark, indent = 0 } = opts;
  doc.font(FONT_REGULAR).fontSize(fontSize).fillColor(color);
  const x = ML + indent;
  const w = PW - indent;
  const h = doc.heightOfString(text, { width: w, lineGap: 3 });
  checkPage(h + 5);
  doc.text(text, x, y, { width: w, lineGap: 3 });
  y += h + 5;
}

function boldPara(text, opts = {}) {
  const { fontSize = 10.5, color = COLORS.primary, indent = 0 } = opts;
  doc.font(FONT_BOLD).fontSize(fontSize).fillColor(color);
  const x = ML + indent;
  const w = PW - indent;
  const h = doc.heightOfString(text, { width: w, lineGap: 3 });
  checkPage(h + 5);
  doc.text(text, x, y, { width: w, lineGap: 3 });
  y += h + 5;
}

function step(number, text) {
  checkPage(25);
  doc.font(FONT_BOLD).fontSize(10.5).fillColor(COLORS.primary);
  doc.text(`${number}.`, ML, y, { continued: true, width: PW, lineGap: 3 });
  doc.font(FONT_REGULAR).fillColor(COLORS.dark);
  doc.text(` ${text}`, { width: PW - 20, lineGap: 3 });
  y += doc.heightOfString(`${number}. ${text}`, { width: PW, lineGap: 3 }) + 4;
}

function tip(text) {
  doc.font(FONT_REGULAR).fontSize(10);
  const h = doc.heightOfString(text, { width: PW - 30 }) + 16;
  checkPage(h + 10);

  doc.roundedRect(ML, y, PW, h, 4).fill(COLORS.blockquoteBg);
  doc.rect(ML, y, 3, h).fill(COLORS.blockquoteBorder);
  doc.fillColor('#555555').font('Helvetica').fontSize(10);
  doc.text(text, ML + 14, y + 8, { width: PW - 30 });
  y += h + 10;
}

function screenshot(filename, opts = {}) {
  const { maxHeight = 380, caption = '' } = opts;
  const imgPath = resolve(imgDir, filename);
  const img = doc.openImage(imgPath);

  // Scale to fit nicely in center with phone frame look
  const imgAspect = img.width / img.height;
  let dispWidth = Math.min(220, PW * 0.48);
  let dispHeight = dispWidth / imgAspect;

  if (dispHeight > maxHeight) {
    dispHeight = maxHeight;
    dispWidth = dispHeight * imgAspect;
  }

  checkPage(dispHeight + (caption ? 30 : 12));

  const imgX = ML + (PW - dispWidth - 12) / 2 + 6;

  // Phone frame shadow
  doc.roundedRect(imgX - 6, y - 2, dispWidth + 12, dispHeight + 8, 14)
    .fill('#E8E4DE');

  // Phone frame
  doc.roundedRect(imgX - 4, y, dispWidth + 8, dispHeight + 4, 12)
    .fill('#FFFFFF');

  // Image
  doc.image(imgPath, imgX, y + 2, { width: dispWidth, height: dispHeight });

  y += dispHeight + 10;

  if (caption) {
    doc.font(FONT_REGULAR).fontSize(8.5).fillColor(COLORS.lightGray);
    doc.text(caption, ML, y, { width: PW, align: 'center' });
    y += 16;
  }
}

function twoScreenshots(file1, cap1, file2, cap2) {
  const img1 = doc.openImage(resolve(imgDir, file1));
  const img2 = doc.openImage(resolve(imgDir, file2));

  const colWidth = (PW - 20) / 2;
  const maxW = colWidth * 0.85;

  const aspect1 = img1.width / img1.height;
  const aspect2 = img2.width / img2.height;

  let w1 = maxW, h1 = w1 / aspect1;
  let w2 = maxW, h2 = w2 / aspect2;

  const maxH = 320;
  if (h1 > maxH) { h1 = maxH; w1 = h1 * aspect1; }
  if (h2 > maxH) { h2 = maxH; w2 = h2 * aspect2; }

  const rowH = Math.max(h1, h2);
  checkPage(rowH + 40);

  const x1 = ML + (colWidth - w1) / 2;
  const x2 = ML + colWidth + 20 + (colWidth - w2) / 2;

  // Frames
  doc.roundedRect(x1 - 4, y, w1 + 8, h1 + 4, 10).fill('#E8E4DE');
  doc.roundedRect(x1 - 2, y + 1, w1 + 4, h1 + 2, 8).fill('#FFFFFF');
  doc.image(resolve(imgDir, file1), x1, y + 2, { width: w1, height: h1 });

  doc.roundedRect(x2 - 4, y, w2 + 8, h2 + 4, 10).fill('#E8E4DE');
  doc.roundedRect(x2 - 2, y + 1, w2 + 4, h2 + 2, 8).fill('#FFFFFF');
  doc.image(resolve(imgDir, file2), x2, y + 2, { width: w2, height: h2 });

  y += rowH + 10;

  doc.font(FONT_REGULAR).fontSize(8).fillColor(COLORS.lightGray);
  doc.text(cap1, ML, y, { width: colWidth, align: 'center' });
  doc.text(cap2, ML + colWidth + 20, y - doc.currentLineHeight(), { width: colWidth, align: 'center' });
  y += 18;
}

function space(n = 8) { y += n; }

// ══════════════════════════════════════════════════════
// ── TITLE PAGE ───────────────────────────────────────
// ══════════════════════════════════════════════════════

y = 180;

doc.font(FONT_BOLD).fontSize(42).fillColor(COLORS.primary);
doc.text('H E A L', ML, y, { width: PW, align: 'center' });
y += 55;

doc.font(FONT_REGULAR).fontSize(13).fillColor(COLORS.accent);
doc.text('PILATES STUDIO', ML, y, { width: PW, align: 'center', characterSpacing: 5 });
y += 50;

const cx = doc.page.width / 2;
doc.moveTo(cx - 100, y).lineTo(cx - 8, y).stroke(COLORS.accent);
doc.circle(cx, y, 3).fill(COLORS.accent);
doc.moveTo(cx + 8, y).lineTo(cx + 100, y).stroke(COLORS.accent);
y += 50;

doc.font(FONT_BOLD).fontSize(18).fillColor(COLORS.dark);
doc.text('Instrukcja dla instruktora', ML, y, { width: PW, align: 'center' });
y += 80;

doc.font(FONT_REGULAR).fontSize(10).fillColor(COLORS.lightGray);
doc.text('Marzec 2026', ML, y, { width: PW, align: 'center' });

// ══════════════════════════════════════════════════════
// ── TABLE OF CONTENTS ────────────────────────────────
// ══════════════════════════════════════════════════════

doc.addPage();
y = doc.page.margins.top;

doc.font(FONT_BOLD).fontSize(18).fillColor(COLORS.primary);
doc.text('Spis treści', ML, y, { width: PW });
y += 35;

const tocItems = [
  '1. Logowanie do aplikacji',
  '2. Nawigacja w aplikacji',
  '3. Kalendarz — przeglądanie sesji',
  '4. Dodawanie nowej sesji',
  '5. Edytowanie i usuwanie sesji',
  '6. Sesje cykliczne',
  '7. Otwarte sesje — publikacja linku do zapisu',
  '8. Zarządzanie klientami',
];

for (const item of tocItems) {
  doc.font(FONT_REGULAR).fontSize(12).fillColor(COLORS.dark);
  doc.text(item, ML + 10, y, { width: PW - 20 });
  y += 28;
}

// ══════════════════════════════════════════════════════
// ── 1. LOGOWANIE ─────────────────────────────────────
// ══════════════════════════════════════════════════════

doc.addPage();
y = doc.page.margins.top;

heading2('1. Logowanie do aplikacji');
para('Po otwarciu aplikacji zobaczysz ekran logowania z logo HEAL i przyciskiem logowania przez Google.');
space();

screenshot('01-login.png', { maxHeight: 340, caption: 'Ekran logowania' });
space();

heading3('Krok po kroku:');
step(1, 'Kliknij przycisk "Zaloguj się przez Google".');
step(2, 'Otworzy się okno logowania Google. Wybierz swoje konto Google (to, które zostało przypisane przez administratora studia).');
step(3, 'Ponieważ aplikacja nie przeszła jeszcze procesu weryfikacji Google, zobaczysz ekran ostrzeżenia.');
space();

tip('WAŻNE: Kliknij "Advanced" (Zaawansowane) na dole strony, a następnie "Go to heal-studio (unsafe)". Jest to bezpieczne — ostrzeżenie pojawia się tylko dlatego, że aplikacja nie przeszła jeszcze formalnej weryfikacji Google.');
space();

screenshot('02-google-warning.png', { maxHeight: 340, caption: 'Ostrzeżenie Google — kliknij "Advanced", potem "Go to heal-studio"' });
space();

step(4, 'Na następnym ekranie Google zapyta o uprawnienia. Kliknij "Continue" (Kontynuuj) aby zezwolić na dostęp.');
step(5, 'Po pomyślnym zalogowaniu zostaniesz przekierowana/y do widoku kalendarza.');

// ══════════════════════════════════════════════════════
// ── 2. NAWIGACJA ─────────────────────────────────────
// ══════════════════════════════════════════════════════

doc.addPage();
y = doc.page.margins.top;

heading2('2. Nawigacja w aplikacji');
para('Po zalogowaniu widoczny jest górny pasek z logo HEAL oraz dolna nawigacja z czterema zakładkami:');
space();

boldPara('Kalendarz', { indent: 10 });
para('Widok tygodniowy z sesjami wszystkich instruktorów.', { indent: 10 });
space(4);
boldPara('Klienci', { indent: 10 });
para('Lista klientów studia z wyszukiwaniem i filtrowaniem.', { indent: 10 });
space(4);
boldPara('Rozliczenia', { indent: 10 });
para('Podsumowanie finansowe (widoczne tylko dla Admin i Właściciel).', { indent: 10 });
space(4);
boldPara('Instruktorzy', { indent: 10 });
para('Ustawienia i cennik instruktorów (widoczne tylko dla Admin i Właściciel).', { indent: 10 });
space();

para('Aby się wylogować, kliknij "Wyloguj" w prawym górnym rogu ekranu.');

// ══════════════════════════════════════════════════════
// ── 3. KALENDARZ ─────────────────────────────────────
// ══════════════════════════════════════════════════════

doc.addPage();
y = doc.page.margins.top;

heading2('3. Kalendarz — przeglądanie sesji');
para('Zakładka Kalendarz pokazuje tygodniowy widok z godzinami 8:00–20:00. Każda sesja jest oznaczona kolorem instruktora.');
space();

screenshot('03-calendar.png', { maxHeight: 420, caption: 'Widok kalendarza z sesjami' });
space();

heading3('Elementy kalendarza:');
para('• Strzałki ‹ › przesuwają widok o tydzień. Przycisk "Dziś" wraca do bieżącego tygodnia.');
para('• Kolorowe kropki w legendzie identyfikują instruktorów.');
para('• Kafelki sesji wyświetlają: literę typu (S = Solo, D = Duo, T = Trio), imię instruktora i klientów.');
para('• Ikona globu obok litery typu oznacza sesję otwartą (z linkiem do zapisu online).');
para('• Zielony przycisk "+" w prawym dolnym rogu pozwala dodać nową sesję.');

// ══════════════════════════════════════════════════════
// ── 4. DODAWANIE SESJI ───────────────────────────────
// ══════════════════════════════════════════════════════

doc.addPage();
y = doc.page.margins.top;

heading2('4. Dodawanie nowej sesji');

heading3('Jak otworzyć formularz:');
para('• Kliknij pustą kratkę w siatce kalendarza — data i godzina zostaną uzupełnione automatycznie.');
para('• Lub kliknij zielony przycisk "+" w prawym dolnym rogu.');
space();

screenshot('05-new-session.png', { maxHeight: 420, caption: 'Formularz nowej sesji' });
space();

heading3('Krok po kroku:');
step(1, 'Wybierz rodzaj sesji — Solo (1 klient), Duo (2 klientów) lub Trio (3 klientów).');
step(2, 'Ustaw datę sesji.');
step(3, 'Wybierz godzinę z listy (np. 09:00 – 10:00).');
step(4, 'Wybierz instruktora. Jeśli jesteś zwykłym instruktorem, zobaczysz tylko siebie.');
step(5, 'Dodaj klientów przyciskiem "Dodaj klienta". Wyszukaj po imieniu lub nazwisku.');
step(6, 'Kliknij "Dodaj sesję" — sesja pojawi się w kalendarzu.');

// ══════════════════════════════════════════════════════
// ── 5. EDYTOWANIE / USUWANIE ─────────────────────────
// ══════════════════════════════════════════════════════

doc.addPage();
y = doc.page.margins.top;

heading2('5. Edytowanie i usuwanie sesji');

heading3('Edytowanie:');
step(1, 'Kliknij na kafelek sesji w kalendarzu.');
step(2, 'Otworzy się panel z wypełnionymi danymi i nagłówkiem "Edytuj sesję".');
step(3, 'Zmień potrzebne pola i kliknij "Zapisz zmiany".');
space();

heading3('Usuwanie:');
step(1, 'Kliknij na kafelek sesji.');
step(2, 'W prawym górnym rogu kliknij "Usuń" (czerwony tekst).');
step(3, 'Sesja zostanie natychmiast usunięta z kalendarza.');

// ══════════════════════════════════════════════════════
// ── 6. SESJE CYKLICZNE ──────────────────────────────
// ══════════════════════════════════════════════════════

heading2('6. Sesje cykliczne');
para('Sesje cykliczne automatycznie tworzą kopie sesji co tydzień aż do wybranej daty końcowej.');
space();
step(1, 'Podczas tworzenia sesji włącz przełącznik "Sesja cykliczna".');
step(2, 'Ustaw datę końcową powtarzania w polu "Powtarzaj co tydzień do".');
step(3, 'Kliknij "Dodaj sesję" — sesja pojawi się w kalendarzu na każdym tygodniu.');
space();
para('Przy edycji lub usuwaniu sesji cyklicznej pojawi się pytanie jak zastosować zmiany:');
para('• "Tylko tę sesję" — zmienia/usuwa pojedynczą sesję');
para('• "Tę i wszystkie przyszłe" — od wybranej sesji w przód');
para('• "Wszystkie sesje w serii" — wszystkie sesje z grupy');

// ══════════════════════════════════════════════════════
// ── 7. OTWARTE SESJE ─────────────────────────────────
// ══════════════════════════════════════════════════════

doc.addPage();
y = doc.page.margins.top;

heading2('7. Otwarte sesje — publikacja linku do zapisu');
para('Otwarta sesja pozwala udostępnić link do zapisu online — klienci sami mogą się zapisać bez konieczności kontaktu z instruktorem.');
space();

heading3('Tworzenie otwartej sesji:');
step(1, 'Podczas tworzenia lub edycji sesji włącz przełącznik "Otwarta sesja".');
step(2, 'Pojawi się link do zapisu. Kliknij "Kopiuj" aby skopiować go do schowka.');
step(3, 'Zapisz sesję. W kalendarzu będzie oznaczona ikoną globu.');
space();

twoScreenshots(
  '06-open-session.png', 'Panel z włączoną otwartą sesją',
  '08-booking.png', 'Strona zapisu widziana przez klienta'
);
space();

heading3('Udostępnianie linku:');
para('Skopiowany link możesz udostępnić klientom przez:');
para('• Instagram Stories (np. jako QR kod lub naklejka z linkiem)');
para('• WhatsApp / SMS');
para('• E-mail');
para('• Inne media społecznościowe');
space();

heading3('Co widzi klient:');
para('Po otwarciu linku klient widzi stronę z informacjami o sesji (instruktor, data, godzina, wolne miejsca) i formularz zapisu. Po wypełnieniu danych i kliknięciu "Zapisz się" otrzyma potwierdzenie na e-mail.');
space();
para('Gdy wszystkie miejsca są zajęte, kolejni klienci zobaczą komunikat "Sesja jest już pełna".');

// ══════════════════════════════════════════════════════
// ── 8. ZARZĄDZANIE KLIENTAMI ─────────────────────────
// ══════════════════════════════════════════════════════

doc.addPage();
y = doc.page.margins.top;

heading2('8. Zarządzanie klientami');
para('Przejdź do zakładki "Klienci" w dolnej nawigacji.');
space();

screenshot('04-clients.png', { maxHeight: 400, caption: 'Lista klientów' });
space();

heading3('Statusy klientów:');
para('• Zielony znacznik ✓ — klient zaakceptował regulamin.');
para('• Pomarańczowy znacznik ⚠ — klient jeszcze nie zaakceptował regulaminu.');
space();
para('Filtry na górze pozwalają wyświetlić: Wszyscy / Zaakceptowali / Oczekujący.');
space();

heading3('Dodawanie nowego klienta:');
step(1, 'Kliknij zielony przycisk "+" w prawym dolnym rogu.');
step(2, 'Wypełnij formularz — Imię i Nazwisko są wymagane.');
step(3, 'Kliknij "Dodaj klienta". Na e-mail klienta zostanie wysłany regulamin do akceptacji.');
space();

screenshot('07-new-client.png', { maxHeight: 340, caption: 'Formularz nowego klienta' });
space();

heading3('Edytowanie klienta:');
para('Kliknij na kartę klienta na liście. Otworzy się formularz z wypełnionymi danymi. Zmień pola i kliknij "Zapisz zmiany".');
space();

heading3('Usuwanie klienta:');
para('Kliknij czerwoną ikonę kosza po prawej stronie karty klienta. Potwierdź w oknie dialogowym.');

// ══════════════════════════════════════════════════════
// ── FAQ ──────────────────────────────────────────────
// ══════════════════════════════════════════════════════

doc.addPage();
y = doc.page.margins.top;

heading2('Najczęściej zadawane pytania');
space();

boldPara('P: Nie mogę się zalogować — Google mówi że aplikacja nie jest zweryfikowana.');
para('O: To normalne. Kliknij "Advanced", a następnie "Go to heal-studio (unsafe)". Aplikacja jest bezpieczna, ale nie przeszła jeszcze formalnej weryfikacji Google.');
space();

boldPara('P: Nie widzę zakładek "Rozliczenia" i "Instruktorzy".');
para('O: Te zakładki są widoczne tylko dla kont z rolą Admin lub Właściciel.');
space();

boldPara('P: Nie mogę dodać sesji bez przypisania klientów.');
para('O: Instruktorzy muszą przypisać odpowiednią liczbę klientów (Solo = 1, Duo = 2, Trio = 3). Administratorzy mogą tworzyć sesje bez klientów. Alternatywnie, włącz opcję "Otwarta sesja".');
space();

boldPara('P: Jak udostępnić link do otwartej sesji na Instagramie?');
para('O: Skopiuj link z panelu otwartej sesji, a następnie wklej go w naklejkę z linkiem na Instagram Stories lub wygeneruj kod QR i dodaj go do relacji.');
space();

boldPara('P: Co się dzieje gdy wszystkie miejsca na otwartej sesji są zajęte?');
para('O: Kolejni klienci otwierający link zobaczą komunikat "Sesja jest już pełna" i nie będą mogli się zapisać.');

space(30);
doc.moveTo(ML, y).lineTo(ML + PW, y).stroke('#dddddd');
y += 15;
doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.lightGray);
doc.text('Heal Pilates Studio — ul. Stanisława Kostki-Potockiego 2/1, 02-958 Warszawa', ML, y, { width: PW, align: 'center' });

// ══════════════════════════════════════════════════════
// ── PAGE NUMBERS ─────────────────────────────────────
// ══════════════════════════════════════════════════════

const totalPages = doc.bufferedPageRange().count;
for (let p = 0; p < totalPages; p++) {
  doc.switchToPage(p);

  if (p > 0) {
    doc.font(FONT_REGULAR).fontSize(7).fillColor(COLORS.accent);
    doc.text('HEAL PILATES STUDIO', ML, 25, {
      width: PW,
      align: 'center',
      characterSpacing: 3,
    });
  }

  doc.font(FONT_REGULAR).fontSize(8).fillColor(COLORS.lightGray);
  doc.text(`Strona ${p + 1} z ${totalPages}`, ML, doc.page.height - 35, {
    width: PW,
    align: 'center',
  });
}

doc.end();

stream.on('finish', () => {
  console.log(`PDF generated: ${outputPath} (${totalPages} pages)`);
});
