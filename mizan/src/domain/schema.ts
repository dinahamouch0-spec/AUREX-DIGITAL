/**
 * Field specifications per collection. Used by:
 * - validation (domain layer, before any write),
 * - generic create/edit forms (UI layer),
 * - search (which fields are searchable text).
 * Labels come from i18n keys `field.<name>` and `opt.<optionPrefix>.<value>`.
 */
import { isLocalDate } from './dates';
import { CURRENCY_CODES } from './money';
import { PRAYERS } from './prayerTimes';
import { CollectionName, DEAL_STAGES, DOMAINS } from './types';

export type FieldType =
  | 'text'
  | 'multiline'
  | 'number'
  | 'integer'
  | 'date'
  | 'datetime'
  | 'select'
  | 'money'
  | 'boolean'
  | 'ref'
  | 'weekdays'
  | 'rating'
  | 'json';

export interface FieldSpec {
  name: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  options?: readonly string[];
  /** i18n prefix for option labels: opt.<optionPrefix>.<value> */
  optionPrefix?: string;
  ref?: CollectionName;
  /** money fields: name of the sibling currency field */
  currencyField?: string;
  /** default value for new records; functions are evaluated at form open */
  default?: unknown;
  /** sensitive fields are excluded from search snippets and AI context */
  sensitive?: boolean;
  /** shown only in the detail form, not quick add */
  advanced?: boolean;
  hidden?: boolean;
}

export interface CollectionSchema {
  collection: CollectionName;
  fields: FieldSpec[];
  /** field used as the record title */
  titleField: string;
  /** field used to sort lists (desc) */
  sortField?: string;
  /** field used as the record's date for history/calendar */
  dateField?: string;
}

const STATUS = ['not_started', 'in_progress', 'completed', 'skipped', 'deferred', 'paused', 'archived'] as const;
const PRIORITY = ['low', 'medium', 'high'] as const;
const DOMAIN_OPTS = [...DOMAINS, 'general'] as const;
const now = () => new Date().toISOString();

const f = (name: string, type: FieldType, extra: Partial<FieldSpec> = {}): FieldSpec => ({ name, type, ...extra });

