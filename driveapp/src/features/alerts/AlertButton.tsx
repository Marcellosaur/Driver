import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 100,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: t.danger,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      elevation: 8,
      shadowColor: t.shadow,
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    fabWeb: {
      boxShadow: `0 2px 6px rgba(0,0,0,0.25)`,
    },
    fabPressed: { opacity: 0.9 },
    label: { color: t.onDanger, fontWeight: '800', fontSize: 16 },
  });
}

export function AlertButton(props: { onPress: () => void }) {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="SOS emergency alert"
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.fab,
        Platform.OS === 'web' && styles.fabWeb,
        pressed && styles.fabPressed,
      ]}>
      <Text style={styles.label}>SOS</Text>
    </Pressable>
  );
}
