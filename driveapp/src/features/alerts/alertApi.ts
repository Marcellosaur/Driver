import { ApiError, authenticatedFetch } from '@/shared/api/apiClient';
import { enqueueOutbound } from '@/shared/api/offlineQueue';
import { getSupabase } from '@/shared/auth/authClient';
import { env } from '@/shared/config/env';
import { scheduleLocalNotification } from '@/shared/push/expoNotificationsSafe';

const DEFAULT_MESSAGE = 'Driver emergency alert';

function isRetryable(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof ApiError) {
    const s = e.body.status;
    return s === undefined || s >= 500;
  }
  return true;
}

export async function postAlertDirect(
  tenantId: string,
  tripId: string | null,
  message: string,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('alerts').insert({
    tenant_id: tenantId,
    trip_id: tripId,
    severity: 'critical',
    message: message || DEFAULT_MESSAGE,
  });
  if (error) throw error;
}

export async function postAlertBff(
  tenantId: string,
  tripId: string | null,
  message: string,
): Promise<void> {
  if (!env.apiBaseUrl) {
    await postAlertDirect(tenantId, tripId, message);
    return;
  }
  await authenticatedFetch('POST', `/tenants/${tenantId}/alerts`, {
    trip_id: tripId,
    severity: 'critical',
    message: message || DEFAULT_MESSAGE,
  });
}

export async function sendCriticalAlert(params: {
  tenantId: string;
  tripId: string | null;
  message?: string;
}): Promise<void> {
  const message = params.message?.trim() || DEFAULT_MESSAGE;
  const idempotencyKey = `alert-${params.tenantId}-${params.tripId ?? 'none'}-${Date.now()}`;

  const attemptOnce = async (): Promise<void> => {
    if (env.apiBaseUrl) {
      await postAlertBff(params.tenantId, params.tripId, message);
    } else {
      await postAlertDirect(params.tenantId, params.tripId, message);
    }
  };

  const started = Date.now();
  const maxMs = 5 * 60 * 1000;
  let attempt = 0;
  let delay = 1000;

  while (Date.now() - started < maxMs && attempt < 10) {
    try {
      await attemptOnce();
      return;
    } catch (e) {
      attempt += 1;
      if (!isRetryable(e)) {
        await scheduleLocalNotification({
          content: {
            title: 'Alert failed',
            body: 'Alert failed — call dispatch directly.',
          },
          trigger: null,
        });
        throw e;
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, 60_000);
    }
  }

  await enqueueOutbound({
    type: 'alert',
    payload: { tenantId: params.tenantId, tripId: params.tripId, message },
    idempotencyKey,
  });

  await scheduleLocalNotification({
    content: {
      title: 'Alert failed',
      body: 'Alert failed — call dispatch directly.',
    },
    trigger: null,
  });
}