export const SCHEMAS: Record<CollectionName, CollectionSchema> = {
  goals: {
    collection: 'goals',
    titleField: 'title',
    sortField: 'created_at',
    dateField: 'target_date',
    fields: [
      f('title', 'text', { required: true, maxLength: 200 }),
      f('domain', 'select', { required: true, options: DOMAIN_OPTS, optionPrefix: 'domain', default: 'general' }),
      f('status', 'select', { required: true, options: STATUS, optionPrefix: 'status', default: 'not_started' }),
      f('target_date', 'date'),
      f('description', 'multiline', { maxLength: 4000 }),
      f('metric_current', 'number', { advanced: true }),
      f('metric_target', 'number', { advanced: true }),
      f('metric_unit', 'text', { advanced: true, maxLength: 40 }),
    ],
  },
  milestones: {
    collection: 'milestones',
    titleField: 'title',
    sortField: 'sort_order',
    dateField: 'due_date',
    fields: [
      f('goal_id', 'ref', { ref: 'goals', required: true }),
      f('title', 'text', { required: true, maxLength: 200 }),
      f('status', 'select', { required: true, options: STATUS, optionPrefix: 'status', default: 'not_started' }),
      f('due_date', 'date'),
      f('sort_order', 'integer', { default: 0, hidden: true }),
    ],
  },
  tasks: {
    collection: 'tasks',
    titleField: 'title',
    sortField: 'due_at',
    dateField: 'due_at',
    fields: [
      f('title', 'text', { required: true, maxLength: 200 }),
      f('domain', 'select', { required: true, options: DOMAIN_OPTS, optionPrefix: 'domain', default: 'general' }),
      f('status', 'select', { required: true, options: STATUS, optionPrefix: 'status', default: 'not_started' }),
      f('priority', 'select', { required: true, options: PRIORITY, optionPrefix: 'priority', default: 'medium' }),
      f('due_at', 'datetime'),
      f('estimate_minutes', 'integer', { min: 0, max: 100000 }),
      f('actual_minutes', 'integer', { min: 0, max: 100000, advanced: true }),
      f('recurrence', 'select', { options: ['none', 'daily', 'weekly', 'monthly'], optionPrefix: 'recurrence', default: 'none', advanced: true }),
      f('parent_task_id', 'ref', { ref: 'tasks', advanced: true }),
      f('project_id', 'ref', { ref: 'projects', advanced: true }),
      f('client_id', 'ref', { ref: 'clients', advanced: true }),
      f('deal_id', 'ref', { ref: 'deals', advanced: true }),
      f('description', 'multiline', { maxLength: 4000 }),
    ],
  },
  calendar_events: {
    collection: 'calendar_events',
    titleField: 'title',
    sortField: 'starts_at',
    dateField: 'starts_at',
    fields: [
      f('title', 'text', { required: true, maxLength: 200 }),
      f('domain', 'select', { required: true, options: DOMAIN_OPTS, optionPrefix: 'domain', default: 'general' }),
      f('starts_at', 'datetime', { required: true, default: now }),
      f('ends_at', 'datetime'),
      f('all_day', 'boolean', { default: false }),
      f('location', 'text', { maxLength: 200 }),
      f('note', 'multiline', { maxLength: 4000, sensitive: true }),
    ],
  },
  reminders: {
    collection: 'reminders',
    titleField: 'title',
    sortField: 'scheduled_at',
    dateField: 'scheduled_at',
    fields: [
      f('title', 'text', { required: true, maxLength: 200 }),
      f('domain', 'select', { required: true, options: DOMAIN_OPTS, optionPrefix: 'domain', default: 'general' }),
      f('scheduled_at', 'datetime', { required: true, default: now }),
      f('recurrence', 'select', { required: true, options: ['none', 'daily', 'weekly'], optionPrefix: 'recurrence', default: 'none' }),
      f('status', 'select', { required: true, options: ['active', 'paused', 'done'], optionPrefix: 'rstatus', default: 'active' }),
    ],
  },
  notifications: {
    collection: 'notifications',
    titleField: 'title',
    sortField: 'created_at',
    fields: [f('title', 'text', { required: true }), f('body', 'multiline')],
  },
  prayer_logs: {
    collection: 'prayer_logs',
    titleField: 'prayer_type',
    sortField: 'local_date',
    dateField: 'local_date',
    fields: [
      f('prayer_type', 'select', { required: true, options: PRAYERS, optionPrefix: 'prayer' }),
      f('local_date', 'date', { required: true }),
      f('status', 'select', { required: true, options: ['performed', 'missed', 'excused'], optionPrefix: 'pstatus', default: 'performed' }),
      f('performed_at', 'datetime'),
      f('note', 'multiline', { maxLength: 2000, sensitive: true }),
    ],
  },
  quran_logs: {
    collection: 'quran_logs',
    titleField: 'read_at',
    sortField: 'read_at',
    dateField: 'read_at',
    fields: [
      f('read_at', 'datetime', { required: true, default: now }),
      f('pages', 'integer', { min: 0, max: 1000 }),
      f('duration_minutes', 'integer', { min: 0, max: 1440 }),
      f('note', 'multiline', { maxLength: 2000, sensitive: true }),
    ],
  },
  adhkar_logs: {
    collection: 'adhkar_logs',
    titleField: 'category',
    sortField: 'completed_at',
    dateField: 'completed_at',
    fields: [
      f('category', 'select', { required: true, options: ['morning', 'evening', 'after_prayer', 'supplication', 'istighfar', 'tasbih', 'custom'], optionPrefix: 'adhkar', default: 'morning' }),
      f('custom_label', 'text', { maxLength: 100 }),
      f('completed_at', 'datetime', { required: true, default: now }),
      f('count', 'integer', { min: 0, max: 1000000 }),
      f('note', 'multiline', { maxLength: 2000, sensitive: true }),
    ],
  },
  good_deed_logs: {
    collection: 'good_deed_logs',
    titleField: 'category',
    sortField: 'occurred_at',
    dateField: 'occurred_at',
    fields: [
      f('category', 'select', { required: true, options: ['parents', 'helping', 'charity', 'family_ties', 'kind_words', 'other'], optionPrefix: 'deed', default: 'helping' }),
      f('occurred_at', 'datetime', { required: true, default: now }),
      f('note', 'multiline', { maxLength: 2000, sensitive: true }),
    ],
  },
  body_measurements: {
    collection: 'body_measurements',
    titleField: 'measured_at',
    sortField: 'measured_at',
    dateField: 'measured_at',
    fields: [
      f('measured_at', 'datetime', { required: true, default: now }),
      f('weight_kg', 'number', { min: 10, max: 400, sensitive: true }),
      f('height_cm', 'number', { min: 50, max: 260, sensitive: true }),
      f('waist_cm', 'number', { min: 20, max: 250, sensitive: true, advanced: true }),
      f('chest_cm', 'number', { min: 20, max: 250, sensitive: true, advanced: true }),
      f('arm_cm', 'number', { min: 5, max: 100, sensitive: true, advanced: true }),
      f('thigh_cm', 'number', { min: 10, max: 150, sensitive: true, advanced: true }),
      f('body_fat_percent', 'number', { min: 2, max: 70, sensitive: true, advanced: true }),
      f('body_fat_method', 'text', { maxLength: 100, advanced: true }),
      f('note', 'multiline', { maxLength: 2000, sensitive: true }),
    ],
  },
  fitness_phases: {
    collection: 'fitness_phases',
    titleField: 'name',
    sortField: 'starts_on',
    dateField: 'starts_on',
    fields: [
      f('name', 'text', { required: true, maxLength: 100 }),
      f('phase_type', 'select', { required: true, options: ['bulking', 'cutting', 'maintenance', 'custom'], optionPrefix: 'phase', default: 'maintenance' }),
      f('starts_on', 'date', { required: true }),
      f('ends_on', 'date'),
      f('notes', 'multiline', { maxLength: 2000 }),
    ],
  },
  exercises: {
    collection: 'exercises',
    titleField: 'name',
    sortField: 'name',
    fields: [
      f('name', 'text', { required: true, maxLength: 100 }),
      f('primary_muscles', 'text', { required: true, maxLength: 200 }),
      f('secondary_muscles', 'text', { maxLength: 200 }),
      f('equipment', 'text', { maxLength: 100 }),
      f('difficulty', 'select', { options: ['beginner', 'intermediate', 'advanced'], optionPrefix: 'difficulty' }),
      f('instructions', 'multiline', { maxLength: 4000 }),
      f('common_mistakes', 'multiline', { maxLength: 4000, advanced: true }),
    ],
  },
  workouts: {
    collection: 'workouts',
    titleField: 'title',
    sortField: 'started_at',
    dateField: 'started_at',
    fields: [
      f('title', 'text', { required: true, maxLength: 100 }),
      f('started_at', 'datetime', { required: true, default: now }),
      f('ended_at', 'datetime'),
      f('status', 'select', { required: true, options: ['in_progress', 'completed', 'missed', 'deferred'], optionPrefix: 'wstatus', default: 'in_progress' }),
      f('program_id', 'ref', { ref: 'workout_programs', advanced: true }),
      f('notes', 'multiline', { maxLength: 2000 }),
    ],
  },
  workout_sets: {
    collection: 'workout_sets',
    titleField: 'exercise_id',
    sortField: 'set_number',
    fields: [
      f('workout_id', 'ref', { ref: 'workouts', required: true, hidden: true }),
      f('exercise_id', 'text', { required: true, hidden: true }),
      f('set_number', 'integer', { required: true, min: 1, max: 100 }),
      f('reps', 'integer', { required: true, min: 0, max: 1000 }),
      f('load_value', 'number', { min: 0, max: 1000 }),
      f('load_unit', 'select', { required: true, options: ['kg', 'lb'], optionPrefix: 'unit', default: 'kg' }),
      f('rest_seconds', 'integer', { min: 0, max: 3600 }),
      f('rpe', 'number', { min: 1, max: 10 }),
    ],
  },
  workout_programs: {
    collection: 'workout_programs',
    titleField: 'name',
    sortField: 'name',
    fields: [
      f('name', 'text', { required: true, maxLength: 100 }),
      f('is_active', 'boolean', { default: true }),
      f('schedule_json', 'json', { hidden: true, default: () => ({}) }),
    ],
  },
  meals: {
    collection: 'meals',
    titleField: 'meal_type',
    sortField: 'logged_at',
    dateField: 'logged_at',
    fields: [
      f('meal_type', 'select', { required: true, options: ['breakfast', 'lunch', 'dinner', 'snack'], optionPrefix: 'meal', default: 'lunch' }),
      f('logged_at', 'datetime', { required: true, default: now }),
      f('note', 'multiline', { maxLength: 2000 }),
    ],
  },
  food_items: {
    collection: 'food_items',
    titleField: 'name',
    sortField: 'name',
    fields: [
      f('name', 'text', { required: true, maxLength: 120 }),
      f('serving_label', 'text', { required: true, maxLength: 60, default: '1 serving' }),
      f('source', 'select', { required: true, options: ['user_entered', 'package_label', 'estimate'], optionPrefix: 'nsource', default: 'estimate' }),
      f('calories', 'number', { min: 0, max: 10000 }),
      f('protein_g', 'number', { min: 0, max: 1000 }),
      f('carbs_g', 'number', { min: 0, max: 1000 }),
      f('fat_g', 'number', { min: 0, max: 1000 }),
      f('fiber_g', 'number', { min: 0, max: 1000, advanced: true }),
      f('sugar_g', 'number', { min: 0, max: 1000, advanced: true }),
      f('sodium_mg', 'number', { min: 0, max: 100000, advanced: true }),
    ],
  },
  meal_items: {
    collection: 'meal_items',
    titleField: 'custom_name',
    fields: [
      f('meal_id', 'ref', { ref: 'meals', required: true, hidden: true }),
      f('food_item_id', 'ref', { ref: 'food_items', hidden: true }),
      f('custom_name', 'text', { maxLength: 120 }),
      f('quantity', 'number', { required: true, min: 0.01, max: 100, default: 1 }),
      f('calories', 'number', { min: 0, max: 20000 }),
      f('protein_g', 'number', { min: 0, max: 2000 }),
      f('carbs_g', 'number', { min: 0, max: 2000 }),
      f('fat_g', 'number', { min: 0, max: 2000 }),
      f('source', 'select', { required: true, options: ['user_entered', 'package_label', 'estimate'], optionPrefix: 'nsource', default: 'estimate' }),
    ],
  },
  hydration_logs: {
    collection: 'hydration_logs',
    titleField: 'amount_ml',
    sortField: 'logged_at',
    dateField: 'logged_at',
    fields: [
      f('amount_ml', 'integer', { required: true, min: 1, max: 5000, default: 250 }),
      f('beverage_type', 'select', { required: true, options: ['water', 'milk', 'juice', 'tea', 'coffee', 'other'], optionPrefix: 'drink', default: 'water' }),
      f('logged_at', 'datetime', { required: true, default: now }),
    ],
  },
  recovery_logs: {
    collection: 'recovery_logs',
    titleField: 'local_date',
    sortField: 'local_date',
    dateField: 'local_date',
    fields: [
      f('local_date', 'date', { required: true }),
      f('sleep_hours', 'number', { min: 0, max: 24 }),
      f('sleep_quality', 'rating', { min: 1, max: 5 }),
      f('energy', 'rating', { min: 1, max: 5 }),
      f('fatigue', 'rating', { min: 1, max: 5 }),
      f('soreness', 'rating', { min: 1, max: 5 }),
      f('note', 'multiline', { maxLength: 2000, sensitive: true }),
    ],
  },
  academic_terms: {
    collection: 'academic_terms',
    titleField: 'name',
    sortField: 'starts_on',
    dateField: 'starts_on',
    fields: [
      f('name', 'text', { required: true, maxLength: 100 }),
      f('starts_on', 'date', { required: true }),
      f('ends_on', 'date', { required: true }),
    ],
  },
  subjects: {
    collection: 'subjects',
    titleField: 'name',
    sortField: 'name',
    fields: [
      f('name', 'text', { required: true, maxLength: 100 }),
      f('term_id', 'ref', { ref: 'academic_terms' }),
      f('teacher', 'text', { maxLength: 100 }),
      f('target_grade', 'number', { min: 0, max: 100 }),
      f('difficulty', 'rating', { min: 1, max: 5 }),
      f('color', 'select', { options: ['gold', 'blue', 'green', 'red', 'purple', 'gray'], optionPrefix: 'color', advanced: true }),
      f('notes', 'multiline', { maxLength: 4000 }),
    ],
  },
  academic_units: {
    collection: 'academic_units',
    titleField: 'name',
    sortField: 'sort_order',
    fields: [
      f('subject_id', 'ref', { ref: 'subjects', required: true }),
      f('name', 'text', { required: true, maxLength: 100 }),
      f('sort_order', 'integer', { default: 0, hidden: true }),
    ],
  },
  lessons: {
    collection: 'lessons',
    titleField: 'title',
    sortField: 'created_at',
    fields: [
      f('subject_id', 'ref', { ref: 'subjects', required: true }),
      f('unit_id', 'ref', { ref: 'academic_units' }),
      f('title', 'text', { required: true, maxLength: 200 }),
      f('mastery_status', 'select', { required: true, options: ['not_started', 'learning', 'practicing', 'good', 'mastered'], optionPrefix: 'mastery', default: 'not_started' }),
      f('notes', 'multiline', { maxLength: 4000 }),
    ],
  },
  assignments: {
    collection: 'assignments',
    titleField: 'title',
    sortField: 'due_at',
    dateField: 'due_at',
    fields: [
      f('title', 'text', { required: true, maxLength: 200 }),
      f('subject_id', 'ref', { ref: 'subjects', required: true }),
      f('due_at', 'datetime', { required: true }),
      f('status', 'select', { required: true, options: STATUS, optionPrefix: 'status', default: 'not_started' }),
      f('priority', 'select', { required: true, options: PRIORITY, optionPrefix: 'priority', default: 'medium' }),
      f('estimate_minutes', 'integer', { min: 0, max: 10000 }),
      f('lesson_id', 'ref', { ref: 'lessons', advanced: true }),
      f('notes', 'multiline', { maxLength: 4000 }),
    ],
  },
  exams: {
    collection: 'exams',
    titleField: 'title',
    sortField: 'exam_at',
    dateField: 'exam_at',
    fields: [
      f('title', 'text', { required: true, maxLength: 200 }),
      f('subject_id', 'ref', { ref: 'subjects', required: true }),
      f('exam_at', 'datetime', { required: true }),
      f('max_score', 'number', { min: 0.01, max: 100000 }),
      f('weight', 'number', { min: 0, max: 1000 }),
      f('notes', 'multiline', { maxLength: 4000 }),
      f('error_analysis', 'multiline', { maxLength: 4000, advanced: true }),
    ],
  },
  grades: {
    collection: 'grades',
    titleField: 'title',
    sortField: 'recorded_at',
    dateField: 'recorded_at',
    fields: [
      f('title', 'text', { required: true, maxLength: 200 }),
      f('subject_id', 'ref', { ref: 'subjects', required: true }),
      f('score', 'number', { required: true, min: 0, max: 100000 }),
      f('max_score', 'number', { required: true, min: 0.01, max: 100000, default: 100 }),
      f('weight', 'number', { min: 0, max: 1000 }),
      f('recorded_at', 'datetime', { required: true, default: now }),
      f('exam_id', 'ref', { ref: 'exams', advanced: true }),
    ],
  },
  study_sessions: {
    collection: 'study_sessions',
    titleField: 'title',
    sortField: 'planned_date',
    dateField: 'planned_date',
    fields: [
      f('title', 'text', { required: true, maxLength: 200 }),
      f('subject_id', 'ref', { ref: 'subjects' }),
      f('planned_date', 'date', { required: true }),
      f('planned_minutes', 'integer', { required: true, min: 5, max: 600, default: 45 }),
      f('actual_minutes', 'integer', { min: 0, max: 1440 }),
      f('status', 'select', { required: true, options: STATUS, optionPrefix: 'status', default: 'not_started' }),
      f('priority', 'select', { required: true, options: PRIORITY, optionPrefix: 'priority', default: 'medium' }),
      f('exam_id', 'ref', { ref: 'exams', advanced: true }),
      f('assignment_id', 'ref', { ref: 'assignments', advanced: true }),
    ],
  },
  projects: {
    collection: 'projects',
    titleField: 'name',
    sortField: 'created_at',
    dateField: 'due_on',
    fields: [
      f('name', 'text', { required: true, maxLength: 200 }),
      f('status', 'select', { required: true, options: ['planned', 'active', 'paused', 'completed', 'archived'], optionPrefix: 'pjstatus', default: 'active' }),
      f('client_id', 'ref', { ref: 'clients' }),
      f('phase', 'text', { maxLength: 100 }),
      f('currency', 'select', { required: true, options: CURRENCY_CODES, default: 'USD' }),
      f('budget_minor', 'money', { currencyField: 'currency', sensitive: true }),
      f('starts_on', 'date'),
      f('due_on', 'date'),
      f('progress_percent', 'integer', { min: 0, max: 100 }),
      f('description', 'multiline', { maxLength: 4000 }),
      f('risks', 'multiline', { maxLength: 4000, advanced: true }),
    ],
  },
  clients: {
    collection: 'clients',
    titleField: 'name',
    sortField: 'name',
    dateField: 'follow_up_on',
    fields: [
      f('name', 'text', { required: true, maxLength: 200 }),
      f('organization', 'text', { maxLength: 200 }),
      f('status', 'select', { required: true, options: ['lead', 'active', 'past', 'inactive'], optionPrefix: 'cstatus', default: 'lead' }),
      f('phone', 'text', { maxLength: 40, sensitive: true }),
      f('email', 'text', { maxLength: 200, sensitive: true }),
      f('lead_source', 'text', { maxLength: 100 }),
      f('category', 'text', { maxLength: 100, advanced: true }),
      f('follow_up_on', 'date'),
      f('notes', 'multiline', { maxLength: 4000, sensitive: true }),
    ],
  },
  client_interactions: {
    collection: 'client_interactions',
    titleField: 'summary',
    sortField: 'occurred_at',
    dateField: 'occurred_at',
    fields: [
      f('client_id', 'ref', { ref: 'clients', required: true }),
      f('occurred_at', 'datetime', { required: true, default: now }),
      f('channel', 'select', { required: true, options: ['call', 'message', 'email', 'meeting', 'other'], optionPrefix: 'channel', default: 'message' }),
      f('summary', 'multiline', { required: true, maxLength: 4000, sensitive: true }),
    ],
  },
  deals: {
    collection: 'deals',
    titleField: 'title',
    sortField: 'created_at',
    dateField: 'expected_close_on',
    fields: [
      f('title', 'text', { required: true, maxLength: 200 }),
      f('client_id', 'ref', { ref: 'clients' }),
      f('stage', 'select', { required: true, options: DEAL_STAGES, optionPrefix: 'stage', default: 'new_lead' }),
      f('currency', 'select', { required: true, options: CURRENCY_CODES, default: 'USD' }),
      f('value_minor', 'money', { required: true, currencyField: 'currency', sensitive: true }),
      f('probability', 'integer', { min: 0, max: 100 }),
      f('expected_close_on', 'date'),
      f('follow_up_on', 'date'),
      f('proposal_ref', 'text', { maxLength: 200, advanced: true }),
      f('lost_reason', 'multiline', { maxLength: 2000, advanced: true }),
    ],
  },
  transactions: {
    collection: 'transactions',
    titleField: 'category',
    sortField: 'occurred_on',
    dateField: 'occurred_on',
    fields: [
      f('direction', 'select', { required: true, options: ['income', 'expense', 'refund_issued', 'refund_received'], optionPrefix: 'direction', default: 'income' }),
      f('status', 'select', { required: true, options: ['planned', 'pending', 'cleared'], optionPrefix: 'txstatus', default: 'cleared' }),
      f('currency', 'select', { required: true, options: CURRENCY_CODES, default: 'USD' }),
      f('amount_minor', 'money', { required: true, currencyField: 'currency', sensitive: true }),
      f('occurred_on', 'date', { required: true }),
      f('category', 'text', { maxLength: 100 }),
      f('project_id', 'ref', { ref: 'projects' }),
      f('client_id', 'ref', { ref: 'clients' }),
      f('note', 'multiline', { maxLength: 2000, sensitive: true }),
    ],
  },
  invoices: {
    collection: 'invoices',
    titleField: 'invoice_number',
    sortField: 'issued_on',
    dateField: 'due_on',
    fields: [
      f('invoice_number', 'text', { required: true, maxLength: 60 }),
      f('client_id', 'ref', { ref: 'clients' }),
      f('project_id', 'ref', { ref: 'projects' }),
      f('currency', 'select', { required: true, options: CURRENCY_CODES, default: 'USD' }),
      f('amount_minor', 'money', { required: true, currencyField: 'currency', sensitive: true }),
      f('issued_on', 'date', { required: true }),
      f('due_on', 'date'),
      f('status', 'select', { required: true, options: ['draft', 'sent', 'void'], optionPrefix: 'invstatus', default: 'draft' }),
    ],
  },
  invoice_payments: {
    collection: 'invoice_payments',
    titleField: 'paid_on',
    sortField: 'paid_on',
    dateField: 'paid_on',
    fields: [
      f('invoice_id', 'ref', { ref: 'invoices', required: true }),
      f('amount_minor', 'money', { required: true, currencyField: '@invoice', sensitive: true }),
      f('paid_on', 'date', { required: true }),
      f('method', 'text', { maxLength: 60 }),
    ],
  },
  habit_categories: {
    collection: 'habit_categories',
    titleField: 'name',
    sortField: 'name',
    fields: [
      f('name', 'text', { required: true, maxLength: 60 }),
      f('color', 'select', { options: ['gold', 'blue', 'green', 'red', 'purple', 'gray'], optionPrefix: 'color' }),
    ],
  },
  habits: {
    collection: 'habits',
    titleField: 'name',
    sortField: 'sort_order',
    fields: [
      f('name', 'text', { required: true, maxLength: 100 }),
      f('schedule_type', 'select', { required: true, options: ['daily', 'weekdays', 'times_per_week'], optionPrefix: 'schedule', default: 'daily' }),
      f('schedule_days', 'weekdays'),
      f('times_per_week', 'integer', { min: 1, max: 7 }),
      f('category_id', 'ref', { ref: 'habit_categories' }),
      f('linked_domain', 'select', { options: DOMAINS, optionPrefix: 'domain', advanced: true }),
      f('target_quantity', 'number', { min: 0, max: 100000, advanced: true }),
      f('target_unit', 'text', { maxLength: 30, advanced: true }),
      f('status', 'select', { required: true, options: ['active', 'paused', 'archived'], optionPrefix: 'hstatus', default: 'active' }),
      f('sort_order', 'integer', { default: 0, hidden: true }),
    ],
  },
  habit_logs: {
    collection: 'habit_logs',
    titleField: 'local_date',
    sortField: 'local_date',
    dateField: 'local_date',
    fields: [
      f('habit_id', 'ref', { ref: 'habits', required: true }),
      f('local_date', 'date', { required: true }),
      f('status', 'select', { required: true, options: ['completed', 'partial', 'skipped', 'deferred', 'paused'], optionPrefix: 'hlog', default: 'completed' }),
      f('quantity', 'number', { min: 0, max: 100000 }),
      f('duration_minutes', 'integer', { min: 0, max: 1440 }),
      f('logged_at', 'datetime', { required: true, default: now, hidden: true }),
      f('note', 'multiline', { maxLength: 2000 }),
    ],
  },
  routines: {
    collection: 'routines',
    titleField: 'name',
    sortField: 'name',
    fields: [
      f('name', 'text', { required: true, maxLength: 100 }),
      f('kind', 'select', { required: true, options: ['morning', 'evening', 'custom'], optionPrefix: 'routine', default: 'morning' }),
      f('status', 'select', { required: true, options: ['active', 'paused', 'archived'], optionPrefix: 'hstatus', default: 'active' }),
    ],
  },
  routine_steps: {
    collection: 'routine_steps',
    titleField: 'title',
    sortField: 'sort_order',
    fields: [
      f('routine_id', 'ref', { ref: 'routines', required: true, hidden: true }),
      f('title', 'text', { required: true, maxLength: 200 }),
      f('estimate_minutes', 'integer', { min: 0, max: 600 }),
      f('sort_order', 'integer', { default: 0, hidden: true }),
    ],
  },
  routine_logs: {
    collection: 'routine_logs',
    titleField: 'local_date',
    sortField: 'started_at',
    fields: [
      f('routine_id', 'ref', { ref: 'routines', required: true }),
      f('local_date', 'date', { required: true }),
      f('started_at', 'datetime', { required: true }),
      f('completed_at', 'datetime'),
      f('status', 'select', { required: true, options: ['in_progress', 'completed', 'partial', 'skipped'] }),
    ],
  },
  routine_step_logs: {
    collection: 'routine_step_logs',
    titleField: 'status',
    fields: [
      f('routine_log_id', 'ref', { ref: 'routine_logs', required: true }),
      f('routine_step_id', 'ref', { ref: 'routine_steps', required: true }),
      f('status', 'select', { required: true, options: ['completed', 'skipped', 'deferred'] }),
      f('completed_at', 'datetime'),
    ],
  },
  audit_logs: {
    collection: 'audit_logs',
    titleField: 'action',
    sortField: 'occurred_at',
    fields: [f('action', 'text', { required: true }), f('entity_type', 'text', { required: true }), f('occurred_at', 'datetime', { required: true })],
  },
};

