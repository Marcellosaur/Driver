import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTripSend } from '@/features/trips/tripContext';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 16 },
    link: { fontSize: 16, color: t.textMuted },
    primary: { fontSize: 16, fontWeight: '700', color: t.primary },
    danger: { fontSize: 16, fontWeight: '700', color: t.danger },
  });
}

export function TripStartActions() {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);
  const send = useTripSend();
  return (
    <View style={styles.row}>
      <Text style={styles.link} onPress={() => send({ type: 'CANCEL_START' })}>
        Cancel
      </Text>
      <Text style={styles.primary} onPress={() => send({ type: 'CONFIRM_START' })}>
        Start trip
      </Text>
    </View>
  );
}

export function TripEndActions() {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);
  const send = useTripSend();
  return (
    <View style={styles.row}>
      <Text style={styles.link} onPress={() => send({ type: 'CANCEL_END' })}>
        Cancel
      </Text>
      <Text style={styles.danger} onPress={() => send({ type: 'CONFIRM_END' })}>
        End trip
      </Text>
    </View>
  );
}
