import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TripCard } from '@/features/trips/TripCard';
import { fetchAssignedTrips } from '@/features/trips/tripApi';
import { useTripSend } from '@/features/trips/tripContext';
import { useSession } from '@/shared/auth/useSession';
import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    pad: { padding: 16, backgroundColor: t.background },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: t.background,
    },
    title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: t.text },
    body: { fontSize: 16, color: t.textSecondary },
    err: { color: t.danger },
  });
}

export default function TripSelectScreen() {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);

  const send = useTripSend();
  const tenantId = useSession((s) => s.tenantId)!;
  const driverId = useSession((s) => s.driverId)!;

  const { data, isLoading, error } = useQuery({
    queryKey: ['trips', tenantId, driverId],
    queryFn: () => fetchAssignedTrips(tenantId, driverId),
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>{error instanceof Error ? error.message : 'Failed to load'}</Text>
      </View>
    );
  }

  if (!data?.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>No scheduled trips assigned.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Select trip</Text>
      {data.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          onPress={() => {
            send({ type: 'SELECT_TRIP', tripId: trip.id });
            router.back();
          }}
        />
      ))}
    </ScrollView>
  );
}
