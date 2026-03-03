import PDFDocument from 'pdfkit';
import { createWriteStream, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, 'Instrukcja-HEAL-Pilates-Studio.pdf');

const COLORS = {
  primary: '#2C3E2D',
  accent: '#B8A88A',
  dark: '#1A1A1A',
  gray: '#666666',
  lightGray: '#999999',
  codeBg: '#F5F3EF',
  codeBorder: '#E0DDD8',
  blockquoteBg: '#FAF8F5',
  blockquoteBorder: '#B8A88A',
  tableBg: '#FAF9F7',
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

const PAGE_WIDTH = doc.page.width - doc.page.margins.left - doc.page.margins.right;
let y = doc.page.margins.top;

function checkPage(needed = 60) {
  if (y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    y = doc.page.margins.top;
  }
}

function drawText(text, opts = {}) {
  const {
    fontSize = 10.5,
    color = COLORS.dark,
    bold = false,
    indent = 0,
    lineGap = 3,
    continued = false,
  } = opts;

  checkPage(fontSize + lineGap + 10);

  doc.fontSize(fontSize).fillColor(color);
  if (bold) doc.font('Helvetica-Bold');
  else doc.font('Helvetica');

  const x = doc.page.margins.left + indent;
  const width = PAGE_WIDTH - indent;

  const height = doc.heightOfString(text, { width, lineGap });
  checkPage(height + 5);

  doc.text(text, x, y, { width, lineGap, continued });
  if (!continued) y += height + lineGap;
}

function drawRichLine(line, opts = {}) {
  const { indent = 0, fontSize = 10.5, lineGap = 3 } = opts;
  checkPage(fontSize + lineGap + 10);

  const x = doc.page.margins.left + indent;
  const width = PAGE_WIDTH - indent;

  // Parse bold, inline code, and links
  const parts = [];
  let remaining = line;
  const regex = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  remaining = line;
  lastIndex = 0;
  const r2 = /(\*\*([^*]+)\*\*)|(`([^`]+)`)/g;
  while ((match = r2.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: line.slice(lastIndex, match.index), bold: false, code: false });
    }
    if (match[2]) {
      parts.push({ text: match[2], bold: true, code: false });
    } else if (match[4]) {
      parts.push({ text: match[4], bold: false, code: true });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    parts.push({ text: line.slice(lastIndex), bold: false, code: false });
  }

  if (parts.length === 0) {
    parts.push({ text: line, bold: false, code: false });
  }

  // Calculate height first
  doc.fontSize(fontSize).font('Helvetica');
  const fullText = parts.map(p => p.text).join('');
  const height = doc.heightOfString(fullText, { width, lineGap });
  checkPage(height + 5);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;

    if (part.code) {
      doc.font('Courier').fontSize(fontSize - 0.5).fillColor(COLORS.primary);
    } else if (part.bold) {
      doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(COLORS.primary);
    } else {
      doc.font('Helvetica').fontSize(fontSize).fillColor(COLORS.dark);
    }

    doc.text(part.text, i === 0 ? x : undefined, i === 0 ? y : undefined, {
      width: i === 0 ? width : undefined,
      lineGap,
      continued: !isLast,
    });
  }
  y += height + lineGap;
}

function drawCodeBlock(lines) {
  const codeText = lines.join('\n');
  doc.font('Courier').fontSize(8);
  const textHeight = doc.heightOfString(codeText, { width: PAGE_WIDTH - 28 }) + 20;

  checkPage(textHeight + 10);

  // Background
  doc.roundedRect(doc.page.margins.left, y, PAGE_WIDTH, textHeight, 6)
    .fill(COLORS.codeBg);

  // Border
  doc.roundedRect(doc.page.margins.left, y, PAGE_WIDTH, textHeight, 6)
    .stroke(COLORS.codeBorder);

  doc.fillColor(COLORS.dark).font('Courier').fontSize(8);
  doc.text(codeText, doc.page.margins.left + 14, y + 10, {
    width: PAGE_WIDTH - 28,
    lineGap: 1.5,
  });

  y += textHeight + 8;
}

function drawBlockquote(text) {
  doc.font('Helvetica').fontSize(10);
  // Strip "> " prefix
  const cleanText = text.replace(/^>\s*/gm, '');
  const textHeight = doc.heightOfString(cleanText, { width: PAGE_WIDTH - 30 }) + 16;

  checkPage(textHeight + 10);

  // Background
  doc.roundedRect(doc.page.margins.left, y, PAGE_WIDTH, textHeight, 4)
    .fill(COLORS.blockquoteBg);

  // Left border
  doc.rect(doc.page.margins.left, y, 3, textHeight).fill(COLORS.blockquoteBorder);

  doc.fillColor('#555555').font('Helvetica').fontSize(10);

  // Parse bold within blockquote
  const parts = [];
  let remaining = cleanText;
  let lastIdx = 0;
  const boldRe = /\*\*([^*]+)\*\*/g;
  let m;
  while ((m = boldRe.exec(cleanText)) !== null) {
    if (m.index > lastIdx) parts.push({ text: cleanText.slice(lastIdx, m.index), bold: false });
    parts.push({ text: m[1], bold: true });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < cleanText.length) parts.push({ text: cleanText.slice(lastIdx), bold: false });

  let startX = doc.page.margins.left + 14;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.bold) doc.font('Helvetica-Bold').fillColor(COLORS.primary);
    else doc.font('Helvetica').fillColor('#555555');
    doc.text(p.text, i === 0 ? startX : undefined, i === 0 ? y + 8 : undefined, {
      width: i === 0 ? PAGE_WIDTH - 30 : undefined,
      continued: i < parts.length - 1,
    });
  }

  y += textHeight + 8;
}

function drawTable(headerLine, rows) {
  const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
  const colCount = headers.length;
  const colWidth = PAGE_WIDTH / colCount;
  const rowHeight = 26;
  const totalHeight = (rows.length + 1) * rowHeight + 4;

  checkPage(totalHeight + 10);

  // Header row
  doc.roundedRect(doc.page.margins.left, y, PAGE_WIDTH, rowHeight, 3).fill(COLORS.primary);
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(9);
  headers.forEach((h, i) => {
    doc.text(h, doc.page.margins.left + i * colWidth + 10, y + 7, { width: colWidth - 20 });
  });
  y += rowHeight;

  // Data rows
  rows.forEach((row, rowIdx) => {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (rowIdx % 2 === 0) {
      doc.rect(doc.page.margins.left, y, PAGE_WIDTH, rowHeight).fill(COLORS.tableBg);
    }
    doc.fillColor(COLORS.dark).font('Helvetica').fontSize(9);
    cells.forEach((c, i) => {
      doc.text(c, doc.page.margins.left + i * colWidth + 10, y + 7, { width: colWidth - 20 });
    });
    y += rowHeight;
  });

  y += 8;
}

function drawHR() {
  checkPage(20);
  doc.moveTo(doc.page.margins.left, y + 8)
    .lineTo(doc.page.margins.left + PAGE_WIDTH, y + 8)
    .stroke('#dddddd');
  y += 20;
}

// ── Parse and render the markdown ──────────────────────────────

const md = readFileSync(resolve(__dirname, 'instrukcja-uzytkownika.md'), 'utf-8');
const mdLines = md.split('\n');

// ── Title page ──────────────────────────────────────────────────

y = 200;
doc.font('Helvetica-Bold').fontSize(36).fillColor(COLORS.primary);
doc.text('H E A L', doc.page.margins.left, y, { width: PAGE_WIDTH, align: 'center' });
y += 48;

doc.font('Helvetica').fontSize(12).fillColor(COLORS.accent);
doc.text('PILATES STUDIO', doc.page.margins.left, y, { width: PAGE_WIDTH, align: 'center', characterSpacing: 4 });
y += 50;

// Decorative line
const lineY = y;
const cx = doc.page.width / 2;
doc.moveTo(cx - 100, lineY).lineTo(cx - 8, lineY).stroke(COLORS.accent);
doc.circle(cx, lineY, 3).fill(COLORS.accent);
doc.moveTo(cx + 8, lineY).lineTo(cx + 100, lineY).stroke(COLORS.accent);
y += 40;

doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.dark);
doc.text('Instrukcja dla instruktora', doc.page.margins.left, y, { width: PAGE_WIDTH, align: 'center' });
y += 60;

doc.font('Helvetica').fontSize(10).fillColor(COLORS.lightGray);
doc.text('Marzec 2026', doc.page.margins.left, y, { width: PAGE_WIDTH, align: 'center' });

// ── Content pages ───────────────────────────────────────────────

doc.addPage();
y = doc.page.margins.top;

let i = 0;
let skipTitleAndToc = true;

while (i < mdLines.length) {
  const line = mdLines[i];

  // Skip the original H1 title
  if (line.startsWith('# ') && skipTitleAndToc) {
    i++;
    continue;
  }

  // Skip TOC section (between first --- pair)
  if (line === '---' && skipTitleAndToc) {
    i++;
    // Skip until next ---
    while (i < mdLines.length && mdLines[i] !== '---') i++;
    if (i < mdLines.length) i++; // skip closing ---
    skipTitleAndToc = false;
    continue;
  }

  skipTitleAndToc = false;

  // Horizontal rule
  if (line === '---') {
    drawHR();
    i++;
    continue;
  }

  // H2
  if (line.startsWith('## ')) {
    const title = line.replace('## ', '');
    checkPage(50);
    y += 10;
    doc.font('Helvetica-Bold').fontSize(15).fillColor(COLORS.primary);
    doc.text(title, doc.page.margins.left, y, { width: PAGE_WIDTH });
    y += doc.heightOfString(title, { width: PAGE_WIDTH }) + 4;
    // Underline
    doc.moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + PAGE_WIDTH, y)
      .stroke('#dddddd');
    y += 12;
    i++;
    continue;
  }

  // H3
  if (line.startsWith('### ')) {
    const title = line.replace('### ', '');
    checkPage(35);
    y += 6;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#3D5340');
    doc.text(title, doc.page.margins.left, y, { width: PAGE_WIDTH });
    y += doc.heightOfString(title, { width: PAGE_WIDTH }) + 6;
    i++;
    continue;
  }

  // Code block
  if (line.startsWith('```')) {
    i++;
    const codeLines = [];
    while (i < mdLines.length && !mdLines[i].startsWith('```')) {
      codeLines.push(mdLines[i]);
      i++;
    }
    if (i < mdLines.length) i++; // skip closing ```
    drawCodeBlock(codeLines);
    continue;
  }

  // Blockquote
  if (line.startsWith('> ')) {
    let blockText = line;
    i++;
    while (i < mdLines.length && mdLines[i].startsWith('> ')) {
      blockText += '\n' + mdLines[i];
      i++;
    }
    drawBlockquote(blockText);
    continue;
  }

  // Table
  if (line.startsWith('|') && i + 1 < mdLines.length && mdLines[i + 1].startsWith('|')) {
    const headerLine = line;
    i++; // skip separator line
    i++;
    const rows = [];
    while (i < mdLines.length && mdLines[i].startsWith('|')) {
      rows.push(mdLines[i]);
      i++;
    }
    drawTable(headerLine, rows);
    continue;
  }

  // Empty line
  if (line.trim() === '') {
    y += 4;
    i++;
    continue;
  }

  // Regular text line (with rich formatting)
  drawRichLine(line);
  i++;
}

// ── Add page numbers ────────────────────────────────────────────

const totalPages = doc.bufferedPageRange().count;
for (let p = 0; p < totalPages; p++) {
  doc.switchToPage(p);

  // Header on all pages except first
  if (p > 0) {
    doc.font('Helvetica').fontSize(7).fillColor(COLORS.accent);
    doc.text('HEAL PILATES STUDIO', doc.page.margins.left, 25, {
      width: PAGE_WIDTH,
      align: 'center',
      characterSpacing: 3,
    });
  }

  // Footer page number
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightGray);
  doc.text(
    `Strona ${p + 1} z ${totalPages}`,
    doc.page.margins.left,
    doc.page.height - 35,
    { width: PAGE_WIDTH, align: 'center' }
  );
}

doc.end();

stream.on('finish', () => {
  console.log(`PDF generated: ${outputPath}`);
});
