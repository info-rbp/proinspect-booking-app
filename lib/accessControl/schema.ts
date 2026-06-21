import { z } from 'zod';

const requiredString = z.string().trim().min(1);
export const lockboxInstallationJobSchema = z.object({
  serviceType: z.literal('Lockbox Installation'),
  customerName: requiredString, customerEmail: z.string().trim().email(), customerPhone: requiredString, preferredDate: requiredString,
  installationAddress: requiredString, installationLocationOnProperty: requiredString,
  occupancyStatus: z.enum(['Vacant', 'Tenanted', 'Owner occupied', 'Unknown']),
  pickupRequired: z.enum(['Pickup required', 'No pickup required - lockbox already onsite', 'No pickup required - ProInspect supplies lockbox']),
  pickupAddress: z.string().trim().optional(), pickupFromName: z.string().trim().optional(), pickupContactPhone: z.string().trim().optional(), pickupNotes: z.string().trim().optional(), accessNotes: z.string().trim().optional(),
  shopifyCustomerId: z.string().trim().optional(), shopifyCompanyId: z.string().trim().optional(), shopifyCompanyLocationId: z.string().trim().optional(), clientName: z.string().trim().optional()
}).superRefine((value, ctx) => {
  if (value.pickupRequired === 'Pickup required') {
    if (!value.pickupAddress) ctx.addIssue({ code: 'custom', path: ['pickupAddress'], message: 'Pickup address is required when pickup is required.' });
    if (!value.pickupFromName) ctx.addIssue({ code: 'custom', path: ['pickupFromName'], message: 'Pickup contact name is required when pickup is required.' });
  }
});

export const accessControlJobsRequestSchema = z.object({ jobs: z.array(lockboxInstallationJobSchema).nonempty() });
export const fulfilAccessControlJobSchema = z.object({
  shopifyOrderNumber: requiredString, installedLocation: requiredString, lockboxCode: requiredString, completionNotes: z.string().trim().optional(), completedBy: requiredString, completedDate: requiredString, photoUrls: z.array(z.string().url()).optional()
});
