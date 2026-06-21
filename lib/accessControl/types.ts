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
export type AccessControlJobStatus = 'Job Draft Created' | 'Completed Pending Shopify Fulfilment' | 'Fulfilled Pending Shopify Integration';
export type PickupRequired = 'Pickup required' | 'No pickup required - lockbox already onsite' | 'No pickup required - ProInspect supplies lockbox';
export type OccupancyStatus = 'Vacant' | 'Tenanted' | 'Owner occupied' | 'Unknown';

export interface LockboxInstallationJobRequest {
  serviceType: 'Lockbox Installation';
  customerName: string; customerEmail: string; customerPhone: string; preferredDate: string;
  installationAddress: string; installationLocationOnProperty: string; occupancyStatus: OccupancyStatus; pickupRequired: PickupRequired;
  pickupAddress?: string; pickupFromName?: string; pickupContactPhone?: string; pickupNotes?: string; accessNotes?: string;
  shopifyCustomerId?: string; shopifyCompanyId?: string; shopifyCompanyLocationId?: string; clientName?: string;
}
export interface AccessControlJob extends LockboxInstallationJobRequest { id: string; status: AccessControlJobStatus; }
