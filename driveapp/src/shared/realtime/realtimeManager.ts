import type { TripStatus } from '@/types/db';

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
