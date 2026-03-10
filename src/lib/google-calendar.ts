import { google, calendar_v3 } from 'googleapis';
import { Session, SessionType, RecurringEditMode, getCalendarEventTitle, Instructor } from './types';

// Google Calendar color IDs mapping (approximate)
// See: https://developers.google.com/calendar/api/v3/reference/colors
const INSTRUCTOR_CALENDAR_COLORS: Record<string, string> = {
  '#D4A843': '5',  // yellow/banana
  '#1A1A1A': '8',  // graphite
  '#4A90D9': '9',  // blueberry
  '#D94A4A': '11', // tomato
};

function getCalendarColorId(instructorColor: string): string {
  return INSTRUCTOR_CALENDAR_COLORS[instructorColor] || '1';
}

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

function buildExtendedProperties(data: Record<string, string>) {
  // Write to BOTH shared and private for maximum compatibility
  // Recurring event instances may not inherit one or the other
  return {
    shared: { ...data },
    private: { ...data },
  };
}

export async function createCalendarEvent(
  accessToken: string,
  session: Omit<Session, 'id' | 'calendarEventId'>,
  calendarId: string = 'primary'
): Promise<string> {
  const calendar = getCalendarClient(accessToken);

  // Use instructorName from session data (resolved from sheet by the API route)
  const instructorName = session.instructorName || session.instructorId;
  const firstName = instructorName.split(' ')[0];
  const title = getCalendarEventTitle(session.type, firstName);
  // Use instructorColor if provided, otherwise try to match from known colors
  const colorId = session.instructorColor
    ? getCalendarColorId(session.instructorColor)
    : '1';

  const event: calendar_v3.Schema$Event = {
    summary: title,
    description: `Klienci: ${session.clientNames.join(', ') || 'Brak'}`,
    colorId,
    start: {
      dateTime: `${session.date}T${session.startTime}:00`,
      timeZone: 'Europe/Warsaw',
    },
    end: {
      dateTime: `${session.date}T${session.endTime}:00`,
      timeZone: 'Europe/Warsaw',
    },
    extendedProperties: buildExtendedProperties({
      sessionType: session.type,
      instructorId: session.instructorId,
      instructorName: instructorName,
      clientIds: JSON.stringify(session.clientIds),
      clientNames: JSON.stringify(session.clientNames),
      isRecurring: String(session.isRecurring),
      recurringGroupId: session.recurringGroupId || '',
      recurringEndDate: session.recurringEndDate || '',
      isOpenSession: String(session.isOpenSession || false),
      bookingToken: session.bookingToken || '',
    }),
  };

  if (session.isRecurring && session.recurringEndDate) {
    const endDate = session.recurringEndDate.replace(/-/g, '');
    event.recurrence = [`RRULE:FREQ=WEEKLY;UNTIL=${endDate}T235959Z`];
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data.id!;
}

function getBaseEventId(eventId: string): string {
  return eventId.replace(/_\d{8}T\d{6}Z$/, '');
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  session: Partial<Session> & { editMode?: RecurringEditMode },
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = getCalendarClient(accessToken);
  const editMode = session.editMode;

  const updateData: calendar_v3.Schema$Event = {};

  if (session.type && session.instructorName) {
    const firstName = session.instructorName.split(' ')[0];
    updateData.summary = getCalendarEventTitle(session.type, firstName);
  }

  if (session.instructorColor) {
    updateData.colorId = getCalendarColorId(session.instructorColor);
  }

  if (session.date && session.startTime && session.endTime) {
    updateData.start = {
      dateTime: `${session.date}T${session.startTime}:00`,
      timeZone: 'Europe/Warsaw',
    };
    updateData.end = {
      dateTime: `${session.date}T${session.endTime}:00`,
      timeZone: 'Europe/Warsaw',
    };
  }

  if (session.clientNames) {
    updateData.description = `Klienci: ${session.clientNames.join(', ') || 'Brak'}`;
  }

  const propsData: Record<string, string> = {
    ...(session.type && { sessionType: session.type }),
    ...(session.instructorId && { instructorId: session.instructorId }),
    ...(session.instructorName && { instructorName: session.instructorName }),
    ...(session.clientIds && { clientIds: JSON.stringify(session.clientIds) }),
    ...(session.clientNames && { clientNames: JSON.stringify(session.clientNames) }),
  };
  updateData.extendedProperties = buildExtendedProperties(propsData);

  if (editMode === 'all') {
    // Update the entire recurring series — use base event ID
    const baseId = getBaseEventId(eventId);
    // For 'all' mode, don't send start/end (they relate to a specific instance)
    delete updateData.start;
    delete updateData.end;
    await calendar.events.patch({
      calendarId,
      eventId: baseId,
      requestBody: updateData,
    });
  } else if (editMode === 'future' && session.date) {
    // End old series before this instance, create a new series from this date
    const baseId = getBaseEventId(eventId);

    // First, get the existing base event to read its recurrence rule
    const existing = await calendar.events.get({ calendarId, eventId: baseId });

    // Shorten original series to end before this instance
    const untilDate = new Date(session.date);
    untilDate.setDate(untilDate.getDate() - 1);
    const until = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const recurrence = existing.data.recurrence || [];
    const updatedRecurrence = recurrence.map((rule) => {
      if (rule.startsWith('RRULE:')) {
        const withoutUntil = rule.replace(/;UNTIL=[^;]+/, '');
        return `${withoutUntil};UNTIL=${until}`;
      }
      return rule;
    });
    await calendar.events.patch({
      calendarId,
      eventId: baseId,
      requestBody: { recurrence: updatedRecurrence },
    });

    // Create a new recurring event from this date with updated data
    const originalEnd = existing.data.recurrence?.[0]?.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
    const recurringEndDate = originalEnd
      ? `${originalEnd[1]}-${originalEnd[2]}-${originalEnd[3]}`
      : '';

    const startTime = session.startTime || existing.data.start?.dateTime?.substring(11, 16) || '08:00';
    const endTime = session.endTime || existing.data.end?.dateTime?.substring(11, 16) || '09:00';

    const newEvent: calendar_v3.Schema$Event = {
      summary: updateData.summary || existing.data.summary || '',
      description: updateData.description || existing.data.description || '',
      colorId: updateData.colorId || existing.data.colorId || '1',
      start: {
        dateTime: `${session.date}T${startTime}:00`,
        timeZone: 'Europe/Warsaw',
      },
      end: {
        dateTime: `${session.date}T${endTime}:00`,
        timeZone: 'Europe/Warsaw',
      },
      extendedProperties: updateData.extendedProperties,
    };

    if (recurringEndDate) {
      const endDateClean = recurringEndDate.replace(/-/g, '');
      newEvent.recurrence = [`RRULE:FREQ=WEEKLY;UNTIL=${endDateClean}T235959Z`];
    }

    await calendar.events.insert({
      calendarId,
      requestBody: newEvent,
    });
  } else {
    // Single instance or non-recurring — patch the specific event ID
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updateData,
    });
  }
}

