import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFreeBusyWindow, type BusyWindow } from '@/lib/calendar';
import { getServiceRule } from '@/lib/serviceRules';
import { serviceTypes, type ServiceType } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const availabilityRequestSchema = z.object({
  serviceType: z.enum(serviceTypes),
  propertyAddress: z.string().min(6),
  preferredDate: z.string().min(10).max(10),
  placeId: z.string().optional(),
  requireCalendar: z.boolean().optional()
});

type AvailabilityRequest = z.infer<typeof availabilityRequestSchema>;

type LoadingLabel = 'Standard Hours' | 'Weekday After Hours' | 'Saturday' | 'Sunday' | 'Public Holiday';

type LoadingRuleResult = {
  loadingLabel: LoadingLabel;
  loadingAmount: number;
};

type AvailabilitySlot = {
  start: string;
  end: string;
  serviceType: ServiceType;
  durationMinutes: number;
  bufferMinutes: number;
  loadingLabel: LoadingLabel;
  loadingAmount: number;
  currencyCode: 'AUD';
  priceAmount: number;
  priceLabel: string;
  travelFromPreviousMinutes: number | null;
  travelToNextMinutes: number | null;
  score: number;
  reason: string;
  calendarVerified?: boolean;
};

const servicePriceMap: Record<ServiceType, Record<LoadingLabel, number>> = {
  'Routine Inspection': {
    'Standard Hours': 50,
    'Weekday After Hours': 57.5,
    Saturday: 62.5,
    Sunday: 67.5,
    'Public Holiday': 75
  },
  'Property Condition Report': {
    'Standard Hours': 150,
    'Weekday After Hours': 172.5,
    Saturday: 187.5,
    Sunday: 202.5,
    'Public Holiday': 225
  },
  'Exit Inspection': {
    'Standard Hours': 150,
    'Weekday After Hours': 150,
    Saturday: 150,
    Sunday: 150,
    'Public Holiday': 150
  }
};

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && origin.includes('myshopify.com') ? origin : '*';

  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store'
  };
}

function classifyLoading(start: Date): LoadingRuleResult {
  const day = start.getDay();
  const hour = start.getHours();

  if (day === 0) {
    return { loadingLabel: 'Sunday', loadingAmount: 75 };
  }

  if (day === 6) {
    return { loadingLabel: 'Saturday', loadingAmount: 50 };
  }

  if (hour < 8 || hour >= 17) {
    return { loadingLabel: 'Weekday After Hours', loadingAmount: 35 };
  }

  return { loadingLabel: 'Standard Hours', loadingAmount: 0 };
}

function toIsoWithPerthOffset(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00+08:00`;
}

function ymdFromDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function dayBounds(preferredDate: string) {
  const [year, month, day] = preferredDate.split('-').map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

  return {
    timeMin: `${preferredDate}T00:00:00+08:00`,
    timeMax: `${ymdFromDate(nextDay)}T00:00:00+08:00`
  };
}

function estimateTravelMinutes(slotIndex: number) {
  return 12 + slotIndex * 4;
}

function formatAud(amount: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

function priceFor(serviceType: ServiceType, loadingLabel: LoadingLabel) {
  return servicePriceMap[serviceType][loadingLabel] ?? servicePriceMap[serviceType]['Standard Hours'];
}

function buildCandidateSlots(input: AvailabilityRequest): AvailabilitySlot[] {
  const rule = getServiceRule(input.serviceType);
  const [year, month, day] = input.preferredDate.split('-').map(Number);
  const slotStarts = [9, 10.5, 12, 13.5, 15, 16.5];

  return slotStarts.map((hourValue, index) => {
    const wholeHour = Math.floor(hourValue);
    const minute = hourValue % 1 === 0 ? 0 : 30;
    const start = new Date(year, month - 1, day, wholeHour, minute, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + rule.durationMinutes);

    const loading = classifyLoading(start);
    const travelFromPreviousMinutes = estimateTravelMinutes(index);
    const priceAmount = priceFor(input.serviceType, loading.loadingLabel);

    return {
      start: toIsoWithPerthOffset(start),
      end: toIsoWithPerthOffset(end),
      serviceType: input.serviceType,
      durationMinutes: rule.durationMinutes,
      bufferMinutes: rule.bufferMinutes,
      loadingLabel: loading.loadingLabel,
      loadingAmount: loading.loadingAmount,
      currencyCode: 'AUD',
      priceAmount,
      priceLabel: formatAud(priceAmount),
      travelFromPreviousMinutes,
      travelToNextMinutes: null,
      score: 100 - travelFromPreviousMinutes - loading.loadingAmount / 5,
      reason: 'Candidate slot pending calendar verification.'
    };
  });
}

function overlapsBusyWindow(slot: AvailabilitySlot, busyWindow: BusyWindow) {
  const slotStart = new Date(slot.start).getTime() - slot.bufferMinutes * 60_000;
  const slotEnd = new Date(slot.end).getTime() + slot.bufferMinutes * 60_000;
  const busyStart = new Date(busyWindow.start).getTime();
  const busyEnd = new Date(busyWindow.end).getTime();

  return slotStart < busyEnd && slotEnd > busyStart;
}

function filterCalendarAvailableSlots(slots: AvailabilitySlot[], busy: BusyWindow[]) {
  return slots
    .filter((slot) => !busy.some((busyWindow) => overlapsBusyWindow(slot, busyWindow)))
    .map((slot) => ({
      ...slot,
      calendarVerified: true,
      reason: 'Google Calendar checked. No overlapping event found for this slot.'
    }));
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
    const parsed = availabilityRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid availability request', details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const candidateSlots = buildCandidateSlots(parsed.data);
    const { timeMin, timeMax } = dayBounds(parsed.data.preferredDate);

    const calendarWindow = await getFreeBusyWindow({
      timeMin,
      timeMax,
      timeZone: 'Australia/Perth'
    });

    const slots = filterCalendarAvailableSlots(candidateSlots, calendarWindow.busy);

    return NextResponse.json(
      {
        serviceType: parsed.data.serviceType,
        propertyAddress: parsed.data.propertyAddress,
        placeId: parsed.data.placeId ?? null,
        preferredDate: parsed.data.preferredDate,
        slots,
        mode: 'calendar',
        calendarConnected: calendarWindow.connected,
        calendarId: calendarWindow.calendarId,
        busyCount: calendarWindow.busy.length,
        message: 'Live Google Calendar availability calculated.'
      },
      { status: 200, headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error('Failed to calculate calendar availability', error);

    return NextResponse.json(
      {
        error: 'Failed to calculate availability',
        calendarConnected: false,
        mode: 'calendar_error',
        message: error instanceof Error ? error.message : 'Unknown calendar availability error'
      },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
