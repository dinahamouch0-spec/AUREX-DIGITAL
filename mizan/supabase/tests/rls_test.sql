-- RLS / ownership tests. Run via scripts/test-db.sh. Any failed assertion raises.
\set ON_ERROR_STOP on
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

-- expect_error(sql, label [, pattern]): the statement must fail; if a pattern is
-- given, the error message must match it (so we know WHY it was rejected).
create or replace function pg_temp.expect_error(sql text, label text, pattern text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if pattern is not null and sqlerrm !~* pattern then
      raise exception 'FAIL: % rejected for the wrong reason: %', label, sqlerrm;
    end if;
    raise notice 'PASS (rejected): %', label;
    return;
  end;
  raise exception 'FAIL: expected rejection: %', label;
end $$;

create or replace function pg_temp.expect_error(sql text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'PASS (rejected): %', label;
    return;
  end;
  raise exception 'FAIL: expected rejection: %', label;
end $$;

-- ---- user A writes data
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

insert into public.tasks (id, domain, title, status, priority)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'A task', 'not_started', 'medium');
insert into public.clients (id, name, status, phone) values ('aaaaaaaa-0000-0000-0000-000000000002', 'Client A', 'lead', '+961 1 000000');
insert into public.transactions (direction, amount_minor, currency, occurred_on, status)
  values ('income', 1000, 'USD', '2026-11-16', 'cleared');
insert into public.prayer_logs (prayer_type, local_date, status) values ('fajr', '2026-11-16', 'performed');
insert into public.audit_logs (action, entity_type, occurred_at) values ('create', 'transactions', now());

do $$ begin
  if (select count(*) from public.tasks) <> 1 then raise exception 'FAIL: owner cannot read own task'; end if;
  if (select user_id from public.tasks limit 1) <> '11111111-1111-1111-1111-111111111111' then raise exception 'FAIL: user_id default'; end if;
  raise notice 'PASS: owner reads own rows; user_id defaults to auth.uid()';
end $$;

-- invalid data is rejected by constraints
select pg_temp.expect_error($$insert into public.transactions (direction, amount_minor, currency, occurred_on, status) values ('income', 1000, 'EUR', '2026-11-16', 'cleared')$$, 'unsupported currency');
select pg_temp.expect_error($$insert into public.transactions (direction, amount_minor, currency, occurred_on, status) values ('income', -5, 'USD', '2026-11-16', 'cleared')$$, 'negative amount');
select pg_temp.expect_error($$insert into public.prayer_logs (prayer_type, local_date, status) values ('fajr', '2026-11-16', 'performed')$$, 'duplicate live prayer record for same day');
select pg_temp.expect_error($$insert into public.prayer_logs (prayer_type, local_date, status) values ('asr', '2026-11-16', 'not_recorded')$$, '"not recorded" is never stored');
select pg_temp.expect_error($$insert into public.tasks (user_id, domain, title, status, priority) values ('22222222-2222-2222-2222-222222222222', 'general', 'spoof', 'not_started', 'low')$$, 'insert with spoofed user_id');
select pg_temp.expect_error($$update public.tasks set user_id = '22222222-2222-2222-2222-222222222222'$$, 'moving a row to another user');
-- audit logs are append-only
update public.audit_logs set action = 'tampered';
do $$ begin
  if exists (select 1 from public.audit_logs where action = 'tampered') then raise exception 'FAIL: audit log was modified'; end if;
  raise notice 'PASS: audit logs cannot be modified';
end $$;

-- a tombstoned prayer log frees the slot for a corrected entry
update public.prayer_logs set deleted_at = now() where prayer_type = 'fajr';
insert into public.prayer_logs (prayer_type, local_date, status) values ('fajr', '2026-11-16', 'excused');

-- ---- user B cannot see or touch A's data
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$ begin
  if (select count(*) from public.tasks) <> 0 then raise exception 'FAIL: B can read A tasks'; end if;
  if (select count(*) from public.clients) <> 0 then raise exception 'FAIL: B can read A clients'; end if;
  if (select count(*) from public.transactions) <> 0 then raise exception 'FAIL: B can read A transactions'; end if;
  if (select count(*) from public.prayer_logs) <> 0 then raise exception 'FAIL: B can read A prayer logs'; end if;
  raise notice 'PASS: cross-user reads return nothing';
end $$;
update public.tasks set title = 'hacked';
delete from public.clients;
-- upsert onto A's id must not overwrite A's row
select pg_temp.expect_error($$insert into public.tasks (id, domain, title, status, priority) values ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'hijack', 'not_started', 'low') on conflict (id) do update set title = excluded.title$$, 'upsert hijack of another user''s id');

