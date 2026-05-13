import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

/**
 * Expo Go (StoreClient) cannot load expo-notifications on Android SDK 53+ (throws at import).
 * Web skips native module. Dev / standalone builds load the real package on first use.
 */
function getNotificationsModule(): NotificationsModule | null {
  if (cached !== undefined) return cached ?? null;

  if (Platform.OS === 'web') {
    cached = null;
    return null;
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    cached = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export async function scheduleLocalNotification(
  request: Parameters<NotificationsModule['scheduleNotificationAsync']>[0],
): Promise<void> {
  const m = getNotificationsModule();
  if (!m) return;
  await m.scheduleNotificationAsync(request);
}

/** Returns Expo push token, or null when unavailable (Expo Go, web, denied, etc.). */
export async function getExpoPushTokenIfAvailable(): Promise<string | null> {
  const m = getNotificationsModule();
  if (!m) return null;

  const perm = await m.getPermissionsAsync();
  if (perm.status !== 'granted') {
    const next = await m.requestPermissionsAsync();
    if (next.status !== 'granted') return null;
  }

  const token = await m.getExpoPushTokenAsync().catch(() => null);
  return token?.data ?? null;
}
