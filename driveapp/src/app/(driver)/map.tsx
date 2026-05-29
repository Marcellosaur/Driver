import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { memo, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AlertConfirmModal } from '@/features/alerts/AlertConfirmModal';
import { sendCriticalAlert } from '@/features/alerts/alertApi';
import { useAlertStore } from '@/features/alerts/useAlertStore';
import { fetchTripDetail } from '@/features/trips/tripApi';
import { useTripState } from '@/features/trips/tripContext';
import { trackEvent } from '@/shared/analytics/analytics';
import { useSession } from '@/shared/auth/useSession';
import { env } from '@/shared/config/env';
import { DispatchHeader } from '@/shared/ui/dispatch/DispatchHeader';
import { RouteCodeBadge } from '@/shared/ui/dispatch/StatusBadge';
import { LabelCaps, Mono } from '@/shared/ui/dispatch/Typography';
import { TerminalCard } from '@/shared/ui/dispatch/TerminalCard';
import { tokens } from '@/shared/ui/design-tokens';
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
        <Polyline
          coordinates={props.coordinates}
          strokeColor={props.polylineColor}
          strokeWidth={4}
          lineDashPattern={[8, 6]}
        />
      ) : null}
      {props.marker ? (
        <Marker coordinate={props.marker} rotation={props.heading ?? 0} flat anchor={{ x: 0.5, y: 0.5 }} />
      ) : null}
    </MapView>
  );
});

function MapFallback() {
  return (
    <View className="absolute inset-0 bg-map-fallback">
      <View
        className="absolute inset-0 opacity-30"
        style={{
          backgroundColor: tokens.primary,
          // grid hint via repeated borders simulated with opacity overlay
        }}
      />
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="map" size={48} color={tokens.primary} />
        <Text className="mt-4 text-center font-sans text-headline-sm font-semibold text-foreground">
          Map unavailable in Expo Go
        </Text>
        <Text className="mt-2 text-center font-sans text-body-md text-foreground-secondary">
          Use a development build with react-native-maps for the full dispatch map view.
        </Text>
      </View>
    </View>
  );
}

export default function DriverMapScreen() {
  const t = useAppPalette();
  const maps = useMemo(() => loadMapsModule(), []);
  const state = useTripState();
  const tenantId = useSession((s) => s.tenantId)!;
  const activeId = state.context.activeTripId;
  const [sosOpen, setSosOpen] = useState(false);

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

  const nextStop = useMemo(() => {
    if (!detail?.route_stops?.length) return null;
    const sorted = [...detail.route_stops].sort((a, b) => a.sequence_order - b.sequence_order);
    return sorted.find((rs) => rs.stop.lat != null) ?? sorted[0];
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

  const headerRight = (
    <View className="flex-row items-center gap-2">
      <View className="flex-row items-center gap-1 rounded-full border border-border bg-surface px-2 py-1">
        <Ionicons name="locate" size={14} color={tokens.primary} />
        <Mono className="text-[10px]">±4m</Mono>
      </View>
      <Ionicons
        name={state.matches('active') ? 'cellular' : 'cellular-outline'}
        size={20}
        color={state.matches('active') ? tokens.primary : tokens.outline}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <DispatchHeader showMenu right={headerRight} />
      <View className="flex-1">
        {maps ? (
          <MapBody
            maps={maps}
            coordinates={coordinates}
            marker={throttled}
            heading={state.matches('active') ? 0 : null}
            useGoogle={!!env.googleMapsApiKey}
            polylineColor={t.mapPolyline}
          />
        ) : (
          <MapFallback />
        )}
        <View className="absolute bottom-[88px] left-0 right-0 px-4">
          <TerminalCard className="border-primary/30">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <LabelCaps>Next stop</LabelCaps>
                <Text className="mt-1 font-sans text-headline-sm font-bold text-foreground" numberOfLines={2}>
                  {nextStop?.stop.name ?? 'No active route'}
                </Text>
              </View>
              {activeId ? (
                <RouteCodeBadge code={`ID: ${activeId.slice(0, 6).toUpperCase()}`} />
              ) : null}
            </View>
            <View className="mt-4 flex-row gap-8">
              <View>
                <LabelCaps>ETA</LabelCaps>
                <Text className="mt-1">
                  <Text className="font-mono text-2xl text-primary">—</Text>
                  <Text className="font-mono text-sm text-primary"> min</Text>
                </Text>
              </View>
              <View>
                <LabelCaps>Distance</LabelCaps>
                <Text className="mt-1">
                  <Text className="font-mono text-2xl text-foreground">—</Text>
                  <Text className="font-sans text-sm text-foreground-secondary"> mi</Text>
                </Text>
              </View>
            </View>
          </TerminalCard>
        </View>
        <Pressable
          className="absolute bottom-[148px] right-8 z-10 h-14 w-14 items-center justify-center rounded-full bg-emergency shadow-lg active:opacity-90"
          onPress={() => setSosOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="SOS">
          <Text className="font-sans text-xs font-extrabold text-on-danger">SOS</Text>
        </Pressable>
      </View>
      <AlertConfirmModal
        visible={sosOpen}
        onCancel={() => setSosOpen(false)}
        onConfirm={(msg) => {
          setSosOpen(false);
          void (async () => {
            useAlertStore.getState().setStatus('pending');
            try {
              await sendCriticalAlert({ tenantId, tripId: activeId, message: msg });
              useAlertStore.getState().setStatus('acked');
              trackEvent('alert_triggered');
            } catch {
              useAlertStore.getState().setStatus('failed');
            }
          })();
        }}
      />
    </View>
  );
}
