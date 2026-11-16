-- MIZAN initial schema.
-- Conventions: UUID PKs (client-generated for offline capture), user_id on
-- every user-owned row, timestamptz instants, `date` for local calendar
-- days, integer minor units + explicit currency for money, tombstone
-- `deleted_at` for sync. RLS is enabled on every table (see bottom).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- identity
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 100),
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  timezone text not null default 'Asia/Beirut',
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  week_start smallint not null default 1 check (week_start between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Shared column block, repeated per table for clarity:
--   id uuid pk, user_id uuid not null default auth.uid(), created_at, updated_at, deleted_at

-- ------------------------------------------------------- shared planning
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  domain text not null check (domain in ('deen','fitness','academics','business','habits','general')),
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 4000),
  status text not null check (status in ('not_started','in_progress','completed','skipped','deferred','paused','archived')),
  target_date date,
  metric_current numeric,
  metric_target numeric,
  metric_unit text check (char_length(metric_unit) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  status text not null check (status in ('not_started','in_progress','completed','skipped','deferred','paused','archived')),
  due_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  schedule_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  organization text,
  phone text,
  email text,
  lead_source text,
  status text not null check (status in ('lead','active','past','inactive')),
  category text,
  follow_up_on date,
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text,
  status text not null check (status in ('planned','active','paused','completed','archived')),
  phase text,
  client_id uuid references public.clients (id) on delete set null,
  budget_minor bigint check (budget_minor >= 0),
  currency text not null check (currency in ('USD','LBP')),
  starts_on date,
  due_on date,
  risks text,
  progress_percent smallint check (progress_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (due_on is null or starts_on is null or due_on >= starts_on)
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  stage text not null check (stage in ('new_lead','contacted','discovery','proposal','negotiation','won','lost')),
  value_minor bigint not null check (value_minor >= 0),
  currency text not null check (currency in ('USD','LBP')),
  probability smallint check (probability between 0 and 100),
  expected_close_on date,
  follow_up_on date,
  lost_reason text,
  proposal_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  domain text not null check (domain in ('deen','fitness','academics','business','habits','general')),
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 4000),
  status text not null check (status in ('not_started','in_progress','completed','skipped','deferred','paused','archived')),
  priority text not null check (priority in ('low','medium','high')),
  due_at timestamptz,
  estimate_minutes integer check (estimate_minutes >= 0),
  actual_minutes integer check (actual_minutes >= 0),
  completed_at timestamptz,
  recurrence text check (recurrence in ('none','daily','weekly','monthly')),
  parent_task_id uuid references public.tasks (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  deal_id uuid references public.deals (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  domain text not null check (domain in ('deen','fitness','academics','business','habits','general')),
  title text not null check (char_length(title) between 1 and 200),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ends_at is null or ends_at >= starts_at)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  domain text not null check (domain in ('deen','fitness','academics','business','habits','general')),
  title text not null check (char_length(title) between 1 and 200),
  scheduled_at timestamptz not null,
  recurrence text not null check (recurrence in ('none','daily','weekly')),
  status text not null check (status in ('active','paused','done')),
  source_type text,
  source_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  domain text not null check (domain in ('deen','fitness','academics','business','habits','general','system','ai')),
  title text not null,
  body text,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  read_at timestamptz,
  dismissed_at timestamptz,
  snoozed_until timestamptz,
  dedupe_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ------------------------------------------------------------------- DEEN
create table public.prayer_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prayer_type text not null check (prayer_type in ('fajr','dhuhr','asr','maghrib','isha')),
  local_date date not null,
  -- "not recorded" is the absence of a row; it is never stored as missed.
  status text not null check (status in ('performed','missed','excused')),
  performed_at timestamptz,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
-- One live record per prayer per day (tombstoned corrections excluded).
create unique index prayer_logs_one_per_day on public.prayer_logs (user_id, local_date, prayer_type) where deleted_at is null;

create table public.quran_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  read_at timestamptz not null,
  pages integer check (pages >= 0),
  duration_minutes integer check (duration_minutes >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.adhkar_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in ('morning','evening','after_prayer','supplication','istighfar','tasbih','custom')),
  custom_label text,
  completed_at timestamptz not null,
  count integer check (count >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.good_deed_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in ('parents','helping','charity','family_ties','kind_words','other')),
  occurred_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------------------------------------------------------------- FITNESS
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_at timestamptz not null,
  weight_kg numeric(5,2) check (weight_kg between 10 and 400),
  height_cm numeric(5,1) check (height_cm between 50 and 260),
  waist_cm numeric(5,1),
  chest_cm numeric(5,1),
  arm_cm numeric(5,1),
  thigh_cm numeric(5,1),
  body_fat_percent numeric(4,1) check (body_fat_percent between 2 and 70),
  body_fat_method text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.body_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- path inside the private 'body-photos' bucket, always '<user_id>/<file>'
  storage_path text not null,
  captured_at timestamptz not null,
  phase_id uuid,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (split_part(storage_path, '/', 1) = user_id::text)
);

create table public.fitness_phases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  phase_type text not null check (phase_type in ('bulking','cutting','maintenance','custom')),
  name text not null,
  starts_on date not null,
  ends_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ends_on is null or ends_on >= starts_on)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  name_ar text,
  primary_muscles text not null,
  secondary_muscles text,
  equipment text,
  difficulty text check (difficulty in ('beginner','intermediate','advanced')),
  instructions text,
  common_mistakes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  status text not null check (status in ('in_progress','completed','missed','deferred')),
  program_id uuid references public.workout_programs (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ended_at is null or ended_at >= started_at)
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  -- either a user exercise uuid or a built-in catalog id ('builtin:...')
  exercise_id text not null,
  set_number integer not null check (set_number >= 1),
  reps integer not null check (reps >= 0),
  load_value numeric(7,2) check (load_value >= 0),
  load_unit text not null check (load_unit in ('kg','lb')),
  rest_seconds integer check (rest_seconds >= 0),
  rpe numeric(3,1) check (rpe between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_at timestamptz not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  serving_label text not null,
  calories numeric(7,1) check (calories >= 0),
  protein_g numeric(6,1) check (protein_g >= 0),
  carbs_g numeric(6,1) check (carbs_g >= 0),
  fat_g numeric(6,1) check (fat_g >= 0),
  fiber_g numeric(6,1) check (fiber_g >= 0),
  sugar_g numeric(6,1) check (sugar_g >= 0),
  sodium_mg numeric(8,1) check (sodium_mg >= 0),
  source text not null check (source in ('user_entered','package_label','estimate')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  food_item_id uuid references public.food_items (id) on delete set null,
  custom_name text,
  quantity numeric(6,2) not null check (quantity > 0),
  calories numeric(8,1),
  protein_g numeric(7,1),
  carbs_g numeric(7,1),
  fat_g numeric(7,1),
  source text not null check (source in ('user_entered','package_label','estimate')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (food_item_id is not null or custom_name is not null)
);

create table public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_at timestamptz not null,
  amount_ml integer not null check (amount_ml between 1 and 5000),
  beverage_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  sleep_hours numeric(4,1) check (sleep_hours between 0 and 24),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  fatigue smallint check (fatigue between 1 and 5),
  soreness smallint check (soreness between 1 and 5),
  energy smallint check (energy between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- -------------------------------------------------------------- ACADEMICS
create table public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ends_on >= starts_on)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  term_id uuid references public.academic_terms (id) on delete set null,
  name text not null,
  teacher text,
  color text,
  target_grade numeric(5,2) check (target_grade between 0 and 100),
  difficulty smallint check (difficulty between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.academic_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  unit_id uuid references public.academic_units (id) on delete set null,
  title text not null,
  mastery_status text not null check (mastery_status in ('not_started','learning','practicing','good','mastered')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  status text not null check (status in ('not_started','in_progress','completed','skipped','deferred','paused','archived')),
  priority text not null check (priority in ('low','medium','high')),
  estimate_minutes integer check (estimate_minutes >= 0),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null,
  exam_at timestamptz not null,
  max_score numeric(10,2) check (max_score > 0),
  weight numeric(8,3) check (weight >= 0),
  notes text,
  error_analysis text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  exam_id uuid references public.exams (id) on delete set null,
  title text not null,
  score numeric(10,2) not null check (score >= 0),
  max_score numeric(10,2) not null check (max_score > 0),
  weight numeric(8,3) check (weight >= 0),
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  exam_id uuid references public.exams (id) on delete set null,
  assignment_id uuid references public.assignments (id) on delete set null,
  title text not null,
  planned_date date not null,
  planned_minutes integer not null check (planned_minutes between 5 and 600),
  actual_minutes integer check (actual_minutes >= 0),
  status text not null check (status in ('not_started','in_progress','completed','skipped','deferred','paused','archived')),
  priority text not null check (priority in ('low','medium','high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- --------------------------------------------------------------- BUSINESS
create table public.client_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  occurred_at timestamptz not null,
  channel text not null check (channel in ('call','message','email','meeting','other')),
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  direction text not null check (direction in ('income','expense','refund_issued','refund_received')),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency in ('USD','LBP')),
  occurred_on date not null,
  status text not null check (status in ('planned','pending','cleared')),
  category text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  invoice_number text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency in ('USD','LBP')),
  issued_on date not null,
  due_on date,
  status text not null check (status in ('draft','sent','void')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (due_on is null or due_on >= issued_on)
);
create unique index invoices_number_per_user on public.invoices (user_id, invoice_number) where deleted_at is null;

create table public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount_minor bigint not null check (amount_minor > 0),
  paid_on date not null,
  method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ----------------------------------------------------------------- HABITS
create table public.habit_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  category_id uuid references public.habit_categories (id) on delete set null,
  linked_domain text check (linked_domain in ('deen','fitness','academics','business','habits')),
  schedule_type text not null check (schedule_type in ('daily','weekdays','times_per_week')),
  schedule_days jsonb,
  times_per_week smallint check (times_per_week between 1 and 7),
  target_quantity numeric,
  target_unit text,
  status text not null check (status in ('active','paused','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  local_date date not null,
  status text not null check (status in ('completed','partial','skipped','deferred','paused')),
  quantity numeric,
  duration_minutes integer check (duration_minutes >= 0),
  logged_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('morning','evening','custom')),
  status text not null check (status in ('active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.routine_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  estimate_minutes integer check (estimate_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  local_date date not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null check (status in ('in_progress','completed','partial','skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.routine_step_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_log_id uuid not null references public.routine_logs (id) on delete cascade,
  routine_step_id uuid not null references public.routine_steps (id) on delete cascade,
  status text not null check (status in ('completed','skipped','deferred')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ----------------------------------------------------------------- SYSTEM
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  occurred_at timestamptz not null,
  -- redacted metadata only; never field values
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ------------------------------------------------- triggers, RLS, indexes
-- Server-authoritative updated_at (the sync cursor relies on it).
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;

-- Rows can never be moved to another owner.
create or replace function public.prevent_owner_change() returns trigger
language plpgsql as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id is immutable' using errcode = '42501';
  end if;
  return new;
end $$;

do $$
declare
  t text;
  owned text[] := array[
    'goals','milestones','tasks','calendar_events','reminders','notifications',
    'prayer_logs','quran_logs','adhkar_logs','good_deed_logs',
    'body_measurements','body_photos','fitness_phases','exercises','workouts','workout_sets',
    'workout_programs','meals','food_items','meal_items','hydration_logs','recovery_logs',
    'academic_terms','subjects','academic_units','lessons','assignments','exams','grades','study_sessions',
    'projects','clients','client_interactions','deals','transactions','invoices','invoice_payments',
    'habit_categories','habits','habit_logs','routines','routine_steps','routine_logs','routine_step_logs',
    'audit_logs'];
begin
  foreach t in array owned loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())', t || '_delete_own', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.prevent_owner_change()', t || '_owner_immutable', t);
    execute format('create index %I on public.%I (user_id, updated_at)', t || '_user_updated_idx', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Audit logs are append-only for the user.
drop policy audit_logs_update_own on public.audit_logs;
drop policy audit_logs_delete_own on public.audit_logs;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_updated_at before insert or update on public.profiles for each row execute function public.set_updated_at();
grant select, insert, update on public.profiles to authenticated;
revoke all on public.profiles from anon;

-- Common query indexes
create index tasks_due_idx on public.tasks (user_id, due_at) where deleted_at is null;
create index assignments_due_idx on public.assignments (user_id, due_at) where deleted_at is null;
create index exams_at_idx on public.exams (user_id, exam_at) where deleted_at is null;
create index habit_logs_day_idx on public.habit_logs (user_id, habit_id, local_date) where deleted_at is null;
create index transactions_day_idx on public.transactions (user_id, occurred_on) where deleted_at is null;
create index workout_sets_workout_idx on public.workout_sets (workout_id);
create index meal_items_meal_idx on public.meal_items (meal_id);
