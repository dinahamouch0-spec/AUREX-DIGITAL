# MIZAN — DEEN Specification
Version: 1.0

## 1. Purpose
A gentle personal record of worship and good deeds. It is not a religious authority, a faith score, or a source of invented reward calculations.

## 2. Prayer tracking
Five separately recorded prayers:
- Fajr
- Dhuhr
- Asr
- Maghrib
- Isha

The user commonly combines Dhuhr with Asr and Maghrib with Isha. Notifications may say “حان وقت صلاة الظهر والعصر” and “حان وقت صلاة المغرب والعشاء”, but each prayer must retain a separate record and separate completion control.

Each prayer record supports:
- local date
- prayer type
- status: performed / not recorded / intentionally marked missed (only if user explicitly chooses) / excused if user wants this category
- performed timestamp, optional
- note, optional

A missing log must remain “not recorded”; never automatically mark as missed.

## 3. Prayer times and alerts
- Default location setting: Beirut, Lebanon; user can change it.
- Default timezone: Asia/Beirut.
- Calculation convention: Ja'fari.
- Exact authority, calculation parameters, and manual adjustments must be selectable/confirmed during implementation because local conventions and marjaʿ preferences can differ.
- Show calculation source and last update.
- Allow manual time adjustments.
- Alerts: time-entry alert and optional follow-up reminder if not logged.
- Fajr separate; combined Dhuhr and combined Maghrib alerts as described above.
- Never promise reliable Adhan audio/background scheduling until tested on the target OS and device. If full audio is not supported, provide a clear fallback.

## 4. Quran
Open-ended, no imposed target. Log:
- read timestamp
- optional page count
- optional duration
- optional note
Show history and gentle trends. No guilt-based streaks.

## 5. Adhkar and supplications
Optional categories:
- Morning adhkar
- Evening adhkar
- After-prayer adhkar
- Supplications
- Istighfar / tasbih counter

Support custom entries and optional counts. Do not require daily completion.

## 6. Good deeds
Optional categories:
- Honouring parents
- Helping others
- Charity
- Maintaining family ties
- Kind words / avoiding harm
Allow private notes. Do not assign fabricated hasanat/sayyat quantities or numerical faith scores. Any religious content added later must be sourced and reviewed appropriately.

## 7. Dashboard and analytics
- Today's prayer records 0–5, clearly described as recorded completions, not a measure of faith.
- Recent Quran activity.
- Optional adhkar and good deeds.
- Daily, weekly, monthly history.
- Distinguish no record from a missed prayer.
- No combined DEEN score.

## 8. UX requirements
Fast logging, minimal friction, optional details, correction of mistakes, private-by-default records, clear local dates and times. No punitive streak resets or guilt language.

## 9. Acceptance criteria
- Five prayers can be logged independently.
- Combined alerts do not merge the underlying prayer records.
- Missing entries remain unrecorded.
- User can correct an entry.
- Prayer calculation settings are visible and configurable.
- Notification permission failure is clearly communicated.
- Quran/adhkar/good deeds are optional.
