import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, Text } from 'react-native';

import { tokens } from '@/shared/ui/design-tokens';

export function AlertButton(props: { onPress: () => void; className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="SOS emergency alert"
      onPress={props.onPress}
      className={`absolute bottom-[100px] right-5 z-[999] h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-emergency/50 bg-emergency active:opacity-90 ${
        Platform.OS === 'web' ? 'shadow-lg shadow-emergency/40' : 'elevation-8'
      } ${props.className ?? ''}`}>
      <Ionicons name="alert" size={22} color={tokens.onEmergency} />
      <Text className="font-sans text-xs font-extrabold uppercase text-on-danger">SOS</Text>
    </Pressable>
  );
}
