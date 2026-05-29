import { router } from 'expo-router';

import { AssignedTripsPanel } from '@/features/trips/AssignedTripsPanel';
import { useTripSend } from '@/features/trips/tripContext';
import { DispatchHeader } from '@/shared/ui/dispatch/DispatchHeader';
import { View } from 'react-native';

export default function TripSelectScreen() {
  const send = useTripSend();

  return (
    <View className="flex-1 bg-background">
      <DispatchHeader title="Assigned Trips" />
      <AssignedTripsPanel
        onSelectTrip={(tripId) => {
          send({ type: 'SELECT_TRIP', tripId });
          router.back();
        }}
        onStartTrip={(tripId) => {
          send({ type: 'SELECT_TRIP', tripId });
          router.back();
        }}
      />
    </View>
  );
}
