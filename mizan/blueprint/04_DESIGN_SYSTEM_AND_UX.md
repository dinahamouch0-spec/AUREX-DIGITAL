# MIZAN — Design System & UX Specification
Version: 1.0

## 1. Visual direction
Premium, calm, focused, and functional. Default dark theme with black/charcoal surfaces, restrained gold accents, and high-contrast text. Gold is an accent, not a background for large text blocks. Provide a complete light theme.

## 2. Design tokens
Create semantic tokens rather than hardcoding colors:
- background / surface / elevated surface
- primary text / secondary text / muted text
- accent / accent-muted
- success / warning / danger / info
- border / divider / focus ring

Gold should not be the only indicator of state. Pair color with text/icon. Meet WCAG contrast targets where feasible.

## 3. Typography
Use a readable font stack with strong Arabic and Latin coverage. Establish consistent type scale, line heights, weights, and numeric typography. Test Arabic numerals and Latin numerals. Avoid tiny labels.

## 4. Layout
- Mobile-first single-column layouts.
- Responsive grids on larger screens.
- Safe-area aware.
- Thumb-friendly controls.
- Consistent spacing and corner radius.
- Avoid excessive cards nested inside cards.
- Use charts only when they add insight; always label axes and date ranges.

## 5. Navigation
Bottom navigation: Home, Calendar, Analytics, Goals, Sections, Settings (adapt to platform space; if six items are too crowded, use five primary items and place Settings in profile/menu). Sections provides entry to the five domains. Preserve navigation state where appropriate.

## 6. Shared components
- AppHeader
- BottomNavigation
- SectionHeader
- MetricCard
- ProgressIndicator
- EmptyState
- ErrorState
- LoadingSkeleton
- SearchField
- FilterChips
- DateRangePicker
- FormField
- ConfirmationDialog
- ReminderEditor
- TimelineItem
- InsightCard
- ChartCard
- RecordStatusBadge
- OfflineSyncIndicator

Components need documented props, variants, and accessibility labels.

## 7. Interaction patterns
- One-tap logging for frequent actions.
- Advanced detail forms are optional.
- Autosave only when safe and visibly indicated.
- Confirm destructive operations.
- Undo for reversible changes.
- Do not use streak-loss shame language.
- Empty states explain the next useful action.
- Forms preserve user input after validation errors.

## 8. Arabic and RTL
- Full RTL layout mirroring, not just right-aligned text.
- Correct icon direction where semantic.
- Localized date/time/number/currency formatting.
- Mixed Arabic/English content must remain readable.
- Test long Arabic labels, pluralization, and text expansion.
- User can switch language without losing data.

## 9. Accessibility
Support dynamic font scaling, screen readers, visible focus, large touch targets, reduced motion, and non-color status cues. Charts require text summaries or accessible data tables.

## 10. Screen inventory
Global:
- Onboarding
- Sign in / sign up / recovery
- Home dashboard
- Global calendar
- Goals list/detail
- Analytics overview
- Notifications center
- Search
- AI assistant
- Settings / profile / privacy / integrations

Each domain:
- Overview dashboard
- List screen
- Detail screen
- Create/edit form
- History/log screen
- Analytics screen
- Domain settings

## 11. Required UI states
Every screen must implement loading, empty, populated, error, offline, permission-denied, and (where applicable) sync-pending states. No dead-end placeholders.
