import Constants from 'expo-constants';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAlertStore } from '@/features/alerts/useAlertStore';
import { useSession } from '@/shared/auth/useSession';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, gap: 8, backgroundColor: t.background },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: t.text },
    row: { fontSize: 15, color: t.textSecondary },
    btn: {
      marginTop: 24,
      backgroundColor: t.secondaryButtonBg,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    btnText: { color: t.secondaryButtonText, fontWeight: '700' },
  });
}

export default function ProfileScreen() {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);

  const signOut = useSession((s) => s.signOut);
  const email = useSession((s) => s.userId);
  const tenantId = useSession((s) => s.tenantId);
  const driverId = useSession((s) => s.driverId);
  const role = useSession((s) => s.membershipRole);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.row}>User ID: {email?.slice(0, 8)}…</Text>
      <Text style={styles.row}>Tenant: {tenantId?.slice(0, 8)}…</Text>
      <Text style={styles.row}>Driver: {driverId?.slice(0, 8)}…</Text>
      <Text style={styles.row}>Role: {role}</Text>
      <Text style={styles.row}>App v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      <Pressable
        style={styles.btn}
        onPress={() => {
          useAlertStore.getState().reset();
          void signOut();
        }}>
        <Text style={styles.btnText}>Sign out</Text>
      </Pressable>
    </View>
  );
}
