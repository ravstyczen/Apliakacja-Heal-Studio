/**
 * Script to delete all session events from the service account's primary calendar.
 * Run with: npx tsx scripts/cleanup-service-calendar.ts
 *
 * Optional: pass target calendar ID as argument:
 *   npx tsx scripts/cleanup-service-calendar.ts abc123@group.calendar.google.com
 */

import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const calendarId = process.argv[2] || 'primary';

  console.log(`\nCleaning up calendar: ${calendarId}\n`);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  // Fetch all events
  let allEvents: any[] = [];
  let pageToken: string | undefined;

  do {
    const response = await calendar.events.list({
      calendarId,
      maxResults: 2500,
      singleEvents: false, // Get base events, not instances
      pageToken,
    });

    const items = response.data.items || [];
    allEvents = allEvents.concat(items);
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  // Filter to only session events (have our title pattern or extended properties)
  const sessionEvents = allEvents.filter((e) => {
    const hasProps = e.extendedProperties?.shared?.sessionType ||
                     e.extendedProperties?.private?.sessionType;
    const hasTitle = /^\[(SOLO|DUO|TRIO)\]\s*-\s*.+/.test(e.summary || '');
    return hasProps || hasTitle;
  });

  console.log(`Found ${allEvents.length} total events, ${sessionEvents.length} are sessions\n`);

  if (sessionEvents.length === 0) {
    console.log('No session events to delete.');
    return;
  }

  // List them
  for (const event of sessionEvents) {
    const isRecurring = event.recurrence ? ' (recurring)' : '';
    console.log(`  - ${event.summary} | ${event.start?.dateTime || event.start?.date}${isRecurring} | ID: ${event.id}`);
  }

  console.log(`\nDeleting ${sessionEvents.length} events...\n`);

  let deleted = 0;
  let errors = 0;
  for (const event of sessionEvents) {
    try {
      await calendar.events.delete({ calendarId, eventId: event.id! });
      deleted++;
      process.stdout.write(`  Deleted ${deleted}/${sessionEvents.length}\r`);
    } catch (err: any) {
      errors++;
      console.error(`  Failed to delete ${event.id}: ${err.message}`);
    }
  }

  console.log(`\nDone! Deleted: ${deleted}, Errors: ${errors}`);
}

main().catch(console.error);
