/**
 * Built-in exercise library.
 *
 * - IDs are stable strings prefixed "builtin:" and are stored in workout_sets.exercise_id,
 *   so existing IDs must never be renamed or removed.
 * - Every exercise is a standard, widely taught movement. Instructions are general
 *   coaching cues, not medical advice.
 * - Sets / reps / rest are guideline ranges (typical hypertrophy / strength practice),
 *   meant as a starting point the user adjusts.
 * - Illustrations are drawn in-app as a muscle map (src/ui/MuscleMap.tsx) that highlights
 *   the listed primary and secondary muscles — no photos, so nothing can mismatch.
 */

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'abs' | 'calves' | 'forearms' | 'cardio';
export const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs', 'calves', 'forearms', 'cardio'];

export type Muscle =
  | 'chest'
  | 'upper_chest'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'traps'
  | 'lats'
  | 'upper_back'
  | 'lower_back'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'adductors'
  | 'calves'
  | 'heart';
export const MUSCLES: Muscle[] = ['chest', 'upper_chest', 'front_delts', 'side_delts', 'rear_delts', 'traps', 'lats', 'upper_back', 'lower_back', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'quads', 'hamstrings', 'glutes', 'adductors', 'calves', 'heart'];

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'bench'
  | 'pullup_bar'
  | 'ez_bar'
  | 'band'
  | 'rope'
  | 'cardio_machine'
  | 'none';
export const EQUIPMENT: Equipment[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'bench', 'pullup_bar', 'ez_bar', 'band', 'rope', 'cardio_machine', 'none'];

export type ExerciseKind = 'compound' | 'isolation' | 'cardio' | 'core';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
/** What one "rep" means when logging. */
export type RepUnit = 'reps' | 'seconds' | 'minutes';

export interface Prescription {
  sets: [number, number];
  reps: [number, number];
  unit: RepUnit;
  /** rest between sets, seconds */
  rest: [number, number];
}

export interface CatalogExercise {
  id: string;
  name: string;
  name_ar: string;
  group: MuscleGroup;
  primary: Muscle[];
  secondary: Muscle[];
  equipment: Equipment[];
  kind: ExerciseKind;
  difficulty: Difficulty;
  prescription: Prescription;
  steps: string[];
  steps_ar: string[];
  mistakes: string[];
  mistakes_ar: string[];
  alternatives: string[];
  /** legacy text fields kept for screens/exports that read them */
  primary_muscles: string;
  secondary_muscles?: string;
  instructions: string;
  common_mistakes: string;
}

const P = {
  strength: { sets: [3, 5], reps: [5, 8], unit: 'reps', rest: [120, 180] },
  compound: { sets: [3, 4], reps: [8, 12], unit: 'reps', rest: [90, 120] },
  isolation: { sets: [3, 4], reps: [10, 15], unit: 'reps', rest: [60, 90] },
  bodyweight: { sets: [3, 4], reps: [8, 15], unit: 'reps', rest: [60, 90] },
  pullups: { sets: [3, 4], reps: [5, 10], unit: 'reps', rest: [90, 150] },
  coreReps: { sets: [3, 3], reps: [12, 20], unit: 'reps', rest: [45, 60] },
  coreHold: { sets: [3, 3], reps: [20, 60], unit: 'seconds', rest: [45, 60] },
  calves: { sets: [3, 4], reps: [10, 20], unit: 'reps', rest: [45, 60] },
  carry: { sets: [3, 4], reps: [30, 60], unit: 'seconds', rest: [60, 90] },
  steady: { sets: [1, 1], reps: [15, 45], unit: 'minutes', rest: [0, 0] },
  intervals: { sets: [6, 10], reps: [20, 60], unit: 'seconds', rest: [60, 120] },
} satisfies Record<string, Prescription>;

type Def = Omit<CatalogExercise, 'id' | 'primary_muscles' | 'secondary_muscles' | 'instructions' | 'common_mistakes'> & { id: string };

function def(d: Def): CatalogExercise {
  return {
    ...d,
    id: `builtin:${d.id}`,
    alternatives: d.alternatives.map((a) => `builtin:${a}`),
    primary_muscles: d.primary.join(', '),
    secondary_muscles: d.secondary.length ? d.secondary.join(', ') : undefined,
    instructions: d.steps.join(' '),
    common_mistakes: d.mistakes.join(' '),
  };
}

