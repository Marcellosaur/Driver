import type { Schedule, Stop, Trip, TripStatus } from '@/types/db';

import { ApiError, authenticatedFetch } from '@/shared/api/apiClient';
import { enqueueOutbound } from '@/shared/api/offlineQueue';
import { getSupabase } from '@/shared/auth/authClient';
import { env } from '@/shared/config/env';
import { toError } from '@/shared/errors';

export interface TripStopRow {
  sequence_order: number;
  arrival_offset_min: number;
  departure_offset_min: number;
  is_destination: boolean;
  stop: Pick<Stop, 'id' | 'name' | 'lat' | 'lng'>;
}

export interface TripDetail extends Trip {
  route_stops: TripStopRow[];
  schedules: Schedule[];
}

function isRetryable(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof ApiError) {
    const s = e.body.status;
    return s === undefined || s >= 500;
  }
  return true;
}

export async function fetchAssignedTrips(tenantId: string, driverId: string): Promise<Trip[]> {
  if (env.apiBaseUrl) {
    try {
      const q = new URLSearchParams({
        driver_id: driverId,
        status: 'scheduled',
      });
      return await authenticatedFetch<Trip[]>(
        'GET',
        `/tenants/${tenantId}/trips?${q.toString()}`,
      );
    } catch (e) {
      if (!isRetryable(e)) throw e;
    }
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('driver_id', driverId)
    .eq('status', 'scheduled')
    .order('scheduled_start', { ascending: true });

  if (error) throw toError(error, 'Failed to load assigned trips');
  return (data ?? []) as Trip[];
}

export async function fetchActiveTrip(tenantId: string, driverId: string): Promise<Trip | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('driver_id', driverId)
    .eq('status', 'active')
    .order('scheduled_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw toError(error, 'Failed to check for active trip');
  return (data as Trip | null) ?? null;
}

export async function fetchTripDetail(tenantId: string, tripId: string): Promise<TripDetail> {
  if (env.apiBaseUrl) {
    try {
      return await authenticatedFetch<TripDetail>('GET', `/tenants/${tenantId}/trips/${tripId}`);
    } catch (e) {
      if (!isRetryable(e)) throw e;
    }
  }

  const supabase = getSupabase();
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('tenant_id', tenantId)
    .single();

  if (tripErr || !trip) throw tripErr ?? new Error('Trip not found');

  const routeId = trip.route_id as string;

  const { data: rsRows, error: rsErr } = await supabase
    .from('route_stops')
    .select(
      `
      sequence_order,
      arrival_offset_min,
      departure_offset_min,
      is_destination,
      stops ( id, name, lat, lng )
    `,
    )
    .eq('route_id', routeId)
    .order('sequence_order', { ascending: true });

  if (rsErr) throw rsErr;

  const { data: sched, error: schErr } = await supabase
    .from('schedules')
    .select('*')
    .eq('route_id', routeId)
    .eq('tenant_id', tenantId);

  if (schErr) throw schErr;

  const route_stops: TripStopRow[] = (rsRows ?? []).map((row: Record<string, unknown>) => {
    const stop = row.stops as Stop;
    return {
      sequence_order: row.sequence_order as number,
      arrival_offset_min: row.arrival_offset_min as number,
      departure_offset_min: row.departure_offset_min as number,
      is_destination: row.is_destination as boolean,
      stop: {
        id: stop.id,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
      },
    };
  });

  return {
    ...(trip as Trip),
    route_stops,
    schedules: (sched ?? []) as Schedule[],
  };
}

export async function patchTripStatus(
  tenantId: string,
  tripId: string,
  status: Extract<TripStatus, 'active' | 'completed'>,
  options: { allowQueue?: boolean } = {},
): Promise<void> {
  const allowQueue = options.allowQueue !== false;
  const idempotencyKey = `trip-status-${tripId}-${status}`;
  const payload = { tenantId, tripId, status };

  if (env.apiBaseUrl) {
    try {
      await authenticatedFetch('PATCH', `/tenants/${tenantId}/trips/${tripId}/status`, { status });
      return;
    } catch (e) {
      if (allowQueue && isRetryable(e)) {
        await enqueueOutbound({
          type: 'trip_status',
          payload,
          idempotencyKey,
        });
        return;
      }
      throw e;
    }
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('trips')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', tripId)
    .eq('tenant_id', tenantId);

  if (error) {
    if (allowQueue) {
      await enqueueOutbound({
        type: 'trip_status',
        payload,
        idempotencyKey,
      });
      return;
    }
    throw error;
  }
}
