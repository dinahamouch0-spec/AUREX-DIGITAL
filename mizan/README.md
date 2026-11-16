# MIZAN | ميزان

A private, premium personal life-management app: **Deen · Fitness · Academics · Business (AUREX) · Habits**, plus a global dashboard, calendar, goals, analytics, notifications, search, settings and an on-device assistant. Arabic (RTL) and English (LTR), dark and light themes, Beirut timezone by default.

Built from the blueprint in [`blueprint/`](blueprint/). **What is done, what is pending, and why** is tracked in [`docs/STATUS.md`](docs/STATUS.md). Read that before relying on any feature.

## Run it

```bash
cd mizan
npm install
npx expo start            # press "w" for web, or scan with a development build on iPhone
```

The app works fully **offline / local-only** with no configuration. To enable accounts and cloud sync, see [`docs/SUPABASE.md`](docs/SUPABASE.md). To install it on an iPhone, see [`docs/IPHONE.md`](docs/IPHONE.md).

## Verify it

| Command | What it checks |
|---|---|
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint (Expo config + React hooks rules) |
| `npm test` | 116 unit tests: dates/DST, money, prayer times, grades, invoices, habits, fitness, goals, forms, notifications plan, store, sync engine, use cases, AI provider, schema⇄DB consistency, i18n parity |
| `npm run test:db` | Applies the migrations to a throwaway PostgreSQL and runs RLS / ownership tests |
| `npm run test:e2e` | Builds the web app and drives real flows in Chromium (151 checks, Arabic + English) |
| `npx expo-doctor` | Expo SDK / dependency health |

## Structure

```
mizan/
  src/app/          screens (Expo Router)       src/domain/     pure business logic (tested)
  src/data/         store, drivers, sync, use cases, Supabase adapter, notifications
  src/ai/           AI provider abstraction     src/integrations/  integration framework (Apple Health slot)
  src/ui/           design system components    src/i18n/       Arabic + English
  supabase/         migrations, RLS tests, edge function
  docs/             status, decisions, iPhone, Supabase, AI, integrations
  tests/            unit tests + e2e smoke test
```

Architecture in one paragraph: screens call **use cases** and a **local-first store**. Every write is persisted synchronously (SQLite on device, localStorage on web) and queued in a durable **outbox**. When Supabase is configured and the user signs in, the **sync engine** pushes the outbox and pulls changes. Conflicting edits are never auto-merged; the user resolves them. Postgres **RLS** enforces ownership server-side. Domain rules (money, grades, prayer times, "not recorded ≠ missed") live in `src/domain` and are unit-tested.
