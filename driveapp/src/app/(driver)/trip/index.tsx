import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AlertButton } from '@/features/alerts/AlertButton';
import { AlertConfirmModal } from '@/features/alerts/AlertConfirmModal';
import { sendCriticalAlert } from '@/features/alerts/alertApi';
import { useAlertStore } from '@/features/alerts/useAlertStore';
import { StopSequence } from '@/features/trips/StopSequence';
import { TripEndActions, TripStartActions } from '@/features/trips/TripActions';
import { clearDriverLivePosition } from '@/features/location/livePositionApi';
import { useShareLiveLocationStore } from '@/features/location/useShareLiveLocationStore';
import { fetchTripDetail } from '@/features/trips/tripApi';
import { useTripSend, useTripState } from '@/features/trips/tripContext';
import { trackEvent } from '@/shared/analytics/analytics';
import { useSession } from '@/shared/auth/useSession';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.background },
    container: { flex: 1, padding: 16, backgroundColor: t.background },
    scroll: { padding: 16, paddingBottom: 120, backgroundColor: t.background },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: t.background,
    },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: t.text },
    body: { fontSize: 16, color: t.textSecondary, marginBottom: 12 },
    hint: { marginTop: 12, color: t.textMuted },
    btn: {
      marginTop: 12,
      backgroundColor: t.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    btnText: { color: t.onPrimary, fontWeight: '700' },
    shareCard: {
      marginTop: 28,
      padding: 16,
      borderRadius: 12,
      backgroundColor: t.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    shareTextCol: { flex: 1, marginRight: 12 },
    shareTitle: { fontSize: 17, fontWeight: '600', color: t.text },
    shareHint: { fontSize: 13, color: t.textMuted, marginTop: 6, lineHeight: 18 },
  });
}

export default function TripDashboardScreen() {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);

  const state = useTripState();
  const send = useTripSend();
  const tenantId = useSession((s) => s.tenantId)!;
  const shareLiveLocation = useShareLiveLocationStore((s) => s.shareLiveLocation);
  const setShareLiveLocation = useShareLiveLocationStore((s) => s.setShareLiveLocation);
  const [sosOpen, setSosOpen] = useState(false);
  const trackedTripRef = useRef<string | null>(null);

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
    if (isActive && activeId && trackedTripRef.current !== activeId) {
      trackedTripRef.current = activeId;
      trackEvent('trip_started', { trip_id: activeId.slice(0, 8) });
    }
    if (isEnded && trackedTripRef.current) {
      trackEvent('trip_ended');
      trackedTripRef.current = null;
    }
  }, [isActive, isEnded, activeId]);

  if (state.matches('loading_boot') || state.matches('loading_assigned')) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={t.primary} />
        <Text style={styles.hint}>Loading trips…</Text>
      </View>
    );
  }

  if (state.matches('error')) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>{state.context.error}</Text>
        <Pressable style={styles.btn} onPress={() => send({ type: 'BOOT_CHECK' })}>
          <Text style={styles.btnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (state.matches('selecting')) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Assigned trips</Text>
        <Text style={styles.body}>Choose a scheduled trip to start.</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/(driver)/trip/select')}>
          <Text style={styles.btnText}>Select trip</Text>
        </Pressable>
      </View>
    );
  }

  if (state.matches('confirming_start') || state.matches('starting')) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Start trip</Text>
        {isLoading || !detail ? (
          <ActivityIndicator color={t.primary} />
        ) : (
          <>
            <Text style={styles.body}>Trip {detail.id.slice(0, 8)}</Text>
            <StopSequence trip={detail} routeStops={detail.route_stops} schedules={detail.schedules} />
            <TripStartActions />
          </>
        )}
      </ScrollView>
    );
  }

  if (state.matches('active')) {
    return (
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Active trip</Text>
          {isLoading || !detail ? (
            <ActivityIndicator color={t.primary} />
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
            />
          )}
          <TripEndActions />
          <View style={styles.shareCard}>
            <View style={styles.shareTextCol}>
              <Text style={styles.shareTitle}>Share live location</Text>
              <Text style={styles.shareHint}>
                Let dispatchers follow this trip on the map. Uses GPS and data; may use more battery while on.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Share live location"
              value={shareLiveLocation}
              onValueChange={(on) => {
                if (!on && activeId) {
                  void clearDriverLivePosition(activeId).catch(() => {});
                }
                setShareLiveLocation(on);
                trackEvent('live_location_toggle', { on });
              }}
              trackColor={{ false: t.border, true: t.primary }}
              thumbColor={t.surfaceElevated}
              ios_backgroundColor={t.border}
            />
          </View>
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
      <View style={styles.container}>
        <Text style={styles.title}>End trip?</Text>
        <TripEndActions />
      </View>
    );
  }

  if (state.matches('ended')) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Trip finished</Text>
        <Pressable style={styles.btn} onPress={() => send({ type: 'BOOT_CHECK' })}>
          <Text style={styles.btnText}>Back to trips</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.body}>Idle — use Boot from trip flow.</Text>
      <Pressable style={styles.btn} onPress={() => send({ type: 'BOOT_CHECK' })}>
        <Text style={styles.btnText}>Refresh</Text>
      </Pressable>
    </View>
  );
}
