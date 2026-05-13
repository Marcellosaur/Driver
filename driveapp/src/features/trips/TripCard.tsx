import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { Trip } from '@/types/db';

import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    card: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: t.surface,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    pressed: { opacity: 0.85 },
    title: { fontSize: 17, fontWeight: '600', color: t.text },
    sub: { marginTop: 4, fontSize: 14, color: t.textSecondary },
  });
}

export function TripCard(props: { trip: Trip; onPress: () => void }) {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.title}>Trip {props.trip.id.slice(0, 8)}</Text>
      <Text style={styles.sub}>
        Route {props.trip.route_id.slice(0, 8)} · {props.trip.status}
      </Text>
      {props.trip.scheduled_start ? (
        <Text style={styles.sub}>Starts {new Date(props.trip.scheduled_start).toLocaleString()}</Text>
      ) : null}
    </Pressable>
  );
}
