import type { DriverLivePosition, TripStatus } from '@/types/db';

import { getSupabase } from '@/shared/auth/authClient';

export function subscribeTripChannel(params: {
  tenantId: string;
  tripId: string;
  onTripStatus: (status: TripStatus) => void;
}): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`tenant:${params.tenantId}:trip:${params.tripId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${params.tripId}`,
      },
      (payload) => {
        const row = payload.new as { status?: TripStatus };
        if (row.status) params.onTripStatus(row.status);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Viewer map: latest row for this trip (INSERT/UPDATE from driver upserts). */
export function subscribeDriverLivePosition(params: {
  tripId: string;
  onPosition: (row: Pick<DriverLivePosition, 'lat' | 'lng' | 'updated_at'>) => void;
}): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`livepos:${params.tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'driver_live_positions',
        filter: `trip_id=eq.${params.tripId}`,
      },
      (payload) => {
        const row = (payload.new as DriverLivePosition | null) ?? (payload.old as DriverLivePosition | null);
        if (row && typeof row.lat === 'number' && typeof row.lng === 'number') {
          params.onPosition({ lat: row.lat, lng: row.lng, updated_at: row.updated_at });
        }
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
