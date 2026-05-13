import * as SecureStore from 'expo-secure-store';

const ACCESS = 'terobytez_access_token';
const REFRESH = 'terobytez_refresh_token';

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS, tokens.access_token);
  await SecureStore.setItemAsync(REFRESH, tokens.refresh_token);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const access = await SecureStore.getItemAsync(ACCESS);
  const refresh = await SecureStore.getItemAsync(REFRESH);
  if (!access || !refresh) return null;
  return { access_token: access, refresh_token: refresh };
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}
