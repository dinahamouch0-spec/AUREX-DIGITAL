# Assistant / AI provider design

## Implemented now
- `LocalInsightsProvider` (`src/ai/provider.ts`): deterministic insights computed on the device from the domains the user allows (Settings → Assistant & privacy). Each insight states its data source and a confidence label (measured / limited pattern / suggestion).
- It may **propose** actions (e.g. "plan a study session for your exam"). Each proposal needs explicit confirmation and is written to the audit log as `ai_action_approved`.
- The assistant has an off switch and per-domain access. Deen is off by default.

## Adding an external provider later (Pending External Setup)
1. Choose a provider and review its data-retention terms (owner decision).
2. Create a **server-side proxy** (e.g. Supabase Edge Function `ai-proxy`) that holds the provider API key in its server environment, verifies the user's JWT, and rate-limits.
3. Implement `AiProvider` (see `ExternalProviderSlot`) to call `EXPO_PUBLIC_AI_PROXY_URL`. Send only `buildAiContext(list, allowedDomains)`. That function already strips fields marked `sensitive` (notes, contact details, measurements, amounts) and drops disabled domains and local-only data (photos).
4. Keep the rule: providers return insights and proposals only. Nothing is changed, deleted or sent without confirmation.

**API keys must never be placed in the app bundle, `EXPO_PUBLIC_*` variables, or this repository.**
