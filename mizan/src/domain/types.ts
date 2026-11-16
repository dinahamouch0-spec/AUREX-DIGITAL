/**
 * Entity types. Field names are snake_case and match the Postgres columns in
 * supabase/migrations so records sync without a mapping layer.
 */
import type { LocalDate } from './dates';
import type { CurrencyCode } from './money';
import type { PrayerType } from './prayerTimes';

export type Domain = 'deen' | 'fitness' | 'academics' | 'business' | 'habits' | 'general';
export const DOMAINS: Domain[] = ['deen', 'fitness', 'academics', 'business', 'habits'];

export interface BaseRecord {
  id: string;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type Priority = 'low' | 'medium' | 'high';
export type WorkStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'deferred' | 'paused' | 'archived';

// ---------- Shared planning ----------
export interface Goal extends BaseRecord {
  domain: Domain;
  title: string;
  description?: string | null;
  status: WorkStatus;
  target_date?: LocalDate | null;
  metric_current?: number | null;
  metric_target?: number | null;
  metric_unit?: string | null;
}
export interface Milestone extends BaseRecord {
  goal_id: string;
  title: string;
  status: WorkStatus;
  due_date?: LocalDate | null;
  sort_order: number;
}
export interface Task extends BaseRecord {
  domain: Domain;
  title: string;
  description?: string | null;
  status: WorkStatus;
  priority: Priority;
  due_at?: string | null;
  estimate_minutes?: number | null;
  actual_minutes?: number | null;
  completed_at?: string | null;
  parent_task_id?: string | null;
  project_id?: string | null;
  client_id?: string | null;
  deal_id?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | null;
}
export interface CalendarEvent extends BaseRecord {
  domain: Domain;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  all_day: boolean;
  location?: string | null;
  note?: string | null;
}
export interface Reminder extends BaseRecord {
  domain: Domain;
  title: string;
  scheduled_at: string;
  recurrence: 'none' | 'daily' | 'weekly';
  status: 'active' | 'paused' | 'done';
  source_type?: string | null;
  source_id?: string | null;
}
export interface AppNotification extends BaseRecord {
  domain: Domain | 'system' | 'ai';
  title: string;
  body?: string | null;
  priority: Priority;
  read_at?: string | null;
  dismissed_at?: string | null;
  snoozed_until?: string | null;
  dedupe_key?: string | null;
}

// ---------- DEEN ----------
export type PrayerStatus = 'performed' | 'missed' | 'excused';
/** Derived display status; "not_recorded" is the absence of a log. */
export type PrayerDisplayStatus = PrayerStatus | 'not_recorded';
export interface PrayerLog extends BaseRecord {
  prayer_type: PrayerType;
  local_date: LocalDate;
  status: PrayerStatus;
  performed_at?: string | null;
  note?: string | null;
}
export interface QuranLog extends BaseRecord {
  read_at: string;
  pages?: number | null;
  duration_minutes?: number | null;
  note?: string | null;
}
export type AdhkarCategory = 'morning' | 'evening' | 'after_prayer' | 'supplication' | 'istighfar' | 'tasbih' | 'custom';
export interface AdhkarLog extends BaseRecord {
  category: AdhkarCategory;
  custom_label?: string | null;
  completed_at: string;
  count?: number | null;
  note?: string | null;
}
export type GoodDeedCategory = 'parents' | 'helping' | 'charity' | 'family_ties' | 'kind_words' | 'other';
export interface GoodDeedLog extends BaseRecord {
  category: GoodDeedCategory;
  occurred_at: string;
  note?: string | null;
}

// ---------- FITNESS ----------
export interface BodyMeasurement extends BaseRecord {
  measured_at: string;
  weight_kg?: number | null;
  height_cm?: number | null;
  waist_cm?: number | null;
  chest_cm?: number | null;
  arm_cm?: number | null;
  thigh_cm?: number | null;
  body_fat_percent?: number | null;
  body_fat_method?: string | null;
  note?: string | null;
}
/** Progress photo. Local-only: the file never leaves the device in v1. */
export interface BodyPhoto extends BaseRecord {
  local_uri: string;
  captured_at: string;
  phase_id?: string | null;
  note?: string | null;
}
export interface FitnessPhase extends BaseRecord {
  phase_type: 'bulking' | 'cutting' | 'maintenance' | 'custom';
  name: string;
  starts_on: LocalDate;
  ends_on?: LocalDate | null;
  notes?: string | null;
}
export interface Exercise extends BaseRecord {
  name: string;
  name_ar?: string | null;
  primary_muscles: string;
  secondary_muscles?: string | null;
  equipment?: string | null;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  instructions?: string | null;
  common_mistakes?: string | null;
}
export interface Workout extends BaseRecord {
  title: string;
  started_at: string;
  ended_at?: string | null;
  status: 'in_progress' | 'completed' | 'missed' | 'deferred';
  program_id?: string | null;
  notes?: string | null;
}
export interface WorkoutSet extends BaseRecord {
  workout_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  load_value?: number | null;
  load_unit: 'kg' | 'lb';
  rest_seconds?: number | null;
  rpe?: number | null;
}
export interface WorkoutProgram extends BaseRecord {
  name: string;
  /** weekday (0=Sun) -> label; missing/empty = rest day */
  schedule_json: Record<string, string>;
  is_active: boolean;
}
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export interface Meal extends BaseRecord {
  logged_at: string;
  meal_type: MealType;
  note?: string | null;
}
export type NutritionSource = 'user_entered' | 'package_label' | 'estimate';
export interface FoodItem extends BaseRecord {
  name: string;
  serving_label: string;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  source: NutritionSource;
}
export interface MealItem extends BaseRecord {
  meal_id: string;
  food_item_id?: string | null;
  custom_name?: string | null;
  quantity: number;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  source: NutritionSource;
}
export interface HydrationLog extends BaseRecord {
  logged_at: string;
  amount_ml: number;
  beverage_type: string;
}
export interface RecoveryLog extends BaseRecord {
  local_date: LocalDate;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  fatigue?: number | null;
  soreness?: number | null;
  energy?: number | null;
  note?: string | null;
}

// ---------- ACADEMICS ----------
export interface AcademicTerm extends BaseRecord {
  name: string;
  starts_on: LocalDate;
  ends_on: LocalDate;
}
export interface Subject extends BaseRecord {
  term_id?: string | null;
  name: string;
  teacher?: string | null;
  color?: string | null;
  target_grade?: number | null;
  difficulty?: number | null;
  notes?: string | null;
}
export interface AcademicUnit extends BaseRecord {
  subject_id: string;
  name: string;
  sort_order: number;
}
export type MasteryStatus = 'not_started' | 'learning' | 'practicing' | 'good' | 'mastered';
export interface Lesson extends BaseRecord {
  subject_id: string;
  unit_id?: string | null;
  title: string;
  mastery_status: MasteryStatus;
  notes?: string | null;
}
export interface Assignment extends BaseRecord {
  subject_id: string;
  lesson_id?: string | null;
  title: string;
  due_at: string;
  status: WorkStatus;
  priority: Priority;
  estimate_minutes?: number | null;
  notes?: string | null;
  completed_at?: string | null;
}
export interface Exam extends BaseRecord {
  subject_id: string;
  title: string;
  exam_at: string;
  max_score?: number | null;
  weight?: number | null;
  notes?: string | null;
  error_analysis?: string | null;
}
export interface Grade extends BaseRecord {
  subject_id: string;
  exam_id?: string | null;
  title: string;
  score: number;
  max_score: number;
  weight?: number | null;
  recorded_at: string;
}
export interface StudySession extends BaseRecord {
  subject_id?: string | null;
  exam_id?: string | null;
  assignment_id?: string | null;
  title: string;
  planned_date: LocalDate;
  planned_minutes: number;
  actual_minutes?: number | null;
  status: WorkStatus;
  priority: Priority;
}

// ---------- BUSINESS ----------
export interface Project extends BaseRecord {
  name: string;
  description?: string | null;
  status: 'planned' | 'active' | 'paused' | 'completed' | 'archived';
  phase?: string | null;
  client_id?: string | null;
  budget_minor?: number | null;
  currency: CurrencyCode;
  starts_on?: LocalDate | null;
  due_on?: LocalDate | null;
  risks?: string | null;
  progress_percent?: number | null;
}
export interface Client extends BaseRecord {
  name: string;
  organization?: string | null;
  phone?: string | null;
  email?: string | null;
  lead_source?: string | null;
  status: 'lead' | 'active' | 'past' | 'inactive';
  category?: string | null;
  follow_up_on?: LocalDate | null;
  notes?: string | null;
}
export interface ClientInteraction extends BaseRecord {
  client_id: string;
  occurred_at: string;
  channel: 'call' | 'message' | 'email' | 'meeting' | 'other';
  summary: string;
}
export const DEAL_STAGES = ['new_lead', 'contacted', 'discovery', 'proposal', 'negotiation', 'won', 'lost'] as const;
export type DealStage = (typeof DEAL_STAGES)[number];
export interface Deal extends BaseRecord {
  client_id?: string | null;
  title: string;
  stage: DealStage;
  value_minor: number;
  currency: CurrencyCode;
  probability?: number | null;
  expected_close_on?: LocalDate | null;
  follow_up_on?: LocalDate | null;
  lost_reason?: string | null;
  proposal_ref?: string | null;
}
export type TransactionDirection = 'income' | 'expense' | 'refund_issued' | 'refund_received';
export interface Transaction extends BaseRecord {
  project_id?: string | null;
  client_id?: string | null;
  direction: TransactionDirection;
  amount_minor: number;
  currency: CurrencyCode;
  occurred_on: LocalDate;
  status: 'planned' | 'pending' | 'cleared';
  category?: string | null;
  note?: string | null;
}
export interface Invoice extends BaseRecord {
  client_id?: string | null;
  project_id?: string | null;
  invoice_number: string;
  amount_minor: number;
  currency: CurrencyCode;
  issued_on: LocalDate;
  due_on?: LocalDate | null;
  status: 'draft' | 'sent' | 'void';
}
export interface InvoicePayment extends BaseRecord {
  invoice_id: string;
  amount_minor: number;
  paid_on: LocalDate;
  method?: string | null;
}

// ---------- HABITS ----------
export interface HabitCategory extends BaseRecord {
  name: string;
  color?: string | null;
}
export type HabitScheduleType = 'daily' | 'weekdays' | 'times_per_week';
export interface Habit extends BaseRecord {
  name: string;
  category_id?: string | null;
  linked_domain?: Domain | null;
  schedule_type: HabitScheduleType;
  /** 0=Sun..6=Sat; used when schedule_type = 'weekdays' */
  schedule_days?: number[] | null;
  times_per_week?: number | null;
  target_quantity?: number | null;
  target_unit?: string | null;
  status: 'active' | 'paused' | 'archived';
  sort_order: number;
}
export type HabitLogStatus = 'completed' | 'partial' | 'skipped' | 'deferred' | 'paused';
export type HabitDayStatus = HabitLogStatus | 'not_recorded' | 'not_scheduled';
export interface HabitLog extends BaseRecord {
  habit_id: string;
  local_date: LocalDate;
  status: HabitLogStatus;
  quantity?: number | null;
  duration_minutes?: number | null;
  logged_at: string;
  note?: string | null;
}
export interface Routine extends BaseRecord {
  name: string;
  kind: 'morning' | 'evening' | 'custom';
  status: 'active' | 'paused' | 'archived';
}
export interface RoutineStep extends BaseRecord {
  routine_id: string;
  title: string;
  sort_order: number;
  estimate_minutes?: number | null;
}
export interface RoutineLog extends BaseRecord {
  routine_id: string;
  local_date: LocalDate;
  started_at: string;
  completed_at?: string | null;
  status: 'in_progress' | 'completed' | 'partial' | 'skipped';
}
export interface RoutineStepLog extends BaseRecord {
  routine_log_id: string;
  routine_step_id: string;
  status: 'completed' | 'skipped' | 'deferred';
  completed_at?: string | null;
}

// ---------- PERFECT DAYS ----------
export type PerfectCriterion =
  | { type: 'habit'; ref_id: string }
  | { type: 'routine'; ref_id: string }
  | { type: 'prayers' }
  | { type: 'planned_workout' }
  | { type: 'planned_study' }
  | { type: 'tasks_due' };
/** A version of the user's perfect-day definition, effective from a date (never backdated). */
export interface PerfectDayDefinition extends BaseRecord {
  effective_from: LocalDate;
  criteria: PerfectCriterion[];
}
/** A day the user marks in advance as rest / holiday: it neither counts nor breaks a streak. */
export interface DayExemption extends BaseRecord {
  local_date: LocalDate;
  reason: 'rest' | 'holiday' | 'sick' | 'travel' | 'other';
  note?: string | null;
}
export type SealedDayStatus = 'perfect' | 'incomplete' | 'rest' | 'exempt';
/** Immutable result of a closed day (written once at seal time). */
export interface PerfectDayResult extends BaseRecord {
  local_date: LocalDate;
  status: SealedDayStatus;
  met: number;
  applicable: number;
  sealed_at: string;
  definition_id: string;
}

export interface AuditLog extends BaseRecord {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  occurred_at: string;
  metadata?: Record<string, unknown> | null;
}

/** Registry of every synced collection. Key = Postgres table name. */
export interface CollectionMap {
  goals: Goal;
  milestones: Milestone;
  tasks: Task;
  calendar_events: CalendarEvent;
  reminders: Reminder;
  notifications: AppNotification;
  prayer_logs: PrayerLog;
  quran_logs: QuranLog;
  adhkar_logs: AdhkarLog;
  good_deed_logs: GoodDeedLog;
  body_measurements: BodyMeasurement;
  body_photos: BodyPhoto;
  fitness_phases: FitnessPhase;
  exercises: Exercise;
  workouts: Workout;
  workout_sets: WorkoutSet;
  workout_programs: WorkoutProgram;
  meals: Meal;
  food_items: FoodItem;
  meal_items: MealItem;
  hydration_logs: HydrationLog;
  recovery_logs: RecoveryLog;
  academic_terms: AcademicTerm;
  subjects: Subject;
  academic_units: AcademicUnit;
  lessons: Lesson;
  assignments: Assignment;
  exams: Exam;
  grades: Grade;
  study_sessions: StudySession;
  projects: Project;
  clients: Client;
  client_interactions: ClientInteraction;
  deals: Deal;
  transactions: Transaction;
  invoices: Invoice;
  invoice_payments: InvoicePayment;
  habit_categories: HabitCategory;
  habits: Habit;
  habit_logs: HabitLog;
  routines: Routine;
  routine_steps: RoutineStep;
  routine_logs: RoutineLog;
  routine_step_logs: RoutineStepLog;
  perfect_day_definitions: PerfectDayDefinition;
  day_exemptions: DayExemption;
  perfect_day_results: PerfectDayResult;
  audit_logs: AuditLog;
}
export type CollectionName = keyof CollectionMap;

export const COLLECTION_DOMAIN: Record<CollectionName, Domain> = {
  goals: 'general',
  milestones: 'general',
  tasks: 'general',
  calendar_events: 'general',
  reminders: 'general',
  notifications: 'general',
  prayer_logs: 'deen',
  quran_logs: 'deen',
  adhkar_logs: 'deen',
  good_deed_logs: 'deen',
  body_measurements: 'fitness',
  body_photos: 'fitness',
  fitness_phases: 'fitness',
  exercises: 'fitness',
  workouts: 'fitness',
  workout_sets: 'fitness',
  workout_programs: 'fitness',
  meals: 'fitness',
  food_items: 'fitness',
  meal_items: 'fitness',
  hydration_logs: 'fitness',
  recovery_logs: 'fitness',
  academic_terms: 'academics',
  subjects: 'academics',
  academic_units: 'academics',
  lessons: 'academics',
  assignments: 'academics',
  exams: 'academics',
  grades: 'academics',
  study_sessions: 'academics',
  projects: 'business',
  clients: 'business',
  client_interactions: 'business',
  deals: 'business',
  transactions: 'business',
  invoices: 'business',
  invoice_payments: 'business',
  habit_categories: 'habits',
  habits: 'habits',
  habit_logs: 'habits',
  routines: 'habits',
  routine_steps: 'habits',
  routine_logs: 'habits',
  routine_step_logs: 'habits',
  perfect_day_definitions: 'general',
  day_exemptions: 'general',
  perfect_day_results: 'general',
  audit_logs: 'general',
};

export const COLLECTIONS = Object.keys(COLLECTION_DOMAIN) as CollectionName[];

/** Collections whose edits are audited (sensitive: finance + contacts). */
export const AUDITED_COLLECTIONS: CollectionName[] = ['transactions', 'invoices', 'invoice_payments', 'deals', 'clients'];

/** Collections stored only on this device: never queued for sync or sent to AI. */
/** Collections that may only be appended to: updates and deletes are refused. */
export const APPEND_ONLY_COLLECTIONS: CollectionName[] = ['perfect_day_results', 'perfect_day_definitions', 'audit_logs'];

/**
 * Collections whose previous versions are kept locally (field `_history`,
 * never synced) so a closed day can be evaluated exactly as the records were
 * at its close time (as-of evaluation).
 */
export const VERSIONED_COLLECTIONS: CollectionName[] = [
  'habits', 'habit_logs', 'routines', 'routine_logs', 'workout_programs', 'workouts',
  'study_sessions', 'tasks', 'prayer_logs', 'day_exemptions',
];
export const MAX_VERSIONS = 100;

export const LOCAL_ONLY_COLLECTIONS: CollectionName[] = ['body_photos'];
export const SYNCED_COLLECTIONS: CollectionName[] = COLLECTIONS.filter((c) => !LOCAL_ONLY_COLLECTIONS.includes(c));
