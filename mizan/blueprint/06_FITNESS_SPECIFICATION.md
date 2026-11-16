# MIZAN — FITNESS Specification
Version: 1.0

## 1. Purpose and safety
Fitness is a training, nutrition, and wellness log. It is not medical advice. The owner is a teenager and still growing: do not prescribe aggressive calorie deficits, cutting phases, restrictive diets, body-fat targets, or extreme training volume. Do not diagnose conditions. Encourage parent/qualified-clinician guidance for significant diet, weight, or health decisions.

## 2. Fitness navigation
Bottom-level section tabs:
- Dashboard
- Body
- Nutrition
- Workout
More:
- Goals & Progress
- Recovery
- Analytics
- Exercise Library
- Programs
- Settings

## 3. Body tracking
Track optional:
- weight
- height
- waist, chest, arm, thigh
- progress photos
- body-fat percentage only when measured with a reliable method and clearly labeled

Weekly body check-in reminder; user can log anytime. Retain history. Measurements are private. Photos stored in private storage with access-controlled paths. Allow export and deletion. No automatic external upload or sharing.

Phases: Bulking, Cutting, Maintenance, and custom phases with dates/history. Phase labels are organizational only; the app must not recommend restrictive cutting for a growing teen.

## 4. Nutrition
Meal categories: breakfast, lunch, dinner, snacks. Support:
- food database/search
- manual/custom food
- saved and repeated meals
- serving/portion quantities
- calories and macros where data is available
- fiber, sugar, saturated fat, sodium, cholesterol, vitamins/minerals only when source data is reliable
- source and confidence labels for estimates

Do not present estimated nutrition as exact. Do not enforce calorie limits or automatic deficits. Goals are flexible and user-reviewed. Focus on regular meals, variety, hydration, and balanced nutrition.

Hydration:
- quick-add cups/bottles
- custom volume
- other fluids
- history and reminders
- no universal fixed water target

## 5. Workout management
Support:
- fixed weekly schedule, editable
- workout/rest day
- user-built and suggested programs
- exercise library with images/media only when licensed/available
- primary/secondary muscles
- equipment, difficulty, instructions, common mistakes, alternatives
- custom exercises
- per-set weight/reps/rest
- live logging and post-session editing
- workout duration and history
- personal records
- session comparisons

Missed workouts are recorded as missed/deferred only when user chooses; do not silently shift the schedule.

## 6. Progression and analytics
- training volume and frequency
- muscle-group distribution
- strength trends
- weekly comparisons
- PR history
- possible plateau flags only with sufficient data
- smart overload suggestions based on logged performance
- suggestions require user approval
- no diagnosis or certainty claims

## 7. Recovery
Optional sleep duration/quality, fatigue, soreness, readiness, and subjective energy. These are self-reported wellness indicators, not medical assessments. Provide gentle suggestions and advise rest/professional support when appropriate.

## 8. Goals
Hybrid: user defines goals; app may suggest milestones and review progress. Never impose goals or modify targets without approval.

## 9. Integrations
Apple Health and wearable integrations are optional and require explicit permissions. HealthKit requires a native iOS capability/entitlement and real-device testing; a generic PWA cannot be assumed to access Apple Health. Show source, sync time, permissions, and disconnect control.

## 10. Acceptance criteria
- User can log/edit workouts and meals.
- Estimates are visibly labeled.
- Photos remain private.
- Weekly measurements can be recorded without forced goals.
- No auto-cutting or deficit recommendations.
- All AI recommendations are reviewable and optional.
