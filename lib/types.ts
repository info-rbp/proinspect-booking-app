export const bookingStatuses = [
  'Pending Info',
  'Ready For Scheduling',
  'Pending Route Review',
  'Manual Review',
  'Confirmed',
  'Cancelled',
  'Completed',
  'Failed'
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export const serviceTypes = [
  'Property Condition Report',
  'Routine Inspection',
  'Exit Inspection',
  'Maintenance Request',
  'Insurance Claims Management',
  'Key Installation',
  'Open For Inspection',
  'Other / Not Sure'
] as const;

export type ServiceType = (typeof serviceTypes)[number];

export type BookingRequest = {
  serviceType: ServiceType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  agency?: string;
  propertyAddress: string;
  preferredDate?: string;
  preferredWindow?: string;
  accessMethod?: string;
  occupancyStatus?: string;
  signageRequired?: boolean;
  notes?: string;
};

export type BookingRecord = BookingRequest & {
  id: string;
  status: BookingStatus;
  missingInformation: string[];
  durationMinutes: number;
  bufferMinutes: number;
  aiSummary: string;
  createdAt: string;
  updatedAt: string;
};

export type CandidateSlot = {
  start: string;
  end: string;
  score: number;
  reason: string;
};
