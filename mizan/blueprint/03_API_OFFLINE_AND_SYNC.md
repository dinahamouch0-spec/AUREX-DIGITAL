# MIZAN — API, Offline Data & Synchronization
Version: 1.0

## 1. API design
Use a typed service/repository layer. The mobile UI calls use cases, not raw SQL or provider SDKs directly. Validate inputs both client-side and server-side.

Suggested API domains:
- `/profile`
- `/dashboard`
- `/goals`, `/milestones`
- `/tasks`
- `/calendar/events`
- `/notifications`, `/reminders`
- `/deen/*`
- `/fitness/*`
- `/academics/*`
- `/business/*`
- `/habits/*`
- `/analytics/*`
- `/integrations/*`
- `/exports/*`

Exact REST/RPC/Edge Function choices should be made per operation. Prefer simple CRUD for ordinary records and server-side functions for privileged or multi-record operations.

## 2. API conventions
- Authenticated requests only for private data.
- Consistent response envelope and error codes.
- Pagination for lists.
- Filtering by date range, status, domain.
- Idempotency keys for retryable create/payment/sync operations.
- Optimistic concurrency using `updated_at` or version number.
- UTC timestamps in transport; timezone identifier supplied for recurring local schedules.
- Never trust client-supplied `user_id`; derive from authenticated identity.

## 3. Offline-first behaviour
Offline support should prioritize safe capture, not pretend every feature works offline.
- Cache recently used lists and reference data.
- Permit local creation/editing for supported records.
- Store pending mutations in a durable SQLite outbox.
- Assign client-generated UUIDs to new records.
- Display pending/synced/failed state clearly.
- Retry with exponential backoff and jitter.
- Do not silently discard a queued operation.

## 4. Conflict resolution
Default policies:
- Independent new records: merge by UUID.
- Same record edited on two devices: detect conflict and ask user or show a safe resolution screen.
- Append-only logs: preserve both events where valid; do not overwrite history.
- Financial records: never auto-merge conflicting amounts; require review.
- Sensitive records: prefer explicit user resolution.
- Deletions: use tombstones and propagate only after confirmed authorization.

## 5. Sync engine
Each sync job records:
- job id
- user id
- provider/source
- started/finished time
- records attempted/succeeded/failed
- cursor or checkpoint
- sanitized error code
- retry count

Never store access tokens in plaintext logs. Avoid infinite retries. Provide a manual “Sync now” action and a per-integration pause/disconnect control.

## 6. Notifications
Separate notification intent from platform delivery. A reminder may be stored even when OS permission is denied; UI must communicate that it cannot currently be delivered.
- Request permission contextually, not on first launch without explanation.
- Respect quiet hours and user preferences.
- Deduplicate repeated alerts.
- Provide snooze, dismiss, and mark-read where appropriate.
- Do not claim guaranteed delivery.
- For prayer alerts, explain device/platform limitations and test on actual iPhone hardware.

## 7. Export and deletion
Export should produce a documented archive (JSON/CSV, with media manifest where appropriate). Include timezone, units, and schema version. Deletion must revoke sessions/tokens, remove data according to retention rules, and handle backups in accordance with disclosed retention policy.

## 8. Observability
Use structured, privacy-minimized logs. Track crashes, sync failures, and latency without capturing private content. Provide a diagnostics screen that can export sanitized technical logs with user consent.
