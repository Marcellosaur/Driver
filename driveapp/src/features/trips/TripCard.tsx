import { Pressable, Text } from 'react-native';

import type { Trip } from '@/types/db';

export function TripCard(props: { trip: Trip; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      className="mb-3 rounded-xl border border-border bg-surface p-4 active:opacity-85">
      <Text className="text-[17px] font-semibold text-foreground">Trip {props.trip.id.slice(0, 8)}</Text>
      <Text className="mt-1 text-sm text-foreground-secondary">
        Route {props.trip.route_id.slice(0, 8)} · {props.trip.status}
      </Text>
      {props.trip.scheduled_start ? (
        <Text className="mt-1 text-sm text-foreground-secondary">
          Starts {new Date(props.trip.scheduled_start).toLocaleString()}
        </Text>
      ) : null}
    </Pressable>
  );
}
