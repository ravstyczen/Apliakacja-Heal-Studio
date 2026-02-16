import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCalendarEvents } from '@/lib/google-calendar';
import { clearSettlements, addSettlement, getInstructorsFromSheet } from '@/lib/google-sheets';
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

    // Only sync past events (sessions that have already occurred)
    const pastEvents = calendarEvents.filter((event) => {
      const eventEnd = new Date(`${event.date}T${event.endTime}:00`);
      return eventEnd < now;
    });

    // Clear all existing settlement data and re-write from calendar
    // This ensures correct column alignment after schema changes
    await clearSettlements(accessToken, SHEETS_ID);

    let added = 0;

    for (const event of pastEvents) {
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
