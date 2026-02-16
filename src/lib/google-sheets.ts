import { google } from 'googleapis';
import { Client, Settlement, MonthlySettlement, Instructor } from './types';

function isTrueValue(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    return lower === 'true' || lower === 'prawda';
  }
  return false;
}

function getSheetsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: 'v4', auth });
}

const SHEETS = {
  CLIENTS: 'Klienci',
  SESSIONS: 'Sesje',
  INSTRUCTORS: 'Instruktorzy',
};

// ---- CLIENTS ----

export async function getClients(
  accessToken: string,
  spreadsheetId: string
): Promise<Client[]> {
  const sheets = getSheetsClient(accessToken);

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEETS.CLIENTS}!A2:H`,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      id: row[0] || '',
      firstName: row[1] || '',
      lastName: row[2] || '',
      phone: row[3] || '',
      email: row[4] || '',
      isOwnerClient: isTrueValue(row[5]),
      regulationsAccepted: isTrueValue(row[6]),
      regulationsAcceptedDate: row[7] || null,
    }));
  } catch {
    // Sheet might not exist yet, create it
    await initializeClientsSheet(accessToken, spreadsheetId);
    return [];
  }
}

export async function addClient(
  accessToken: string,
  spreadsheetId: string,
  client: Omit<Client, 'id'>
): Promise<Client> {
  const sheets = getSheetsClient(accessToken);
  const id = `client-${Date.now()}`;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEETS.CLIENTS}!A:H`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          id,
          client.firstName,
          client.lastName,
          client.phone,
          client.email,
          String(client.isOwnerClient),
          String(client.regulationsAccepted),
          client.regulationsAcceptedDate || '',
        ],
      ],
    },
  });

  return { ...client, id };
}

export async function updateClient(
  accessToken: string,
  spreadsheetId: string,
  client: Client
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  const clients = await getClients(accessToken, spreadsheetId);
  const rowIndex = clients.findIndex((c) => c.id === client.id);

  if (rowIndex === -1) throw new Error('Client not found');

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEETS.CLIENTS}!A${rowIndex + 2}:H${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          client.id,
          client.firstName,
          client.lastName,
          client.phone,
          client.email,
          String(client.isOwnerClient),
          String(client.regulationsAccepted),
          client.regulationsAcceptedDate || '',
        ],
      ],
    },
  });
}

export async function deleteClient(
  accessToken: string,
  spreadsheetId: string,
  clientId: string
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  const clients = await getClients(accessToken, spreadsheetId);
  const rowIndex = clients.findIndex((c) => c.id === clientId);

  if (rowIndex === -1) throw new Error('Client not found');

  // Get sheet ID
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === SHEETS.CLIENTS
  );
  if (!sheet?.properties?.sheetId) throw new Error('Sheet not found');

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex + 1, // +1 for header
              endIndex: rowIndex + 2,
            },
          },
        },
      ],
    },
  });
}

// ---- SETTLEMENTS ----

export async function addSettlement(
  accessToken: string,
  spreadsheetId: string,
  settlement: Omit<Settlement, 'id'>
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  const id = `settlement-${Date.now()}`;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEETS.SESSIONS}!A:H`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          id,
          settlement.date,
          settlement.sessionType,
          settlement.instructorId,
          settlement.instructorName,
          settlement.clientNames.join(', '),
          String(settlement.price),
          String(settlement.instructorShare),
        ],
      ],
    },
  });
}

export async function getSettlements(
  accessToken: string,
  spreadsheetId: string,
  month?: string,
  instructorId?: string
): Promise<Settlement[]> {
  const sheets = getSheetsClient(accessToken);

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEETS.SESSIONS}!A2:H`,
    });

    const rows = response.data.values || [];
    let settlements: Settlement[] = rows.map((row) => ({
      id: row[0] || '',
      date: row[1] || '',
      sessionType: row[2] as any,
      instructorId: row[3] || '',
      instructorName: row[4] || '',
      clientNames: (row[5] || '').split(', ').filter(Boolean),
      price: Number(row[6]) || 0,
      instructorShare: Number(row[7]) || 0,
    }));

    if (month) {
      settlements = settlements.filter((s) => s.date.startsWith(month));
    }

    if (instructorId) {
      settlements = settlements.filter((s) => s.instructorId === instructorId);
    }

    return settlements;
  } catch {
    await initializeSessionsSheet(accessToken, spreadsheetId);
    return [];
  }
}

