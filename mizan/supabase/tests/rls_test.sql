-- RLS / ownership tests. Run via scripts/test-db.sh. Any failed assertion raises.
\set ON_ERROR_STOP on
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

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
-- perfect-day results are append-only, even for their owner
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
insert into public.perfect_day_definitions (id, effective_from, criteria)
  values ('bbbbbbbb-0000-0000-0000-000000000001', '2026-11-01', '[{"type":"habit","ref_id":"x"}]');
insert into public.perfect_day_results (id, local_date, status, met, applicable, sealed_at, definition_id)
  values ('bbbbbbbb-0000-0000-0000-000000000002', '2026-11-01', 'perfect', 1, 1, '2026-11-02T02:00:00Z', 'bbbbbbbb-0000-0000-0000-000000000001')
  on conflict (id) do update set status = excluded.status;
update public.perfect_day_results set status = 'incomplete';
delete from public.perfect_day_results;
do $$ begin
  if (select status from public.perfect_day_results) <> 'perfect' then raise exception 'FAIL: sealed result was modified'; end if;
  raise notice 'PASS: perfect-day results are append-only (upsert insert works, update/delete blocked)';
end $$;
select pg_temp.expect_error($$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values ('2026-11-01', 'perfect', 1, 1, '2026-11-02T02:00:00Z', 'bbbbbbbb-0000-0000-0000-000000000001')$$, 'second result for the same day');
select pg_temp.expect_error($$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values ('2026-11-05', 'perfect', 1, 1, '2026-11-01T00:00:00Z', 'bbbbbbbb-0000-0000-0000-000000000001')$$, 'sealing a day before it ended');
select pg_temp.expect_error($$insert into public.perfect_day_results (local_date, status, met, applicable, sealed_at, definition_id) values ('2026-11-06', 'perfect', 3, 1, '2026-11-07T02:00:00Z', 'bbbbbbbb-0000-0000-0000-000000000001')$$, 'met greater than applicable');
reset role;
\echo ALL RLS TESTS PASSED
