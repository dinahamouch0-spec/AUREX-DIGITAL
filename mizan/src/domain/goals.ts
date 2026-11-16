import type { Goal, Milestone } from './types';

export interface GoalProgress {
  /** 0..1, or null when progress can't be measured */
  ratio: number | null;
  basis: 'metric' | 'milestones' | 'status' | 'none';
  done?: number;
  total?: number;
}

/**
 * Progress of one goal. Goals are never combined into a single score
 * (blueprint 09 §12): this is per-goal only.
 */
export function goalProgress(goal: Goal, milestones: Milestone[]): GoalProgress {
  if (goal.status === 'completed') return { ratio: 1, basis: 'status' };
  if (goal.metric_target != null && goal.metric_target !== 0 && goal.metric_current != null) {
    return { ratio: Math.max(0, Math.min(1, goal.metric_current / goal.metric_target)), basis: 'metric' };
  }
  const ms = milestones.filter((m) => !m.deleted_at && m.goal_id === goal.id && m.status !== 'archived');
  if (ms.length > 0) {
    const done = ms.filter((m) => m.status === 'completed').length;
    return { ratio: done / ms.length, basis: 'milestones', done, total: ms.length };
  }
  return { ratio: null, basis: 'none' };
}
