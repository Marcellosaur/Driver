import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Alert } from '@/types/db';

import { AlertConfirmModal } from '@/features/alerts/AlertConfirmModal';
import { sendCriticalAlert } from '@/features/alerts/alertApi';
import { EmergencyAlertBanner } from '@/features/trips/TripRouteCard';
import { useAlertStore } from '@/features/alerts/useAlertStore';
import { useTripState } from '@/features/trips/tripContext';
import { getSupabase } from '@/shared/auth/authClient';
import { useSession } from '@/shared/auth/useSession';
import { trackEvent } from '@/shared/analytics/analytics';
import { DispatchHeader } from '@/shared/ui/dispatch/DispatchHeader';
import { RouteCodeBadge, StatusBadge } from '@/shared/ui/dispatch/StatusBadge';
import { TerminalCard } from '@/shared/ui/dispatch/TerminalCard';
import { LabelCaps, Mono } from '@/shared/ui/dispatch/Typography';
import { tokens } from '@/shared/ui/design-tokens';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '—';
  }
}

function severityVariant(severity: Alert['severity']): 'critical' | 'warning' | 'info' {
  if (severity === 'critical') return 'critical';
  if (severity === 'warning') return 'warning';
  return 'info';
}

function severityIcon(severity: Alert['severity']): keyof typeof Ionicons.glyphMap {
  const v = severityVariant(severity);
  if (v === 'critical') return 'alert-circle';
  if (v === 'warning') return 'git-branch-outline';
  return 'information-circle-outline';
}

function severityIconBg(severity: Alert['severity']): string {
  const v = severityVariant(severity);
  if (v === 'critical') return 'bg-emergency';
  if (v === 'warning') return 'bg-status-scheduled';
  return 'bg-status-info';
}

function AlertEventCard({ item }: { item: Alert }) {
  const variant = severityVariant(item.severity);
  const tripRef = item.trip_id ? `TRP-${item.trip_id.slice(0, 8).toUpperCase()}` : 'SYS-BCAST';

  return (
    <TerminalCard className="mb-3">
      <View className="flex-row gap-3">
        <View
          className={`h-10 w-10 items-center justify-center rounded-full ${severityIconBg(item.severity)}`}>
          <Ionicons name={severityIcon(item.severity)} size={20} color={tokens.onEmergency} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 font-sans text-body-md font-bold text-foreground" numberOfLines={2}>
              {item.message.split('.')[0] ?? item.message}
            </Text>
            <Mono className="text-foreground-muted">{formatTime(item.created_at)}</Mono>
          </View>
          <Text className="mt-1 font-sans text-sm text-foreground-secondary" numberOfLines={3}>
            {item.message}
          </Text>
          <View className="mt-3 flex-row items-center gap-2">
            <RouteCodeBadge code={tripRef} />
            <StatusBadge label={item.severity.toUpperCase()} variant={variant} />
          </View>
        </View>
      </View>
    </TerminalCard>
  );
}

export default function AlertsHistoryScreen() {
  const t = useAppPalette();
  const tenantId = useSession((s) => s.tenantId)!;
  const tripState = useTripState();
  const [sosOpen, setSosOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts', tenantId],
    queryFn: async (): Promise<Alert[]> => {
      const supabase = getSupabase();
      const { data: rows, error: qErr } = await supabase
        .from('alerts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (qErr) throw qErr;
      return (rows ?? []) as Alert[];
    },
  });

  return (
    <View className="flex-1 bg-background">
      <DispatchHeader showMenu />
      <FlatList
        className="flex-1"
        contentContainerClassName="px-4 pb-28 pt-2"
        data={data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-sans text-headline-md font-bold text-foreground">Alerts</Text>
              <View className="flex-row items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1">
                <View className="h-2 w-2 rounded-full bg-status-active" />
                <Mono className="text-[10px] text-foreground-muted">SYS_ONLINE</Mono>
              </View>
            </View>
            <EmergencyAlertBanner onPress={() => setSosOpen(true)} />
            <LabelCaps className="mb-3">Active events</LabelCaps>
            {isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color={t.primary} />
              </View>
            ) : error ? (
              <Text className="font-sans text-body-md text-danger">
                {error instanceof Error ? error.message : 'Failed to load alerts'}
              </Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <Text className="py-6 text-center font-sans text-body-md text-foreground-secondary">
              No alerts yet.
            </Text>
          ) : null
        }
        renderItem={({ item }) => <AlertEventCard item={item} />}
      />
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
                tripId: tripState.context.activeTripId,
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
