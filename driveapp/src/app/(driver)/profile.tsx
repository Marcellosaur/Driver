import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAlertStore } from '@/features/alerts/useAlertStore';
import { fetchDriverProfile } from '@/features/profile/driverProfileApi';
import { useSession } from '@/shared/auth/useSession';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function formatCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    scroll: { flexGrow: 1, padding: 20, paddingBottom: 40, backgroundColor: t.background },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: t.text },
    card: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: t.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      gap: 14,
    },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: t.textMuted, textTransform: 'uppercase' },
    fieldValue: { fontSize: 16, color: t.text, marginTop: 4 },
    hint: { fontSize: 15, color: t.textSecondary, marginTop: 8 },
    error: { fontSize: 15, color: t.danger, marginTop: 8 },
    footer: { marginTop: 20, gap: 8 },
    meta: { fontSize: 13, color: t.textMuted },
    btn: {
      marginTop: 8,
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
  const sessionStatus = useSession((s) => s.status);
  const userId = useSession((s) => s.userId);
  const tenantId = useSession((s) => s.tenantId);
  const driverId = useSession((s) => s.driverId);
  const role = useSession((s) => s.membershipRole);

  const canQueryDriver = sessionStatus === 'authenticated' && (!!driverId || (!!userId && !!tenantId));

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['driver-profile', driverId, userId, tenantId],
    enabled: canQueryDriver,
    queryFn: () => fetchDriverProfile({ driverId, userId, tenantId }),
  });

  const licenseDisplay =
    data?.license_number != null && String(data.license_number).trim() !== ''
      ? data.license_number
      : '—';

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Profile</Text>

      {sessionStatus === 'loading' ? (
        <ActivityIndicator size="large" color={t.primary} />
      ) : sessionStatus === 'unauthenticated' ? (
        <Text style={styles.hint}>Sign in to view your driver profile.</Text>
      ) : !canQueryDriver ? (
        <Text style={styles.hint}>
          No driver record is linked to this account yet. Complete onboarding or contact support.
        </Text>
      ) : isLoading ? (
        <ActivityIndicator size="large" color={t.primary} />
      ) : isError ? (
        <Text style={styles.error}>
          {error instanceof Error ? error.message : 'Could not load driver profile.'}
        </Text>
      ) : data ? (
        <View style={styles.card}>
          <View>
            <Text style={styles.fieldLabel}>Full name</Text>
            <Text style={styles.fieldValue} selectable>
              {data.full_name}
            </Text>
          </View>
          <View>
            <Text style={styles.fieldLabel}>License number</Text>
            <Text style={styles.fieldValue} selectable>
              {licenseDisplay}
            </Text>
          </View>
          <View>
            <Text style={styles.fieldLabel}>Status</Text>
            <Text style={styles.fieldValue} selectable>
              {data.status}
            </Text>
          </View>
          <View>
            <Text style={styles.fieldLabel}>Member since</Text>
            <Text style={styles.fieldValue} selectable>
              {formatCreatedAt(data.created_at)}
            </Text>
          </View>
          <View>
            <Text style={styles.fieldLabel}>Tenant ID</Text>
            <Text style={styles.fieldValue} selectable>
              {data.tenant_id}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.footer}>
        {role ? (
          <Text style={styles.meta} selectable>
            Role: {role}
          </Text>
        ) : null}
        <Text style={styles.meta}>App v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        {(userId || driverId) && (
          <Text style={styles.meta} selectable>
            {userId ? `User ID: ${userId}` : ''}
            {userId && driverId ? ' · ' : ''}
            {driverId ? `Driver ID: ${driverId}` : ''}
          </Text>
        )}
        <Pressable
          style={styles.btn}
          onPress={() => {
            useAlertStore.getState().reset();
            void signOut();
          }}
          accessibilityRole="button"
          accessibilityLabel="Sign out">
          <Text style={styles.btnText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
