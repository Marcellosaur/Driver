import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useQuery } from '@tanstack/react-query';
import { memo, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fetchTripDetail } from '@/features/trips/tripApi';
import { useTripState } from '@/features/trips/tripContext';
import { env } from '@/shared/config/env';
import { useSession } from '@/shared/auth/useSession';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

type Coord = { latitude: number; longitude: number };

type MapsModule = {
  default: ComponentType<Record<string, unknown>>;
  Marker: ComponentType<Record<string, unknown>>;
  Polyline: ComponentType<Record<string, unknown>>;
  PROVIDER_GOOGLE: string;
};

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function loadMapsModule(): MapsModule | null {
  if (isExpoGo()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- native module; avoid loading in Expo Go
    return require('react-native-maps') as MapsModule;
  } catch {
    return null;
  }
}

const MapBody = memo(function MapBody(props: {
  maps: MapsModule;
  coordinates: Coord[];
  marker: Coord | null;
  heading: number | null;
  useGoogle: boolean;
  polylineColor: string;
}) {
  const { default: MapView, Marker, Polyline, PROVIDER_GOOGLE } = props.maps;
  const initial = props.coordinates[0] ?? props.marker;
  return (
    <MapView
      provider={props.useGoogle ? PROVIDER_GOOGLE : undefined}
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: initial?.latitude ?? 37.33,
        longitude: initial?.longitude ?? -122.03,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }}
      rotateEnabled
      pitchEnabled>
      {props.coordinates.length > 1 ? (
        <Polyline coordinates={props.coordinates} strokeColor={props.polylineColor} strokeWidth={4} />
      ) : null}
      {props.marker ? (
        <Marker coordinate={props.marker} rotation={props.heading ?? 0} flat anchor={{ x: 0.5, y: 0.5 }} />
      ) : null}
    </MapView>
  );
});

function makeFallbackStyles(t: AppPalette) {
  return StyleSheet.create({
    flex: { flex: 1 },
    center: { justifyContent: 'center', padding: 24, backgroundColor: t.mapFallbackBg },
    title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: t.text },
    body: { fontSize: 15, color: t.textSecondary },
  });
}

export default function DriverMapScreen() {
  const t = useAppPalette();
  const fallbackStyles = useMemo(() => makeFallbackStyles(t), [t]);
  const maps = useMemo(() => loadMapsModule(), []);
  const state = useTripState();
  const tenantId = useSession((s) => s.tenantId)!;
  const activeId = state.context.activeTripId;

  const { data: detail } = useQuery({
    queryKey: ['trip', tenantId, activeId],
    enabled: !!activeId,
    queryFn: () => fetchTripDetail(tenantId, activeId!),
  });

  const coordinates = useMemo(() => {
    if (!detail?.route_stops?.length) return [];
    const sorted = [...detail.route_stops].sort((a, b) => a.sequence_order - b.sequence_order);
    return sorted
      .map((rs) =>
        rs.stop.lat != null && rs.stop.lng != null
          ? { latitude: rs.stop.lat, longitude: rs.stop.lng }
          : null,
      )
      .filter((p): p is Coord => p !== null);
  }, [detail]);

  const rawLat = state.context.lastLat;
  const rawLng = state.context.lastLng;
  const [throttled, setThrottled] = useState<Coord | null>(null);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (rawLat == null || rawLng == null) return;
    const now = Date.now();
    const elapsed = now - lastTickRef.current;
    if (elapsed >= 1000) {
      lastTickRef.current = now;
      setThrottled({ latitude: rawLat, longitude: rawLng });
      return;
    }
    const tmo = setTimeout(() => {
      lastTickRef.current = Date.now();
      setThrottled({ latitude: rawLat, longitude: rawLng });
    }, 1000 - elapsed);
    return () => clearTimeout(tmo);
  }, [rawLat, rawLng]);

  if (!maps) {
    return (
      <View style={[fallbackStyles.flex, fallbackStyles.center]}>
        <Text style={fallbackStyles.title}>Map unavailable in Expo Go</Text>
        <Text style={fallbackStyles.body}>
          Google Maps requires native code. Use a development build (EAS Build) or run on a
          simulator with a dev client that includes react-native-maps.
        </Text>
      </View>
    );
  }

  return (
    <View style={fallbackStyles.flex}>
      <MapBody
        maps={maps}
        coordinates={coordinates}
        marker={throttled}
        heading={state.matches('active') ? 0 : null}
        useGoogle={!!env.googleMapsApiKey}
        polylineColor={t.mapPolyline}
      />
    </View>
  );
}
