# MIZAN — HABITS, GLOBAL SYSTEMS & AI Specification
Version: 1.0

## PART A — HABITS & ROUTINES

### 1. Habit tracking
Hybrid logging:
- one-tap check-in
- optional detailed log
- duration, quantity, time, completion level, note
- statuses: completed, partial, skipped, deferred, paused, not recorded

Do not treat missing logs as failure.

### 2. Categories and organization
Custom categories, folders/groups, sorting, filters, colors/icons, archive, and links to DEEN/FITNESS/ACADEMICS/BUSINESS and goals.

### 3. Analytics
Completion and consistency trends, time-of-day patterns, weekly/monthly reports, comparisons, routine effectiveness, and correlations only where supported by adequate data. Correlation is not causation. No shame language.

### 4. Routines
Multiple routines (morning/evening/custom), ordered steps, optional durations, templates, progress, skip/defer, history, and suggestions requiring approval.

### 5. Goals and challenges
User-defined goals with suggested milestones, flexible weekly/monthly targets, difficulty, progress, history, and approval before changes.

### 6. Notifications
Custom reminders, snooze, quiet hours, priority, frequency throttling, routine alerts, and notification history. Avoid notification fatigue.

### 7. Integrations
Internal links across MIZAN sections. External connections where technically supported. Hybrid sync: automatic for safe approved scopes, manual control, conflict detection, explicit approval for sensitive actions.

### 8. Integration control and security
Cards view, reorder/favorites/hide/filter/search. Advanced permissions per provider/data type. Maximum security posture: encrypted tokens, least privilege, session control, audit logs, anomaly alerts, revoke access, emergency stop. Smart approval for new data sharing, permission changes, deletion/disconnect, or unusual sensitive operations.

### 9. Reports schedule
Default suggested schedule:
- Daily evening review
- Weekly Sunday review
- Monthly first day of new month
Delivery time configurable; notifications are subject to OS permissions.

## PART B — GLOBAL SYSTEMS

### 10. Global calendar
Unified view of:
- prayer reminders
- workouts
- exams and assignments
- business meetings/tasks
- habits and routines
- goals and deadlines

Support day/week/month/timeline, filters, conflict detection, and suggestions. Source records remain in their own domain tables; calendar events may reference them rather than duplicate them.

### 11. Unified notifications
Channels: DEEN, FITNESS, ACADEMICS, BUSINESS, HABITS, SYSTEM, AI.
Features: priority, quiet hours, grouping, deduplication, history, snooze, dismiss, mark read, per-channel controls. Respect OS permission state.

### 12. Goals center
Unified goals list with domain filters, milestones, due dates, progress, and linked source records. Do not aggregate incompatible goals into a single score.

### 13. Analytics and reports
Daily/weekly/monthly/quarterly/yearly reporting. Domain-specific metrics, comparisons, trends, data-quality labels, export to PDF/CSV where implemented. Never equate religious, academic, health, and financial performance into one life score.

### 14. Search and quick actions
Search permitted records across domains with filters and clear result types. Quick actions for common logs and task creation. Respect privacy and domain permissions.

### 15. Settings
- profile and language
- timezone and date/time format
- theme and accessibility
- notification preferences
- privacy and security
- sessions/devices
- integrations and permissions
- data export/delete
- backup/restore status
- help and diagnostics

## PART C — AI PERSONAL ASSISTANT

### 16. AI capabilities
- daily planning
- workload analysis
- schedule conflict detection
- progress summaries
- pattern discovery
- report drafting
- answering questions about authorized MIZAN data
- suggestions for next actions

### 17. AI safety and permissions
- Explicit opt-in per data domain.
- Minimize data sent to external AI services.
- Explain which records/time range informed an insight.
- Mark estimates and confidence.
- No diagnosis, financial advice guarantees, religious rulings, or fabricated predictions.
- No delete, send, purchase, financial, or goal-changing action without confirmation.
- Keep an audit trail of AI-proposed and user-approved actions.
- Provide AI off switch and data access controls.

### 18. Acceptance criteria
- Habits support quick and detailed logging.
- Routine steps retain their own completion history.
- Global calendar shows linked source records without duplicate edits.
- Notification preferences and quiet hours are respected.
- AI cannot access disabled domains.
- AI suggestions never execute sensitive actions without approval.
