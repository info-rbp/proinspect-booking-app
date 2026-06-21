import { z } from 'zod';

const requiredString = z.string().trim().min(1);
const optionalString = z.string().trim().optional().default('');
const customerFields = {
  customerName: requiredString,
  customerEmail: z.string().trim().email(),
  customerPhone: requiredString,
  preferredDate: requiredString,
  shopifyCustomerId: optionalString,
  shopifyCompanyId: optionalString,
  shopifyCompanyLocationId: optionalString,
  clientName: optionalString,
  accessNotes: optionalString,
  notes: optionalString
};

const pickupRequiredValues = [
  'Pickup required',
  'No pickup required - lockbox already onsite',
  'No pickup required - ProInspect supplies lockbox'
] as const;

const occupancyValues = ['Vacant', 'Tenanted', 'Owner occupied', 'Unknown'] as const;

export const lockboxInstallationJobSchema = z.object({
  serviceType: z.literal('Lockbox Installation'),
  ...customerFields,
  installationAddress: requiredString,
  installationLocationOnProperty: requiredString,
  occupancyStatus: z.enum(occupancyValues),
  pickupRequired: z.enum(pickupRequiredValues),
  pickupAddress: optionalString,
  pickupFromName: optionalString,
  pickupContactPhone: optionalString,
  pickupNotes: optionalString
}).superRefine((value, ctx) => {
  if (value.pickupRequired === 'Pickup required') {
    if (!value.pickupAddress) ctx.addIssue({ code: 'custom', path: ['pickupAddress'], message: 'Pickup address is required when pickup is required.' });
    if (!value.pickupFromName) ctx.addIssue({ code: 'custom', path: ['pickupFromName'], message: 'Pickup contact name is required when pickup is required.' });
  }
});

export const lockboxRemovalRelocationJobSchema = z.object({
  serviceType: z.literal('Lockbox Removal / Relocation'),
  ...customerFields,
  actionType: z.enum(['Removal only', 'Relocation at same property', 'Relocation to another property']),
  currentPropertyAddress: requiredString,
  currentLockboxLocation: requiredString,
  lockboxCode: optionalString,
  returnOrDisposalInstruction: optionalString,
  newLocationOnProperty: optionalString,
  destinationPropertyAddress: optionalString,
  destinationLocationOnProperty: optionalString
}).superRefine((value, ctx) => {
  if (value.actionType === 'Relocation at same property' && !value.newLocationOnProperty) {
    ctx.addIssue({ code: 'custom', path: ['newLocationOnProperty'], message: 'New location on property is required for same-property relocation.' });
  }
  if (value.actionType === 'Relocation to another property') {
    if (!value.destinationPropertyAddress) ctx.addIssue({ code: 'custom', path: ['destinationPropertyAddress'], message: 'Destination property address is required.' });
    if (!value.destinationLocationOnProperty) ctx.addIssue({ code: 'custom', path: ['destinationLocationOnProperty'], message: 'Destination lockbox location is required.' });
  }
});

export const keyCollectionReturnJobSchema = z.object({
  serviceType: z.literal('Key Collection & Return Service'),
  ...customerFields,
  movementType: z.enum(['Collect keys', 'Return keys', 'Collect and return keys', 'Move keys from one location to another']),
  propertyAddress: requiredString,
  keySetDescription: requiredString,
  collectionAddress: optionalString,
  collectionContactName: optionalString,
  collectionContactPhone: optionalString,
  collectionInstructions: optionalString,
  returnAddress: optionalString,
  returnContactName: optionalString,
  returnContactPhone: optionalString,
  returnInstructions: optionalString,
  authorisedBy: requiredString
}).superRefine((value, ctx) => {
  if (['Collect keys', 'Collect and return keys', 'Move keys from one location to another'].includes(value.movementType) && !value.collectionAddress) {
    ctx.addIssue({ code: 'custom', path: ['collectionAddress'], message: 'Collection address is required.' });
  }
  if (['Return keys', 'Collect and return keys', 'Move keys from one location to another'].includes(value.movementType) && !value.returnAddress) {
    ctx.addIssue({ code: 'custom', path: ['returnAddress'], message: 'Return/drop-off address is required.' });
  }
});

export const keyCuttingTaggingJobSchema = z.object({
  serviceType: z.literal('Key Cutting & Tagging'),
  ...customerFields,
  keyReceiptMethod: z.enum(['Client will drop keys off', 'ProInspect to collect keys', 'Keys already held by ProInspect']),
  propertyAddress: requiredString,
  keyType: requiredString,
  numberOfCopies: requiredString,
  taggingInstructions: requiredString,
  collectionAddress: optionalString,
  returnOrStorageInstructions: requiredString
}).superRefine((value, ctx) => {
  if (value.keyReceiptMethod === 'ProInspect to collect keys' && !value.collectionAddress) {
    ctx.addIssue({ code: 'custom', path: ['collectionAddress'], message: 'Collection address is required when ProInspect collects keys.' });
  }
});

export const offSiteKeyStorageJobSchema = z.object({
  serviceType: z.literal('Off-Site Key Storage'),
  ...customerFields,
  storageAction: z.enum(['Store new key set', 'Update stored key set', 'Retrieve stored key set', 'End storage and return keys']),
  propertyAddress: requiredString,
  keyInventory: requiredString,
  handoverOrCollectionLocation: requiredString,
  authorisedContacts: requiredString,
  storageInstructions: optionalString
});

export const propertyAccessSetupJobSchema = z.object({
  serviceType: z.literal('Property Access Setup Service'),
  ...customerFields,
  propertyAddress: requiredString,
  setupTasks: z.array(requiredString).min(1),
  currentAccessDetails: requiredString,
  occupancyStatus: z.enum(occupancyValues)
});

export const keyAuditRegisterUpdateJobSchema = z.object({
  serviceType: z.literal('Key Audit & Register Update'),
  ...customerFields,
  auditScope: z.enum(['Single property', 'Multiple properties', 'Key cabinet / agency office', 'Rent roll takeover', 'Existing key register cleanup']),
  propertyOrPortfolioDetails: requiredString,
  currentRegisterLink: optionalString,
  outputRequired: requiredString
});

export const accessControlJobSchema = z.union([
  lockboxInstallationJobSchema,
  lockboxRemovalRelocationJobSchema,
  keyCollectionReturnJobSchema,
  keyCuttingTaggingJobSchema,
  offSiteKeyStorageJobSchema,
  propertyAccessSetupJobSchema,
  keyAuditRegisterUpdateJobSchema
]);

export const accessControlJobsRequestSchema = z.object({ jobs: z.array(accessControlJobSchema).nonempty() });

export const fulfilAccessControlJobSchema = z.object({
  shopifyOrderNumber: requiredString,
  installedLocation: requiredString,
  lockboxCode: requiredString,
  completionNotes: optionalString,
  completedBy: requiredString,
  completedDate: requiredString,
  photoUrls: z.array(requiredString).optional().default([])
});

export const accessControlJobSearchSchema = z.object({
  q: z.string().trim().optional().default(''),
  status: z.string().trim().optional().default('')
});
