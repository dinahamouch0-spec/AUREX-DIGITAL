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
  -- Always the server-computed close time (see enforce_perfect_day_seal); a
  -- client-supplied value is overwritten, so it can't be manipulated.
  sealed_at timestamptz not null,
  definition_id uuid not null references public.perfect_day_definitions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- status must agree with the counts
  constraint perfect_day_results_consistent check (
    (status = 'perfect'    and applicable > 0 and met = applicable) or
    (status = 'incomplete' and applicable > 0 and met < applicable) or
    (status = 'rest'       and applicable = 0 and met = 0) or
    (status = 'exempt')
  )
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

-- ------------------------------------------------------------------ sealing
-- A day D closes at 04:00 local time on D+1. The reference zone is
-- Asia/Beirut; if the user's profile has another valid zone, the LATER of the
-- two close times applies, so changing the profile timezone can never close
-- a day earlier than 04:00 Beirut time. DST is handled by PostgreSQL's tz
-- database (Lebanon switches at 00:00, so 04:00 always exists).
create or replace function public.perfect_day_seal_due(p_date date, p_timezone text)
returns timestamptz
language sql stable
set search_path = public, pg_catalog
as $$
  select greatest(
    ((p_date + 1)::timestamp + time '04:00') at time zone 'Asia/Beirut',
    ((p_date + 1)::timestamp + time '04:00') at time zone
      coalesce((select name from pg_catalog.pg_timezone_names where name = p_timezone limit 1), 'Asia/Beirut')
  )
$$;

create or replace function public.enforce_perfect_day_seal() returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_tz text;
  v_due timestamptz;
  v_def public.perfect_day_definitions%rowtype;
begin
  if tg_op = 'UPDATE' then
    raise exception 'perfect_day_results is append-only' using errcode = '42501';
  end if;

  select timezone into v_tz from public.profiles where id = new.user_id;
  v_due := public.perfect_day_seal_due(new.local_date, coalesce(v_tz, 'Asia/Beirut'));

  -- server clock decides; late inserts (offline devices syncing later) are fine
  if statement_timestamp() < v_due then
    raise exception 'day % is not closed until %', new.local_date, v_due using errcode = '23514';
  end if;
  new.sealed_at := v_due; -- canonical, never client-controlled

  select * into v_def from public.perfect_day_definitions where id = new.definition_id;
  if not found or v_def.user_id <> new.user_id then
    raise exception 'definition does not belong to this user' using errcode = '42501';
  end if;
  if v_def.effective_from > new.local_date then
    raise exception 'definition was not in effect on %', new.local_date using errcode = '23514';
  end if;
  return new;
end $$;

create trigger perfect_day_results_seal
  before insert or update on public.perfect_day_results
  for each row execute function public.enforce_perfect_day_seal();

grant execute on function public.perfect_day_seal_due(date, text) to authenticated;
