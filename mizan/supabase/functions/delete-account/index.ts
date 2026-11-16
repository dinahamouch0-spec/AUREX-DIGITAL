// Supabase Edge Function (Deno): permanently deletes the calling user.
// The service-role key is read from the function's server-side environment
// and never shipped to the app. All user rows cascade via FK on auth.users.
// Storage objects under '<uid>/' in 'body-photos' are removed first.
// NOTE: not executed in this repository's CI — deploy and test on staging.
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });
  const auth = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Verify the caller's JWT.
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return new Response('unauthorized', { status: 401 });
  const uid = data.user.id;

  const admin = createClient(url, service);
  const { data: files } = await admin.storage.from('body-photos').list(uid, { limit: 1000 });
  if (files && files.length) await admin.storage.from('body-photos').remove(files.map((f) => `${uid}/${f.name}`));
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return new Response('delete_failed', { status: 500 });
  return new Response(JSON.stringify({ deleted: true }), { headers: { 'Content-Type': 'application/json' } });
});
