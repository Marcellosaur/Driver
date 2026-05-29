import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import type { Schedule, Trip } from '@/types/db';

import type { TripStopRow } from '@/features/trips/tripApi';
import { LabelCaps, Mono } from '@/shared/ui/dispatch/Typography';
import { TerminalCard } from '@/shared/ui/dispatch/TerminalCard';
import { RouteCodeBadge } from '@/shared/ui/dispatch/StatusBadge';
import { tokens } from '@/shared/ui/design-tokens';

function baseDateForTrip(trip: Trip): Date {
  if (trip.scheduled_start) return new Date(trip.scheduled_start);
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function applyDepartsAt(base: Date, departsAt: string | null): Date {
  if (!departsAt) return base;
  const parts = departsAt.split(':').map((p) => Number(p));
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  const out = new Date(base);
  out.setHours(h, m, s, 0);
  return out;
}

function addMinutes(d: Date, minutes: number): Date {
  const out = new Date(d);
  out.setMinutes(out.getMinutes() + minutes);
  return out;
}

function pickSchedule(schedules: Schedule[], trip: Trip): Schedule | null {
  if (schedules.length === 0) return null;
  const dow = baseDateForTrip(trip).getDay();
  const match = schedules.find((sch) => sch.day_of_week === dow);
  return match ?? schedules[0];
}

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

type StopState = 'done' | 'active' | 'upcoming';

export function StopSequence(props: {
  trip: Trip;
  routeStops: TripStopRow[];
  schedules: Schedule[];
  driverPosition?: { lat: number; lng: number } | null;
  tripActive?: boolean;
}) {
  const schedule = useMemo(
    () => pickSchedule(props.schedules, props.trip),
    [props.schedules, props.trip],
  );

  const rows = useMemo(() => {
    const base = baseDateForTrip(props.trip);
    const anchor = applyDepartsAt(base, schedule?.departs_at ?? null);
    const sorted = [...props.routeStops].sort((a, b) => a.sequence_order - b.sequence_order);
    return sorted.map((rs, idx) => {
      const eta = addMinutes(anchor, rs.arrival_offset_min);
      let state: StopState = 'upcoming';
      if (props.tripActive) {
        if (idx === 0) state = 'done';
        else if (
          props.driverPosition &&
          rs.stop.lat != null &&
          rs.stop.lng != null &&
          haversineM(props.driverPosition, { lat: rs.stop.lat, lng: rs.stop.lng }) < 500
        ) {
          state = 'active';
        }
      }
      return { rs, eta, state };
    });
  }, [props.routeStops, props.trip, schedule?.departs_at, props.driverPosition, props.tripActive]);

  const nearDestination =
    props.driverPosition &&
    rows.some(
      (r) =>
        r.rs.is_destination &&
        r.rs.stop.lat != null &&
        r.rs.stop.lng != null &&
        haversineM(props.driverPosition!, { lat: r.rs.stop.lat, lng: r.rs.stop.lng }) < 200,
    );

  return (
    <View className="mt-4">
      <LabelCaps className="mb-3">Waypoints</LabelCaps>
      {nearDestination ? (
        <View className="mb-3 rounded-terminal bg-status-active/20 px-3 py-2">
          <Text className="font-sans text-sm font-semibold text-status-active">Near destination</Text>
        </View>
      ) : null}
      <View className="pl-1">
        {rows.map(({ rs, eta, state }, index) => {
          const isLast = index === rows.length - 1;
          const iconName =
            state === 'done'
              ? 'checkmark-circle'
              : state === 'active'
                ? 'radio-button-on'
                : rs.is_destination
                  ? 'flag'
                  : 'ellipse-outline';
          const iconColor =
            state === 'done' || state === 'active' ? tokens.primary : tokens.outline;
          const cardClass =
            state === 'active' ? 'border-primary bg-surface-elevated' : 'border-border bg-surface';

          return (
            <View key={`${rs.sequence_order}-${rs.stop.id}`} className="flex-row">
              <View className="mr-3 items-center">
                <Ionicons name={iconName} size={22} color={iconColor} />
                {!isLast ? <View className="mt-1 w-0.5 flex-1 bg-border" style={{ minHeight: 40 }} /> : null}
              </View>
              <TerminalCard className={`mb-3 flex-1 gap-1 ${cardClass}`}>
                <Text
                  className={`font-sans text-base font-semibold ${state === 'active' ? 'text-primary' : 'text-foreground'}`}>
                  {rs.stop.name}
                  {rs.is_destination ? ' · Final destination' : ''}
                </Text>
                <View className="flex-row flex-wrap items-center gap-2">
                  <RouteCodeBadge code={`STP-${String(rs.sequence_order + 1).padStart(2, '0')}`} />
                  {state === 'active' ? (
                    <Text className="font-mono text-technical text-primary">En route</Text>
                  ) : state === 'done' ? (
                    <Text className="font-sans text-sm text-foreground-muted">
                      Departed {eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  ) : (
                    <Text className="font-sans text-sm text-foreground-muted">
                      Est. {eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </TerminalCard>
            </View>
          );
        })}
      </View>
    </View>
  );
}
