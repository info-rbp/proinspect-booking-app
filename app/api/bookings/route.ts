import { NextRequest, NextResponse } from 'next/server';
import { bookingRequestSchema, createBookingRecord } from '@/lib/bookings';
import { listBookings, saveBooking } from '@/lib/database';
import { scheduleBooking } from '@/lib/scheduler';

async function parseRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected booking server error';
}

export async function GET() {
  try {
    const bookings = await listBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Failed to list bookings', error);
    return NextResponse.json(
      { error: 'Failed to list bookings', message: errorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await parseRequest(request);
    const parsed = bookingRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid booking request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const record = createBookingRecord(parsed.data);
    const scheduling = await scheduleBooking(record);
    await saveBooking(record);

    const accept = request.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      const params = new URLSearchParams({
        id: record.id,
        status: record.status
      });
      return NextResponse.redirect(new URL(`/booking/received?${params}`, request.url), 303);
    }

    return NextResponse.json({ booking: record, scheduling }, { status: 201 });
  } catch (error) {
    console.error('Failed to submit booking', error);

    const accept = request.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      const params = new URLSearchParams({ reason: errorMessage(error) });
      return NextResponse.redirect(new URL(`/booking/error?${params}`, request.url), 303);
    }

    return NextResponse.json(
      { error: 'Failed to submit booking', message: errorMessage(error) },
      { status: 500 }
    );
  }
}
