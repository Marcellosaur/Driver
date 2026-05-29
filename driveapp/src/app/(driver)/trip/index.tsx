import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native';

import { AlertButton } from '@/features/alerts/AlertButton';
import { AlertConfirmModal } from '@/features/alerts/AlertConfirmModal';
import { sendCriticalAlert } from '@/features/alerts/alertApi';
import { useAlertStore } from '@/features/alerts/useAlertStore';
import { AssignedTripsPanel } from '@/features/trips/AssignedTripsPanel';
import { clearDriverLivePosition } from '@/features/location/livePositionApi';
import { useShareLiveLocationStore } from '@/features/location/useShareLiveLocationStore';
import { StopSequence } from '@/features/trips/StopSequence';
import { TripEndActions, TripStartActions } from '@/features/trips/TripActions';
import { fetchTripDetail } from '@/features/trips/tripApi';
import { useTripSend, useTripState } from '@/features/trips/tripContext';
import { trackEvent } from '@/shared/analytics/analytics';
import { useSession } from '@/shared/auth/useSession';
import { DispatchHeader } from '@/shared/ui/dispatch/DispatchHeader';
import { PrimaryDispatchButton } from '@/shared/ui/dispatch/DispatchButtons';
import { LabelCaps, Mono } from '@/shared/ui/dispatch/Typography';
import { TerminalCard } from '@/shared/ui/dispatch/TerminalCard';
import { RouteCodeBadge, StatusBadge } from '@/shared/ui/dispatch/StatusBadge';
import { tokens } from '@/shared/ui/design-tokens';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TripDashboardScreen() {
  const t = useAppPalette();
  const state = useTripState();
  const send = useTripSend();
  const tenantId = useSession((s) => s.tenantId)!;
  const shareLiveLocation = useShareLiveLocationStore((s) => s.shareLiveLocation);
  const setShareLiveLocation = useShareLiveLocationStore((s) => s.setShareLiveLocation);
  const [sosOpen, setSosOpen] = useState(false);
  const trackedTripRef = useRef<string | null>(null);
  const activeSinceRef = useRef<number | null>(null);
  const [, tick] = useState(0);

  const tripIdForDetail =
    state.context.activeTripId ??
    (state.matches('confirming_start') || state.matches('starting')
      ? state.context.selectedTripId
      : null);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['trip', tenantId, tripIdForDetail],
    enabled: !!tripIdForDetail,
    queryFn: () => fetchTripDetail(tenantId, tripIdForDetail!),
  });

  const isActive = state.matches('active');
  const isEnded = state.matches('ended');
  const activeId = state.context.activeTripId;

  useEffect(() => {
    if (isActive && activeId) {
      if (trackedTripRef.current !== activeId) {
        trackedTripRef.current = activeId;
        activeSinceRef.current = Date.now();
        trackEvent('trip_started', { trip_id: activeId.slice(0, 8) });
      }
    } else {
      activeSinceRef.current = null;
    }
    if (isEnded && trackedTripRef.current) {
      trackEvent('trip_ended');
      trackedTripRef.current = null;
    }
  }, [isActive, isEnded, activeId]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const elapsed = useMemo(() => {
    if (!activeSinceRef.current) return '00:00:00';
    return formatElapsed(Date.now() - activeSinceRef.current);
  }, [isActive, tick]);

  const speedKmh =
    state.context.lastLat != null && state.matches('active')
      ? '—'
      : '—';

  if (state.matches('loading_boot') || state.matches('loading_assigned')) {
    return (
      <View className="flex-1 bg-background">
        <DispatchHeader showMenu />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={t.primary} />
          <Text className="mt-3 font-sans text-sm text-foreground-muted">Loading trips…</Text>
        </View>
      </View>
    );
  }

  if (state.matches('error')) {
    return (
      <View className="flex-1 bg-background">
        <DispatchHeader showMenu />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-sans text-headline-md font-bold text-foreground">Something went wrong</Text>
          <Text className="mt-2 text-center font-sans text-body-md text-foreground-secondary">
            {state.context.error}
          </Text>
          <PrimaryDispatchButton
            label="Retry"
            className="mt-6 w-full"
            onPress={() => send({ type: 'BOOT_CHECK' })}
          />
        </View>
      </View>
    );
  }

  if (state.matches('selecting')) {
    return (
      <View className="flex-1 bg-background">
        <DispatchHeader title="Assigned Trips" showMenu />
        <AssignedTripsPanel
          onSelectTrip={(tripId) => send({ type: 'SELECT_TRIP', tripId })}
          onStartTrip={(tripId) => send({ type: 'SELECT_TRIP', tripId })}
        />
      </View>
    );
  }

  if (state.matches('confirming_start') || state.matches('starting')) {
    return (
      <View className="flex-1 bg-background">
        <DispatchHeader showMenu />
        <ScrollView contentContainerClassName="px-4 pb-32 pt-2">
          <Text className="font-sans text-headline-md font-bold text-foreground">Start trip</Text>
          {isLoading || !detail ? (
            <View className="mt-6 items-center">
              <ActivityIndicator color={t.primary} />
            </View>
          ) : (
            <>
              <RouteCodeBadge code={`TRP-${detail.id.slice(0, 8).toUpperCase()}`} />
              <StopSequence
                trip={detail}
                routeStops={detail.route_stops}
                schedules={detail.schedules}
              />
              <TripStartActions />
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  if (state.matches('active')) {
    return (
      <View className="flex-1 bg-background">
        <DispatchHeader showMenu />
        <ScrollView contentContainerClassName="px-4 pb-36 pt-2">
          <View className="mb-3 flex-row items-center justify-between">
            <StatusBadge label="Live" variant="active" />
            {activeId ? <RouteCodeBadge code={`TRP-${activeId.slice(0, 8).toUpperCase()}`} /> : null}
          </View>
          <Text className="font-sans text-headline-md font-bold text-foreground">
            Route: {detail?.route_id.slice(0, 8).toUpperCase() ?? '—'}
          </Text>
          <Text className="mt-1 font-sans text-body-md text-foreground-secondary">
            Active trip in progress
          </Text>
          <View className="mt-4 flex-row gap-3">
            <TerminalCard className="flex-1">
              <LabelCaps>Current speed</LabelCaps>
              <Text className="mt-1 font-mono text-2xl text-primary">
                {speedKmh}
                <Text className="text-base text-foreground"> km/h</Text>
              </Text>
            </TerminalCard>
            <TerminalCard className="flex-1">
              <LabelCaps>Elapsed time</LabelCaps>
              <Mono className="mt-1 text-2xl">{elapsed}</Mono>
            </TerminalCard>
          </View>
          {isLoading || !detail ? (
            <View className="mt-6 items-center">
              <ActivityIndicator color={t.primary} />
            </View>
          ) : (
            <StopSequence
              trip={detail}
              routeStops={detail.route_stops}
              schedules={detail.schedules}
              driverPosition={
                state.context.lastLat != null && state.context.lastLng != null
                  ? { lat: state.context.lastLat, lng: state.context.lastLng }
                  : null
              }
              tripActive
            />
          )}
          <TripEndActions />
          <TerminalCard className="mt-4 flex-row items-center">
            <View className="mr-3 flex-1">
              <Text className="font-sans text-base font-semibold text-foreground">Share live location</Text>
              <Text className="mt-1 font-sans text-sm text-foreground-muted">
                Dispatch map visibility while trip is active
              </Text>
            </View>
            <Switch
              accessibilityLabel="Share live location"
              value={shareLiveLocation}
              onValueChange={(on) => {
                if (!on && activeId) void clearDriverLivePosition(activeId).catch(() => {});
                setShareLiveLocation(on);
                trackEvent('live_location_toggle', { on });
              }}
              trackColor={{ false: tokens.outline, true: tokens.primary }}
              thumbColor={tokens.surfaceContainerHigh}
            />
          </TerminalCard>
        </ScrollView>
        <AlertButton onPress={() => setSosOpen(true)} />
        <AlertConfirmModal
          visible={sosOpen}
          onCancel={() => setSosOpen(false)}
          onConfirm={(msg) => {
            setSosOpen(false);
            void (async () => {
              useAlertStore.getState().setStatus('pending');
              try {
                await sendCriticalAlert({
                  tenantId,
                  tripId: state.context.activeTripId,
                  message: msg,
                });
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

  if (state.matches('confirming_end')) {
    return (
      <View className="flex-1 bg-background">
        <DispatchHeader showMenu />
        <View className="flex-1 px-4 pt-4">
          <Text className="font-sans text-headline-md font-bold text-foreground">End trip?</Text>
          <TripEndActions />
        </View>
      </View>
    );
  }

  if (state.matches('ended')) {
    return (
      <View className="flex-1 bg-background">
        <DispatchHeader showMenu />
        <View className="flex-1 justify-center px-4">
          <Text className="font-sans text-headline-md font-bold text-foreground">Trip finished</Text>
          <PrimaryDispatchButton
            label="Back to trips"
            className="mt-6"
            onPress={() => send({ type: 'BOOT_CHECK' })}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <DispatchHeader showMenu />
      <View className="flex-1 items-center justify-center px-4">
        <PrimaryDispatchButton label="Refresh" onPress={() => send({ type: 'BOOT_CHECK' })} />
      </View>
    </View>
  );
}
