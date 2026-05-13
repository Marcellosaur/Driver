import { useEffect } from 'react';

import { subscribeTripChannel } from '@/shared/realtime/realtimeManager';
import { getGpsCadenceSeconds, useEntitlementsQuery } from '@/shared/entitlements/useEntitlementsQuery';
import { useSession } from '@/shared/auth/useSession';
import { useLocationService } from '@/features/location/useLocationService';
import { useTripSend, useTripState } from '@/features/trips/tripContext';

/** Keeps GPS + Realtime running for the active trip across all driver tabs. */
export function TripRuntime() {
  const send = useTripSend();
  const state = useTripState();
  const tenantId = useSession((s) => s.tenantId);
  const activeTripId = state.context.activeTripId as string | null;
  const isActive = state.matches('active');

  const { data: entitlements } = useEntitlementsQuery(tenantId);
  const cadence = getGpsCadenceSeconds(entitlements);

  useLocationService({
    isTripActive: isActive,
    tenantId: tenantId ?? '',
    tripId: activeTripId,
    flushIntervalSec: cadence,
  });

  useEffect(() => {
    if (!isActive || !activeTripId || !tenantId) return;
    return subscribeTripChannel({
      tenantId,
      tripId: activeTripId,
      onTripStatus: (status) => send({ type: 'REALTIME_STATUS_CHANGE', status }),
    });
  }, [isActive, activeTripId, tenantId, send]);

  return null;
}
