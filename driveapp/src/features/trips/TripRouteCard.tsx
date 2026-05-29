import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { Trip } from '@/types/db';

import { PrimaryDispatchButton, SecondaryDispatchButton } from '@/shared/ui/dispatch/DispatchButtons';
import { RouteCodeBadge, StatusBadge } from '@/shared/ui/dispatch/StatusBadge';
import { TerminalCard } from '@/shared/ui/dispatch/TerminalCard';
import { LabelCaps, Mono } from '@/shared/ui/dispatch/Typography';
import { tokens } from '@/shared/ui/design-tokens';

function formatDeparture(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function routeLabel(trip: Trip): string {
  return `Route ${trip.route_id.slice(0, 8).toUpperCase()}`;
}

function routeCode(trip: Trip): string {
  return `R-${trip.id.slice(0, 4).toUpperCase()}-${trip.route_id.slice(0, 4).toUpperCase()}`;
}

export function TripRouteCard(props: {
  trip: Trip;
  onStart?: () => void;
  onReview?: () => void;
}) {
  const isScheduled = props.trip.status === 'scheduled';
  const vehicle = props.trip.vehicle_id ? props.trip.vehicle_id.slice(0, 8).toUpperCase() : '—';

  return (
    <TerminalCard className="mb-3 gap-3">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 font-sans text-headline-sm font-semibold text-foreground">
          {routeLabel(props.trip)}
        </Text>
        <StatusBadge
          label={isScheduled ? 'Scheduled' : props.trip.status}
          variant={isScheduled ? 'scheduled' : 'pending'}
        />
      </View>
      <RouteCodeBadge code={routeCode(props.trip)} />
      <View className="flex-row gap-6">
        <View>
          <LabelCaps>Vehicle</LabelCaps>
          <Mono className="mt-1">{vehicle}</Mono>
        </View>
        <View>
          <LabelCaps>Departure</LabelCaps>
          <Mono className="mt-1">{formatDeparture(props.trip.scheduled_start)}</Mono>
        </View>
      </View>
      {isScheduled && props.onStart ? (
        <PrimaryDispatchButton
          label="Start trip"
          icon="play"
          onPress={props.onStart}
          className="mt-1"
        />
      ) : props.onReview ? (
        <SecondaryDispatchButton label="Review details" onPress={props.onReview} className="mt-1" />
      ) : null}
    </TerminalCard>
  );
}

export function EmergencyAlertBanner(props: { onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      className="mb-4 flex-row items-center gap-3 rounded-card border-2 border-emergency bg-emergency-muted/40 p-4 active:opacity-90">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-emergency">
        <Ionicons name="warning" size={22} color={tokens.onEmergency} />
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base font-bold uppercase text-foreground">Emergency alert</Text>
        <Text className="mt-1 font-sans text-sm text-foreground-secondary">
          Tap to notify dispatch immediately
        </Text>
      </View>
    </Pressable>
  );
}
