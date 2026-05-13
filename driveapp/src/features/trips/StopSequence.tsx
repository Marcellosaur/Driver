import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Schedule, Trip } from '@/types/db';

import type { TripStopRow } from '@/features/trips/tripApi';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function baseDateForTrip(trip: Trip): Date {
  if (trip.scheduled_start) {
    return new Date(trip.scheduled_start);
  }
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

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    wrap: { gap: 8 },
    banner: {
      backgroundColor: t.successBannerBg,
      color: t.successBannerText,
      padding: 8,
      borderRadius: 8,
      overflow: 'hidden',
      fontWeight: '600',
    },
    row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    seq: {
      width: 28,
      height: 28,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: t.seqBadgeBg,
      color: t.seqBadgeText,
      textAlign: 'center',
      lineHeight: 28,
      fontWeight: '600',
    },
    body: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: t.text },
    meta: { fontSize: 13, color: t.textMuted, marginTop: 2 },
  });
}

export function StopSequence(props: {
  trip: Trip;
  routeStops: TripStopRow[];
  schedules: Schedule[];
  driverPosition?: { lat: number; lng: number } | null;
}) {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);

  const schedule = useMemo(
    () => pickSchedule(props.schedules, props.trip),
    [props.schedules, props.trip],
  );

  const rows = useMemo(() => {
    const base = baseDateForTrip(props.trip);
    const anchor = applyDepartsAt(base, schedule?.departs_at ?? null);
    const sorted = [...props.routeStops].sort((a, b) => a.sequence_order - b.sequence_order);
    return sorted.map((rs) => {
      const eta = addMinutes(anchor, rs.arrival_offset_min);
      return { rs, eta };
    });
  }, [props.routeStops, props.trip, schedule?.departs_at]);

  const finalStop = useMemo(
    () => rows.find((r) => r.rs.is_destination) ?? rows[rows.length - 1],
    [rows],
  );

  const nearDestination =
    props.driverPosition &&
    finalStop?.rs.stop.lat != null &&
    finalStop?.rs.stop.lng != null &&
    haversineM(props.driverPosition, {
      lat: finalStop.rs.stop.lat,
      lng: finalStop.rs.stop.lng,
    }) < 200;

  return (
    <View style={styles.wrap}>
      {nearDestination ? (
        <Text style={styles.banner}>Near destination</Text>
      ) : null}
      {rows.map(({ rs, eta }) => (
        <View key={`${rs.sequence_order}-${rs.stop.id}`} style={styles.row}>
          <Text style={styles.seq}>{rs.sequence_order + 1}</Text>
          <View style={styles.body}>
            <Text style={styles.name}>
              {rs.stop.name}
              {rs.is_destination ? ' · Final destination' : ''}
            </Text>
            <Text style={styles.meta}>
              ETA {eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · +
              {rs.arrival_offset_min}m from departure
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
