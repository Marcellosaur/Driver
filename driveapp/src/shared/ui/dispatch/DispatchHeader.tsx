import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { tokens } from '@/shared/ui/design-tokens';

type Props = {
  title?: string;
  showMenu?: boolean;
  onMenuPress?: () => void;
  right?: ReactNode;
};

export function DispatchHeader(props: Props) {
  const title = props.title ?? 'TeroBytez Dispatch';
  return (
    <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
      {props.showMenu ? (
        <Pressable
          onPress={props.onMenuPress}
          className="mr-2 h-10 w-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Menu">
          <Ionicons name="menu" size={24} color={tokens.primary} />
        </Pressable>
      ) : (
        <View className="w-10" />
      )}
      <Text className="flex-1 text-center font-sans text-headline-sm font-semibold text-primary">
        {title}
      </Text>
      <View className="min-w-[40px] items-end justify-center">{props.right ?? null}</View>
    </View>
  );
}
