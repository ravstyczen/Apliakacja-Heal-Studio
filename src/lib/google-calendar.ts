import { google, calendar_v3 } from 'googleapis';
import { Session, SessionType, getCalendarEventTitle } from './types';
import { getInstructorById } from './instructors-data';

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

export async function createCalendarEvent(
  accessToken: string,
  session: Omit<Session, 'id' | 'calendarEventId'>,
  calendarId: string = 'primary'
): Promise<string> {
  const calendar = getCalendarClient(accessToken);
  const instructor = getInstructorById(session.instructorId);
  if (!instructor) throw new Error('Instructor not found');

  const firstName = instructor.name.split(' ')[0];
  const title = getCalendarEventTitle(session.type, firstName);

  const event: calendar_v3.Schema$Event = {
    summary: title,
    description: `Klienci: ${session.clientNames.join(', ') || 'Brak'}`,
    colorId: getCalendarColorId(instructor.color),
    start: {
      dateTime: `${session.date}T${session.startTime}:00`,
      timeZone: 'Europe/Warsaw',
    },
    end: {
      dateTime: `${session.date}T${session.endTime}:00`,
      timeZone: 'Europe/Warsaw',
    },
    extendedProperties: {
      private: {
        sessionType: session.type,
        instructorId: session.instructorId,
        clientIds: JSON.stringify(session.clientIds),
        clientNames: JSON.stringify(session.clientNames),
        isRecurring: String(session.isRecurring),
        recurringGroupId: session.recurringGroupId || '',
        recurringEndDate: session.recurringEndDate || '',
      },
    },
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

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  session: Partial<Session>,
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = getCalendarClient(accessToken);
  const instructor = session.instructorId
    ? getInstructorById(session.instructorId)
    : undefined;

  const updateData: calendar_v3.Schema$Event = {};

  if (session.type && instructor) {
    const firstName = instructor.name.split(' ')[0];
    updateData.summary = getCalendarEventTitle(session.type, firstName);
  }

  if (instructor) {
    updateData.colorId = getCalendarColorId(instructor.color);
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

  updateData.extendedProperties = {
    private: {
      ...(session.type && { sessionType: session.type }),
      ...(session.instructorId && { instructorId: session.instructorId }),
      ...(session.clientIds && { clientIds: JSON.stringify(session.clientIds) }),
      ...(session.clientNames && { clientNames: JSON.stringify(session.clientNames) }),
    },
  };

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: updateData,
  });
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = getCalendarClient(accessToken);
  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

export async function getCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarId: string = 'primary'
): Promise<Session[]> {
  const calendar = getCalendarClient(accessToken);

  const response = await calendar.events.list({
    calendarId,
    timeMin: new Date(timeMin).toISOString(),
    timeMax: new Date(timeMax).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];

  return events
    .filter((event) => event.extendedProperties?.private?.sessionType)
    .map((event) => {
      const props = event.extendedProperties!.private!;
      const start = new Date(event.start?.dateTime || event.start?.date || '');
      const end = new Date(event.end?.dateTime || event.end?.date || '');

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
        type: props.sessionType as SessionType,
        instructorId: props.instructorId || '',
        instructorName: getInstructorById(props.instructorId || '')?.name || '',
        clientIds: props.clientIds ? JSON.parse(props.clientIds) : [],
        clientNames: props.clientNames ? JSON.parse(props.clientNames) : [],
        isRecurring: props.isRecurring === 'true',
        recurringGroupId: props.recurringGroupId || null,
        recurringEndDate: props.recurringEndDate || null,
      };
    });
}
