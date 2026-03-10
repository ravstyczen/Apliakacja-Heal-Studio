/**
 * Debug script: list ALL events the API returns for the calendar
 * Usage: npx tsx scripts/debug-calendar-events.ts [calendarId]
 */
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const KEY_JSON = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
const CALENDAR_ID = process.argv[2] || process.env.GOOGLE_CALENDAR_ID || 'primary';

async function main() {
  const auth = new google.auth.JWT(
    KEY_JSON.client_email,
    undefined,
    KEY_JSON.private_key,
    ['https://www.googleapis.com/auth/calendar']
  );
  await auth.authorize();
  const calendar = google.calendar({ version: 'v3', auth });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const threeMonthsAhead = new Date();
  threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

  console.log(`Calendar: ${CALENDAR_ID}`);
  console.log(`Range: ${sixMonthsAgo.toISOString()} - ${threeMonthsAhead.toISOString()}\n`);

  const response = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: sixMonthsAgo.toISOString(),
    timeMax: threeMonthsAhead.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 2500,
  });

  const items = response.data.items || [];
  console.log(`Total events returned: ${items.length}\n`);

  for (const event of items) {
    const hasSession = event.extendedProperties?.shared?.sessionType
      || event.extendedProperties?.private?.sessionType
      || /^\[(Solo|Duo|Trio)\]\s*-\s*.+/.test(event.summary || '');

    console.log('---');
    console.log(`ID:       ${event.id}`);
    console.log(`Summary:  ${event.summary}`);
    console.log(`Status:   ${event.status}`);
    console.log(`Start:    ${event.start?.dateTime || event.start?.date}`);
    console.log(`Recurring: ${event.recurringEventId || 'no'}`);
    console.log(`Session:  ${hasSession ? 'YES' : 'no'}`);
    console.log(`Shared:   ${JSON.stringify(event.extendedProperties?.shared || {})}`);
    console.log(`Private:  ${JSON.stringify(event.extendedProperties?.private || {})}`);
  }

  // Highlight potential ghosts
  const ghosts = items.filter(e => e.status === 'cancelled');
  if (ghosts.length > 0) {
    console.log(`\n=== GHOST EVENTS (status=cancelled): ${ghosts.length} ===`);
    for (const g of ghosts) {
      console.log(`  ${g.id} | ${g.summary} | ${g.start?.dateTime}`);
    }
  }
}

main().catch(console.error);
