import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps;

export function ThemedView({ className, ...otherProps }: ThemedViewProps) {
  return <View className={`bg-background ${className ?? ''}`} {...otherProps} />;
}
