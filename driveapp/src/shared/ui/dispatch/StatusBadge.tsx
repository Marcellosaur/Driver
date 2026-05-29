import { Text, View, type ViewProps } from 'react-native';

import type { TripStatus } from '@/types/db';

const styles: Record<string, string> = {
  scheduled: 'bg-status-scheduled',
  active: 'bg-status-active',
  pending: 'bg-status-pending',
  completed: 'bg-status-completed',
  cancelled: 'bg-status-pending',
  critical: 'bg-status-alert',
  warning: 'bg-status-scheduled',
  info: 'bg-status-info',
};

export function StatusBadge(
  props: ViewProps & { label: string; variant?: TripStatus | 'pending' | 'critical' | 'warning' | 'info' },
) {
  const variant = props.variant ?? 'pending';
  const bg = styles[variant] ?? styles.pending;
  return (
    <View className={`rounded-full px-2.5 py-1 ${bg} ${props.className ?? ''}`}>
      <Text className="font-sans text-[10px] font-bold uppercase tracking-wider text-white">
        {props.label}
      </Text>
    </View>
  );
}

export function RouteCodeBadge(props: { code: string }) {
  return (
    <View className="rounded-full border border-border bg-surface-elevated px-2.5 py-1">
      <Text className="font-mono text-[11px] text-foreground-secondary">{props.code}</Text>
    </View>
  );
}
