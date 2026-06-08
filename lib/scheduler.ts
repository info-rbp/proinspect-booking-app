import { suggestPlaceholderSlot } from './calendar';
import type { BookingRecord, CandidateSlot } from './types';

export type ScheduleResult = {
  schedulingStatus: 'Not Required' | 'Slot Suggested' | 'Manual Review Required';
  recommendedSlot: CandidateSlot | null;
  reason: string;
};

export async function scheduleBooking(record: BookingRecord): Promise<ScheduleResult> {
  if (record.status === 'Pending Route Review') {
    return {
      schedulingStatus: 'Manual Review Required',
      recommendedSlot: null,
      reason: 'Open For Inspection requests are routed to OFI batch review.'
    };
  }

  if (record.status === 'Manual Review' || record.status === 'Pending Info') {
    return {
      schedulingStatus: 'Manual Review Required',
      recommendedSlot: null,
      reason: `Booking status is ${record.status}. Automated scheduling skipped.`
    };
  }

  const recommendedSlot = await suggestPlaceholderSlot();

  return {
    schedulingStatus: 'Slot Suggested',
    recommendedSlot,
    reason: recommendedSlot.reason
  };
}
