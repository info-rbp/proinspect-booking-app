import type { CandidateSlot } from './types';

export async function getFreeBusyWindow() {
  return {
    connected: Boolean(process.env.GOOGLE_CALENDAR_ID),
    message: 'Calendar integration stub. Connect Google Calendar API credentials before production scheduling.'
  };
}

export async function createCalendarEvent(input: {
  title: string;
  location: string;
  description: string;
  start: string;
  end: string;
}) {
  return {
    connected: Boolean(process.env.GOOGLE_CALENDAR_ID),
    eventId: null,
    input,
    message: 'Calendar event creation stub. No event created yet.'
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
