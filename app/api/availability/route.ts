import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRule } from '@/lib/serviceRules';
import { serviceTypes } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const availabilityRequestSchema = z.object({
  serviceType: z.enum(serviceTypes),
  propertyAddress: z.string().min(6),
  preferredDate: z.string().min(10).max(10)
});

type LoadingRuleResult = {
  loadingLabel: 'Standard Hours' | 'Weekday After Hours' | 'Saturday' | 'Sunday' | 'Public Holiday';
  loadingAmount: number;
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

function estimatePlaceholderTravelMinutes(slotIndex: number) {
  // Placeholder until Google Routes is connected. Keeps the API contract stable for the Shopify template.
  return 12 + slotIndex * 4;
}

function buildCandidateSlots(input: z.infer<typeof availabilityRequestSchema>) {
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
    const travelFromPreviousMinutes = estimatePlaceholderTravelMinutes(index);

    return {
      start: toIsoWithPerthOffset(start),
      end: toIsoWithPerthOffset(end),
      serviceType: input.serviceType,
      durationMinutes: rule.durationMinutes,
      bufferMinutes: rule.bufferMinutes,
      loadingLabel: loading.loadingLabel,
      loadingAmount: loading.loadingAmount,
      travelFromPreviousMinutes,
      travelToNextMinutes: null,
      score: 100 - travelFromPreviousMinutes - loading.loadingAmount / 5,
      reason: 'Placeholder availability. Replace with Google Calendar FreeBusy and Google Routes scoring before production.'
    };
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
    const parsed = availabilityRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid availability request', details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const slots = buildCandidateSlots(parsed.data);

    return NextResponse.json(
      {
        serviceType: parsed.data.serviceType,
        propertyAddress: parsed.data.propertyAddress,
        preferredDate: parsed.data.preferredDate,
        slots,
        mode: 'placeholder',
        message: 'Availability API contract is ready. Calendar, Maps and live loading rules still need to be connected.'
      },
      { status: 200, headers: corsHeaders(origin) }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate availability' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