const DEFS: Def[] = [
  // ------------------------------------------------------------------ chest
  {
    id: 'bench_press', name: 'Barbell bench press', name_ar: 'ضغط بنش بالبار', group: 'chest', primary: ['chest'], secondary: ['triceps', 'front_delts'], equipment: ['barbell', 'bench'], kind: 'compound', difficulty: 'intermediate', prescription: P.strength,
    steps: ['Lie on the bench with eyes under the bar and feet flat.', 'Grip slightly wider than shoulders, squeeze shoulder blades together.', 'Lower the bar under control to mid-chest.', 'Press up and slightly back to straight arms. Use a spotter or safety arms.'],
    steps_ar: ['استلقِ على البنش بحيث تكون عيناك تحت البار والقدمان ثابتتين على الأرض.', 'امسك البار أعرض قليلاً من الكتفين واضمم لوحي الكتفين.', 'أنزل البار بتحكم إلى منتصف الصدر.', 'ادفع للأعلى حتى استقامة الذراعين. استخدم مساعداً أو مساند أمان.'],
    mistakes: ['Bouncing the bar off the chest.', 'Lifting the hips off the bench.'], mistakes_ar: ['ارتداد البار عن الصدر.', 'رفع الحوض عن البنش.'],
    alternatives: ['db_bench_press', 'machine_chest_press', 'push_up'],
  },
  {
    id: 'incline_bench_press', name: 'Incline barbell bench press', name_ar: 'ضغط بنش مائل بالبار', group: 'chest', primary: ['upper_chest'], secondary: ['front_delts', 'triceps'], equipment: ['barbell', 'bench'], kind: 'compound', difficulty: 'intermediate', prescription: P.compound,
    steps: ['Set the bench to 30–45°.', 'Unrack with a shoulder-width-plus grip and shoulder blades pulled back.', 'Lower the bar to the upper chest.', 'Press back up over the shoulders.'],
    steps_ar: ['اضبط البنش على زاوية ٣٠–٤٥ درجة.', 'ارفع البار بقبضة أعرض قليلاً من الكتفين مع ضم لوحي الكتفين.', 'أنزل البار إلى أعلى الصدر.', 'ادفع للأعلى فوق الكتفين.'],
    mistakes: ['Bench set too steep, turning it into a shoulder press.', 'Flaring elbows straight out.'], mistakes_ar: ['زاوية حادة جداً تحوّله إلى تمرين أكتاف.', 'فتح المرفقين بشكل جانبي كامل.'],
    alternatives: ['incline_db_press', 'bench_press'],
  },
  {
    id: 'db_bench_press', name: 'Dumbbell bench press', name_ar: 'ضغط صدر بالدمبل', group: 'chest', primary: ['chest'], secondary: ['triceps', 'front_delts'], equipment: ['dumbbell', 'bench'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Sit with dumbbells on your thighs, then lie back and bring them to chest level.', 'Keep shoulder blades back and wrists stacked over elbows.', 'Lower until a stretch is felt in the chest.', 'Press up until arms are straight.'],
    steps_ar: ['اجلس والدمبلز على فخذيك ثم استلقِ وارفعهما إلى مستوى الصدر.', 'حافظ على ضم لوحي الكتفين والرسغين فوق المرفقين.', 'أنزل حتى تشعر بتمدد في الصدر.', 'ادفع للأعلى حتى استقامة الذراعين.'],
    mistakes: ['Dropping the dumbbells too low and losing control.', 'Clanking the weights together at the top.'], mistakes_ar: ['إنزال الدمبلز أكثر من اللازم وفقدان التحكم.', 'ضرب الدمبلز ببعضهما في الأعلى.'],
    alternatives: ['bench_press', 'push_up', 'machine_chest_press'],
  },
  {
    id: 'incline_db_press', name: 'Incline dumbbell press', name_ar: 'ضغط صدر مائل بالدمبل', group: 'chest', primary: ['upper_chest'], secondary: ['front_delts', 'triceps'], equipment: ['dumbbell', 'bench'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Set the bench to an incline (30–45°).', 'Hold the dumbbells at chest level.', 'Press up until arms are extended.', 'Lower slowly to the start.'],
    steps_ar: ['اضبط البنش على زاوية مائلة (٣٠–٤٥ درجة).', 'أمسك الدمبلز على مستوى الصدر.', 'ادفع للأعلى حتى تمتد الذراعان.', 'أنزل ببطء إلى وضع البداية.'],
    mistakes: ['Arching the lower back off the bench.', 'Using momentum instead of control.'], mistakes_ar: ['تقوّس أسفل الظهر عن البنش.', 'الاعتماد على الاندفاع بدل التحكم.'],
    alternatives: ['incline_bench_press', 'db_bench_press'],
  },
  {
    id: 'db_fly', name: 'Dumbbell fly', name_ar: 'تفتيح صدر بالدمبل', group: 'chest', primary: ['chest'], secondary: ['front_delts'], equipment: ['dumbbell', 'bench'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Lie on a flat bench with dumbbells above the chest, palms facing.', 'Keep a slight bend in the elbows.', 'Open the arms in a wide arc until a stretch is felt.', 'Bring the weights back together over the chest.'],
    steps_ar: ['استلقِ على بنش مستوٍ والدمبلز فوق الصدر والكفان متقابلان.', 'حافظ على انثناء خفيف في المرفقين.', 'افتح الذراعين بقوس واسع حتى تشعر بالتمدد.', 'أعد الدمبلز معاً فوق الصدر.'],
    mistakes: ['Bending the elbows so much it becomes a press.', 'Going too heavy and over-stretching the shoulders.'], mistakes_ar: ['ثني المرفقين كثيراً فيتحول إلى ضغط.', 'أوزان ثقيلة تُجهد الكتفين.'],
    alternatives: ['cable_crossover', 'pec_deck'],
  },
  {
    id: 'cable_crossover', name: 'Cable crossover', name_ar: 'تقاطع الكابل', group: 'chest', primary: ['chest'], secondary: ['front_delts'], equipment: ['cable'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Set both pulleys high and take a handle in each hand.', 'Step forward with a staggered stance and a slight forward lean.', 'Bring the hands together in front of the chest in an arc.', 'Return slowly until the chest is stretched.'],
    steps_ar: ['اضبط البكرتين في الأعلى وأمسك مقبضاً بكل يد.', 'تقدّم خطوة بوقفة متقدمة وانحناء خفيف للأمام.', 'اجمع اليدين أمام الصدر بحركة قوسية.', 'ارجع ببطء حتى يتمدد الصدر.'],
    mistakes: ['Pulling with the arms instead of the chest.', 'Letting the weight stack slam.'], mistakes_ar: ['السحب بالذراعين بدل الصدر.', 'ترك الأوزان ترتطم.'],
    alternatives: ['db_fly', 'pec_deck'],
  },
  {
    id: 'pec_deck', name: 'Pec deck (machine fly)', name_ar: 'جهاز الفراشة للصدر', group: 'chest', primary: ['chest'], secondary: [], equipment: ['machine'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Adjust the seat so the handles are at chest height.', 'Sit tall with the back against the pad.', 'Bring the handles together in front of you.', 'Return with control.'],
    steps_ar: ['اضبط المقعد بحيث تكون المقابض على مستوى الصدر.', 'اجلس مستقيماً والظهر ملاصق للمسند.', 'اجمع المقابض أمامك.', 'ارجع بتحكم.'],
    mistakes: ['Shrugging the shoulders up.', 'Letting the arms go too far back.'], mistakes_ar: ['رفع الكتفين نحو الأذنين.', 'إرجاع الذراعين أكثر من اللازم للخلف.'],
    alternatives: ['db_fly', 'cable_crossover'],
  },
  {
    id: 'machine_chest_press', name: 'Machine chest press', name_ar: 'ضغط صدر على الجهاز', group: 'chest', primary: ['chest'], secondary: ['triceps', 'front_delts'], equipment: ['machine'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Set the seat so the handles line up with mid-chest.', 'Keep the back against the pad and shoulder blades back.', 'Press the handles forward to near-straight arms.', 'Return slowly.'],
    steps_ar: ['اضبط المقعد ليكون المقبض بمحاذاة منتصف الصدر.', 'أبقِ الظهر على المسند ولوحي الكتفين مضمومين.', 'ادفع المقابض للأمام حتى تقارب الاستقامة.', 'ارجع ببطء.'],
    mistakes: ['Seat too low or too high.', 'Locking the elbows hard.'], mistakes_ar: ['مقعد منخفض أو مرتفع جداً.', 'قفل المرفقين بقوة.'],
    alternatives: ['db_bench_press', 'bench_press'],
  },
  {
    id: 'push_up', name: 'Push-up', name_ar: 'ضغط (بوش أب)', group: 'chest', primary: ['chest'], secondary: ['triceps', 'front_delts', 'abs'], equipment: ['bodyweight'], kind: 'compound', difficulty: 'beginner', prescription: P.bodyweight,
    steps: ['Hands slightly wider than shoulders, body in a straight line.', 'Brace the core and glutes.', 'Lower the chest towards the floor, elbows about 45° from the body.', 'Push back up to straight arms.'],
    steps_ar: ['اليدان أعرض قليلاً من الكتفين والجسم مستقيم.', 'شدّ البطن والألوية.', 'أنزل الصدر نحو الأرض والمرفقان بزاوية ٤٥ درجة تقريباً.', 'ادفع للأعلى حتى استقامة الذراعين.'],
    mistakes: ['Sagging hips.', 'Partial range of motion.'], mistakes_ar: ['هبوط الحوض.', 'مدى حركة ناقص.'],
    alternatives: ['db_bench_press', 'machine_chest_press'],
  },
  {
    id: 'chest_dip', name: 'Chest dip', name_ar: 'متوازي للصدر', group: 'chest', primary: ['chest'], secondary: ['triceps', 'front_delts'], equipment: ['bodyweight'], kind: 'compound', difficulty: 'intermediate', prescription: P.bodyweight,
    steps: ['Support yourself on parallel bars with straight arms.', 'Lean the torso slightly forward.', 'Lower until the upper arms are about parallel to the floor.', 'Press back up.'],
    steps_ar: ['ارتكز على المتوازي والذراعان مستقيمتان.', 'أمِل الجذع قليلاً للأمام.', 'انزل حتى يصبح العضد موازياً للأرض تقريباً.', 'ادفع للأعلى.'],
    mistakes: ['Dropping too deep and straining the shoulders.', 'Swinging the legs.'], mistakes_ar: ['النزول عميقاً جداً وإجهاد الكتفين.', 'أرجحة الساقين.'],
    alternatives: ['push_up', 'db_bench_press'],
  },

  // ------------------------------------------------------------------ back
  {
    id: 'pull_up', name: 'Pull-up', name_ar: 'عقلة', group: 'back', primary: ['lats'], secondary: ['biceps', 'upper_back'], equipment: ['pullup_bar'], kind: 'compound', difficulty: 'intermediate', prescription: P.pullups,
    steps: ['Hang from the bar with an overhand grip a little wider than shoulders.', 'Pull the shoulder blades down and back.', 'Pull until the chin passes the bar.', 'Lower under control to a full hang.'],
    steps_ar: ['تعلّق بالبار بقبضة علوية أعرض قليلاً من الكتفين.', 'اسحب لوحي الكتفين للأسفل والخلف.', 'اسحب حتى يتجاوز الذقن البار.', 'انزل بتحكم حتى التعلق الكامل.'],
    mistakes: ['Kipping or swinging.', 'Stopping short of full extension.'], mistakes_ar: ['الأرجحة واستخدام الاندفاع.', 'عدم الوصول للامتداد الكامل.'],
    alternatives: ['lat_pulldown', 'chin_up', 'inverted_row'],
  },
  {
    id: 'chin_up', name: 'Chin-up', name_ar: 'عقلة بقبضة عكسية', group: 'back', primary: ['lats', 'biceps'], secondary: ['upper_back'], equipment: ['pullup_bar'], kind: 'compound', difficulty: 'intermediate', prescription: P.pullups,
    steps: ['Hang with an underhand, shoulder-width grip.', 'Brace the core and keep the legs still.', 'Pull the chest towards the bar.', 'Lower slowly to a full hang.'],
    steps_ar: ['تعلّق بقبضة سفلية بعرض الكتفين.', 'شدّ البطن وثبّت الساقين.', 'اسحب الصدر نحو البار.', 'انزل ببطء حتى التعلق الكامل.'],
    mistakes: ['Half reps.', 'Craning the neck to reach the bar.'], mistakes_ar: ['تكرارات نصفية.', 'مدّ الرقبة للوصول إلى البار.'],
    alternatives: ['pull_up', 'lat_pulldown'],
  },
  {
    id: 'lat_pulldown', name: 'Lat pulldown', name_ar: 'سحب أمامي على الجهاز', group: 'back', primary: ['lats'], secondary: ['biceps', 'upper_back'], equipment: ['cable', 'machine'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Sit with thighs under the pads and grip the bar wider than shoulders.', 'Lean back slightly with the chest up.', 'Pull the bar to the upper chest, driving the elbows down.', 'Let the bar rise slowly to a full stretch.'],
    steps_ar: ['اجلس والفخذان تحت المساند وامسك البار أعرض من الكتفين.', 'مِل للخلف قليلاً مع رفع الصدر.', 'اسحب البار إلى أعلى الصدر بدفع المرفقين للأسفل.', 'اترك البار يرتفع ببطء حتى التمدد الكامل.'],
    mistakes: ['Pulling the bar behind the neck.', 'Leaning far back and using body swing.'], mistakes_ar: ['سحب البار خلف الرقبة.', 'الميل الشديد للخلف والأرجحة.'],
    alternatives: ['pull_up', 'straight_arm_pulldown'],
  },
  {
    id: 'seated_cable_row', name: 'Seated cable row', name_ar: 'سحب أرضي بالكابل', group: 'back', primary: ['upper_back', 'lats'], secondary: ['biceps', 'rear_delts'], equipment: ['cable'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Sit with feet on the platform and knees slightly bent.', 'Hold the handle with a tall chest.', 'Row the handle to the lower ribs, squeezing the shoulder blades.', 'Extend the arms slowly without rounding.'],
    steps_ar: ['اجلس والقدمان على المسند والركبتان منثنيتان قليلاً.', 'أمسك المقبض مع رفع الصدر.', 'اسحب المقبض نحو أسفل الأضلاع مع ضم لوحي الكتفين.', 'مدّ الذراعين ببطء دون تقويس الظهر.'],
    mistakes: ['Rocking the torso back and forth.', 'Shrugging the shoulders.'], mistakes_ar: ['هزّ الجذع للأمام والخلف.', 'رفع الكتفين.'],
    alternatives: ['db_row', 'barbell_row'],
  },
  {
    id: 'barbell_row', name: 'Barbell row', name_ar: 'سحب بالبار منحنياً', group: 'back', primary: ['upper_back', 'lats'], secondary: ['biceps', 'rear_delts', 'lower_back'], equipment: ['barbell'], kind: 'compound', difficulty: 'intermediate', prescription: P.compound,
    steps: ['Hinge at the hips with a flat back, torso about 45°.', 'Hold the bar just outside the knees.', 'Pull the bar to the lower chest / upper stomach.', 'Lower with control, keeping the back flat.'],
    steps_ar: ['انحنِ من الحوض بظهر مستقيم والجذع بزاوية ٤٥ درجة تقريباً.', 'أمسك البار خارج الركبتين مباشرة.', 'اسحب البار إلى أسفل الصدر وأعلى البطن.', 'أنزل بتحكم مع إبقاء الظهر مستقيماً.'],
    mistakes: ['Rounding the lower back.', 'Standing up more with every rep.'], mistakes_ar: ['تقوّس أسفل الظهر.', 'الاستقامة أكثر مع كل تكرار.'],
    alternatives: ['db_row', 'seated_cable_row', 't_bar_row'],
  },
  {
    id: 'db_row', name: 'One-arm dumbbell row', name_ar: 'سحب بالدمبل بيد واحدة', group: 'back', primary: ['lats', 'upper_back'], secondary: ['biceps', 'rear_delts'], equipment: ['dumbbell', 'bench'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Support one hand and knee on a bench, back flat.', 'Hold the dumbbell with the free arm straight.', 'Pull the dumbbell towards the hip.', 'Lower slowly to a full stretch.'],
    steps_ar: ['ارتكز بيد وركبة على البنش والظهر مستقيم.', 'أمسك الدمبل باليد الأخرى ممدودة.', 'اسحب الدمبل نحو الورك.', 'أنزل ببطء حتى التمدد الكامل.'],
    mistakes: ['Twisting the torso to lift the weight.', 'Jerking the dumbbell.'], mistakes_ar: ['لفّ الجذع لرفع الوزن.', 'سحب الدمبل بعنف.'],
    alternatives: ['barbell_row', 'seated_cable_row'],
  },
  {
    id: 't_bar_row', name: 'T-bar row', name_ar: 'سحب تي بار', group: 'back', primary: ['upper_back', 'lats'], secondary: ['biceps', 'lower_back'], equipment: ['barbell', 'machine'], kind: 'compound', difficulty: 'intermediate', prescription: P.compound,
    steps: ['Straddle the bar and hinge forward with a flat back.', 'Grip the handle close to the plates.', 'Row the weight towards the chest.', 'Lower with control.'],
    steps_ar: ['قف فوق البار وانحنِ للأمام بظهر مستقيم.', 'أمسك المقبض قرب الأوزان.', 'اسحب الوزن نحو الصدر.', 'أنزل بتحكم.'],
    mistakes: ['Rounding the back.', 'Using the legs to heave the weight.'], mistakes_ar: ['تقويس الظهر.', 'استخدام الساقين لرفع الوزن.'],
    alternatives: ['barbell_row', 'seated_cable_row'],
  },
  {
    id: 'inverted_row', name: 'Inverted row', name_ar: 'سحب مقلوب', group: 'back', primary: ['upper_back'], secondary: ['biceps', 'lats'], equipment: ['bodyweight', 'barbell'], kind: 'compound', difficulty: 'beginner', prescription: P.bodyweight,
    steps: ['Lie under a fixed bar at about waist height.', 'Grip it and keep the body straight from head to heels.', 'Pull the chest to the bar.', 'Lower under control.'],
    steps_ar: ['استلقِ تحت بار ثابت بارتفاع الخصر تقريباً.', 'امسكه وأبقِ الجسم مستقيماً من الرأس للكعبين.', 'اسحب الصدر نحو البار.', 'انزل بتحكم.'],
    mistakes: ['Hips dropping.', 'Shrugging instead of rowing.'], mistakes_ar: ['هبوط الحوض.', 'رفع الكتفين بدل السحب.'],
    alternatives: ['pull_up', 'seated_cable_row'],
  },
  {
    id: 'straight_arm_pulldown', name: 'Straight-arm pulldown', name_ar: 'سحب بذراعين مستقيمتين', group: 'back', primary: ['lats'], secondary: ['triceps'], equipment: ['cable'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Stand facing a high pulley, holding a bar with straight arms.', 'Hinge slightly forward.', 'Sweep the bar down to the thighs, keeping arms straight.', 'Return slowly overhead.'],
    steps_ar: ['قف مقابل بكرة عالية وامسك البار بذراعين مستقيمتين.', 'انحنِ للأمام قليلاً.', 'اسحب البار إلى الفخذين مع إبقاء الذراعين مستقيمتين.', 'أعده ببطء للأعلى.'],
    mistakes: ['Bending the elbows into a pushdown.', 'Using the torso to swing.'], mistakes_ar: ['ثني المرفقين فيصبح تمرين ترايسبس.', 'استخدام الجذع للأرجحة.'],
    alternatives: ['lat_pulldown'],
  },
  {
    id: 'conventional_deadlift', name: 'Deadlift', name_ar: 'رفعة ميتة', group: 'back', primary: ['lower_back', 'glutes', 'hamstrings'], secondary: ['quads', 'traps', 'forearms'], equipment: ['barbell'], kind: 'compound', difficulty: 'advanced', prescription: P.strength,
    steps: ['Stand with mid-foot under the bar, feet hip-width.', 'Hinge and grip the bar just outside the legs; flatten the back.', 'Push the floor away and stand up, bar close to the legs.', 'Lower by hinging the hips back first.'],
    steps_ar: ['قف ومنتصف القدم تحت البار والقدمان بعرض الورك.', 'انحنِ وامسك البار خارج الساقين مع استقامة الظهر.', 'ادفع الأرض وقف بالبار قريباً من الساقين.', 'أنزل بدفع الحوض للخلف أولاً.'],
    mistakes: ['Rounding the lower back.', 'Letting the bar drift away from the body.'], mistakes_ar: ['تقويس أسفل الظهر.', 'ابتعاد البار عن الجسم.'],
    alternatives: ['deadlift', 'hip_thrust', 'back_extension'],
  },
  {
    id: 'back_extension', name: 'Back extension', name_ar: 'تمديد الظهر', group: 'back', primary: ['lower_back'], secondary: ['glutes', 'hamstrings'], equipment: ['bench', 'bodyweight'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Set the hip pad just below the hip bones.', 'Cross the arms on the chest.', 'Lower the torso by hinging at the hips.', 'Rise until the body is in a straight line — not beyond.'],
    steps_ar: ['اضبط مسند الحوض أسفل عظام الورك.', 'ضع الذراعين متقاطعتين على الصدر.', 'أنزل الجذع بالانحناء من الحوض.', 'ارتفع حتى يستقيم الجسم دون تجاوز ذلك.'],
    mistakes: ['Hyperextending at the top.', 'Moving fast with momentum.'], mistakes_ar: ['التقوس الزائد في الأعلى.', 'الحركة السريعة بالاندفاع.'],
    alternatives: ['deadlift', 'glute_bridge'],
  },
  {
    id: 'shrug', name: 'Dumbbell shrug', name_ar: 'رفع الأكتاف بالدمبل (ترابيس)', group: 'back', primary: ['traps'], secondary: ['forearms'], equipment: ['dumbbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Stand tall holding dumbbells at your sides.', 'Raise the shoulders straight up towards the ears.', 'Pause briefly.', 'Lower slowly.'],
    steps_ar: ['قف مستقيماً والدمبلز بجانبيك.', 'ارفع الكتفين مباشرة نحو الأذنين.', 'توقف لحظة.', 'أنزل ببطء.'],
    mistakes: ['Rolling the shoulders in circles.', 'Bending the elbows.'], mistakes_ar: ['تدوير الكتفين.', 'ثني المرفقين.'],
    alternatives: ['farmers_walk'],
  },

  // ------------------------------------------------------------------ shoulders
  {
    id: 'overhead_press', name: 'Barbell overhead press', name_ar: 'ضغط أكتاف بالبار واقفاً', group: 'shoulders', primary: ['front_delts'], secondary: ['side_delts', 'triceps', 'abs'], equipment: ['barbell'], kind: 'compound', difficulty: 'intermediate', prescription: P.strength,
    steps: ['Hold the bar at the front of the shoulders, grip just outside them.', 'Brace the core and squeeze the glutes.', 'Press the bar overhead, moving the head back slightly to clear it.', 'Lower to the shoulders with control.'],
    steps_ar: ['أمسك البار أمام الكتفين بقبضة أعرض منهما قليلاً.', 'شدّ البطن والألوية.', 'ادفع البار فوق الرأس مع إرجاع الرأس قليلاً.', 'أنزله إلى الكتفين بتحكم.'],
    mistakes: ['Leaning back and arching the lower back.', 'Pressing the bar forward instead of overhead.'], mistakes_ar: ['الميل للخلف وتقوس أسفل الظهر.', 'دفع البار للأمام بدل الأعلى.'],
    alternatives: ['db_press', 'arnold_press'],
  },
  {
    id: 'db_press', name: 'Dumbbell shoulder press', name_ar: 'ضغط أكتاف بالدمبل', group: 'shoulders', primary: ['front_delts'], secondary: ['side_delts', 'triceps'], equipment: ['dumbbell', 'bench'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Sit on an upright bench with dumbbells at shoulder height.', 'Keep the back against the pad.', 'Press the dumbbells overhead.', 'Lower to shoulder height with control.'],
    steps_ar: ['اجلس على بنش عمودي والدمبلز بمستوى الكتفين.', 'أبقِ الظهر على المسند.', 'ادفع الدمبلز فوق الرأس.', 'أنزلها إلى مستوى الكتفين بتحكم.'],
    mistakes: ['Arching the lower back.', 'Cutting the range short.'], mistakes_ar: ['تقوس أسفل الظهر.', 'تقصير مدى الحركة.'],
    alternatives: ['overhead_press', 'arnold_press'],
  },
  {
    id: 'arnold_press', name: 'Arnold press', name_ar: 'ضغط أرنولد', group: 'shoulders', primary: ['front_delts', 'side_delts'], secondary: ['triceps'], equipment: ['dumbbell'], kind: 'compound', difficulty: 'intermediate', prescription: P.compound,
    steps: ['Start with dumbbells in front of the shoulders, palms facing you.', 'Press up while rotating the palms to face forward.', 'Finish with arms overhead.', 'Reverse the rotation as you lower.'],
    steps_ar: ['ابدأ والدمبلز أمام الكتفين والكفان باتجاهك.', 'ادفع للأعلى مع تدوير الكفين للأمام.', 'أنهِ الحركة والذراعان فوق الرأس.', 'اعكس الدوران أثناء الإنزال.'],
    mistakes: ['Rushing the rotation.', 'Going too heavy.'], mistakes_ar: ['استعجال الدوران.', 'أوزان ثقيلة جداً.'],
    alternatives: ['db_press'],
  },
  {
    id: 'lateral_raise', name: 'Dumbbell lateral raise', name_ar: 'رفرفة جانبي بالدمبل', group: 'shoulders', primary: ['side_delts'], secondary: ['traps'], equipment: ['dumbbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Stand with dumbbells at your sides, slight bend in the elbows.', 'Raise the arms out to the sides to shoulder height.', 'Lead with the elbows.', 'Lower slowly.'],
    steps_ar: ['قف والدمبلز بجانبيك مع انثناء خفيف في المرفقين.', 'ارفع الذراعين جانباً حتى مستوى الكتفين.', 'اجعل المرفقين يقودان الحركة.', 'أنزل ببطء.'],
    mistakes: ['Swinging the body.', 'Raising above shoulder height with shrugging.'], mistakes_ar: ['أرجحة الجسم.', 'الرفع فوق مستوى الكتف مع رفع الكتفين.'],
    alternatives: ['cable_lateral_raise'],
  },
  {
    id: 'cable_lateral_raise', name: 'Cable lateral raise', name_ar: 'رفرفة جانبي بالكابل', group: 'shoulders', primary: ['side_delts'], secondary: [], equipment: ['cable'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Set a pulley low and stand side-on to it.', 'Hold the handle with the far hand.', 'Raise the arm out to shoulder height.', 'Lower slowly against the cable.'],
    steps_ar: ['اضبط البكرة في الأسفل وقف بجانبها.', 'أمسك المقبض باليد البعيدة.', 'ارفع الذراع جانباً حتى مستوى الكتف.', 'أنزل ببطء مقاوماً الكابل.'],
    mistakes: ['Leaning away to cheat the weight up.', 'Bending the elbow more as you lift.'], mistakes_ar: ['الميل بعيداً للغش في الرفع.', 'زيادة ثني المرفق أثناء الرفع.'],
    alternatives: ['lateral_raise'],
  },
  {
    id: 'front_raise', name: 'Dumbbell front raise', name_ar: 'رفرفة أمامي بالدمبل', group: 'shoulders', primary: ['front_delts'], secondary: ['upper_chest'], equipment: ['dumbbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Stand with dumbbells in front of the thighs.', 'Raise one or both arms forward to shoulder height.', 'Keep a slight bend in the elbows.', 'Lower with control.'],
    steps_ar: ['قف والدمبلز أمام الفخذين.', 'ارفع ذراعاً أو الاثنتين للأمام حتى مستوى الكتف.', 'حافظ على انثناء خفيف في المرفقين.', 'أنزل بتحكم.'],
    mistakes: ['Swinging the torso.', 'Raising too high.'], mistakes_ar: ['أرجحة الجذع.', 'الرفع لأعلى من اللازم.'],
    alternatives: ['db_press'],
  },
  {
    id: 'rear_delt_fly', name: 'Rear delt fly', name_ar: 'رفرفة خلفي', group: 'shoulders', primary: ['rear_delts'], secondary: ['upper_back'], equipment: ['dumbbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Hinge forward with a flat back, dumbbells hanging below the chest.', 'Keep a slight bend in the elbows.', 'Raise the arms out to the sides.', 'Lower slowly.'],
    steps_ar: ['انحنِ للأمام بظهر مستقيم والدمبلز تحت الصدر.', 'حافظ على انثناء خفيف في المرفقين.', 'ارفع الذراعين جانباً.', 'أنزل ببطء.'],
    mistakes: ['Squeezing the shoulder blades too hard (turns into a row).', 'Using momentum.'], mistakes_ar: ['ضم لوحي الكتفين بقوة فيتحول إلى سحب.', 'استخدام الاندفاع.'],
    alternatives: ['face_pull'],
  },
  {
    id: 'face_pull', name: 'Face pull', name_ar: 'سحب للوجه بالحبل', group: 'shoulders', primary: ['rear_delts'], secondary: ['upper_back', 'traps'], equipment: ['cable'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Set a rope on a pulley at upper-chest height.', 'Hold the rope with thumbs pointing back.', 'Pull the rope towards the face, hands moving apart.', 'Return slowly.'],
    steps_ar: ['ضع الحبل على بكرة بمستوى أعلى الصدر.', 'أمسك الحبل والإبهامان للخلف.', 'اسحب الحبل نحو الوجه مع تباعد اليدين.', 'ارجع ببطء.'],
    mistakes: ['Pulling to the chest instead of the face.', 'Leaning back to move more weight.'], mistakes_ar: ['السحب إلى الصدر بدل الوجه.', 'الميل للخلف لرفع وزن أكبر.'],
    alternatives: ['rear_delt_fly'],
  },

  // ------------------------------------------------------------------ biceps
  {
    id: 'bicep_curl', name: 'Dumbbell biceps curl', name_ar: 'تبادل بايسبس بالدمبل', group: 'biceps', primary: ['biceps'], secondary: ['forearms'], equipment: ['dumbbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Stand with dumbbells at your sides, palms forward.', 'Keep the elbows by your sides.', 'Curl the weights up towards the shoulders.', 'Lower slowly to straight arms.'],
    steps_ar: ['قف والدمبلز بجانبيك والكفان للأمام.', 'أبقِ المرفقين ملاصقين للجسم.', 'اثنِ الذراعين لرفع الدمبلز نحو الكتفين.', 'أنزل ببطء حتى استقامة الذراعين.'],
    mistakes: ['Swinging the body.', 'Moving the elbows forward.'], mistakes_ar: ['أرجحة الجسم.', 'تحريك المرفقين للأمام.'],
    alternatives: ['barbell_curl', 'cable_curl'],
  },
  {
    id: 'barbell_curl', name: 'Barbell curl', name_ar: 'بايسبس بالبار', group: 'biceps', primary: ['biceps'], secondary: ['forearms'], equipment: ['barbell', 'ez_bar'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Hold the bar with an underhand, shoulder-width grip.', 'Stand tall with elbows at your sides.', 'Curl the bar to the upper chest.', 'Lower under control.'],
    steps_ar: ['أمسك البار بقبضة سفلية بعرض الكتفين.', 'قف مستقيماً والمرفقان بجانبيك.', 'ارفع البار إلى أعلى الصدر.', 'أنزل بتحكم.'],
    mistakes: ['Leaning back to lift.', 'Dropping the bar fast.'], mistakes_ar: ['الميل للخلف للرفع.', 'إنزال البار بسرعة.'],
    alternatives: ['bicep_curl', 'preacher_curl'],
  },
  {
    id: 'hammer_curl', name: 'Hammer curl', name_ar: 'بايسبس هامر', group: 'biceps', primary: ['biceps', 'forearms'], secondary: [], equipment: ['dumbbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Hold dumbbells with palms facing each other.', 'Keep the elbows fixed by your sides.', 'Curl the weights up.', 'Lower slowly.'],
    steps_ar: ['أمسك الدمبلز والكفان متقابلان.', 'ثبّت المرفقين بجانبيك.', 'ارفع الدمبلز.', 'أنزل ببطء.'],
    mistakes: ['Swinging.', 'Rotating the wrists.'], mistakes_ar: ['الأرجحة.', 'تدوير الرسغين.'],
    alternatives: ['bicep_curl', 'wrist_curl'],
  },
  {
    id: 'incline_db_curl', name: 'Incline dumbbell curl', name_ar: 'بايسبس على بنش مائل', group: 'biceps', primary: ['biceps'], secondary: [], equipment: ['dumbbell', 'bench'], kind: 'isolation', difficulty: 'intermediate', prescription: P.isolation,
    steps: ['Sit back on a bench set to about 60°, arms hanging straight.', 'Keep the upper arms still.', 'Curl the dumbbells up.', 'Lower to a full stretch.'],
    steps_ar: ['اجلس على بنش بزاوية ٦٠ درجة تقريباً والذراعان متدليتان.', 'ثبّت العضدين.', 'ارفع الدمبلز.', 'أنزل حتى التمدد الكامل.'],
    mistakes: ['Lifting the shoulders off the bench.', 'Too heavy to reach full range.'], mistakes_ar: ['رفع الكتفين عن البنش.', 'وزن ثقيل يمنع المدى الكامل.'],
    alternatives: ['bicep_curl', 'preacher_curl'],
  },
  {
    id: 'preacher_curl', name: 'Preacher curl', name_ar: 'بايسبس على الكرسي (بريتشر)', group: 'biceps', primary: ['biceps'], secondary: [], equipment: ['ez_bar', 'bench'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Rest the back of the upper arms on the preacher pad.', 'Hold the bar with an underhand grip.', 'Curl the bar up.', 'Lower slowly — stop just short of locking out.'],
    steps_ar: ['ضع خلف العضدين على مسند البريتشر.', 'أمسك البار بقبضة سفلية.', 'ارفع البار.', 'أنزل ببطء وتوقف قبل الاستقامة الكاملة.'],
    mistakes: ['Dropping fast into the bottom.', 'Lifting the elbows off the pad.'], mistakes_ar: ['الإنزال السريع للأسفل.', 'رفع المرفقين عن المسند.'],
    alternatives: ['barbell_curl', 'concentration_curl'],
  },
  {
    id: 'cable_curl', name: 'Cable curl', name_ar: 'بايسبس بالكابل', group: 'biceps', primary: ['biceps'], secondary: ['forearms'], equipment: ['cable'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Attach a bar to a low pulley.', 'Stand tall, elbows at your sides.', 'Curl the bar up.', 'Lower against the cable slowly.'],
    steps_ar: ['ثبّت باراً على بكرة سفلية.', 'قف مستقيماً والمرفقان بجانبيك.', 'ارفع البار.', 'أنزل ببطء مقاوماً الكابل.'],
    mistakes: ['Leaning back.', 'Elbows drifting forward.'], mistakes_ar: ['الميل للخلف.', 'تقدّم المرفقين للأمام.'],
    alternatives: ['bicep_curl', 'barbell_curl'],
  },
  {
    id: 'concentration_curl', name: 'Concentration curl', name_ar: 'بايسبس تركيز', group: 'biceps', primary: ['biceps'], secondary: [], equipment: ['dumbbell', 'bench'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Sit and brace the elbow against the inner thigh.', 'Let the arm hang straight with the dumbbell.', 'Curl the dumbbell up.', 'Lower slowly.'],
    steps_ar: ['اجلس واسند المرفق على باطن الفخذ.', 'اترك الذراع متدلية مع الدمبل.', 'ارفع الدمبل.', 'أنزل ببطء.'],
    mistakes: ['Moving the upper arm.', 'Rushing reps.'], mistakes_ar: ['تحريك العضد.', 'استعجال التكرارات.'],
    alternatives: ['preacher_curl', 'bicep_curl'],
  },

  // ------------------------------------------------------------------ triceps
  {
    id: 'triceps_dip', name: 'Bench dip', name_ar: 'غطس ترايسبس على البنش', group: 'triceps', primary: ['triceps'], secondary: ['chest', 'front_delts'], equipment: ['bench', 'bodyweight'], kind: 'compound', difficulty: 'beginner', prescription: P.bodyweight,
    steps: ['Place the hands on a bench behind you, legs out in front.', 'Lower by bending the elbows to about 90°.', 'Keep the back close to the bench.', 'Push back up.'],
    steps_ar: ['ضع اليدين على بنش خلفك والساقان ممدودتان للأمام.', 'انزل بثني المرفقين حتى ٩٠ درجة تقريباً.', 'أبقِ الظهر قريباً من البنش.', 'ادفع للأعلى.'],
    mistakes: ['Going too deep and straining the shoulders.', 'Flaring the elbows.'], mistakes_ar: ['النزول عميقاً وإجهاد الكتفين.', 'فتح المرفقين للخارج.'],
    alternatives: ['triceps_pushdown', 'close_grip_bench'],
  },
  {
    id: 'close_grip_bench', name: 'Close-grip bench press', name_ar: 'ضغط بنش بقبضة ضيقة', group: 'triceps', primary: ['triceps'], secondary: ['chest', 'front_delts'], equipment: ['barbell', 'bench'], kind: 'compound', difficulty: 'intermediate', prescription: P.compound,
    steps: ['Lie on the bench and grip the bar about shoulder-width.', 'Keep the elbows close to the body.', 'Lower the bar to the lower chest.', 'Press up to straight arms.'],
    steps_ar: ['استلقِ وامسك البار بعرض الكتفين تقريباً.', 'أبقِ المرفقين قريبين من الجسم.', 'أنزل البار إلى أسفل الصدر.', 'ادفع للأعلى حتى استقامة الذراعين.'],
    mistakes: ['Grip so narrow it strains the wrists.', 'Elbows flaring wide.'], mistakes_ar: ['قبضة ضيقة جداً تُجهد الرسغين.', 'فتح المرفقين.'],
    alternatives: ['diamond_push_up', 'triceps_dip'],
  },
  {
    id: 'triceps_pushdown', name: 'Triceps pushdown', name_ar: 'ترايسبس بالكابل (بوش داون)', group: 'triceps', primary: ['triceps'], secondary: [], equipment: ['cable'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Hold a rope or bar on a high pulley.', 'Pin the elbows to your sides.', 'Push down until the arms are straight.', 'Let the hands rise slowly to about chest height.'],
    steps_ar: ['أمسك حبلاً أو باراً على بكرة عالية.', 'ثبّت المرفقين بجانبيك.', 'ادفع للأسفل حتى تستقيم الذراعان.', 'اترك اليدين ترتفعان ببطء حتى مستوى الصدر.'],
    mistakes: ['Elbows moving forward and back.', 'Leaning over the bar to push with body weight.'], mistakes_ar: ['تحرك المرفقين للأمام والخلف.', 'الانحناء فوق البار للدفع بوزن الجسم.'],
    alternatives: ['overhead_triceps_extension', 'triceps_dip'],
  },
  {
    id: 'overhead_triceps_extension', name: 'Overhead triceps extension', name_ar: 'ترايسبس خلف الرأس', group: 'triceps', primary: ['triceps'], secondary: [], equipment: ['dumbbell', 'cable'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Hold one dumbbell overhead with both hands.', 'Keep the upper arms close to the head.', 'Lower the weight behind the head by bending the elbows.', 'Extend back to straight arms.'],
    steps_ar: ['أمسك دمبلاً واحداً فوق الرأس بكلتا اليدين.', 'أبقِ العضدين قريبين من الرأس.', 'أنزل الوزن خلف الرأس بثني المرفقين.', 'مدّ الذراعين حتى الاستقامة.'],
    mistakes: ['Flaring the elbows wide.', 'Arching the lower back.'], mistakes_ar: ['فتح المرفقين للخارج.', 'تقوس أسفل الظهر.'],
    alternatives: ['skull_crusher', 'triceps_pushdown'],
  },
  {
    id: 'skull_crusher', name: 'Lying triceps extension (skull crusher)', name_ar: 'ترايسبس مستلقٍ (سكل كراشر)', group: 'triceps', primary: ['triceps'], secondary: [], equipment: ['ez_bar', 'bench'], kind: 'isolation', difficulty: 'intermediate', prescription: P.isolation,
    steps: ['Lie on a bench holding the bar above the chest.', 'Keep the upper arms vertical.', 'Bend the elbows to lower the bar towards the forehead.', 'Extend back up.'],
    steps_ar: ['استلقِ على البنش والبار فوق الصدر.', 'أبقِ العضدين عموديين.', 'اثنِ المرفقين لإنزال البار نحو الجبهة.', 'مدّ للأعلى.'],
    mistakes: ['Letting the elbows drift and flare.', 'Going too heavy and losing control near the face.'], mistakes_ar: ['تحرك المرفقين وانفتاحهما.', 'أوزان ثقيلة وفقدان التحكم قرب الوجه.'],
    alternatives: ['overhead_triceps_extension', 'close_grip_bench'],
  },
  {
    id: 'diamond_push_up', name: 'Diamond push-up', name_ar: 'ضغط ماسي', group: 'triceps', primary: ['triceps'], secondary: ['chest'], equipment: ['bodyweight'], kind: 'compound', difficulty: 'intermediate', prescription: P.bodyweight,
    steps: ['Place the hands together under the chest, forming a diamond.', 'Keep the body straight.', 'Lower the chest towards the hands.', 'Push back up.'],
    steps_ar: ['ضع اليدين معاً تحت الصدر بشكل ماسة.', 'أبقِ الجسم مستقيماً.', 'أنزل الصدر نحو اليدين.', 'ادفع للأعلى.'],
    mistakes: ['Hips sagging.', 'Elbows flaring out.'], mistakes_ar: ['هبوط الحوض.', 'فتح المرفقين.'],
    alternatives: ['close_grip_bench', 'push_up'],
  },
  {
    id: 'triceps_kickback', name: 'Triceps kickback', name_ar: 'ترايسبس كيك باك', group: 'triceps', primary: ['triceps'], secondary: [], equipment: ['dumbbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Hinge forward with a flat back, upper arm parallel to the floor.', 'Keep the upper arm still.', 'Extend the forearm back until the arm is straight.', 'Return slowly.'],
    steps_ar: ['انحنِ للأمام بظهر مستقيم والعضد موازٍ للأرض.', 'ثبّت العضد.', 'مدّ الساعد للخلف حتى تستقيم الذراع.', 'ارجع ببطء.'],
    mistakes: ['Swinging the weight.', 'Dropping the upper arm.'], mistakes_ar: ['أرجحة الوزن.', 'هبوط العضد.'],
    alternatives: ['triceps_pushdown'],
  },

  // ------------------------------------------------------------------ legs
  {
    id: 'back_squat', name: 'Barbell back squat', name_ar: 'سكوات بالبار', group: 'legs', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lower_back', 'adductors'], equipment: ['barbell'], kind: 'compound', difficulty: 'intermediate', prescription: P.strength,
    steps: ['Set the bar on the upper back, feet about shoulder-width.', 'Brace the core and keep the chest up.', 'Sit down and back until the thighs are at least parallel, knees tracking over toes.', 'Drive up through the whole foot. Use safety arms.'],
    steps_ar: ['ضع البار على أعلى الظهر والقدمان بعرض الكتفين تقريباً.', 'شدّ البطن وارفع الصدر.', 'انزل للأسفل والخلف حتى يوازي الفخذ الأرض على الأقل والركبتان باتجاه أصابع القدم.', 'ادفع للأعلى بكامل القدم. استخدم مساند الأمان.'],
    mistakes: ['Knees caving inwards.', 'Heels lifting off the floor.'], mistakes_ar: ['انهيار الركبتين للداخل.', 'ارتفاع الكعبين عن الأرض.'],
    alternatives: ['goblet_squat', 'leg_press', 'front_squat'],
  },
  {
    id: 'front_squat', name: 'Front squat', name_ar: 'سكوات أمامي', group: 'legs', primary: ['quads'], secondary: ['glutes', 'abs'], equipment: ['barbell'], kind: 'compound', difficulty: 'advanced', prescription: P.strength,
    steps: ['Rest the bar on the front of the shoulders, elbows high.', 'Keep the torso upright.', 'Squat down between the knees.', 'Stand up keeping the elbows up.'],
    steps_ar: ['ضع البار على مقدمة الكتفين والمرفقان مرتفعان.', 'أبقِ الجذع منتصباً.', 'انزل بين الركبتين.', 'قف مع إبقاء المرفقين مرتفعين.'],
    mistakes: ['Elbows dropping so the bar rolls forward.', 'Rounding the upper back.'], mistakes_ar: ['هبوط المرفقين فيتدحرج البار للأمام.', 'تقوس أعلى الظهر.'],
    alternatives: ['goblet_squat', 'back_squat'],
  },
  {
    id: 'squat', name: 'Bodyweight squat', name_ar: 'سكوات بوزن الجسم', group: 'legs', primary: ['quads', 'glutes'], secondary: ['hamstrings'], equipment: ['bodyweight'], kind: 'compound', difficulty: 'beginner', prescription: P.bodyweight,
    steps: ['Feet shoulder-width, toes slightly out.', 'Sit the hips back and down, chest up.', 'Keep the heels on the floor.', 'Stand back up.'],
    steps_ar: ['القدمان بعرض الكتفين وأصابع القدم للخارج قليلاً.', 'انزل بالحوض للخلف والأسفل مع رفع الصدر.', 'أبقِ الكعبين على الأرض.', 'قف من جديد.'],
    mistakes: ['Knees caving in.', 'Rounding the back.'], mistakes_ar: ['انهيار الركبتين للداخل.', 'تقويس الظهر.'],
    alternatives: ['goblet_squat', 'lunge'],
  },
  {
    id: 'goblet_squat', name: 'Goblet squat', name_ar: 'سكوات بالدمبل (غوبلت)', group: 'legs', primary: ['quads', 'glutes'], secondary: ['abs', 'adductors'], equipment: ['dumbbell', 'kettlebell'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Hold one dumbbell or kettlebell against the chest.', 'Squat down between the knees.', 'Keep the elbows inside the knees and chest up.', 'Stand up tall.'],
    steps_ar: ['أمسك دمبلاً أو كيتل بل أمام الصدر.', 'انزل بين الركبتين.', 'أبقِ المرفقين داخل الركبتين والصدر مرفوعاً.', 'قف مستقيماً.'],
    mistakes: ['Leaning forward.', 'Letting the weight pull you down.'], mistakes_ar: ['الميل للأمام.', 'ترك الوزن يسحبك للأسفل.'],
    alternatives: ['back_squat', 'leg_press'],
  },
  {
    id: 'leg_press', name: 'Leg press', name_ar: 'دفع الأرجل على الجهاز', group: 'legs', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'], equipment: ['machine'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Sit with the back flat against the pad, feet hip-width on the platform.', 'Release the safeties.', 'Lower the platform until the knees reach about 90°.', 'Press back up without locking the knees.'],
    steps_ar: ['اجلس والظهر ملاصق للمسند والقدمان بعرض الورك على المنصة.', 'حرر أقفال الأمان.', 'أنزل المنصة حتى تصل الركبتان إلى ٩٠ درجة تقريباً.', 'ادفع للأعلى دون قفل الركبتين.'],
    mistakes: ['Lower back lifting off the pad at the bottom.', 'Locking the knees at the top.'], mistakes_ar: ['ارتفاع أسفل الظهر عن المسند في الأسفل.', 'قفل الركبتين في الأعلى.'],
    alternatives: ['back_squat', 'goblet_squat'],
  },
  {
    id: 'lunge', name: 'Lunge', name_ar: 'طعنات (لانجز)', group: 'legs', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'], equipment: ['bodyweight', 'dumbbell'], kind: 'compound', difficulty: 'beginner', prescription: P.bodyweight,
    steps: ['Stand tall and step forward with one leg.', 'Lower until both knees are bent about 90°.', 'Keep the front knee over the foot.', 'Push back to the start and switch legs.'],
    steps_ar: ['قف مستقيماً وتقدم خطوة بساق واحدة.', 'انزل حتى تنثني الركبتان ٩٠ درجة تقريباً.', 'أبقِ الركبة الأمامية فوق القدم.', 'ادفع للعودة وبدّل الساق.'],
    mistakes: ['Front knee collapsing inwards.', 'Steps too short.'], mistakes_ar: ['انهيار الركبة الأمامية للداخل.', 'خطوات قصيرة جداً.'],
    alternatives: ['bulgarian_split_squat', 'step_up'],
  },
  {
    id: 'bulgarian_split_squat', name: 'Bulgarian split squat', name_ar: 'سكوات بلغاري', group: 'legs', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'], equipment: ['dumbbell', 'bench'], kind: 'compound', difficulty: 'intermediate', prescription: P.compound,
    steps: ['Rest the back foot on a bench behind you.', 'Hold dumbbells at your sides.', 'Lower straight down until the front thigh is near parallel.', 'Drive up through the front foot.'],
    steps_ar: ['ضع القدم الخلفية على بنش خلفك.', 'أمسك الدمبلز بجانبيك.', 'انزل للأسفل حتى يقارب الفخذ الأمامي التوازي.', 'ادفع للأعلى بالقدم الأمامية.'],
    mistakes: ['Front foot too close to the bench.', 'Pushing off the back foot.'], mistakes_ar: ['القدم الأمامية قريبة جداً من البنش.', 'الدفع بالقدم الخلفية.'],
    alternatives: ['lunge', 'step_up'],
  },
  {
    id: 'step_up', name: 'Step-up', name_ar: 'صعود على صندوق', group: 'legs', primary: ['quads', 'glutes'], secondary: ['hamstrings'], equipment: ['bench', 'dumbbell'], kind: 'compound', difficulty: 'beginner', prescription: P.compound,
    steps: ['Stand facing a sturdy box or bench.', 'Place one whole foot on it.', 'Step up by driving through that foot.', 'Step down slowly and repeat.'],
    steps_ar: ['قف مقابل صندوق أو بنش ثابت.', 'ضع قدماً كاملة عليه.', 'اصعد بالدفع بتلك القدم.', 'انزل ببطء وكرر.'],
    mistakes: ['Pushing off the bottom foot.', 'Box too high.'], mistakes_ar: ['الدفع بالقدم السفلية.', 'صندوق مرتفع جداً.'],
    alternatives: ['lunge', 'bulgarian_split_squat'],
  },
  {
    id: 'deadlift', name: 'Romanian deadlift', name_ar: 'رفعة رومانية', group: 'legs', primary: ['hamstrings', 'glutes'], secondary: ['lower_back'], equipment: ['barbell', 'dumbbell'], kind: 'compound', difficulty: 'intermediate', prescription: P.compound,
    steps: ['Stand with soft knees holding the weight in front of the thighs.', 'Hinge at the hips with a flat back.', 'Slide the weight down the legs until a hamstring stretch is felt.', 'Squeeze the glutes to stand back up.'],
    steps_ar: ['قف مع ثني خفيف للركبتين والوزن أمام الفخذين.', 'انحنِ من الحوض بظهر مستقيم.', 'أنزل الوزن على طول الساقين حتى تشعر بتمدد الخلفية.', 'شدّ الألوية للعودة واقفاً.'],
    mistakes: ['Rounding the back.', 'Bending the knees into a squat.'], mistakes_ar: ['تقويس الظهر.', 'ثني الركبتين كأنه سكوات.'],
    alternatives: ['lying_leg_curl', 'hip_thrust', 'conventional_deadlift'],
  },
  {
    id: 'leg_extension', name: 'Leg extension', name_ar: 'رفرفة أمامي للأرجل', group: 'legs', primary: ['quads'], secondary: [], equipment: ['machine'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Adjust the seat so the knees line up with the machine pivot.', 'Place the shins under the pad.', 'Extend the legs until straight.', 'Lower slowly.'],
    steps_ar: ['اضبط المقعد لتكون الركبتان بمحاذاة محور الجهاز.', 'ضع الساقين تحت المسند.', 'مدّ الساقين حتى الاستقامة.', 'أنزل ببطء.'],
    mistakes: ['Kicking the weight up.', 'Lifting the hips off the seat.'], mistakes_ar: ['ركل الوزن للأعلى.', 'رفع الحوض عن المقعد.'],
    alternatives: ['leg_press', 'goblet_squat'],
  },
  {
    id: 'lying_leg_curl', name: 'Lying leg curl', name_ar: 'رفرفة خلفي للأرجل', group: 'legs', primary: ['hamstrings'], secondary: ['calves'], equipment: ['machine'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Lie face down with the pad just above the heels.', 'Hold the handles and keep the hips down.', 'Curl the heels towards the glutes.', 'Lower slowly.'],
    steps_ar: ['استلقِ على بطنك والمسند فوق الكعبين مباشرة.', 'أمسك المقابض وأبقِ الحوض منخفضاً.', 'اسحب الكعبين نحو الألوية.', 'أنزل ببطء.'],
    mistakes: ['Hips lifting off the pad.', 'Swinging the weight.'], mistakes_ar: ['ارتفاع الحوض عن المسند.', 'أرجحة الوزن.'],
    alternatives: ['deadlift', 'glute_bridge'],
  },
  {
    id: 'hip_thrust', name: 'Barbell hip thrust', name_ar: 'دفع الحوض بالبار', group: 'legs', primary: ['glutes'], secondary: ['hamstrings', 'quads'], equipment: ['barbell', 'bench'], kind: 'compound', difficulty: 'intermediate', prescription: P.compound,
    steps: ['Sit with the upper back against a bench, bar padded over the hips.', 'Feet flat, about hip-width.', 'Drive the hips up until the body is flat from shoulders to knees.', 'Squeeze the glutes, then lower.'],
    steps_ar: ['اجلس وأعلى ظهرك على البنش والبار مبطّن فوق الحوض.', 'القدمان مسطحتان بعرض الورك.', 'ادفع الحوض للأعلى حتى يستقيم الجسم من الكتفين للركبتين.', 'شدّ الألوية ثم أنزل.'],
    mistakes: ['Over-arching the lower back at the top.', 'Feet too far away.'], mistakes_ar: ['تقوس أسفل الظهر الزائد في الأعلى.', 'القدمان بعيدتان جداً.'],
    alternatives: ['glute_bridge', 'deadlift'],
  },
  {
    id: 'glute_bridge', name: 'Glute bridge', name_ar: 'جسر الألوية', group: 'legs', primary: ['glutes'], secondary: ['hamstrings'], equipment: ['bodyweight'], kind: 'isolation', difficulty: 'beginner', prescription: P.bodyweight,
    steps: ['Lie on your back, knees bent, feet flat.', 'Brace the core.', 'Drive the hips up and squeeze the glutes.', 'Lower slowly.'],
    steps_ar: ['استلقِ على ظهرك والركبتان منثنيتان والقدمان على الأرض.', 'شدّ البطن.', 'ادفع الحوض للأعلى واعصر الألوية.', 'أنزل ببطء.'],
    mistakes: ['Over-arching the lower back.', 'Pushing through the toes.'], mistakes_ar: ['تقوس أسفل الظهر.', 'الدفع بأصابع القدم.'],
    alternatives: ['hip_thrust'],
  },

  // ------------------------------------------------------------------ abs
  {
    id: 'plank', name: 'Plank', name_ar: 'بلانك', group: 'abs', primary: ['abs'], secondary: ['obliques', 'front_delts'], equipment: ['bodyweight'], kind: 'core', difficulty: 'beginner', prescription: P.coreHold,
    steps: ['Forearms on the floor under the shoulders.', 'Body in a straight line from head to heels.', 'Squeeze the glutes and brace the stomach.', 'Hold while breathing steadily. Log seconds.'],
    steps_ar: ['الساعدان على الأرض تحت الكتفين.', 'الجسم مستقيم من الرأس للكعبين.', 'شدّ الألوية والبطن.', 'اثبت مع التنفس بانتظام. سجّل الثواني.'],
    mistakes: ['Hips too high or sagging.', 'Holding the breath.'], mistakes_ar: ['الحوض مرتفع أو هابط.', 'حبس النفس.'],
    alternatives: ['dead_bug', 'side_plank'],
  },
  {
    id: 'side_plank', name: 'Side plank', name_ar: 'بلانك جانبي', group: 'abs', primary: ['obliques'], secondary: ['abs', 'glutes'], equipment: ['bodyweight'], kind: 'core', difficulty: 'beginner', prescription: P.coreHold,
    steps: ['Lie on your side with the elbow under the shoulder.', 'Stack the feet.', 'Lift the hips so the body forms a straight line.', 'Hold, then switch sides. Log seconds per side.'],
    steps_ar: ['استلقِ على جانبك والمرفق تحت الكتف.', 'ضع القدمين فوق بعضهما.', 'ارفع الحوض ليستقيم الجسم.', 'اثبت ثم بدّل الجانب. سجّل الثواني لكل جانب.'],
    mistakes: ['Hips dropping.', 'Rolling forward.'], mistakes_ar: ['هبوط الحوض.', 'الميل للأمام.'],
    alternatives: ['plank', 'russian_twist'],
  },
  {
    id: 'crunch', name: 'Crunch', name_ar: 'كرنش', group: 'abs', primary: ['abs'], secondary: [], equipment: ['bodyweight'], kind: 'core', difficulty: 'beginner', prescription: P.coreReps,
    steps: ['Lie on your back, knees bent, hands lightly by the head.', 'Curl the shoulders off the floor by contracting the abs.', 'Pause briefly.', 'Lower slowly.'],
    steps_ar: ['استلقِ على ظهرك والركبتان منثنيتان واليدان بخفة قرب الرأس.', 'ارفع الكتفين عن الأرض بشد عضلات البطن.', 'توقف لحظة.', 'انزل ببطء.'],
    mistakes: ['Pulling on the neck.', 'Using momentum.'], mistakes_ar: ['سحب الرقبة.', 'استخدام الاندفاع.'],
    alternatives: ['cable_crunch', 'dead_bug'],
  },
  {
    id: 'bicycle_crunch', name: 'Bicycle crunch', name_ar: 'كرنش الدراجة', group: 'abs', primary: ['obliques', 'abs'], secondary: [], equipment: ['bodyweight'], kind: 'core', difficulty: 'beginner', prescription: P.coreReps,
    steps: ['Lie on your back with hands by the head and legs raised.', 'Bring one elbow towards the opposite knee while extending the other leg.', 'Switch sides in a slow pedalling motion.', 'Keep the lower back on the floor.'],
    steps_ar: ['استلقِ على ظهرك واليدان قرب الرأس والساقان مرفوعتان.', 'قرّب مرفقاً نحو الركبة المعاكسة مع مدّ الساق الأخرى.', 'بدّل الجانبين بحركة بطيئة كالدواسة.', 'أبقِ أسفل الظهر على الأرض.'],
    mistakes: ['Going too fast.', 'Pulling the head forward.'], mistakes_ar: ['السرعة الزائدة.', 'سحب الرأس للأمام.'],
    alternatives: ['russian_twist', 'crunch'],
  },
  {
    id: 'hanging_knee_raise', name: 'Hanging knee raise', name_ar: 'رفع الركبتين معلّقاً', group: 'abs', primary: ['abs'], secondary: ['forearms'], equipment: ['pullup_bar'], kind: 'core', difficulty: 'intermediate', prescription: P.coreReps,
    steps: ['Hang from a bar with straight arms.', 'Brace the core to stop swinging.', 'Raise the knees towards the chest, curling the pelvis up.', 'Lower slowly.'],
    steps_ar: ['تعلّق بالبار والذراعان مستقيمتان.', 'شدّ البطن لمنع الأرجحة.', 'ارفع الركبتين نحو الصدر مع لف الحوض للأعلى.', 'أنزل ببطء.'],
    mistakes: ['Swinging.', 'Only lifting the legs without curling the pelvis.'], mistakes_ar: ['الأرجحة.', 'رفع الساقين فقط دون لف الحوض.'],
    alternatives: ['crunch', 'ab_wheel_rollout'],
  },
  {
    id: 'cable_crunch', name: 'Cable crunch', name_ar: 'كرنش بالكابل', group: 'abs', primary: ['abs'], secondary: [], equipment: ['cable'], kind: 'core', difficulty: 'intermediate', prescription: P.isolation,
    steps: ['Kneel facing a high pulley holding a rope by the head.', 'Keep the hips still.', 'Crunch down, bringing the ribs towards the hips.', 'Return slowly.'],
    steps_ar: ['اركع مقابل بكرة عالية وأمسك الحبل قرب الرأس.', 'ثبّت الحوض.', 'انحنِ للأسفل مقرّباً الأضلاع من الحوض.', 'ارجع ببطء.'],
    mistakes: ['Pulling with the arms.', 'Sitting back onto the heels.'], mistakes_ar: ['السحب بالذراعين.', 'الجلوس على الكعبين.'],
    alternatives: ['crunch'],
  },
  {
    id: 'dead_bug', name: 'Dead bug', name_ar: 'الحشرة الميتة (ديد بغ)', group: 'abs', primary: ['abs'], secondary: ['obliques'], equipment: ['bodyweight'], kind: 'core', difficulty: 'beginner', prescription: P.coreReps,
    steps: ['Lie on your back with arms up and knees bent at 90°.', 'Press the lower back into the floor.', 'Lower the opposite arm and leg slowly.', 'Return and switch sides.'],
    steps_ar: ['استلقِ على ظهرك والذراعان للأعلى والركبتان بزاوية ٩٠ درجة.', 'ألصق أسفل الظهر بالأرض.', 'أنزل الذراع والساق المتعاكستين ببطء.', 'ارجع وبدّل الجانب.'],
    mistakes: ['Lower back arching off the floor.', 'Moving too fast.'], mistakes_ar: ['ارتفاع أسفل الظهر عن الأرض.', 'الحركة السريعة.'],
    alternatives: ['plank', 'crunch'],
  },
  {
    id: 'russian_twist', name: 'Russian twist', name_ar: 'الالتفاف الروسي', group: 'abs', primary: ['obliques'], secondary: ['abs'], equipment: ['bodyweight', 'dumbbell'], kind: 'core', difficulty: 'beginner', prescription: P.coreReps,
    steps: ['Sit with knees bent and lean back slightly, back straight.', 'Hold the hands or a light weight in front of the chest.', 'Rotate the torso to one side, then the other.', 'Move slowly and keep the chest up.'],
    steps_ar: ['اجلس والركبتان منثنيتان ومِل للخلف قليلاً بظهر مستقيم.', 'أمسك اليدين أو وزناً خفيفاً أمام الصدر.', 'لفّ الجذع لجهة ثم للأخرى.', 'تحرك ببطء وأبقِ الصدر مرفوعاً.'],
    mistakes: ['Rounding the back.', 'Only moving the arms.'], mistakes_ar: ['تقويس الظهر.', 'تحريك الذراعين فقط.'],
    alternatives: ['bicycle_crunch', 'side_plank'],
  },
  {
    id: 'ab_wheel_rollout', name: 'Ab wheel rollout', name_ar: 'عجلة البطن', group: 'abs', primary: ['abs'], secondary: ['lats', 'obliques'], equipment: ['none'], kind: 'core', difficulty: 'advanced', prescription: P.coreReps,
    steps: ['Kneel holding the wheel under the shoulders.', 'Brace hard and roll forward slowly.', 'Go only as far as you can without the lower back sagging.', 'Pull back with the abs.'],
    steps_ar: ['اركع وأمسك العجلة تحت الكتفين.', 'شدّ البطن بقوة وتدحرج للأمام ببطء.', 'اذهب فقط إلى حيث لا يهبط أسفل الظهر.', 'ارجع بقوة البطن.'],
    mistakes: ['Lower back sagging.', 'Rolling too far too soon.'], mistakes_ar: ['هبوط أسفل الظهر.', 'التدحرج بعيداً قبل الاستعداد.'],
    alternatives: ['plank', 'hanging_knee_raise'],
  },

  // ------------------------------------------------------------------ calves
  {
    id: 'calf_raise', name: 'Standing calf raise', name_ar: 'رفع السمانة واقفاً', group: 'calves', primary: ['calves'], secondary: [], equipment: ['bodyweight', 'machine'], kind: 'isolation', difficulty: 'beginner', prescription: P.calves,
    steps: ['Stand with the balls of the feet on a step, heels hanging.', 'Lower the heels for a stretch.', 'Rise as high as possible onto the toes.', 'Pause, then lower slowly.'],
    steps_ar: ['قف ومقدمة القدمين على درجة والكعبان متدليان.', 'أنزل الكعبين للتمدد.', 'ارتفع على أصابع القدم لأعلى ما يمكن.', 'توقف ثم أنزل ببطء.'],
    mistakes: ['Bouncing.', 'Partial range.'], mistakes_ar: ['الارتداد.', 'مدى حركة ناقص.'],
    alternatives: ['seated_calf_raise', 'single_leg_calf_raise'],
  },
  {
    id: 'seated_calf_raise', name: 'Seated calf raise', name_ar: 'رفع السمانة جالساً', group: 'calves', primary: ['calves'], secondary: [], equipment: ['machine'], kind: 'isolation', difficulty: 'beginner', prescription: P.calves,
    steps: ['Sit with the pad on the lower thighs and balls of the feet on the platform.', 'Release the safety.', 'Lower the heels, then rise onto the toes.', 'Pause at the top.'],
    steps_ar: ['اجلس والمسند على أسفل الفخذين ومقدمة القدمين على المنصة.', 'حرر قفل الأمان.', 'أنزل الكعبين ثم ارتفع على الأصابع.', 'توقف في الأعلى.'],
    mistakes: ['Bouncing at the bottom.', 'Rushing reps.'], mistakes_ar: ['الارتداد في الأسفل.', 'استعجال التكرارات.'],
    alternatives: ['calf_raise'],
  },
  {
    id: 'single_leg_calf_raise', name: 'Single-leg calf raise', name_ar: 'رفع السمانة بساق واحدة', group: 'calves', primary: ['calves'], secondary: [], equipment: ['bodyweight', 'dumbbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.calves,
    steps: ['Stand on one foot on a step, holding something for balance.', 'Lower the heel.', 'Rise onto the toes as high as possible.', 'Switch legs after the set.'],
    steps_ar: ['قف على قدم واحدة على درجة وامسك شيئاً للتوازن.', 'أنزل الكعب.', 'ارتفع على الأصابع لأعلى ما يمكن.', 'بدّل الساق بعد المجموعة.'],
    mistakes: ['Bending the knee to help.', 'Partial reps.'], mistakes_ar: ['ثني الركبة للمساعدة.', 'تكرارات ناقصة.'],
    alternatives: ['calf_raise'],
  },
  {
    id: 'leg_press_calf_raise', name: 'Leg press calf raise', name_ar: 'رفع السمانة على جهاز الأرجل', group: 'calves', primary: ['calves'], secondary: [], equipment: ['machine'], kind: 'isolation', difficulty: 'beginner', prescription: P.calves,
    steps: ['Sit in the leg press with the balls of the feet on the bottom edge of the platform.', 'Keep the knees straight but not locked; keep the safeties on.', 'Push the platform with the toes.', 'Let the heels come back slowly.'],
    steps_ar: ['اجلس في جهاز الأرجل ومقدمة القدمين على الحافة السفلية للمنصة.', 'أبقِ الركبتين مستقيمتين دون قفل وأقفال الأمان مفعلة.', 'ادفع المنصة بأصابع القدم.', 'اترك الكعبين يعودان ببطء.'],
    mistakes: ['Feet slipping off the platform.', 'Bending the knees.'], mistakes_ar: ['انزلاق القدمين عن المنصة.', 'ثني الركبتين.'],
    alternatives: ['calf_raise', 'seated_calf_raise'],
  },

  // ------------------------------------------------------------------ forearms
  {
    id: 'wrist_curl', name: 'Wrist curl', name_ar: 'ثني الرسغ', group: 'forearms', primary: ['forearms'], secondary: [], equipment: ['dumbbell', 'barbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Sit with forearms on the thighs, palms up, wrists past the knees.', 'Let the weight roll down to the fingers.', 'Curl the wrists up.', 'Lower slowly.'],
    steps_ar: ['اجلس والساعدان على الفخذين والكفان للأعلى والرسغان خارج الركبتين.', 'اترك الوزن ينزل نحو الأصابع.', 'اثنِ الرسغين للأعلى.', 'أنزل ببطء.'],
    mistakes: ['Lifting the forearms off the thighs.', 'Too heavy.'], mistakes_ar: ['رفع الساعدين عن الفخذين.', 'وزن ثقيل جداً.'],
    alternatives: ['reverse_wrist_curl', 'hammer_curl'],
  },
  {
    id: 'reverse_wrist_curl', name: 'Reverse wrist curl', name_ar: 'ثني الرسغ العكسي', group: 'forearms', primary: ['forearms'], secondary: [], equipment: ['dumbbell', 'barbell'], kind: 'isolation', difficulty: 'beginner', prescription: P.isolation,
    steps: ['Sit with forearms on the thighs, palms down.', 'Lower the back of the hands.', 'Raise the hands by extending the wrists.', 'Lower slowly.'],
    steps_ar: ['اجلس والساعدان على الفخذين والكفان للأسفل.', 'أنزل ظهر اليدين.', 'ارفع اليدين بمدّ الرسغين.', 'أنزل ببطء.'],
    mistakes: ['Using a weight that is too heavy.', 'Moving the forearms.'], mistakes_ar: ['وزن ثقيل جداً.', 'تحريك الساعدين.'],
    alternatives: ['wrist_curl'],
  },
  {
    id: 'farmers_walk', name: "Farmer's walk", name_ar: 'مشي المزارع', group: 'forearms', primary: ['forearms', 'traps'], secondary: ['abs', 'glutes'], equipment: ['dumbbell', 'kettlebell'], kind: 'compound', difficulty: 'beginner', prescription: P.carry,
    steps: ['Pick up heavy dumbbells or kettlebells with a neutral grip.', 'Stand tall with shoulders back.', 'Walk with short, steady steps.', 'Set the weights down with a flat back. Log seconds.'],
    steps_ar: ['ارفع دمبلز أو كيتل بل ثقيلة بقبضة محايدة.', 'قف مستقيماً والكتفان للخلف.', 'امشِ بخطوات قصيرة ثابتة.', 'ضع الأوزان بظهر مستقيم. سجّل الثواني.'],
    mistakes: ['Leaning to one side.', 'Rounding the back when picking up.'], mistakes_ar: ['الميل إلى جانب.', 'تقويس الظهر عند الرفع.'],
    alternatives: ['dead_hang', 'shrug'],
  },
  {
    id: 'dead_hang', name: 'Dead hang', name_ar: 'تعلّق ثابت', group: 'forearms', primary: ['forearms'], secondary: ['lats'], equipment: ['pullup_bar'], kind: 'isolation', difficulty: 'beginner', prescription: P.carry,
    steps: ['Grip a pull-up bar with both hands.', 'Hang with straight arms and relaxed legs.', 'Keep the shoulders slightly engaged.', 'Hold as long as you can with good grip. Log seconds.'],
    steps_ar: ['أمسك بار العقلة بكلتا اليدين.', 'تعلّق والذراعان مستقيمتان والساقان مرتخيتان.', 'أبقِ الكتفين مشدودين قليلاً.', 'اثبت أطول ما يمكن بقبضة جيدة. سجّل الثواني.'],
    mistakes: ['Swinging.', 'Letting the shoulders shrug up fully.'], mistakes_ar: ['الأرجحة.', 'ارتفاع الكتفين بالكامل نحو الأذنين.'],
    alternatives: ['farmers_walk'],
  },

  // ------------------------------------------------------------------ cardio
  {
    id: 'running', name: 'Running', name_ar: 'جري', group: 'cardio', primary: ['heart', 'quads'], secondary: ['calves', 'hamstrings', 'glutes'], equipment: ['none'], kind: 'cardio', difficulty: 'beginner', prescription: P.steady,
    steps: ['Warm up with 5 minutes of brisk walking.', 'Run at a pace where you can still speak in short sentences.', 'Land softly under the body with short strides.', 'Cool down by walking. Log minutes.'],
    steps_ar: ['أحمِ جسمك ٥ دقائق بمشي سريع.', 'اجرِ بسرعة تسمح لك بالكلام بجمل قصيرة.', 'اهبط بخفة تحت الجسم بخطوات قصيرة.', 'اختم بالمشي. سجّل الدقائق.'],
    mistakes: ['Increasing distance too quickly.', 'Over-striding and landing on the heel far in front.'], mistakes_ar: ['زيادة المسافة بسرعة.', 'خطوات طويلة والهبوط على الكعب بعيداً للأمام.'],
    alternatives: ['brisk_walking', 'cycling', 'elliptical'],
  },
  {
    id: 'brisk_walking', name: 'Brisk walking', name_ar: 'مشي سريع', group: 'cardio', primary: ['heart'], secondary: ['calves', 'glutes'], equipment: ['none'], kind: 'cardio', difficulty: 'beginner', prescription: P.steady,
    steps: ['Walk at a pace that raises your breathing but still lets you talk.', 'Swing the arms naturally.', 'Keep an upright posture.', 'Log minutes.'],
    steps_ar: ['امشِ بسرعة ترفع تنفسك مع قدرتك على الكلام.', 'حرّك الذراعين بشكل طبيعي.', 'حافظ على وقفة مستقيمة.', 'سجّل الدقائق.'],
    mistakes: ['Pace too slow to raise the heart rate.', 'Looking down at the phone.'], mistakes_ar: ['سرعة بطيئة لا ترفع النبض.', 'النظر إلى الهاتف أثناء المشي.'],
    alternatives: ['running', 'elliptical'],
  },
  {
    id: 'cycling', name: 'Stationary cycling', name_ar: 'دراجة ثابتة', group: 'cardio', primary: ['heart', 'quads'], secondary: ['glutes', 'calves'], equipment: ['cardio_machine'], kind: 'cardio', difficulty: 'beginner', prescription: P.steady,
    steps: ['Set the seat so the knee is slightly bent at the bottom of the pedal stroke.', 'Start with light resistance.', 'Keep a steady cadence.', 'Log minutes.'],
    steps_ar: ['اضبط المقعد لتبقى الركبة منثنية قليلاً في أسفل الدورة.', 'ابدأ بمقاومة خفيفة.', 'حافظ على إيقاع ثابت.', 'سجّل الدقائق.'],
    mistakes: ['Seat too low.', 'Resistance so high the cadence collapses.'], mistakes_ar: ['مقعد منخفض جداً.', 'مقاومة عالية تُبطئ الإيقاع كثيراً.'],
    alternatives: ['running', 'elliptical'],
  },
  {
    id: 'rowing_machine', name: 'Rowing machine', name_ar: 'جهاز التجديف', group: 'cardio', primary: ['heart', 'upper_back'], secondary: ['quads', 'lats', 'biceps'], equipment: ['cardio_machine'], kind: 'cardio', difficulty: 'beginner', prescription: P.steady,
    steps: ['Strap the feet in and grip the handle.', 'Push with the legs first, then lean back slightly, then pull with the arms.', 'Return in reverse order: arms, body, legs.', 'Log minutes.'],
    steps_ar: ['ثبّت القدمين وأمسك المقبض.', 'ادفع بالساقين أولاً ثم مِل للخلف قليلاً ثم اسحب بالذراعين.', 'ارجع بالترتيب المعاكس: الذراعان ثم الجسم ثم الساقان.', 'سجّل الدقائق.'],
    mistakes: ['Pulling with the arms before the legs.', 'Rounding the back.'], mistakes_ar: ['السحب بالذراعين قبل الساقين.', 'تقويس الظهر.'],
    alternatives: ['cycling', 'running'],
  },
  {
    id: 'elliptical', name: 'Elliptical trainer', name_ar: 'جهاز الإليبتيكال', group: 'cardio', primary: ['heart'], secondary: ['quads', 'glutes'], equipment: ['cardio_machine'], kind: 'cardio', difficulty: 'beginner', prescription: P.steady,
    steps: ['Step on and hold the handles.', 'Move in a smooth stride.', 'Use moderate resistance.', 'Log minutes.'],
    steps_ar: ['اصعد وأمسك المقابض.', 'تحرك بخطوات انسيابية.', 'استخدم مقاومة متوسطة.', 'سجّل الدقائق.'],
    mistakes: ['Leaning heavily on the handles.', 'Very low resistance with fast spinning.'], mistakes_ar: ['الاتكاء على المقابض.', 'مقاومة منخفضة جداً مع سرعة عالية.'],
    alternatives: ['cycling', 'brisk_walking'],
  },
  {
    id: 'stair_climber', name: 'Stair climber', name_ar: 'جهاز صعود الدرج', group: 'cardio', primary: ['heart', 'glutes'], secondary: ['quads', 'calves'], equipment: ['cardio_machine'], kind: 'cardio', difficulty: 'intermediate', prescription: P.steady,
    steps: ['Start at a slow speed.', 'Stand upright and step with the whole foot.', 'Use the rails only lightly for balance.', 'Log minutes.'],
    steps_ar: ['ابدأ بسرعة بطيئة.', 'قف مستقيماً واصعد بكامل القدم.', 'استخدم المساند بخفة للتوازن فقط.', 'سجّل الدقائق.'],
    mistakes: ['Hanging on the rails.', 'Stepping only on the toes.'], mistakes_ar: ['التعلق بالمساند.', 'الصعود على أصابع القدم فقط.'],
    alternatives: ['step_up', 'elliptical'],
  },
  {
    id: 'jump_rope', name: 'Jump rope', name_ar: 'نط الحبل', group: 'cardio', primary: ['heart', 'calves'], secondary: ['forearms'], equipment: ['rope'], kind: 'cardio', difficulty: 'beginner', prescription: P.intervals,
    steps: ['Hold the handles at hip height, elbows close.', 'Turn the rope with the wrists.', 'Make small, quick jumps on the balls of the feet.', 'Work in intervals. Log seconds per round.'],
    steps_ar: ['أمسك المقبضين بمستوى الورك والمرفقان قريبان.', 'أدر الحبل بالرسغين.', 'اقفز قفزات صغيرة سريعة على مقدمة القدمين.', 'اعمل بفترات. سجّل الثواني لكل جولة.'],
    mistakes: ['Jumping too high.', 'Landing on the heels.'], mistakes_ar: ['القفز عالياً جداً.', 'الهبوط على الكعبين.'],
    alternatives: ['burpee', 'running'],
  },
  {
    id: 'burpee', name: 'Burpee', name_ar: 'بيربي', group: 'cardio', primary: ['heart'], secondary: ['chest', 'quads', 'abs'], equipment: ['bodyweight'], kind: 'cardio', difficulty: 'intermediate', prescription: P.intervals,
    steps: ['From standing, squat and place the hands on the floor.', 'Jump or step the feet back into a plank.', 'Return the feet to the hands.', 'Stand or jump up. Log seconds per round.'],
    steps_ar: ['من الوقوف، انزل وضع اليدين على الأرض.', 'اقفز أو أرجع القدمين لوضع البلانك.', 'أعد القدمين نحو اليدين.', 'قف أو اقفز للأعلى. سجّل الثواني لكل جولة.'],
    mistakes: ['Hips sagging in the plank.', 'Landing hard.'], mistakes_ar: ['هبوط الحوض في البلانك.', 'الهبوط بقوة.'],
    alternatives: ['jump_rope', 'mountain_climber'],
  },
  {
    id: 'mountain_climber', name: 'Mountain climber', name_ar: 'متسلق الجبال', group: 'cardio', primary: ['heart', 'abs'], secondary: ['front_delts', 'quads'], equipment: ['bodyweight'], kind: 'cardio', difficulty: 'beginner', prescription: P.intervals,
    steps: ['Start in a high plank, hands under the shoulders.', 'Drive one knee towards the chest.', 'Switch legs quickly.', 'Keep the hips level. Log seconds per round.'],
    steps_ar: ['ابدأ بوضع البلانك العالي واليدان تحت الكتفين.', 'اسحب ركبة نحو الصدر.', 'بدّل الساقين بسرعة.', 'أبقِ الحوض مستوياً. سجّل الثواني لكل جولة.'],
    mistakes: ['Hips bouncing up.', 'Hands drifting in front of the shoulders.'], mistakes_ar: ['ارتفاع الحوض.', 'تقدم اليدين أمام الكتفين.'],
    alternatives: ['burpee', 'plank'],
  },
];

export const EXERCISE_CATALOG: CatalogExercise[] = DEFS.map(def);
export const CATALOG_BY_ID: ReadonlyMap<string, CatalogExercise> = new Map(EXERCISE_CATALOG.map((e) => [e.id, e]));

export interface CatalogFilter {
  query?: string;
  group?: MuscleGroup | null;
  equipment?: Equipment | null;
  kind?: ExerciseKind | null;
  difficulty?: Difficulty | null;
}

/** Normalise for search: lowercase, strip Arabic diacritics and unify alef/ya/ta-marbuta forms. */
export function normalizeSearch(s: string): string {
  return s
    .toLocaleLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

export function filterCatalog(list: CatalogExercise[], f: CatalogFilter): CatalogExercise[] {
  const q = f.query ? normalizeSearch(f.query) : '';
  return list.filter(
    (e) =>
      (!f.group || e.group === f.group) &&
      (!f.equipment || e.equipment.includes(f.equipment)) &&
      (!f.kind || e.kind === f.kind) &&
      (!f.difficulty || e.difficulty === f.difficulty) &&
      (!q || [e.name, e.name_ar, e.group, ...e.primary, ...e.secondary].some((x) => normalizeSearch(x).includes(q))),
  );
}
