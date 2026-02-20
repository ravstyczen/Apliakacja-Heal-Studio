import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
} from '@/lib/google-calendar';
import { addSettlement, deleteSettlementByDetails, getInstructorsFromSheet, createBooking, getAllBookings } from '@/lib/google-sheets';
import { SESSION_CLIENT_LIMITS } from '@/lib/types';
import { getInstructorById } from '@/lib/instructors-data';
import { Instructor, getSessionPrice, getSessionShare } from '@/lib/types';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

async function findInstructor(accessToken: string, instructorId: string): Promise<Instructor | undefined> {
  // Read from sheet first (source of truth for pricing), fall back to hardcoded defaults
  try {
    if (SHEETS_ID) {
      const sheetInstructors = await getInstructorsFromSheet(accessToken, SHEETS_ID);
      const found = sheetInstructors.find((i) => i.id === instructorId);
      if (found) return found;
    }
  } catch {
    // Fall through to default
  }
  return getInstructorById(instructorId);
}

function getWeeklyDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 7);
  }
  return dates;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get('timeMin') || new Date().toISOString();
  const timeMax =
    searchParams.get('timeMax') ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const events = await getCalendarEvents(
      accessToken,
      timeMin,
      timeMax,
      CALENDAR_ID
    );

    // Merge booking signups into open sessions so client names display in calendar
    if (SHEETS_ID) {
      const openSessions = events.filter((e) => e.isOpenSession && e.bookingToken);
      if (openSessions.length > 0) {
        try {
          const bookings = await getAllBookings(accessToken, SHEETS_ID);
          const bookingsByEventId = new Map(
            bookings.map((b) => [b.calendarEventId, b])
          );
          for (const event of events) {
            if (event.isOpenSession) {
              const booking = bookingsByEventId.get(event.calendarEventId);
              if (booking && booking.signups.length > 0) {
                const bookingNames = booking.signups.map(
                  (s) => `${s.firstName} ${s.lastName}`
                );
                event.clientNames = bookingNames;
              }
            }
          }
        } catch {
          // Don't fail if booking lookup fails
        }
      }
    }

    return NextResponse.json(events, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const body = await request.json();

  try {
    // Create single or recurring events
    const eventData = body.isRecurring && body.recurringEndDate
      ? body
      : { ...body, isRecurring: false, recurringEndDate: null };
    const eventId = await createCalendarEvent(accessToken, eventData, CALENDAR_ID);

    // Write settlement to Sesje sheet
    if (SHEETS_ID) {
      const instructor = await findInstructor(accessToken, body.instructorId);
      if (instructor) {
        const price = getSessionPrice(instructor.pricing, body.type);
        const share = getSessionShare(instructor.pricing, body.type);
        const settlementBase = {
          time: body.startTime || '',
          sessionType: body.type,
          instructorId: body.instructorId,
          instructorName: instructor.name,
          clientNames: body.clientNames || [],
          price,
          instructorShare: share,
        };

        if (body.isRecurring && body.recurringEndDate) {
          // Write entries for all recurring weekly dates
          const dates = getWeeklyDates(body.date, body.recurringEndDate);
          for (const date of dates) {
            await addSettlement(accessToken, SHEETS_ID, { ...settlementBase, date });
          }
        } else {
          await addSettlement(accessToken, SHEETS_ID, { ...settlementBase, date: body.date });
        }
      }
    }

    // Create booking record for open sessions
    if (body.isOpenSession && body.bookingToken && SHEETS_ID) {
      const instructor = await findInstructor(accessToken, body.instructorId);
      await createBooking(accessToken, SHEETS_ID, {
        token: body.bookingToken,
        calendarEventId: eventId,
        date: body.date,
        startTime: body.startTime || '',
        endTime: body.endTime || '',
        sessionType: body.type,
        instructorName: instructor?.name || '',
        maxSlots: SESSION_CLIENT_LIMITS[body.type as keyof typeof SESSION_CLIENT_LIMITS] || 1,
      });
    }

    return NextResponse.json({ id: eventId, calendarEventId: eventId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const body = await request.json();
  const { eventId, ...updateData } = body;

  try {
    await updateCalendarEvent(accessToken, eventId, updateData, CALENDAR_ID);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json(
      { error: 'Event ID required' },
      { status: 400 }
    );
  }

  // Also get session details from query params for settlement deletion
  const editMode = searchParams.get('editMode') as 'single' | 'future' | 'all' | null;
  const date = searchParams.get('date');
  const instructorId = searchParams.get('instructorId');
  const sessionType = searchParams.get('sessionType');

  try {
    await deleteCalendarEvent(
      accessToken,
      eventId,
      CALENDAR_ID,
      editMode || undefined,
      date || undefined
    );

    // Remove corresponding settlement entry
    if (SHEETS_ID && date && instructorId && sessionType) {
      await deleteSettlementByDetails(accessToken, SHEETS_ID, date, instructorId, sessionType);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: 500 }
    );
  }
}
