import { Platform } from 'react-native';

import type { Platform as DbPlatform } from '@/types/db';

import { getSupabase } from '@/shared/auth/authClient';

function toDbPlatform(): DbPlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

export async function registerDevice(params: {
  userId: string;
  tenantId: string | null;
  pushToken: string | null;
}): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('devices').upsert(
    {
      user_id: params.userId,
      tenant_id: params.tenantId,
      platform: toDbPlatform(),
      push_token: params.pushToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

export async function clearDevicePushToken(userId: string): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('devices')
    .update({ push_token: null, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}