-- ---- anonymous role has no access at all
reset role;
set role anon;
select pg_temp.expect_error($$select * from public.tasks$$, 'anon select');

-- ---- verify A's data is intact
reset role;
do $$ begin
  if (select title from public.tasks where id = 'aaaaaaaa-0000-0000-0000-000000000001') <> 'A task' then raise exception 'FAIL: B modified A task'; end if;
  if (select count(*) from public.clients) <> 1 then raise exception 'FAIL: B deleted A client'; end if;
  raise notice 'PASS: A''s rows unchanged after B''s update/delete attempts';
end $$;

-- every public table has RLS forced
do $$
declare missing text;
begin
  select string_agg(c.relname, ', ') into missing
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not (c.relrowsecurity and c.relforcerowsecurity);
  if missing is not null then raise exception 'FAIL: RLS not forced on %', missing; end if;
  raise notice 'PASS: RLS enabled and forced on every public table';
end $$;

-- server sets updated_at (sync cursor relies on it)
do $$ begin
  update public.tasks set title = 'A task' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  if (select updated_at from public.tasks where id = 'aaaaaaaa-0000-0000-0000-000000000001') < now() - interval '1 minute' then
    raise exception 'FAIL: updated_at not maintained';
  end if;
  raise notice 'PASS: updated_at maintained by server';
end $$;
-- ======================================================= perfect days
-- Close time = 04:00 Asia/Beirut on the next day, DST-aware.
do $$ begin
  -- winter (UTC+2): 2026-01-16 04:00 Beirut = 02:00Z
  if public.perfect_day_seal_due('2026-01-15', 'Asia/Beirut') <> '2026-01-16T02:00:00Z' then raise exception 'FAIL: winter close time'; end if;
  -- summer (UTC+3): 2026-07-02 04:00 Beirut = 01:00Z
  if public.perfect_day_seal_due('2026-07-01', 'Asia/Beirut') <> '2026-07-02T01:00:00Z' then raise exception 'FAIL: summer close time'; end if;
  -- spring-forward night (00:00 -> 01:00 on 2026-03-29): day before closes 04:00 UTC+3
  if public.perfect_day_seal_due('2026-03-28', 'Asia/Beirut') <> '2026-03-29T01:00:00Z' then raise exception 'FAIL: spring DST close time'; end if;
  -- fall-back night (00:00 -> 23:00 on 2026-10-25): day before closes 04:00 UTC+2
  if public.perfect_day_seal_due('2026-10-24', 'Asia/Beirut') <> '2026-10-25T02:00:00Z' then raise exception 'FAIL: autumn DST close time'; end if;
  -- a far-east profile zone can never close a day earlier than Beirut
  if public.perfect_day_seal_due('2026-07-01', 'Pacific/Kiritimati') <> '2026-07-02T01:00:00Z' then raise exception 'FAIL: east zone closed early'; end if;
  -- a west zone closes later (its own 04:00)
  if public.perfect_day_seal_due('2026-07-01', 'America/New_York') <> '2026-07-02T08:00:00Z' then raise exception 'FAIL: west zone close time'; end if;
  -- unknown zone falls back to Beirut
  if public.perfect_day_seal_due('2026-07-01', 'Not/AZone') <> '2026-07-02T01:00:00Z' then raise exception 'FAIL: unknown zone fallback'; end if;
  raise notice 'PASS: close time is 04:00 Beirut next day (winter, summer, both DST nights, zone changes)';
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
create temp table if not exists pd_dates as
  select (now() at time zone 'Asia/Beirut')::date as today_beirut;
insert into public.perfect_day_definitions (id, effective_from, criteria)
  values ('bbbbbbbb-0000-0000-0000-000000000001', (select today_beirut - 30 from pd_dates), '[{"type":"habit","ref_id":"x"}]');

