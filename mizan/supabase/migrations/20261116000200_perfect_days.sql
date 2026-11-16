-- Perfect Days & streaks.
-- Definitions are versioned (effective_from); results are an append-only
-- ledger written once per closed day, so a streak can't be rewritten.

create table public.perfect_day_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  effective_from date not null,
  criteria jsonb not null check (jsonb_typeof(criteria) = 'array' and jsonb_array_length(criteria) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.day_exemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  reason text not null check (reason in ('rest','holiday','sick','travel','other')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index day_exemptions_one_per_day on public.day_exemptions (user_id, local_date) where deleted_at is null;

create table public.perfect_day_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  status text not null check (status in ('perfect','incomplete','rest','exempt')),
  met integer not null check (met >= 0),
  applicable integer not null check (applicable >= 0 and met <= applicable),
  sealed_at timestamptz not null,
  definition_id uuid not null references public.perfect_day_definitions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- a day can only be sealed after it ended
  check (sealed_at >= (local_date + 1)::timestamp at time zone 'UTC' - interval '14 hours')
);
create unique index perfect_day_results_one_per_day on public.perfect_day_results (user_id, local_date);

do $$
declare t text;
begin
  foreach t in array array['perfect_day_definitions','day_exemptions','perfect_day_results'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())', t || '_insert_own', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.prevent_owner_change()', t || '_owner_immutable', t);
    execute format('create index %I on public.%I (user_id, updated_at)', t || '_user_updated_idx', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Definitions and exemptions can be edited/tombstoned by their owner; results cannot.
create policy perfect_day_definitions_update_own on public.perfect_day_definitions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy day_exemptions_update_own on public.day_exemptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- (no update/delete policy on perfect_day_results: append-only)
