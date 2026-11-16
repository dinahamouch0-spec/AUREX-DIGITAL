# MIZAN — Implementation status

Legend:
- ✅ **Implemented & tested.** Works now. Covered by unit, DB or e2e tests.
- 🟡 **Implemented. Pending External Setup.** The code is built and tested with stand-ins, but needs something only the owner can provide: an account, keys, or a provider choice.
- 📱 **Implemented. Real Device Validation.** The code is built; behaviour must be verified on a physical iPhone. It is **not** claimed to work until then.
- ⏳ **Not yet implemented.** Nothing in this category is presented as working in the UI.

## Global systems
| Feature | Status | Notes |
|---|---|---|
| Arabic RTL / English LTR, live switch without data loss | ✅ | e2e checks `dir`, every screen scanned for untranslated keys in both languages |
| Dark / light / system theme, semantic tokens | ✅ | `src/theme/tokens.ts` |
| Numerals: Latin or Arabic-Indic | ✅ | applied consistently, including inside templates |
| Onboarding, privacy explanation | ✅ | |
| Home dashboard: greeting, domain cards, quick actions, priorities, timeline, deadlines, goals, insights | ✅ | counts only recorded items; no "life score" |
| Calendar: day/week/month, domain filters, conflict flags, links to source records | ✅ | no duplicated records |
| Goals centre and milestones, per-goal progress only | ✅ | |
| Analytics: 7/30/90 days per domain, data range shown | ✅ | |
| Search across domains with filters | ✅ | |
| In-app notification centre (read / snooze / dismiss), reminders | ✅ | |
| Device notifications (prayer alerts, reminders, quiet hours, follow-ups) | 📱 | Planning logic unit-tested; delivery via `expo-notifications` not yet verified on iPhone |
| Adhan audio | 📱 / ⏳ | Not supported; standard notification sound only (stated in app) |
| Export (JSON, documented conventions) | ✅ | Web download tested; iOS share sheet 📱 |
| Delete all local data (type-to-confirm) | ✅ | e2e tested |
| Account deletion | 🟡 | Edge Function `delete-account` written; deploy + test on Supabase staging |
| Diagnostics (sanitised, no personal data) | ✅ | |
| Undo after delete, confirmation dialogs, loading/empty/error/not-found states | ✅ | |

## Data, backend and security
| Feature | Status | Notes |
|---|---|---|
| Local persistence survives restart | ✅ | web: e2e reload test. iPhone (SQLite) 📱 |
| Durable outbox, retry with backoff + jitter, never discarded | ✅ | unit tests with a fake server |
| Conflict detection, user resolution (finance never auto-merged) | ✅ | unit tests + resolution UI |
| Tombstone deletes | ✅ | |
| Supabase schema: 46 tables, constraints, indexes | ✅ | `npm run test:db` on PostgreSQL 16 |
| RLS on every table: cross-user isolation, spoof/hijack rejected, audit append-only | ✅ | `supabase/tests/rls_test.sql` |
| Every app field has a DB column | ✅ | `tests/schema-sync.test.ts` |
| Supabase Auth (email/password, reset), session in iOS Keychain | 🟡 | Needs a Supabase project + `EXPO_PUBLIC_SUPABASE_*` |
| Live sync against Supabase | 🟡 | Engine tested against a fake server; not yet run against a real project |
| Private photo storage bucket policies | 🟡 | `20261116000100_storage.sql` (needs Supabase storage) |

## DEEN
| Feature | Status |
|---|---|
| Five separate prayer records; one tap = prayed; options: excused / marked missed / clear | ✅ |
| Missing = "not recorded", never auto-missed (also enforced by a DB constraint) | ✅ |
| Correct entries, undo | ✅ |
| History grid (7/30 days) with legend | ✅ |
| Prayer times: on-device Jaʿfari calculation, Beirut default, all parameters and minute adjustments editable, source shown, "please confirm" notice | ✅ calculation · 🟡 **you must confirm values against your marjaʿ / local calendar** |
| Combined alerts (Dhuhr+Asr, Maghrib+Isha), separate records | ✅ logic · 📱 delivery |
| Quran log (no targets), adhkar quick log, tasbih/istighfar counter, good deeds | ✅ |

