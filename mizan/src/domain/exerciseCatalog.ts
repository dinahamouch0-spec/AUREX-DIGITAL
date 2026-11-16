/**
 * Small built-in exercise catalog (text only — no images/media, since none
 * are licensed). IDs are stable strings prefixed "builtin:". Users can add
 * their own exercises (stored in the `exercises` collection).
 */
export interface CatalogExercise {
  id: string;
  name: string;
  name_ar: string;
  primary_muscles: string;
  secondary_muscles?: string;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
  common_mistakes: string;
}

export const EXERCISE_CATALOG: CatalogExercise[] = [
  { id: 'builtin:push_up', name: 'Push-up', name_ar: 'ضغط', primary_muscles: 'chest', secondary_muscles: 'triceps, shoulders', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Hands under shoulders, body in a straight line, lower chest towards the floor, push back up.', common_mistakes: 'Sagging hips; flaring elbows wide; partial range of motion.' },
  { id: 'builtin:squat', name: 'Bodyweight squat', name_ar: 'سكوات بوزن الجسم', primary_muscles: 'quadriceps, glutes', secondary_muscles: 'hamstrings', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Feet shoulder-width, sit hips back and down, keep chest up and heels down, stand back up.', common_mistakes: 'Knees caving inwards; heels lifting; rounding the back.' },
  { id: 'builtin:goblet_squat', name: 'Goblet squat', name_ar: 'سكوات بالدمبل', primary_muscles: 'quadriceps, glutes', secondary_muscles: 'core', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Hold one dumbbell at the chest, squat down between the knees, stand up tall.', common_mistakes: 'Leaning forward; letting the weight pull you down.' },
  { id: 'builtin:lunge', name: 'Lunge', name_ar: 'طعنات', primary_muscles: 'quadriceps, glutes', secondary_muscles: 'hamstrings', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Step forward, lower until both knees are bent about 90°, push back to start.', common_mistakes: 'Front knee collapsing inward; short steps.' },
  { id: 'builtin:plank', name: 'Plank', name_ar: 'بلانك', primary_muscles: 'core', secondary_muscles: 'shoulders', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Forearms under shoulders, body straight from head to heels; hold. Log seconds as reps.', common_mistakes: 'Hips too high or sagging; holding breath.' },
  { id: 'builtin:pull_up', name: 'Pull-up', name_ar: 'عقلة', primary_muscles: 'back', secondary_muscles: 'biceps', equipment: 'pull-up bar', difficulty: 'intermediate', instructions: 'Hang with straight arms, pull until chin passes the bar, lower under control.', common_mistakes: 'Kipping/swinging; not reaching full extension.' },
  { id: 'builtin:inverted_row', name: 'Inverted row', name_ar: 'سحب مقلوب', primary_muscles: 'back', secondary_muscles: 'biceps', equipment: 'bar / table', difficulty: 'beginner', instructions: 'Lie under a sturdy bar, keep body straight, pull chest to the bar.', common_mistakes: 'Hips dropping; shrugging shoulders.' },
  { id: 'builtin:db_row', name: 'Dumbbell row', name_ar: 'سحب بالدمبل', primary_muscles: 'back', secondary_muscles: 'biceps', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Support one hand on a bench, pull the dumbbell towards the hip, lower slowly.', common_mistakes: 'Twisting the torso; jerking the weight.' },
  { id: 'builtin:bench_press', name: 'Bench press', name_ar: 'ضغط بنش', primary_muscles: 'chest', secondary_muscles: 'triceps, shoulders', equipment: 'barbell', difficulty: 'intermediate', instructions: 'Lie on the bench, lower the bar to mid-chest, press up. Always use a spotter or safety arms.', common_mistakes: 'Bouncing the bar; lifting hips; training without a spotter.' },
  { id: 'builtin:db_press', name: 'Dumbbell shoulder press', name_ar: 'ضغط أكتاف بالدمبل', primary_muscles: 'shoulders', secondary_muscles: 'triceps', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Press dumbbells from shoulder height to overhead, lower with control.', common_mistakes: 'Arching the lower back; locking out aggressively.' },
  { id: 'builtin:deadlift', name: 'Romanian deadlift', name_ar: 'رفعة رومانية', primary_muscles: 'hamstrings, glutes', secondary_muscles: 'lower back', equipment: 'barbell / dumbbell', difficulty: 'intermediate', instructions: 'Soft knees, hinge at the hips with a flat back, lower the weight along the legs, return.', common_mistakes: 'Rounding the back; bending the knees into a squat.' },
  { id: 'builtin:glute_bridge', name: 'Glute bridge', name_ar: 'جسر الألوية', primary_muscles: 'glutes', secondary_muscles: 'hamstrings', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Lie on your back, knees bent, drive hips up, squeeze, lower.', common_mistakes: 'Overarching the lower back.' },
  { id: 'builtin:bicep_curl', name: 'Biceps curl', name_ar: 'تمرين البايسبس', primary_muscles: 'biceps', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Elbows by your sides, curl the weights up, lower slowly.', common_mistakes: 'Swinging the body; moving elbows forward.' },
  { id: 'builtin:triceps_dip', name: 'Bench dip', name_ar: 'غطس ترايسبس', primary_muscles: 'triceps', secondary_muscles: 'chest, shoulders', equipment: 'bench', difficulty: 'beginner', instructions: 'Hands on bench behind you, lower by bending elbows, push back up.', common_mistakes: 'Going too deep and straining the shoulders.' },
  { id: 'builtin:calf_raise', name: 'Calf raise', name_ar: 'رفع السمانة', primary_muscles: 'calves', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Rise onto the balls of your feet, pause, lower slowly.', common_mistakes: 'Bouncing; partial range.' },
  { id: 'builtin:jump_rope', name: 'Jump rope', name_ar: 'نط الحبل', primary_muscles: 'cardio', secondary_muscles: 'calves', equipment: 'rope', difficulty: 'beginner', instructions: 'Light, quick jumps on the balls of the feet. Log minutes as reps.', common_mistakes: 'Jumping too high; landing on heels.' },
  { id: 'builtin:running', name: 'Running', name_ar: 'جري', primary_muscles: 'cardio', secondary_muscles: 'legs', equipment: 'none', difficulty: 'beginner', instructions: 'Comfortable pace you can talk at. Log minutes as reps.', common_mistakes: 'Increasing distance too fast.' },
];
