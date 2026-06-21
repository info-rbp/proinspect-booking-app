import { google } from 'googleapis';
import type { CandidateSlot } from './types';

const DEFAULT_TIME_ZONE = 'Australia/Perth';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

export type BusyWindow = {
  start: string;
  end: string;
};

export type FreeBusyResult = {
  connected: boolean;
  calendarId: string;
  busy: BusyWindow[];
  message: string;
};

type CalendarCredentials = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
  [key: string]: unknown;
};

function getCalendarId(): string {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID_PROINSPECT;

  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID is not configured.');
  }

  return calendarId;
}

function getServiceAccountCredentials(): CalendarCredentials {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!rawCredentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured.');
  }

  const credentials = JSON.parse(rawCredentials) as CalendarCredentials;

  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key.');
  }

  return credentials;
}

async function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getServiceAccountCredentials(),
    scopes: [CALENDAR_SCOPE]
  });

  const authClient = await auth.getClient();

  return google.calendar({
    version: 'v3',
    auth: authClient as any
  });
}

export async function getFreeBusyWindow(input: {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
}): Promise<FreeBusyResult> {
  const calendarId = getCalendarId();
  const calendar = await getCalendarClient();

  const result = await calendar.freebusy.query({
    requestBody: {
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      timeZone: input.timeZone || DEFAULT_TIME_ZONE,
      items: [{ id: calendarId }]
    }
  });

  const busy = (result.data.calendars?.[calendarId]?.busy || [])
    .filter((window): window is { start: string; end: string } => Boolean(window.start && window.end))
    .map((window) => ({
      start: window.start,
      end: window.end
    }));

  return {
    connected: true,
    calendarId,
    busy,
    message: 'Google Calendar FreeBusy window loaded.'
  };
}

export async function createCalendarEvent(input: {
  title: string;
  location: string;
  description: string;
  start: string;
  end: string;
  timeZone?: string;
  attendees?: string[];
  extendedProperties?: Record<string, string>;
}) {
  const calendarId = getCalendarId();
  const calendar = await getCalendarClient();
  const timeZone = input.timeZone || DEFAULT_TIME_ZONE;

  const event = await calendar.events.insert({
    calendarId,
    sendUpdates: 'none',
    requestBody: {
      summary: input.title,
      location: input.location,
      description: input.description,
      start: {
        dateTime: input.start,
        timeZone
      },
      end: {
        dateTime: input.end,
        timeZone
      },
      attendees: input.attendees?.filter(Boolean).map((email) => ({ email })),
      extendedProperties: input.extendedProperties
        ? {
            private: input.extendedProperties
          }
        : undefined
    }
  });

  return {
    connected: true,
    eventId: event.data.id ?? null,
    htmlLink: event.data.htmlLink ?? null,
    input,
    message: 'Google Calendar event created.'
  };
}

export async function suggestPlaceholderSlot(): Promise<CandidateSlot> {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 45);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    score: 70,
    reason: 'Placeholder slot until Google Calendar FreeBusy is connected.'
  };
}
