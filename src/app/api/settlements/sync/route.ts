import { NextRequest, NextResponse } from 'next/server';
import { getCalendarEvents } from '@/lib/google-calendar';
import { clearSettlements, addSettlement, getInstructorsFromSheet } from '@/lib/google-sheets';
import { getInstructorById } from '@/lib/instructors-data';
import { Instructor, getSessionPrice, getSessionShare } from '@/lib/types';
import { getServiceAuth } from '@/lib/service-auth';
import { getAuthenticatedInstructor } from '@/lib/auth-mobile';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function POST(request: NextRequest) {
  const { email } = await getAuthenticatedInstructor(request);
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceToken = await getServiceAuth();
  if (!serviceToken) {
    return NextResponse.json({ error: 'Service account unavailable' }, { status: 500 });
  }

  try {
    // Read calendar events using Service Account
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const threeMonthsAhead = new Date();
    threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

    const calendarEvents = await getCalendarEvents(
      serviceToken,
      sixMonthsAgo.toISOString(),
      threeMonthsAhead.toISOString(),
      CALENDAR_ID
    );

    // Load instructor pricing from sheet using Service Account
    let sheetInstructors: Instructor[] = [];
    try {
      sheetInstructors = await getInstructorsFromSheet(serviceToken, SHEETS_ID);
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

    // Write to Sheets using Service Account
    // Always clear first to remove ghost/stale settlements even when calendar is empty
    await clearSettlements(serviceToken, SHEETS_ID);
    for (const settlement of settlementsToWrite) {
      await addSettlement(serviceToken, SHEETS_ID, settlement);
    }

    return NextResponse.json({ synced: settlementsToWrite.length, total: validEvents.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync settlements' },
      { status: 500 }
    );
  }
}
