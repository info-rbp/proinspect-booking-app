import { NextRequest, NextResponse } from 'next/server';
import { bookingRequestSchema, createBookingRecord } from '@/lib/bookings';
import { createCalendarEvent } from '@/lib/calendar';
import { saveBooking } from '@/lib/database';
import { scheduleBooking } from '@/lib/scheduler';
import type { BookingRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && origin.includes('myshopify.com') ? origin : '*';

  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store'
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected booking server error';
}

function parsePreferredWindow(preferredWindow?: string) {
  const [start, end] = (preferredWindow || '').split(' - ').map((part) => part.trim());

  if (!start || !end) {
    return null;
  }

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return null;
  }

  return { start, end };
}

function calendarDescription(record: BookingRecord) {
  return [
    `Booking ID: ${record.id}`,
    `Service: ${record.serviceType}`,
    `Property: ${record.propertyAddress}`,
    `Customer: ${record.customerName}`,
    `Email: ${record.customerEmail}`,
    `Phone: ${record.customerPhone}`,
    record.agency ? `Agency: ${record.agency}` : '',
    record.accessMethod ? `Access details: ${record.accessMethod}` : '',
    record.notes ? `Notes: ${record.notes}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

async function createBookingCalendarEvent(record: BookingRecord) {
  const window = parsePreferredWindow(record.preferredWindow);

  if (!window) {
    return {
      connected: false,
      eventId: null,
      htmlLink: null,
      message: 'No valid preferred booking window supplied. Calendar event was not created.'
    };
  }

  return createCalendarEvent({
    title: `${record.serviceType} - ${record.propertyAddress}`,
    location: record.propertyAddress,
    description: calendarDescription(record),
    start: window.start,
    end: window.end,
    attendees: record.customerEmail ? [record.customerEmail] : [],
    extendedProperties: {
      bookingId: record.id,
      serviceType: record.serviceType,
      source: 'shopify-booking'
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin'))
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const raw = await request.json();
    const parsed = bookingRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid booking request', details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const record = createBookingRecord(parsed.data);
    const scheduling = await scheduleBooking(record);
    const savedBooking = await saveBooking(record);

    let calendarEvent = null;

    try {
      calendarEvent = await createBookingCalendarEvent(savedBooking);
    } catch (calendarError) {
      console.error('Booking saved, but calendar event creation failed', calendarError);
      calendarEvent = {
        connected: false,
        eventId: null,
        htmlLink: null,
        message: calendarError instanceof Error ? calendarError.message : 'Calendar event creation failed'
      };
    }

    return NextResponse.json(
      { booking: savedBooking, scheduling, calendarEvent },
      { status: 201, headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error('Failed to submit Shopify booking request', error);

    return NextResponse.json(
      { error: 'Failed to submit booking request', message: errorMessage(error) },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