export async function getMonthlySettlement(
  accessToken: string,
  spreadsheetId: string,
  month: string,
  instructorId?: string
): Promise<MonthlySettlement[]> {
  const settlements = await getSettlements(accessToken, spreadsheetId, month, instructorId);

  const grouped = new Map<string, Settlement[]>();
  for (const s of settlements) {
    const key = s.instructorId;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  const result: MonthlySettlement[] = [];
  for (const [instrId, sessions] of grouped) {
    result.push({
      month,
      instructorId: instrId,
      instructorName: sessions[0]?.instructorName || '',
      totalHours: sessions.length,
      totalPrice: sessions.reduce((sum, s) => sum + s.price, 0),
      totalShare: sessions.reduce((sum, s) => sum + s.instructorShare, 0),
      sessions,
    });
  }

  return result;
}

// ---- INSTRUCTORS ----

export async function getInstructorsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Instructor[]> {
  const sheets = getSheetsClient(accessToken);

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEETS.INSTRUCTORS}!A2:L`,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      id: row[0] || '',
      name: row[1] || '',
      email: row[2] || '',
      color: row[3] || '',
      colorName: row[4] || '',
      role: row[5] as any,
      pricing: {
        solo: { price: Number(row[6]) || 0, share: Number(row[7]) || 0 },
        duo: { price: Number(row[8]) || 0, share: Number(row[9]) || 0 },
        trio: { price: Number(row[10]) || 0, share: Number(row[11]) || 0 },
      },
    }));
  } catch {
    // Sheet might not exist yet, initialize it
    await initializeInstructorsSheet(accessToken, spreadsheetId);
    return [];
  }
}

export async function saveInstructorsToSheet(
  accessToken: string,
  spreadsheetId: string,
  instructors: Instructor[]
): Promise<void> {
  const sheets = getSheetsClient(accessToken);

  const values = instructors.map((i) => [
    i.id,
    i.name,
    i.email,
    i.color,
    i.colorName,
    i.role,
    String(i.pricing.solo.price),
    String(i.pricing.solo.share),
    String(i.pricing.duo.price),
    String(i.pricing.duo.share),
    String(i.pricing.trio.price),
    String(i.pricing.trio.share),
  ]);

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEETS.INSTRUCTORS}!A2:L${instructors.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  } catch {
    // Sheet might not exist, initialize and retry
    await initializeInstructorsSheet(accessToken, spreadsheetId);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEETS.INSTRUCTORS}!A2:L${instructors.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }
}

// ---- INITIALIZATION ----

async function initializeClientsSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  const sheets = getSheetsClient(accessToken);

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: SHEETS.CLIENTS },
            },
          },
        ],
      },
    });
  } catch {
    // Sheet might already exist
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEETS.CLIENTS}!A1:H1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          'ID',
          'Imię',
          'Nazwisko',
          'Telefon',
          'E-mail',
          'Klient właściciela',
          'Regulamin zaakceptowany',
          'Data akceptacji',
        ],
      ],
    },
  });
}

async function initializeSessionsSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  const sheets = getSheetsClient(accessToken);

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: SHEETS.SESSIONS },
            },
          },
        ],
      },
    });
  } catch {
    // Sheet might already exist
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEETS.SESSIONS}!A1:H1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          'ID',
          'Data',
          'Rodzaj sesji',
          'ID Instruktora',
          'Instruktor',
          'Klienci',
          'Cena',
          'Udział instruktora',
        ],
      ],
    },
  });
}

async function initializeInstructorsSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  const sheets = getSheetsClient(accessToken);

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: SHEETS.INSTRUCTORS },
            },
          },
        ],
      },
    });
  } catch {
    // Sheet might already exist
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEETS.INSTRUCTORS}!A1:L1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          'ID',
          'Imię i Nazwisko',
          'E-mail',
          'Kolor',
          'Nazwa koloru',
          'Rola',
          'Solo cena',
          'Solo udział',
          'Duo cena',
          'Duo udział',
          'Trio cena',
          'Trio udział',
        ],
      ],
    },
  });
}

export async function initializeSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  await initializeClientsSheet(accessToken, spreadsheetId);
  await initializeSessionsSheet(accessToken, spreadsheetId);
  await initializeInstructorsSheet(accessToken, spreadsheetId);
}
