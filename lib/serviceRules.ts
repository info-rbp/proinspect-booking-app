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
    durationMinutes: 60,
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
    durationMinutes: 30,
    bufferMinutes: 15,
    autoBookAllowed: true,
    requiresManualReview: false
  }
};

export function getServiceRule(serviceType: ServiceType): ServiceRule {
  return serviceRules[serviceType];
}
