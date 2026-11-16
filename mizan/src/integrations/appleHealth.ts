/**
 * Apple Health (HealthKit) provider — NOT IMPLEMENTED IN THIS BUILD.
 *
 * Status: Pending External Setup + Real Device Validation.
 * HealthKit requires a native module, the HealthKit entitlement, usage
 * descriptions in Info.plist, and testing on a physical iPhone. A web build
 * or Expo Go cannot access it. See docs/INTEGRATIONS.md for the plan.
 *
 * This provider never fabricates data: it reports `unavailable`.
 */
import type { IntegrationProvider } from './types';

export const appleHealth: IntegrationProvider = {
  id: 'apple_health',
  nameKey: 'int.appleHealth',
  descriptionKey: 'int.appleHealth.desc',
  scopes: [
    { id: 'body_mass', labelKey: 'int.scope.weight', access: 'read' },
    { id: 'height', labelKey: 'int.scope.height', access: 'read' },
    { id: 'step_count', labelKey: 'int.scope.steps', access: 'read' },
    { id: 'sleep_analysis', labelKey: 'int.scope.sleep', access: 'read' },
    { id: 'workouts', labelKey: 'int.scope.workouts', access: 'read' },
    { id: 'dietary_water', labelKey: 'int.scope.water', access: 'read' },
  ],
  unavailableReasonKey: 'int.appleHealth.unavailable',
  async status() {
    return 'unavailable';
  },
  async connect() {
    return 'unavailable';
  },
  async disconnect() {},
  async sync() {
    return { imported: 0, errors: 0 };
  },
};

export const INTEGRATIONS: IntegrationProvider[] = [appleHealth];