export type FieldErrors = Record<string, string>;

export class ValidationError extends Error {
  constructor(public readonly errors: FieldErrors) {
    super('validation_failed');
  }
}

const ISO_INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function isEmpty(v: unknown) {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

/** Validate a full record (after defaults applied). Returns field -> error code. */
export function validateRecord(collection: CollectionName, values: Record<string, unknown>): FieldErrors {
  const schema = SCHEMAS[collection];
  const errors: FieldErrors = {};
  for (const field of schema.fields) {
    const v = values[field.name];
    if (isEmpty(v)) {
      if (field.required) errors[field.name] = 'required';
      continue;
    }
    switch (field.type) {
      case 'text':
      case 'multiline':
        if (typeof v !== 'string') errors[field.name] = 'invalid';
        else if (field.required && v.trim() === '') errors[field.name] = 'required';
        else if (field.maxLength && v.length > field.maxLength) errors[field.name] = 'too_long';
        break;
      case 'number':
      case 'integer':
      case 'rating':
      case 'money':
        if (typeof v !== 'number' || !Number.isFinite(v)) errors[field.name] = 'invalid_number';
        else if ((field.type === 'integer' || field.type === 'money' || field.type === 'rating') && !Number.isInteger(v))
          errors[field.name] = 'integer_required';
        else if (field.type === 'money' && (v < 0 || !Number.isSafeInteger(v))) errors[field.name] = 'invalid_amount';
        else if (field.min != null && v < field.min) errors[field.name] = 'too_small';
        else if (field.max != null && v > field.max) errors[field.name] = 'too_large';
        break;
      case 'date':
        if (!isLocalDate(v)) errors[field.name] = 'invalid_date';
        break;
      case 'datetime':
        if (typeof v !== 'string' || !ISO_INSTANT_RE.test(v) || Number.isNaN(Date.parse(v))) errors[field.name] = 'invalid_date';
        break;
      case 'select':
        if (field.options && !field.options.includes(v as string)) errors[field.name] = 'invalid_option';
        break;
      case 'boolean':
        if (typeof v !== 'boolean') errors[field.name] = 'invalid';
        break;
      case 'weekdays':
        if (!Array.isArray(v) || v.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) errors[field.name] = 'invalid';
        break;
      default:
        break;
    }
  }
  // Cross-field rules
  const after = (a: string, b: string) => {
    const x = values[a];
    const y = values[b];
    if (!isEmpty(x) && !isEmpty(y) && !errors[a] && !errors[b] && String(y) < String(x)) errors[b] = 'before_start';
  };
  after('starts_at', 'ends_at');
  after('started_at', 'ended_at');
  after('starts_on', 'ends_on');
  after('issued_on', 'due_on');
  if (collection === 'habits' && values.schedule_type === 'weekdays' && isEmpty(values.schedule_days)) errors.schedule_days = 'required';
  if (collection === 'habits' && values.schedule_type === 'times_per_week' && isEmpty(values.times_per_week)) errors.times_per_week = 'required';
  if (collection === 'adhkar_logs' && values.category === 'custom' && isEmpty(values.custom_label)) errors.custom_label = 'required';
  if (collection === 'meal_items' && isEmpty(values.food_item_id) && isEmpty(values.custom_name)) errors.custom_name = 'required';
  return errors;
}

export function defaultsFor(collection: CollectionName): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of SCHEMAS[collection].fields) {
    if (field.default === undefined) continue;
    out[field.name] = typeof field.default === 'function' ? (field.default as () => unknown)() : field.default;
  }
  return out;
}
