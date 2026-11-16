# MIZAN — Product Overview & Master Specification
Version: 1.0 | Status: Implementation baseline | Product owner: User

## 1. Product vision
MIZAN is a private personal life-management system that brings five life domains into one coherent command center:
- DEEN
- FITNESS
- ACADEMICS
- BUSINESS / AUREX
- HABITS & ROUTINES

It is a practical tool for recording, planning, reviewing, and improving. It must never score a person's worth, faith, health, or identity.

## 2. Product principles
1. User control: recommendations never silently change important user data.
2. Honest records: unknown/unlogged is not equivalent to missed/failed.
3. Data ownership: private by default; export and deletion must be supported.
4. Useful simplicity: advanced capability behind clear progressive disclosure.
5. Cross-domain awareness: shared calendar, goals, notifications, and analytics without duplicating source records.
6. Evidence-aware intelligence: distinguish measured facts, estimates, and AI suggestions.
7. Mobile-first: optimize for iPhone while keeping architecture portable.
8. Accessibility: readable contrast, dynamic text where feasible, keyboard/screen-reader support.
9. Localization: Arabic and English, complete RTL/LTR support, Beirut timezone default.
10. No dark patterns: no guilt, manipulative streak loss, or punitive notifications.

## 3. Users and scope
Initial product is a single-user personal app. Design data ownership so multi-user support could be added later, but do not build social feeds, public profiles, leaderboards, or shared accounts in v1.

The owner is a secondary-school student. Fitness and nutrition features must be supportive and non-restrictive: no aggressive cutting, calorie-deficit prescriptions, body-fat fixation, medical diagnosis, or unsafe training advice. Encourage parent/qualified-professional involvement for significant health or diet changes.

## 4. Information architecture
Primary navigation:
- Home
- Calendar
- Analytics
- Goals
- Sections
- Settings

Sections contains DEEN, FITNESS, ACADEMICS, BUSINESS, HABITS. AI assistant is accessible globally but respects permissions.

## 5. Global dashboard
The adaptive command center includes:
- Greeting and date
- Today summary
- Today's priorities
- Domain cards for all five sections
- Calendar/timeline preview
- Upcoming deadlines
- Goals and milestones preview
- Smart insights with confidence/source labels
- Quick actions
- Unified notifications preview
- Morning overview and evening review, configurable

Daily completion summaries may count only explicitly trackable records. Never create a combined “life score” that equates prayer, grades, health, and revenue.

## 6. Shared concepts
- Goal: user-defined desired outcome, optionally associated with a domain.
- Milestone: measurable intermediate step.
- Task: actionable item with status, priority, due date, and optional links.
- Event: time-based calendar item.
- Reminder: notification intent, subject to platform permission.
- Log: immutable-ish historical record with correction support and audit trail for sensitive changes.
- Insight: derived observation with supporting data and confidence.
- Integration: external connection with granular scopes and sync state.

## 7. Status conventions
Use explicit states where applicable:
- Not started
- In progress
- Completed
- Skipped
- Deferred
- Paused
- Archived

Do not infer a negative outcome from absence of a record. For example, an unlogged prayer is “not recorded”, not “missed”.

## 8. Product-wide requirements
- Every list has loading, empty, error, and populated states.
- Forms validate inputs and show actionable errors.
- Destructive actions require confirmation and offer undo where possible.
- Dates are stored consistently (UTC timestamps plus relevant local timezone where needed); display in user's configured timezone.
- Currency values use decimal-safe representation and explicit currency codes.
- Analytics explain the time range and source data.
- Search spans permitted records and supports domain filters.
- Export includes user data in documented formats.
- Account deletion has a clear, secure workflow.
- No fake sample data in production; demo data must be clearly labeled.

## 9. MVP vs later
MVP:
- Authentication and profile
- Core dashboard and navigation
- Manual record creation/editing
- All five section foundations
- Shared calendar, goals, reminders, basic analytics
- Secure persistence, export, backup strategy
- Offline-tolerant local capture and safe sync

Later:
- Advanced AI agent actions
- Broad third-party integrations
- Complex predictive analytics
- Multi-device conflict resolution beyond core cases
- Public distribution and subscription/business model

## 10. Definition of done
A feature is done only when:
- UI states are implemented
- Validation and authorization are enforced server-side
- Data persists across app restarts
- Tests cover core success and failure cases
- Accessibility and RTL/LTR are checked
- Errors are observable without exposing private content
- No placeholder button or misleading “success” state remains
