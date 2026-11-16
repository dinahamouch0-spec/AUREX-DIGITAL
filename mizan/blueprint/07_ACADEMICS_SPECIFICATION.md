# MIZAN — ACADEMICS Specification
Version: 1.0

## 1. Purpose
A structured school command center for subjects, lessons, homework, exams, grades, study planning, and academic insights.

## 2. Academic structure
Support school year, terms/semesters, subjects, units, lessons, notes, files, teacher (optional), exam links, target grades (optional), and mastery tracking.

Lesson mastery states:
- Not Started
- Learning
- Practicing
- Good
- Mastered

These are user-controlled statuses, not automatic judgments.

## 3. Subjects
Subject profile includes:
- name and optional color
- teacher (optional)
- term/year association
- units and lessons
- current/target grade (optional)
- difficulty (user-rated)
- mastery distribution
- upcoming assignments/exams
- notes and attachments

## 4. Homework and assignments
Fields:
- title
- subject and optional unit/lesson
- due date/time
- priority
- status
- estimate minutes
- notes and attachments
- optional subtasks/steps

Support overdue detection, reminders, workload view, completion history, and rescheduling. Never silently change due dates.

## 5. Exams and grades
Exams support:
- subject
- title
- date
- score and maximum score
- optional weight
- notes

Grade calculations must disclose the formula and whether weights are known. If weights are missing, show a simple average only when appropriate and label it clearly. Do not fabricate a projected grade from insufficient data.

Provide:
- subject/term/year averages
- trend charts
- strengths and improvement areas
- exam history
- error analysis notes
- optional target gap analysis

## 6. Study planner
Daily/weekly planner supports:
- study sessions
- linked subject/unit/exam/assignment
- priority and difficulty
- estimated duration
- actual duration (optional)
- completion status
- break planning
- workload warnings
- rescheduling suggestions after missed sessions

The planner should avoid excessive study recommendations and respect school, sleep, and personal time.

## 7. Goals
Per-subject, term, or year goals:
- desired mark/average
- milestone steps
- target date
- progress
- gap analysis
- forecast only when enough data exists and confidence is displayed

## 8. Academic intelligence
Insights may include:
- grade trends
- subject strengths/weaknesses
- workload distribution
- study session consistency
- upcoming high-load periods
- topics needing practice based on user-recorded mastery or mistakes

AI must explain the data behind suggestions. No peer ranking or friend comparison by default.

## 9. Acceptance criteria
- Academic year/term/subject relationships are valid.
- Assignment reminders respect timezone and permissions.
- Grade formulas are transparent and testable.
- Study plans can be edited and rescheduled.
- Forecasts show uncertainty or are withheld when data is insufficient.