export async function updateCalendarEventClients(
  accessToken: string,
  eventId: string,
  clientNames: string[],
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = getCalendarClient(accessToken);

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      description: `Klienci: ${clientNames.join(', ') || 'Brak'}`,
      extendedProperties: buildExtendedProperties({
        clientNames: JSON.stringify(clientNames),
      }),
    },
  });
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary',
  editMode?: RecurringEditMode,
  instanceDate?: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken);

  if (editMode === 'all') {
    // Delete the entire recurring series — use base event ID
    const baseId = getBaseEventId(eventId);
    await calendar.events.delete({ calendarId, eventId: baseId });
  } else if (editMode === 'future' && instanceDate) {
    // End the recurrence just before this instance
    const baseId = getBaseEventId(eventId);
    const untilDate = new Date(instanceDate);
    untilDate.setDate(untilDate.getDate() - 1);
    const until = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const existing = await calendar.events.get({ calendarId, eventId: baseId });
    const recurrence = existing.data.recurrence || [];
    const updatedRecurrence = recurrence.map((rule) => {
      // Replace existing UNTIL or add one
      if (rule.startsWith('RRULE:')) {
        const withoutUntil = rule.replace(/;UNTIL=[^;]+/, '');
        return `${withoutUntil};UNTIL=${until}`;
      }
      return rule;
    });

    await calendar.events.patch({
      calendarId,
      eventId: baseId,
      requestBody: { recurrence: updatedRecurrence },
    });
  } else {
    // Single instance or non-recurring — delete the specific event ID
    await calendar.events.delete({ calendarId, eventId });
  }
}

