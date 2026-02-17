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

    // Include all events (past and future) so settlements are always visible
    const validEvents = calendarEvents.filter((event) => {
      return event.instructorId && event.type;
    });

    // Build settlement data before clearing to avoid data loss on errors
    const settlementsToWrite: Array<Omit<import('@/lib/types').Settlement, 'id'>> = [];
    for (const event of validEvents) {
      const instructor = findInstructor(event.instructorId);
      if (!instructor) continue;

      const price = getSessionPrice(instructor.pricing, event.type);
      const share = getSessionShare(instructor.pricing, event.type);

      settlementsToWrite.push({
        date: event.date,
        time: event.startTime,
        sessionType: event.type,
        instructorId: event.instructorId,
        instructorName: instructor.name,
        clientNames: event.clientNames || [],
        price,
        instructorShare: share,
      });
    }

    // Only clear and re-write if we have data (prevent accidental wipe)
    if (settlementsToWrite.length > 0) {
      await clearSettlements(accessToken, SHEETS_ID);
      for (const settlement of settlementsToWrite) {
        await addSettlement(accessToken, SHEETS_ID, settlement);
      }
    }

    return NextResponse.json({ synced: settlementsToWrite.length, total: validEvents.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync settlements' },
      { status: 500 }
    );
  }
}
