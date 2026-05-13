import { getSupabase } from '@/shared/auth/authClient';

export async function upsertDriverLivePosition(params: {
  tripId: string;
  tenantId: string;
  userId: string;
  lat: number;
  lng: number;
  accuracy?: number | null;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('driver_live_positions').upsert(
    {
      trip_id: params.tripId,
      tenant_id: params.tenantId,
      user_id: params.userId,
      lat: params.lat,
      lng: params.lng,
      accuracy: params.accuracy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'trip_id' },
  );
  if (error) throw error;
}

export async function clearDriverLivePosition(tripId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('driver_live_positions').delete().eq('trip_id', tripId);
  if (error) throw error;
}
