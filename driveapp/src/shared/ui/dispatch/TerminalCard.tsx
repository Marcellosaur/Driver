import { View, type ViewProps } from 'react-native';

export function TerminalCard(props: ViewProps) {
  const { className, ...rest } = props;
  return (
    <View
      className={`rounded-card border border-border bg-surface p-4 ${className ?? ''}`}
      {...rest}
    />
  );
}
