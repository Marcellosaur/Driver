import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';

import { fetchAssignedTrips } from '@/features/trips/tripApi';
import { TripRouteCard } from '@/features/trips/TripRouteCard';
import { fetchDriverProfile } from '@/features/profile/driverProfileApi';
import { useSession } from '@/shared/auth/useSession';
import { LabelCaps } from '@/shared/ui/dispatch/Typography';
import { useAppPalette } from '@/shared/ui/useAppTheme';
import { ActivityIndicator } from 'react-native';

export function AssignedTripsPanel(props: {
  onSelectTrip: (tripId: string) => void;
  onStartTrip?: (tripId: string) => void;
}) {
  const t = useAppPalette();
  const tenantId = useSession((s) => s.tenantId)!;
  const driverId = useSession((s) => s.driverId)!;
  const userId = useSession((s) => s.userId);

  const { data: profile } = useQuery({
    queryKey: ['driver-profile', driverId, userId, tenantId],
    queryFn: () => fetchDriverProfile({ driverId, userId, tenantId }),
  });

  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['trips', tenantId, driverId],
    queryFn: () => fetchAssignedTrips(tenantId, driverId),
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const dayStr = now.toLocaleDateString(undefined, { weekday: 'long' });

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pb-28 pt-2">
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-sans text-display-lg font-bold text-foreground">
            {profile?.full_name ?? 'Driver'}
          </Text>
          <Text className="mt-1 font-sans text-body-md text-foreground-secondary">
            TeroBytez • Terminal {tenantId.slice(0, 4).toUpperCase()}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-sans text-body-md font-bold text-foreground">{dateStr}</Text>
          <Text className="font-mono text-technical text-primary">{dayStr}</Text>
        </View>
      </View>

      <LabelCaps className="mb-3">Assigned routes</LabelCaps>

      {isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator color={t.primary} />
        </View>
      ) : error ? (
        <Text className="font-sans text-body-md text-danger">
          {error instanceof Error ? error.message : 'Failed to load trips'}
        </Text>
      ) : !trips?.length ? (
        <Text className="font-sans text-body-md text-foreground-secondary">No scheduled trips assigned.</Text>
      ) : (
        trips.map((trip) => (
          <TripRouteCard
            key={trip.id}
            trip={trip}
            onStart={
              props.onStartTrip
                ? () => props.onStartTrip!(trip.id)
                : () => props.onSelectTrip(trip.id)
            }
            onReview={() => props.onSelectTrip(trip.id)}
          />
        ))
      )}
    </ScrollView>
  );
}
