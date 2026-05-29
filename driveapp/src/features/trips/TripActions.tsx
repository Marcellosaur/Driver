import { View } from 'react-native';

import { useTripSend } from '@/features/trips/tripContext';
import {
  EndTripButton,
  PrimaryDispatchButton,
  SecondaryDispatchButton,
} from '@/shared/ui/dispatch/DispatchButtons';

export function TripStartActions() {
  const send = useTripSend();
  return (
    <View className="mt-6 gap-3">
      <PrimaryDispatchButton label="Start trip" icon="play" onPress={() => send({ type: 'CONFIRM_START' })} />
      <SecondaryDispatchButton label="Cancel" onPress={() => send({ type: 'CANCEL_START' })} />
    </View>
  );
}

export function TripEndActions() {
  const send = useTripSend();
  return (
    <View className="mt-6 gap-3">
      <EndTripButton onPress={() => send({ type: 'CONFIRM_END' })} />
      <SecondaryDispatchButton label="Cancel" onPress={() => send({ type: 'CANCEL_END' })} />
    </View>
  );
}
