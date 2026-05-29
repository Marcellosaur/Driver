import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/shared/config/env';
import { secureStorage } from '@/shared/auth/secureStorage';

const SUPABASE_AUTH_KEY = 'terobytez_supabase_session';

let client: SupabaseClient | null = null;

/** Row shapes are defined in `src/types/db.ts`; swap in a generated `Database` generic when available. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: secureStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: SUPABASE_AUTH_KEY,
      },
    });
  }
  return client;
}
