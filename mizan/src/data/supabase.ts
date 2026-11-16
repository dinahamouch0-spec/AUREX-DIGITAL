/**
 * Supabase client boundary. Only the public URL and the anon (publishable)
 * key are used client-side; they are safe to ship because RLS enforces
 * ownership. NEVER put a service-role key in the app or in EXPO_PUBLIC_*.
 *
 * If the env vars are absent the app runs in local-only mode.
 */
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { CollectionName } from '../domain/types';
import type { Row } from './store';
import type { RemoteAdapter } from './sync';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isBackendConfigured = Boolean(url && anonKey);

/**
 * Session storage: iOS Keychain via SecureStore on device. SecureStore
 * values are limited in size, so long values are chunked.
 */
const CHUNK = 1800;
const secureStorage = {
  async getItem(key: string) {
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (!count) return SecureStore.getItemAsync(key);
    let out = '';
    for (let i = 0; i < Number(count); i++) out += (await SecureStore.getItemAsync(`${key}.${i}`)) ?? '';
    return out;
  },
  async setItem(key: string, value: string) {
    await this.removeItem(key);
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i++) await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await SecureStore.setItemAsync(`${key}.n`, String(n));
  },
  async removeItem(key: string) {
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (count) for (let i = 0; i < Number(count); i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
    await SecureStore.deleteItemAsync(`${key}.n`);
    await SecureStore.deleteItemAsync(key);
  },
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isBackendConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export class SupabaseRemote implements RemoteAdapter {
  constructor(private sb: SupabaseClient) {}

  async upsert(collection: CollectionName, row: Record<string, unknown>): Promise<Row> {
    const { data, error } = await this.sb.from(collection).upsert(row, { onConflict: 'id' }).select().single();
    if (error) throw error;
    return data as Row;
  }

  async fetchById(collection: CollectionName, id: string): Promise<Row | null> {
    const { data, error } = await this.sb.from(collection).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data as Row) ?? null;
  }

  async fetchChangedSince(collection: CollectionName, cursor: string | null, limit: number): Promise<Row[]> {
    let q = this.sb.from(collection).select('*').order('updated_at', { ascending: true }).limit(limit);
    if (cursor) q = q.gte('updated_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    return (data as Row[]) ?? [];
  }
}
