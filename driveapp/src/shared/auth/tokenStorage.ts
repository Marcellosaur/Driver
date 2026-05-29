import { secureStorage } from '@/shared/auth/secureStorage';

const ACCESS = 'terobytez_access_token';
const REFRESH = 'terobytez_refresh_token';

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await secureStorage.setItem(ACCESS, tokens.access_token);
  await secureStorage.setItem(REFRESH, tokens.refresh_token);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const access = await secureStorage.getItem(ACCESS);
  const refresh = await secureStorage.getItem(REFRESH);
  if (!access || !refresh) return null;
  return { access_token: access, refresh_token: refresh };
}

export async function clearTokens(): Promise<void> {
  await secureStorage.removeItem(ACCESS);
  await secureStorage.removeItem(REFRESH);
}
