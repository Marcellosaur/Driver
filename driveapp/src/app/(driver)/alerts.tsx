import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { Alert } from '@/types/db';

import { getSupabase } from '@/shared/auth/authClient';
import { useSession } from '@/shared/auth/useSession';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    list: { padding: 16, backgroundColor: t.background },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.background,
    },
    centeredText: { color: t.textSecondary },
    card: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: t.surface,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    severity: { fontWeight: '700', textTransform: 'uppercase', fontSize: 12, color: t.textMuted },
    message: { fontSize: 16, marginTop: 4, color: t.text },
    meta: { fontSize: 12, color: t.textMuted, marginTop: 6 },
    body: { textAlign: 'center', marginTop: 24, color: t.textSecondary },
    err: { color: t.danger },
  });
}

export default function AlertsHistoryScreen() {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);

  const tenantId = useSession((s) => s.tenantId)!;

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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>{error instanceof Error ? error.message : 'Error'}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.body}>No alerts yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.severity}>{item.severity}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
      )}
    />
  );
}
