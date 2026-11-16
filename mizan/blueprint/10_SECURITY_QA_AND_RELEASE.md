# MIZAN — Security, QA, Delivery & Release Plan
Version: 1.0

## 1. Security baseline
- Enforce Row Level Security on every private table.
- Never ship service-role credentials or provider secrets in the app.
- Use secure device storage for refresh tokens where supported.
- Encrypt sensitive data in transit and at rest using platform/provider capabilities.
- Use least-privilege integration scopes.
- Validate every privileged operation server-side.
- Rate-limit authentication and sensitive endpoints.
- Protect file storage with private buckets and signed, short-lived access where appropriate.
- Keep audit logs minimal and redact sensitive values.
- Provide session revocation and account recovery.
- Define backup retention and deletion behaviour transparently.

## 2. Privacy requirements
Private by default. No public profiles, public sharing, or sale of personal data. Do not include private notes, photos, health, school, religious, or financial records in crash logs or analytics. External AI and integrations are opt-in and scope-limited.

## 3. Testing strategy
### Unit tests
- date/time and timezone utilities
- grade calculations
- financial arithmetic and currency handling
- nutrition unit conversions
- habit recurrence and completion states
- goal progress calculations
- permission decisions

### Integration tests
- authentication and ownership
- RLS policies
- CRUD for every domain
- sync queue and retry
- conflict handling
- file upload/download authorization
- reminder scheduling state
- export and deletion

### End-to-end tests
- onboarding and sign-in
- create/edit/delete ordinary record
- log prayer independently
- record workout set and meal
- create assignment and grade
- create client/deal/transaction
- habit and routine completion
- offline capture then sync
- language switch Arabic/English
- dark/light theme
- permission denied paths

### Device testing
Test on real iPhone hardware for:
- local notifications
- background behaviour
- audio limitations
- HealthKit authorization and data access
- safe-area and keyboard behaviour
- offline/reconnect
- app lifecycle and persistence

## 4. Quality gates
A release candidate must have:
- no critical/high unresolved security defects
- no cross-user data access
- no data loss in supported offline workflows
- verified financial calculations
- tested export and deletion
- no dead buttons or fake success states
- all screens have empty/loading/error states
- Arabic RTL and English LTR smoke tests
- crash-free test sessions at acceptable level
- documented known limitations

## 5. Delivery phases
1. Foundation: repo, environments, auth, database migrations, design tokens, navigation, local storage.
2. Domain foundations: DEEN, FITNESS, ACADEMICS, BUSINESS, HABITS.
3. Global systems: dashboard, calendar, goals, notifications, search, analytics.
4. AI layer: opt-in context, insight generation, confirmation workflow.
5. Integrations: Apple Health, calendar, notifications, other providers after feasibility review.
6. QA and hardening: RLS, offline/sync, device testing, accessibility, performance.
7. Release: internal beta, feedback, fixes, store readiness.

## 6. Claude Code working agreement
Claude Code must:
- Read all ten blueprint files before implementation.
- Inspect the existing repository before modifying it.
- Produce a short implementation plan and identify ambiguities.
- Build one phase at a time.
- Create migrations and tests alongside features.
- Never claim an integration works without running it on the required platform.
- Never leave placeholder controls presented as functional.
- Keep secrets out of source control.
- Run lint, typecheck, unit, integration, and relevant E2E tests.
- Report changed files, commands run, test results, limitations, and next steps.
- Stop before destructive production operations and request explicit approval.

## 7. Release checklist
- [ ] App identity, bundle IDs, signing, environments configured
- [ ] Privacy policy and terms drafted and reviewed
- [ ] Permissions requested contextually
- [ ] Database migrations applied to staging
- [ ] RLS policies tested
- [ ] Backups and restore tested
- [ ] Export and deletion tested
- [ ] Crash reporting privacy reviewed
- [ ] iPhone real-device testing complete
- [ ] Store assets and metadata prepared
- [ ] Known limitations documented
- [ ] Production release approved by owner

## 8. Important unresolved implementation decisions
Do not guess these silently:
- Exact Ja'fari prayer-time authority/calculation adjustments.
- Whether the first release is private sideload/TestFlight or public App Store.
- Final AI provider, data-retention terms, and opt-in UX.
- Exact integration providers and scopes.
- Final visual assets, app icon, and brand typography.
- Whether a separate web client is required for v1.

The product owner has delegated ordinary design and technical defaults. Ask only when a decision materially affects privacy, cost, legal obligations, platform capability, or irreversible behaviour.
