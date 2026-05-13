import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getSupabase } from '@/shared/auth/authClient';
import { clearTokens, loadTokens, saveTokens } from '@/shared/auth/tokenStorage';
import { env } from '@/shared/config/env';

export class ApiError extends Error {
  constructor(
    public readonly body: { type?: string; title?: string; status?: number; detail?: string },
  ) {
    super(body.detail ?? body.title ?? 'API error');
    this.name = 'ApiError';
  }
}

const BASE_URL = env.apiBaseUrl.replace(/\/$/, '');

export async function authenticatedFetch<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  let tokens = await loadTokens();
  if (!tokens) {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (s?.access_token && s.refresh_token) {
      tokens = { access_token: s.access_token, refresh_token: s.refresh_token };
      await saveTokens(tokens);
    }
  }

  if (!tokens) {
    throw new ApiError({ title: 'Unauthorized', status: 401, detail: 'No session' });
  }

  const doFetch = async (accessToken: string) =>
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-App-Version': Constants.expoConfig?.version ?? 'unknown',
        'X-Platform': Platform.OS,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(tokens.access_token);

  if (res.status === 401) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: tokens.refresh_token,
    });
    if (error || !data.session) {
      await clearTokens();
      throw new ApiError({ title: 'Unauthorized', status: 401, detail: 'Refresh failed' });
    }
    await saveTokens({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    res = await doFetch(data.session.access_token);
  }

  if (!res.ok) {
    let parsed: { type?: string; title?: string; status?: number; detail?: string } = {};
    try {
      parsed = (await res.json()) as typeof parsed;
    } catch {
      parsed = { detail: await res.text() };
    }
    throw new ApiError({ ...parsed, status: res.status });
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
