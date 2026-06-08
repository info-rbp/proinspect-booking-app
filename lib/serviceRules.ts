import type { ServiceType } from './types';

export type ServiceRule = {
  serviceType: ServiceType;
  durationMinutes: number;
  bufferMinutes: number;
  autoBookAllowed: boolean;
  requiresManualReview: boolean;
};

export const serviceRules: Record<ServiceType, ServiceRule> = {
  'Property Condition Report': {
    serviceType: 'Property Condition Report',
    durationMinutes: 90,
    bufferMinutes: 30,
    autoBookAllowed: true,
    requiresManualReview: false
  },
  'Routine Inspection': {
    serviceType: 'Routine Inspection',
    durationMinutes: 30,
    bufferMinutes: 15,
    autoBookAllowed: true,
    requiresManualReview: false
  },
  'Exit Inspection': {
    serviceType: 'Exit Inspection',
    durationMinutes: 60,
    bufferMinutes: 30,
    autoBookAllowed: true,
    requiresManualReview: false
  },
  'Maintenance Request': {
    serviceType: 'Maintenance Request',
    durationMinutes: 45,
    bufferMinutes: 20,
    autoBookAllowed: false,
    requiresManualReview: true
  },
  'Insurance Claims Management': {
    serviceType: 'Insurance Claims Management',
    durationMinutes: 90,
    bufferMinutes: 30,
    autoBookAllowed: false,
    requiresManualReview: true
  },
  'Key Installation': {
    serviceType: 'Key Installation',
    durationMinutes: 45,
    bufferMinutes: 15,
    autoBookAllowed: true,
    requiresManualReview: false
  },
  'Open For Inspection': {
    serviceType: 'Open For Inspection',
    durationMinutes: 15,
    bufferMinutes: 15,
    autoBookAllowed: false,
    requiresManualReview: true
  },
  'Other / Not Sure': {
    serviceType: 'Other / Not Sure',
    durationMinutes: 45,
    bufferMinutes: 20,
    autoBookAllowed: false,
    requiresManualReview: true
  }
};

export function getServiceRule(serviceType: ServiceType): ServiceRule {
  return serviceRules[serviceType];
}
