# MIZAN — Architecture & Database Specification
Version: 1.0 | Status: Proposed architecture; validate dependencies before implementation.

## 1. Recommended stack
- Mobile: React Native + Expo Development Build + TypeScript.
- Web readiness: keep domain logic and API contracts platform-neutral; add web client only if required.
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions) as a proposed starting point.
- Local persistence: SQLite for offline-first capture and cached data.
- Server state: typed repository/API layer; do not let UI components query tables ad hoc.
- Native integrations: small, isolated native modules for HealthKit and platform notifications when supported.
- Tests: unit tests, integration tests, end-to-end tests on real/simulated devices.

Do not hardcode package versions in this document. Before setup, inspect current compatibility matrices and pin mutually compatible stable versions.

## 2. Architecture layers
1. Presentation: screens, reusable components, navigation, localization.
2. Application: use cases, validation, orchestration, permission checks.
3. Domain: entities, value objects, business rules, calculations.
4. Data: repositories, remote API, local SQLite, sync queue.
5. Infrastructure: auth, notifications, storage, telemetry, integrations.

UI must not contain critical business logic or direct unrestricted database access.

## 3. Suggested repository structure
```text
mizan/
  apps/mobile/
  packages/domain/
  packages/shared/
  packages/ui/
  supabase/migrations/
  supabase/functions/
  docs/
  tests/
```
If a monorepo creates unnecessary complexity for the first release, use a simpler single app with clear module boundaries.

## 4. Database conventions
- UUID primary keys.
- `user_id` on all user-owned records.
- `created_at`, `updated_at` timestamps.
- Use `archived_at` or explicit status instead of destructive deletion for ordinary archive actions.
- Use `timestamptz` for instants; store timezone identifiers for recurring local schedules.
- Use integer minor units or PostgreSQL numeric for money; never floating point for financial calculations.
- Store units explicitly (kg, cm, minutes, reps, etc.).
- Prefer normalized source tables; create analytics views/materialized views only after measuring need.
- Add indexes for user-scoped queries and common date/status filters.
- Use foreign keys and check constraints.
- Apply Row Level Security to every exposed user-owned table.

## 5. Core schema (logical)
### Identity
- profiles(id = auth user id, display_name, locale, timezone, theme, week_start, created_at, updated_at)
- user_preferences(user_id, key, value_json, updated_at)
- user_devices(id, user_id, platform, device_label, push_token_encrypted, last_seen_at)

### Shared planning
- goals(id, user_id, domain, title, description, status, target_date, metric_json, created_at, updated_at)
- milestones(id, user_id, goal_id, title, status, due_at, sort_order)
- tasks(id, user_id, domain, title, description, status, priority, due_at, estimate_minutes, completed_at)
- task_links(id, user_id, task_id, entity_type, entity_id)
- calendar_events(id, user_id, domain, title, starts_at, ends_at, timezone, all_day, source_type, source_id)
- reminders(id, user_id, domain, title, scheduled_at, timezone, recurrence_json, status, channel, source_type, source_id)
- notifications(id, user_id, domain, title, body, priority, read_at, dismissed_at, created_at)

### DEEN
- prayer_logs(id, user_id, prayer_type, local_date, status, performed_at, note)
- quran_logs(id, user_id, read_at, pages_optional, duration_minutes_optional, note)
- adhkar_logs(id, user_id, category, completed_at, count_optional, note)
- good_deed_logs(id, user_id, category, occurred_at, note)

