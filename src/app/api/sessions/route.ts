import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
} from '@/lib/google-calendar';
import { addSettlement } from '@/lib/google-sheets';
import { getInstructorById } from '@/lib/instructors-data';
import { getSessionPrice, getSessionShare } from '@/lib/types';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

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
    return NextResponse.json(events);
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
    if (body.isRecurring && body.recurringEndDate) {
      const eventId = await createCalendarEvent(
        accessToken,
        body,
        CALENDAR_ID
      );
      return NextResponse.json({ id: eventId, calendarEventId: eventId });
    } else {
      const eventId = await createCalendarEvent(
        accessToken,
        { ...body, isRecurring: false, recurringEndDate: null },
        CALENDAR_ID
      );
      return NextResponse.json({ id: eventId, calendarEventId: eventId });
    }
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

  try {
    await deleteCalendarEvent(accessToken, eventId, CALENDAR_ID);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: 500 }
    );
  }
}