## FITNESS
| Feature | Status |
|---|---|
| Section tabs: Dashboard / Body / Nutrition / Workout + More | ✅ |
| Body measurements, weight history chart, phases (organisational only) | ✅ |
| Progress photos: private, on-device only, never synced or sent to AI | 📱 (needs photo library on iPhone; hidden on web) |
| Live workout: exercise picker (built-in text catalog + custom), sets/reps/load (kg/lb), finish, history | ✅ |
| PRs, volume, muscle-group split, weekly volume, overload *suggestion* (≥2 sessions, opt-in) | ✅ |
| Programs: editable weekly schedule, rest days, today's plan | ✅ |
| Nutrition: meals, food library, quantities, estimate labels, missing-data warnings, repeat meal; no calorie limits | ✅ |
| External food database | ⏳ / 🟡 (provider not chosen) |
| Hydration quick add, no fixed target | ✅ |
| Recovery self-reports with wellness disclaimer | ✅ |
| Apple Health | 🟡 + 📱: framework and scopes defined, **no fake connection**, see `docs/INTEGRATIONS.md` |

## ACADEMICS
| Feature | Status |
|---|---|
| Terms, subjects, units, lessons, user-set mastery | ✅ |
| Homework with overdue detection, 7-day workload chart | ✅ |
| Exams, grades; average with disclosed formula and method; trend withheld below 3 grades; target gap | ✅ |
| Study planner by week, heavy-day warning, explicit "move to tomorrow" (never automatic) | ✅ |

## BUSINESS / AUREX
| Feature | Status |
|---|---|
| Clients (private contact fields), interaction timeline, follow-ups | ✅ |
| Pipeline by stage, move stage with undo, weighted estimate vs won value, win rate withheld below 5 | ✅ |
| Transactions: income / expense / refunds; planned, pending, cleared | ✅ |
| Invoices + partial payments, overdue/overpaid status, receivables | ✅ |
| USD and LBP never mixed; decimal-safe; LBP decimals rejected (not rounded) | ✅ (unit + e2e) |
| Projects, business tasks | ✅ |
| Audit log for financial/contact changes (no values stored) | ✅ |
| Sending messages / invoices to clients | Deliberately not done (blueprint: no automatic external actions) |

## HABITS & ROUTINES
| Feature | Status |
|---|---|
| One-tap check-in, long-press for partial / skipped / later / detailed log | ✅ |
| Daily / specific weekdays / N-times-per-week schedules | ✅ |
| 30-day summary that never counts unrecorded days as failure; weekly targets | ✅ |
| Routines with ordered steps, per-step history, derived routine status | ✅ |
| Categories | ✅ |

## PERFECT DAYS STREAK 🔥
| Feature | Status |
|---|---|
| User-defined perfect day (habits, routines, planned workout, planned study, tasks due, prayers). No imposed defaults | ✅ |
| Prayers can't be the only criterion (validated in app) | ✅ |
| Not applicable ≠ failure: archived/paused habits, unscheduled days, weekly-target habits, program rest days, days with nothing planned, low-priority tasks | ✅ |
| Pending (never failed) until the day closes at 04:00 next morning; late logging allowed in the grace window | ✅ |
| Immutable closed-day ledger (`perfect_day_results`), append-only in the app **and** in Postgres RLS | ✅ (unit + DB tests) |
| Anti-fake-streak: records created/edited after a day closes don't count; definitions can't be backdated; rest days only for today or later | ✅ |
| Rest / holiday days bridge a streak without counting | ✅ |
| Current streak, start date, longest (with dates), total, history | ✅ |
| Dashboard 🔥 card, detail screen, monthly calendar, month-by-month chart, analytics section | ✅ (e2e) |
| Multi-device: each device seals days independently; the server keeps the first result per day (unique index). A second device's duplicate push is rejected and shown as a failed sync item | 🟡 needs live Supabase validation |
| Device clock: closing uses the device clock; a user who changes the phone's date offline could affect sealing | Known limitation (server-side sealing would close this) |

## Assistant (AI)
| Feature | Status |
|---|---|
| On-device insights with source and confidence labels, per-domain opt-in, off switch | ✅ |
| Proposed actions require confirmation and are audit-logged | ✅ |
| Provider abstraction; minimised context (no sensitive fields, no disabled domains) | ✅ (unit tested) |
| External AI provider (chat, planning drafts) | 🟡: needs a provider choice and a server-side proxy holding the key. See `docs/AI.md` |

## Release
| Item | Status |
|---|---|
| EAS build profiles (development / preview / production), bundle id, encryption flag | ✅ config · 🟡 needs Apple Developer account |
| App icon / splash (provisional black-and-gold balance) | 🟡 final brand assets are an owner decision |
| TestFlight distribution | 🟡 see `docs/IPHONE.md` |
| Privacy policy / terms | ⏳ owner + legal review |