### FITNESS
- body_measurements(id, user_id, measured_at, weight_kg, height_cm, waist_cm, chest_cm, arm_cm, thigh_cm, body_fat_percent_optional, source, note)
- body_photos(id, user_id, storage_path, captured_at, phase_id_optional, note)
- fitness_phases(id, user_id, phase_type, name, starts_on, ends_on, notes)
- workouts(id, user_id, program_id_optional, started_at, ended_at, status, notes)
- workout_sets(id, user_id, workout_id, exercise_id, set_number, reps, load_value, load_unit, rest_seconds, rpe_optional)
- exercises(id, user_id_nullable_for_catalog, name, primary_muscles, secondary_muscles, equipment, instructions, media_path_optional)
- workout_programs(id, user_id, name, schedule_json, is_active)
- meals(id, user_id, logged_at, meal_type, note)
- food_items(id, user_id_nullable_for_catalog, name, serving_json, nutrition_json, source, confidence)
- meal_items(id, user_id, meal_id, food_item_id_optional, custom_name, quantity, nutrition_snapshot_json)
- hydration_logs(id, user_id, logged_at, amount_ml, beverage_type)

### ACADEMICS
- academic_terms(id, user_id, name, starts_on, ends_on)
- subjects(id, user_id, name, teacher_optional, target_grade_optional, color_optional)
- academic_units(id, user_id, subject_id, name, sort_order)
- lessons(id, user_id, subject_id, unit_id_optional, title, mastery_status, notes)
- assignments(id, user_id, subject_id, title, due_at, status, priority, estimate_minutes, notes)
- exams(id, user_id, subject_id, title, exam_at, max_score, weight_optional)
- grades(id, user_id, subject_id, exam_id_optional, score, max_score, weight_optional, recorded_at)

### BUSINESS
- projects(id, user_id, name, status, client_id_optional, budget_minor_optional, currency, starts_on, due_on)
- clients(id, user_id, name, organization_optional, contact_details_json, status, notes)
- deals(id, user_id, client_id_optional, title, stage, value_minor, currency, probability_optional, expected_close_at)
- transactions(id, user_id, project_id_optional, client_id_optional, direction, amount_minor, currency, occurred_at, status, category, note)
- invoices(id, user_id, client_id_optional, project_id_optional, invoice_number, amount_minor, currency, due_at, status)
- invoice_payments(id, user_id, invoice_id, amount_minor, paid_at, method_optional)

### HABITS
- habits(id, user_id, name, category_id_optional, schedule_json, target_json, status, sort_order)
- habit_categories(id, user_id, name, icon_optional, color_optional, parent_id_optional)
- habit_logs(id, user_id, habit_id, logged_at, status, quantity_optional, duration_minutes_optional, note)
- routines(id, user_id, name, schedule_json, status)
- routine_steps(id, user_id, routine_id, title, sort_order, estimate_minutes_optional)
- routine_logs(id, user_id, routine_id, started_at, completed_at_optional, status)
- routine_step_logs(id, user_id, routine_log_id, routine_step_id, status, completed_at_optional)

### System
- integrations(id, user_id, provider, status, scopes_json, last_sync_at, metadata_json)
- sync_jobs(id, user_id, integration_id_optional, status, started_at, finished_at, error_code_optional)
- audit_logs(id, user_id, action, entity_type, entity_id, occurred_at, metadata_redacted_json)
- reports(id, user_id, report_type, period_start, period_end, generated_at, storage_path_optional, summary_json)

This is a logical schema, not a ready-to-run migration. Resolve exact enums, constraints, indexes, RLS policies, and migration ordering before creating SQL.

## 6. RLS and authorization
For every user-owned table:
- SELECT only where `user_id = auth.uid()`.
- INSERT requires `user_id = auth.uid()`.
- UPDATE requires ownership before and after update.
- DELETE requires ownership and is limited to supported user actions.
- Storage paths must be scoped by user and checked by storage policies.
- Service-role keys must never be shipped in the client.
- Edge Functions must verify JWT and re-check ownership.

## 7. Sensitive data
Prayer records, body photos, measurements, school records, and business finances are private. Do not send these to analytics or AI providers by default. AI access must be purpose-limited, transparent, and opt-in per data domain. Never log raw notes, contact details, tokens, or image contents.

## 8. Migrations and environments
Maintain local, staging, and production environments. Use versioned SQL migrations. Never edit production schema manually without a migration. Seed only clearly labeled development data. Backups must be tested by restoration, not merely assumed to exist.
