# Connecting Supabase (accounts + cloud sync)

MIZAN runs local-only until these steps are done. Nothing needs to be rebuilt: the backend layer (`src/data/supabase.ts`, `src/data/sync.ts`) is already wired and switches on when the two public env vars exist.

## 1. Create the project (owner)
- Create a project at supabase.com (choose an EU region, e.g. Frankfurt, for latency from Lebanon).
- Auth → Providers: keep Email enabled; turn on email confirmation.
- Optional: Auth → Rate limits. The defaults are fine to start with.

## 2. Apply the schema
```bash
npx supabase login
npx supabase link --project-ref <your-ref>
npx supabase db push            # applies supabase/migrations/*.sql in order
```
Before pushing to production, run the same migrations on a **staging** project. Locally you can verify them with `npm run test:db` (plain PostgreSQL + RLS tests).

## 3. Configure the app
Create `mizan/.env.local` (git-ignored):
```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
```
The anon key is safe in the app **because** RLS restricts every row to `auth.uid()`.
**Never** put the `service_role` key in the app, in `EXPO_PUBLIC_*`, or in git. For EAS builds, set the same two variables as EAS environment variables.

## 4. Account deletion function
```bash
npx supabase functions deploy delete-account
```
It reads `SUPABASE_SERVICE_ROLE_KEY` from Supabase's server-side function environment, verifies the caller's JWT, removes their photo folder, and deletes the auth user. All rows cascade.

## 5. Verify (staging first)
1. Sign up in the app → confirm email → sign in.
2. Create records offline (Airplane Mode), reconnect → Settings → Account & sync shows "All changes synced".
3. Sign in on a second device → records appear.
4. Edit the same transaction on both devices offline → a conflict appears for review.
5. In the SQL editor, run the queries from `supabase/tests/rls_test.sql` against two test users.
6. Delete a test account → its rows are gone.

## How sync works
- Each write goes to the local store and a durable outbox (per-record, coalesced).
- Push: for each item, fetch the server row; if it changed since we last saw it, create a **conflict** (never auto-merged); otherwise upsert with the session's `user_id`. RLS rejects anything else.
- Pull: per table, rows with `updated_at >= cursor` (server-maintained timestamp).
- Failures back off exponentially with jitter (max 8 tries), then stay as "failed" with a manual retry. They are never dropped.
- Progress photos are local-only and are never synced.
