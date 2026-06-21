export const accessControlProductTypes = [
  'Lockbox Installation',
  'Lockbox Removal / Relocation',
  'Key Collection & Return Service',
  'Key Cutting & Tagging',
  'Off-Site Key Storage',
  'Property Access Setup Service',
  'Key Audit & Register Update'
] as const;

export type AccessControlProductType = (typeof accessControlProductTypes)[number];

export type AccessControlJobStatus =
  | 'Job Draft Created'
  | 'Order Received'
  | 'Ready To Schedule'
  | 'Scheduled'
  | 'Completed Pending Shopify Fulfilment'
  | 'Fulfilled'
  | 'Failed';

export type PickupRequired =
  | 'Pickup required'
  | 'No pickup required - lockbox already onsite'
  | 'No pickup required - ProInspect supplies lockbox';

export type OccupancyStatus = 'Vacant' | 'Tenanted' | 'Owner occupied' | 'Unknown';

export type AccessControlLocationInput = {
  locationType: 'pickup' | 'installation' | 'source' | 'destination' | 'return' | 'storage' | 'audit';
  address?: string;
  contactName?: string;
  contactPhone?: string;
  instructions?: string;
  locationOnProperty?: string;
};

export type AccessControlJobRequest = {
  serviceType: AccessControlProductType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredDate?: string;
  shopifyCustomerId?: string;
  shopifyCompanyId?: string;
  shopifyCompanyLocationId?: string;
  clientName?: string;
  accessNotes?: string;
  notes?: string;
  payload?: Record<string, unknown>;
  locations?: AccessControlLocationInput[];
};

export type AccessControlJob = AccessControlJobRequest & {
  id: string;
  status: AccessControlJobStatus;
  createdAt?: string;
  updatedAt?: string;
};
