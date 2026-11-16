/**
 * AI provider abstraction.
 *
 * - `LocalInsightsProvider` is the implemented provider: deterministic,
 *   on-device, uses only the domains the user allowed.
 * - External providers (Pending External Setup) must implement `AiProvider`
 *   and call a server-side proxy (e.g. a Supabase Edge Function) that holds
 *   the API key. API keys are NEVER placed in the app or repository.
 * - Every provider receives a minimised context built by `buildAiContext`,
 *   which excludes fields marked `sensitive` and domains the user disabled.
 * - Providers may only PROPOSE actions; execution requires explicit user
 *   confirmation through `ProposedAction` and is audit-logged.
 */
import { Insight, InsightContext, Lists, generateInsights } from '../domain/aggregate';
import { SCHEMAS } from '../domain/schema';
import { COLLECTIONS, COLLECTION_DOMAIN, CollectionName, Domain } from '../domain/types';

export interface ProposedAction {
  id: string;
  kind: 'create_task' | 'create_study_session' | 'open_screen';
  /** human-readable summary shown before the user confirms */
  summaryKey: string;
  params: Record<string, string | number>;
  payload?: Record<string, unknown>;
}

export interface AiAnswer {
  insights: Insight[];
  actions: ProposedAction[];
  /** which collections/time range informed the answer */
  sources: string[];
  providerId: string;
}

export interface AiProvider {
  id: string;
  /** false for providers that need external setup (keys, endpoint, consent) */
  isAvailable(): boolean;
  analyse(list: Lists, ctx: InsightContext): Promise<AiAnswer>;
}

/** Context passed to any external provider: allowed domains only, no sensitive fields. */
export function buildAiContext(list: Lists, allowedDomains: Domain[]): Record<string, Record<string, unknown>[]> {
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const c of COLLECTIONS) {
    const d = COLLECTION_DOMAIN[c];
    if (c === 'audit_logs' || c === 'notifications') continue;
    if (d !== 'general' && !allowedDomains.includes(d)) continue;
    const sensitive = new Set(SCHEMAS[c].fields.filter((f) => f.sensitive).map((f) => f.name));
    out[c] = (list(c as CollectionName) as unknown as Record<string, unknown>[]).map((r) => {
      const copy: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) if (!sensitive.has(k) && !k.startsWith('_') && k !== 'user_id') copy[k] = v;
      return copy;
    });
  }
  return out;
}

export class LocalInsightsProvider implements AiProvider {
  id = 'local';
  isAvailable() {
    return true;
  }
  async analyse(list: Lists, ctx: InsightContext): Promise<AiAnswer> {
    const insights = generateInsights(list, ctx);
    const actions: ProposedAction[] = [];
    for (const i of insights) {
      if (i.id.startsWith('exam-')) {
        actions.push({ id: `plan-${i.id}`, kind: 'create_study_session', summaryKey: 'ai.action.planStudy', params: { name: String(i.params.name) }, payload: { exam_id: i.id.slice(5), title: String(i.params.name) } });
      }
    }
    return { insights, actions, sources: [...new Set(insights.map((i) => i.sourceKey))], providerId: this.id };
  }
}

/**
 * Placeholder slot for a future external provider. It reports itself as
 * unavailable until a server-side proxy URL is configured; it contains no
 * keys and makes no network calls.
 */
export class ExternalProviderSlot implements AiProvider {
  id = 'external';
  constructor(private proxyUrl: string | undefined) {}
  isAvailable() {
    return false; // Pending External Setup: provider choice, data terms, proxy function
  }
  async analyse(): Promise<AiAnswer> {
    throw new Error('external_provider_not_configured');
  }
}

export function getProviders(): AiProvider[] {
  return [new LocalInsightsProvider(), new ExternalProviderSlot(process.env.EXPO_PUBLIC_AI_PROXY_URL)];
}