// Parse instructor name from event title as fallback
// Title format: "[TYPE] - FirstName" e.g. "[SOLO] - Agnieszka"
function parseInstructorFromTitle(summary: string | null | undefined): string {
  if (!summary) return '';
  const match = summary.match(/\]\s*-\s*(.+)$/);
  return match ? match[1].trim() : '';
}

export async function getCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarId: string = 'primary'
): Promise<Session[]> {
  const calendar = getCalendarClient(accessToken);

  // Fetch all pages of events
  let allItems: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;

  do {
    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
      pageToken,
    });

    const items = response.data.items || [];
    allItems = allItems.concat(items);
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return allItems
    .filter((event) => {
      // Check shared, private, or title pattern for session detection
      const hasShared = !!event.extendedProperties?.shared?.sessionType;
      const hasPrivate = !!event.extendedProperties?.private?.sessionType;
      const hasSessionTitle = /^\[(Solo|Duo|Trio)\]\s*-\s*.+/.test(event.summary || '');
      return hasShared || hasPrivate || hasSessionTitle;
    })
    .map((event) => {
      // Merge shared + private properties, preferring shared
      const sharedProps = event.extendedProperties?.shared || {};
      const privateProps = event.extendedProperties?.private || {};
      const props = { ...privateProps, ...sharedProps };

      const start = new Date(event.start?.dateTime || event.start?.date || '');
      const end = new Date(event.end?.dateTime || event.end?.date || '');

      // Fallback: parse instructor name from event title
      const titleInstructorName = parseInstructorFromTitle(event.summary);

      let clientIds: string[] = [];
      let clientNames: string[] = [];
      try {
        const parsed = props.clientIds ? JSON.parse(props.clientIds) : [];
        clientIds = Array.isArray(parsed) ? parsed : [];
      } catch {
        clientIds = [];
      }
      try {
        const parsed = props.clientNames ? JSON.parse(props.clientNames) : [];
        clientNames = Array.isArray(parsed) ? parsed : [];
      } catch {
        clientNames = [];
      }

      // Detect session type from properties or title
      let sessionType = props.sessionType as SessionType;
      if (!sessionType) {
        const titleMatch = event.summary?.match(/^\[(Solo|Duo|Trio)\]/);
        sessionType = (titleMatch ? titleMatch[1] : 'Solo') as SessionType;
      }

      // Detect recurring: event has recurringEventId if it's an instance of a recurring series
      const isRecurringInstance = !!event.recurringEventId;
      const isRecurring = props.isRecurring === 'true' || isRecurringInstance;

      return {
        id: event.id!,
        calendarEventId: event.id!,
        date: start.toISOString().split('T')[0],
        startTime: start.toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Europe/Warsaw',
        }),
        endTime: end.toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Europe/Warsaw',
        }),
        type: sessionType,
        instructorId: props.instructorId || '',
        instructorName: props.instructorName || titleInstructorName || '',
        clientIds,
        clientNames,
        isRecurring,
        recurringGroupId: props.recurringGroupId || event.recurringEventId || null,
        recurringEndDate: props.recurringEndDate || null,
        isOpenSession: props.isOpenSession === 'true',
        bookingToken: props.bookingToken || null,
      };
    });
}
