import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCalendarEvents } from '@/lib/google-calendar';
import { getSettlements, addSettlement, getInstructorsFromSheet } from '@/lib/google-sheets';
import { getInstructorById } from '@/lib/instructors-data';
import { Instructor, getSessionPrice, getSessionShare } from '@/lib/types';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;

  try {
    // Read past calendar events (last 6 months up to now)
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const calendarEvents = await getCalendarEvents(
      accessToken,
      sixMonthsAgo.toISOString(),
      now.toISOString(),
      CALENDAR_ID
    );

    // Read existing settlements
    const existingSettlements = await getSettlements(accessToken, SHEETS_ID);

    // Build a set of existing settlement keys for deduplication
    const existingKeys = new Set(
      existingSettlements.map((s) => `${s.date}|${s.time}|${s.instructorId}|${s.sessionType}`)
    );

    // Load instructor pricing from sheet (source of truth)
    let sheetInstructors: Instructor[] = [];
    try {
      sheetInstructors = await getInstructorsFromSheet(accessToken, SHEETS_ID);
    } catch {
      // Fall back to defaults
    }

    const findInstructor = (instructorId: string): Instructor | undefined => {
      return sheetInstructors.find((i) => i.id === instructorId) || getInstructorById(instructorId);
    };

    let added = 0;

    // Only sync past events (sessions that have already occurred)
    const pastEvents = calendarEvents.filter((event) => {
      const eventEnd = new Date(`${event.date}T${event.endTime}:00`);
      return eventEnd < now;
    });

    for (const event of pastEvents) {
      const key = `${event.date}|${event.startTime}|${event.instructorId}|${event.type}`;
      if (existingKeys.has(key)) continue;

      const instructor = findInstructor(event.instructorId);
      if (!instructor) continue;

      const price = getSessionPrice(instructor.pricing, event.type);
      const share = getSessionShare(instructor.pricing, event.type);

      await addSettlement(accessToken, SHEETS_ID, {
        date: event.date,
        time: event.startTime,
        sessionType: event.type,
        instructorId: event.instructorId,
        instructorName: instructor.name,
        clientNames: event.clientNames || [],
        price,
        instructorShare: share,
      });

      existingKeys.add(key);
      added++;
    }

    return NextResponse.json({ synced: added, total: pastEvents.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync settlements' },
      { status: 500 }
    );
  }
}
