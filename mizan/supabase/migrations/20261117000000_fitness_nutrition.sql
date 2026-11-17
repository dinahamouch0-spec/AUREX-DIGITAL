-- Fitness & nutrition upgrade. Additive only: new nullable columns and one new
-- table, so existing rows and older app versions keep working unchanged.

-- Meal items logged from the built-in food table (values per 100 g, USDA-based)
alter table public.meal_items
  add column catalog_food_id text check (catalog_food_id ~ '^food:[a-z0-9_]+$'),
  add column grams numeric(7,1) check (grams > 0 and grams <= 5000);

-- Structured program days: [{id, name, weekdays[], exercises[{exercise_id, sets, reps_min, reps_max, rest_seconds}]}]
alter table public.workout_programs
  add column days_json jsonb check (days_json is null or jsonb_typeof(days_json) = 'array');

-- Recipes: ingredients with their computed values; per-serving = totals / servings
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  servings numeric(5,1) not null check (servings >= 0.5 and servings <= 100),
  ingredients_json jsonb not null default '[]'::jsonb check (jsonb_typeof(ingredients_json) = 'array'),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.recipes enable row level security;
alter table public.recipes force row level security;
create policy recipes_select_own on public.recipes for select to authenticated using (user_id = auth.uid());
create policy recipes_insert_own on public.recipes for insert to authenticated with check (user_id = auth.uid());
create policy recipes_update_own on public.recipes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy recipes_delete_own on public.recipes for delete to authenticated using (user_id = auth.uid());
create trigger recipes_updated_at before insert or update on public.recipes for each row execute function public.set_updated_at();
create trigger recipes_owner_immutable before update on public.recipes for each row execute function public.prevent_owner_change();
create index recipes_user_updated_idx on public.recipes (user_id, updated_at);
grant select, insert, update, delete on public.recipes to authenticated;
revoke all on public.recipes from anon;
