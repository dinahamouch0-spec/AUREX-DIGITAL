/**
 * Integration framework (blueprint 09 §7–8). Each provider is isolated,
 * declares its scopes, reports status honestly, and can be paused or
 * disconnected. No integration is simulated: a provider that can't run in
 * this build reports `unavailable` with a reason.
 */
export type IntegrationStatus = 'unavailable' | 'not_connected' | 'connected' | 'paused' | 'error';

export interface IntegrationScope {
  id: string;
  /** i18n key */
  labelKey: string;
  access: 'read' | 'write';
}

export interface IntegrationProvider {
  id: string;
  nameKey: string;
  descriptionKey: string;
  scopes: IntegrationScope[];
  /** why it can't be used in this build, as an i18n key (when unavailable) */
  unavailableReasonKey?: string;
  status(): Promise<IntegrationStatus>;
  connect(scopes: string[]): Promise<IntegrationStatus>;
  disconnect(): Promise<void>;
  /** pull data into MIZAN collections; returns counts */
  sync(): Promise<{ imported: number; errors: number }>;
}
