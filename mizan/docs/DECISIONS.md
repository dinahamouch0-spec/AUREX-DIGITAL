# Decisions log

| # | Decision | Why |
|---|---|---|
| 1 | Single Expo app (`mizan/`) with clear module boundaries instead of a monorepo | Blueprint 02 §3 allows it; less complexity for v1. Domain logic is pure TS and portable |
| 2 | Expo SDK 58, Expo Router, TypeScript strict | Current stable SDK at build time; `expo-doctor` passes |
| 3 | Local-first store: generic `records` table in SQLite (native) / localStorage (web), domain queries in memory | Durable synchronous writes, simple migrations, fast at personal-data scale. The server schema stays normalised |
| 4 | Field names = Postgres column names (snake_case) | Sync needs no mapping layer; enforced by `tests/schema-sync.test.ts` |
| 5 | Money: integer minor units; USD 2 decimals, LBP 0 decimals; no conversion without an explicit, timestamped rate | Blueprint 08 §5; avoids silent rounding |
| 6 | Instants as UTC ISO; calendar days as `YYYY-MM-DD` in the user's IANA timezone (default Asia/Beirut); DST-safe conversion | Blueprint 01 §8 |
| 7 | "Not recorded" = absence of a row; the DB check constraint forbids storing it | Blueprint 05 §2 |
| 8 | Prayer times computed on device with the PrayTimes.org formulation, Jaʿfari preset (16° / 4° / 14°); all values configurable plus per-prayer minute adjustments | No network dependency; authority must still be confirmed by the owner (10 §8) |
| 9 | Notification intent stored separately from delivery; at most 60 scheduled (iOS limit 64) | Blueprint 03 §6 |
| 10 | Preferences are per-device, records sync | Simpler v1; listed as a limitation |
| 11 | RTL via a root `direction` style + explicit text alignment (no `I18nManager.forceRTL`) | Language switches instantly without an app restart |
| 12 | Conflicts are always user-resolved (no last-write-wins) | Safety for finance and sensitive records |
| 13 | Progress photos are local-only (never synced or sent to AI) | Privacy for a minor's body photos; cloud storage bucket policies are prepared for later |
| 14 | Assistant = deterministic on-device insights + provider abstraction | No external AI until the owner chooses a provider |
| 15 | App icon: provisional gold balance on black | Owner to replace with final brand assets |
| 16 | Default language Arabic, dark theme, week starts Monday (changeable) | Owner context |
