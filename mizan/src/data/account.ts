import { store } from '../state/AppContext';
import { getSupabase } from './supabase';

/** Sign out and remove the local copy (privacy: nothing left on a shared device). */
export async function signOutAndWipe() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  await store.wipe();
}

/**
 * Account deletion: the `delete-account` Edge Function verifies the JWT and
 * deletes the auth user (cascading to all rows). Then local data is wiped.
 */
export async function deleteAccount() {
  const sb = getSupabase();
  if (!sb) throw new Error('backend_not_configured');
  const { error } = await sb.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
  await sb.auth.signOut();
  await store.wipe();
}
