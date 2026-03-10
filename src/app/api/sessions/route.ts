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
import { getServiceAuth } from '@/lib/service-auth';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

async function getServiceToken(): Promise<string> {
  const token = await getServiceAuth();
  if (!token) throw new Error('Service account unavailable');
  return token;
}

async function findInstructor(sheetsToken: string, instructorId: string): Promise<Instructor | undefined> {
  try {
    if (SHEETS_ID) {
      const sheetInstructors = await getInstructorsFromSheet(sheetsToken, SHEETS_ID);
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

  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get('timeMin') || new Date().toISOString();
  const timeMax =
    searchParams.get('timeMax') ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const serviceToken = await getServiceToken();

    const events = await getCalendarEvents(
      serviceToken,
      timeMin,
      timeMax,
      CALENDAR_ID
    );

    // Resolve missing instructorId/instructorName from instructor database
    // Extended properties may be missing on recurring event instances
    let allInstructors: Instructor[] | null = null;
    for (const event of events) {
      if (!event.instructorId && event.instructorName) {
        // Lazy-load instructor list only when needed
        if (!allInstructors) {
          allInstructors = [];
          try {
            if (SHEETS_ID) {
              allInstructors = await getInstructorsFromSheet(serviceToken, SHEETS_ID);
            }
          } catch { /* fall through */ }
          // Add default instructors
          const { DEFAULT_INSTRUCTORS } = await import('@/lib/instructors-data');
          for (const di of DEFAULT_INSTRUCTORS) {
            if (!allInstructors.some((i) => i.id === di.id)) {
              allInstructors.push(di);
            }
          }
        }
        // Match by first name (parsed from title) or full name
        const matched = allInstructors.find((i) =>
          i.name === event.instructorName ||
          i.name.split(' ')[0] === event.instructorName
        );
        if (matched) {
          event.instructorId = matched.id;
          event.instructorName = matched.name;
        }
      }
    }

    // Merge booking signups into open sessions
    if (SHEETS_ID) {
      const openSessions = events.filter((e) => e.isOpenSession && e.bookingToken);
      if (openSessions.length > 0) {
        try {
          const bookings = await getAllBookings(serviceToken, SHEETS_ID);
          const bookingsByEventId = new Map(
            bookings.map((b) => [b.calendarEventId, b])
          );
          for (const event of events) {
            if (event.isOpenSession) {
              const booking = bookingsByEventId.get(event.calendarEventId);
              if (booking && booking.signups.length > 0) {
                event.clientNames = booking.signups.map(
                  (s) => `${s.firstName} ${s.lastName}`
                );
                event.bookingSignups = booking.signups.map((s) => ({
                  firstName: s.firstName,
                  lastName: s.lastName,
                  email: s.email,
                }));
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

  const body = await request.json();

  try {
    const serviceToken = await getServiceToken();

    // Resolve instructor from sheet for name/color
    const instructor = await findInstructor(serviceToken, body.instructorId);

    // Create calendar event with instructor info
    const eventBase = body.isRecurring && body.recurringEndDate
      ? body
      : { ...body, isRecurring: false, recurringEndDate: null };
    const eventData = {
      ...eventBase,
      instructorName: instructor?.name || body.instructorName || '',
      instructorColor: instructor?.color || '',
    };
    const eventId = await createCalendarEvent(serviceToken, eventData, CALENDAR_ID);

    // Write settlement to Sheets
    if (SHEETS_ID) {
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
          const dates = getWeeklyDates(body.date, body.recurringEndDate);
          for (const date of dates) {
            await addSettlement(serviceToken, SHEETS_ID, { ...settlementBase, date });
          }
        } else {
          await addSettlement(serviceToken, SHEETS_ID, { ...settlementBase, date: body.date });
        }
      }

      // Create booking record for open sessions
      if (body.isOpenSession && body.bookingToken) {
        await createBooking(serviceToken, SHEETS_ID, {
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

  const body = await request.json();
  const { eventId, ...updateData } = body;

  try {
    const serviceToken = await getServiceToken();

    // Resolve instructor color for calendar display
    if (updateData.instructorId) {
      const instructor = await findInstructor(serviceToken, updateData.instructorId);
      if (instructor) {
        updateData.instructorName = instructor.name;
        updateData.instructorColor = instructor.color;
      }
    }

    await updateCalendarEvent(serviceToken, eventId, updateData, CALENDAR_ID);
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

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json(
      { error: 'Event ID required' },
      { status: 400 }
    );
  }

  const editMode = searchParams.get('editMode') as 'single' | 'future' | 'all' | null;
  const date = searchParams.get('date');
  const instructorId = searchParams.get('instructorId');
  const sessionType = searchParams.get('sessionType');
  const startTime = searchParams.get('startTime');

  try {
    const serviceToken = await getServiceToken();

    await deleteCalendarEvent(
      serviceToken,
      eventId,
      CALENDAR_ID,
      editMode || undefined,
      date || undefined
    );

    // Remove corresponding settlement entries
    if (SHEETS_ID && date && instructorId && sessionType) {
      await deleteSettlementByDetails(serviceToken, SHEETS_ID, date, instructorId, sessionType, editMode || 'single', startTime || undefined);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: 500 }
    );
  }
}
