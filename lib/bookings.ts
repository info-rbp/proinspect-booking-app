import { z } from 'zod';
import { getServiceRule } from './serviceRules';
import { serviceTypes, type BookingRecord, type BookingRequest, type BookingStatus } from './types';

export const bookingRequestSchema = z.object({
  serviceType: z.enum(serviceTypes),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(6),
  agency: z.string().optional().default(''),
  propertyAddress: z.string().min(6),
  preferredDate: z.string().optional().default(''),
  preferredWindow: z.string().optional().default(''),
  accessMethod: z.string().optional().default(''),
  occupancyStatus: z.string().optional().default(''),
  signageRequired: z.coerce.boolean().optional().default(false),
  notes: z.string().optional().default('')
});

export function analyseBookingRequest(input: BookingRequest): Pick<BookingRecord, 'status' | 'missingInformation' | 'durationMinutes' | 'bufferMinutes' | 'aiSummary'> {
  const rule = getServiceRule(input.serviceType);
  const missingInformation: string[] = [];

  if (!input.customerName) missingInformation.push('Customer name');
  if (!input.customerEmail) missingInformation.push('Customer email');
  if (!input.customerPhone) missingInformation.push('Customer phone');
  if (!input.propertyAddress) missingInformation.push('Full property address');
  if (!input.accessMethod) missingInformation.push('Access details');

  let status: BookingStatus = 'Ready For Scheduling';

  if (missingInformation.length > 0) {
    status = 'Pending Info';
  } else if (rule.requiresManualReview) {
    status = 'Manual Review';
  }

  const aiSummary = [
    `${input.serviceType} request for ${input.propertyAddress}.`,
    input.preferredDate ? `Preferred date: ${input.preferredDate}.` : '',
    input.preferredWindow ? `Preferred window: ${input.preferredWindow}.` : '',
    input.accessMethod ? `Access: ${input.accessMethod}.` : '',
    status === 'Manual Review' ? 'Manual review required before scheduling.' : ''
  ].filter(Boolean).join(' ');

  return {
    status,
    missingInformation,
    durationMinutes: rule.durationMinutes,
    bufferMinutes: rule.bufferMinutes,
    aiSummary
  };
}

export function createBookingRecord(input: BookingRequest): BookingRecord {
  const analysis = analyseBookingRequest(input);
  const now = new Date().toISOString();

  return {
    id: `PI-${Date.now()}`,
    ...input,
    ...analysis,
    createdAt: now,
    updatedAt: now
  };
}
