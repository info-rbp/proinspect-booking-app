import { NextRequest, NextResponse } from 'next/server';
import { bookingRequestSchema, createBookingRecord } from '@/lib/bookings';
import { saveBooking } from '@/lib/database';
import { scheduleBooking } from '@/lib/scheduler';

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

    return NextResponse.json(
      { booking: savedBooking, scheduling },
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
