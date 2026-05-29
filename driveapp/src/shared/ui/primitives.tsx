import { type ComponentProps } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

type ViewProps = ComponentProps<typeof View>;
type TextProps = ComponentProps<typeof Text>;
type PressableProps = ComponentProps<typeof Pressable>;
type TextInputProps = ComponentProps<typeof TextInput>;

export function Screen(props: ViewProps) {
  return <View className="flex-1 bg-background" {...props} />;
}

export function CenteredScreen(props: ViewProps) {
  return <View className="flex-1 items-center justify-center bg-background p-6" {...props} />;
}

export function Card(props: ViewProps) {
  return (
    <View
      className="rounded-xl border border-border bg-surface-elevated p-4 dark:border-border"
      {...props}
    />
  );
}

export function Title(props: TextProps) {
  return <Text className="text-2xl font-bold text-foreground" {...props} />;
}

export function Subtitle(props: TextProps) {
  return <Text className="text-base text-foreground-secondary" {...props} />;
}

export function Body(props: TextProps) {
  return <Text className="text-base text-foreground-secondary" {...props} />;
}

export function Muted(props: TextProps) {
  return <Text className="text-sm text-foreground-muted" {...props} />;
}

export function ErrorText(props: TextProps) {
  return <Text className="text-base text-danger" {...props} />;
}

export function PrimaryButton(props: PressableProps) {
  const { className, ...rest } = props;
  return (
    <Pressable
      className={`items-center rounded-lg bg-primary px-4 py-3.5 active:opacity-90 ${className ?? ''}`}
      {...rest}
    />
  );
}

export function PrimaryButtonText(props: TextProps) {
  return <Text className="text-base font-bold text-on-primary" {...props} />;
}

export function SecondaryButton(props: PressableProps) {
  const { className, ...rest } = props;
  return (
    <Pressable
      className={`mt-6 items-center rounded-lg bg-secondary-btn px-7 py-3.5 active:opacity-90 ${className ?? ''}`}
      {...rest}
    />
  );
}

export function SecondaryButtonText(props: TextProps) {
  return <Text className="text-base font-bold text-secondary-btn-text" {...props} />;
}

export function Input(props: TextInputProps) {
  const { className, placeholderTextColor, ...rest } = props;
  return (
    <TextInput
      className={`rounded-lg border border-input-border bg-input px-3.5 py-3.5 text-base text-foreground ${className ?? ''}`}
      placeholderTextColor={placeholderTextColor ?? '#687076'}
      {...rest}
    />
  );
}