-- a day closed long ago syncs fine (late sync after offline), and the client's
-- sealed_at is replaced by the canonical close time
insert into public.perfect_day_results (id, local_date, status, met, applicable, sealed_at, definition_id)
  values ('bbbbbbbb-0000-0000-0000-000000000002', (select today_beirut - 3 from pd_dates), 'perfect', 1, 1, '2000-01-01T00:00:00Z', 'bbbbbbbb-0000-0000-0000-000000000001')
  on conflict (id) do update set status = excluded.status;
do $$ begin
  if (select sealed_at from public.perfect_day_results where id = 'bbbbbbbb-0000-0000-0000-000000000002')
     <> public.perfect_day_seal_due((select today_beirut - 3 from pd_dates), 'Asia/Beirut') then
    raise exception 'FAIL: sealed_at was not set by the server';
  end if;
  raise notice 'PASS: late sync accepted; client sealed_at overwritten with the server close time';
end $$;

-- today and tomorrow (Beirut) can never be closed yet, whatever sealed_at the client sends
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'perfect', 1, 1, '2099-01-01T00:00:00Z', 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut from pd_dates)), 'closing today before 04:00 tomorrow (forged future sealed_at)', 'not closed until');
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'perfect', 1, 1, '2000-01-01T00:00:00Z', 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut + 1 from pd_dates)), 'closing a future day', 'not closed until');
-- yesterday: allowed only if the server clock is past 04:00 Beirut today
do $$
declare d date := (select today_beirut - 1 from pd_dates); ok boolean;
begin
  begin
    insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id)
      values (d, 'rest', 0, 0, now(), 'bbbbbbbb-0000-0000-0000-000000000001');
    ok := true;
  exception when others then ok := false;
  end;
  if ok <> (statement_timestamp() >= public.perfect_day_seal_due(d, 'Asia/Beirut')) then
    raise exception 'FAIL: yesterday accepted=% but due=%', ok, public.perfect_day_seal_due(d, 'Asia/Beirut');
  end if;
  raise notice 'PASS: yesterday is accepted exactly when 04:00 Beirut has passed (accepted=%)', ok;
end $$;

-- a timezone change in the profile can't close a day earlier than Beirut
insert into public.profiles (id, timezone) values ('11111111-1111-1111-1111-111111111111', 'Pacific/Kiritimati');
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'perfect', 1, 1, now(), 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut from pd_dates)), 'closing today early via a far-east profile timezone', 'not closed until');

-- status must agree with the counts
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'perfect', 1, 2, now(), 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut - 5 from pd_dates)), 'perfect with met < applicable', 'perfect_day_results_consistent');
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'perfect', 0, 0, now(), 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut - 5 from pd_dates)), 'perfect with nothing applicable', 'perfect_day_results_consistent');
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'incomplete', 2, 2, now(), 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut - 5 from pd_dates)), 'incomplete with all met', 'perfect_day_results_consistent');
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'rest', 0, 1, now(), 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut - 5 from pd_dates)), 'rest with something applicable', 'perfect_day_results_consistent');
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'incomplete', 3, 1, now(), 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut - 5 from pd_dates)), 'met greater than applicable', 'check constraint');
-- a definition must be in effect on that day
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'rest', 0, 0, now(), 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut - 40 from pd_dates)), 'day before the definition took effect', 'not in effect');
-- one result per day
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'rest', 0, 0, now(), 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut - 3 from pd_dates)), 'second result for the same day', 'perfect_day_results_one_per_day');

-- append-only for the owner (no update/delete policy)
update public.perfect_day_results set status = 'incomplete';
delete from public.perfect_day_results;
do $$ begin
  if (select status from public.perfect_day_results where id = 'bbbbbbbb-0000-0000-0000-000000000002') <> 'perfect' then raise exception 'FAIL: sealed result was modified'; end if;
  raise notice 'PASS: owner cannot update or delete closed days';
end $$;

-- another user can't attach a result to someone else's definition
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select pg_temp.expect_error(format($f$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values (%L, 'rest', 0, 0, now(), 'bbbbbbbb-0000-0000-0000-000000000001')$f$, (select today_beirut - 4 from pd_dates)), 'result referencing another user''s definition', 'does not belong');
reset role;

-- even with RLS bypassed (e.g. service role), updates are refused by the trigger
select pg_temp.expect_error($$update public.perfect_day_results set status = 'incomplete', met = 0 where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$, 'privileged update of a closed day', 'append-only');
\echo ALL RLS TESTS PASSED
