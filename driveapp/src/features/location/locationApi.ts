import type { LocationSample } from '@/types/db';

import { ApiError, authenticatedFetch } from '@/shared/api/apiClient';
import { trackEvent } from '@/shared/analytics/analytics';
import { enqueueOutbound } from '@/shared/api/offlineQueue';
import { getSupabase } from '@/shared/auth/authClient';
import { env } from '@/shared/config/env';

export interface LocationBatchPayload {
  tenantId: string;
  tripId: string;
  samples: {
    tenant_id: string;
    trip_id: string;
    lat: number;
    lng: number;
    recorded_at: string;
    payload: LocationSample['payload'];
  }[];
}

function isRetryable(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof ApiError) {
    const s = e.body.status;
    return s === undefined || s >= 500;
  }
  return true;
}

export async function postLocationBatch(
  batch: LocationBatchPayload,
  options: { allowQueue?: boolean } = {},
): Promise<void> {
  const allowQueue = options.allowQueue !== false;
  const firstTs = batch.samples[0]?.recorded_at ?? `${Date.now()}`;
  const idempotencyKey = `loc-batch-${batch.tripId}-${firstTs}`;

  if (env.apiBaseUrl) {
    try {
      await authenticatedFetch('POST', `/tenants/${batch.tenantId}/trips/${batch.tripId}/locations`, {
        samples: batch.samples,
      });
      trackEvent('location_batch_sent', { count: batch.samples.length });
      return;
    } catch (e) {
      if (allowQueue && isRetryable(e)) {
        await enqueueOutbound({
          type: 'location_batch',
          payload: batch,
          idempotencyKey,
        });
        return;
      }
      throw e;
    }
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('location_samples').insert(
    batch.samples.map((s) => ({
      tenant_id: s.tenant_id,
      trip_id: s.trip_id,
      lat: s.lat,
      lng: s.lng,
      recorded_at: s.recorded_at,
      payload: s.payload,
    })),
  );

  if (error) {
    if (allowQueue) {
      await enqueueOutbound({
        type: 'location_batch',
        payload: batch,
        idempotencyKey,
      });
      return;
    }
    throw error;
  }

  trackEvent('location_batch_sent', { count: batch.samples.length });
}
