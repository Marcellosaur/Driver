import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { tokens } from '@/shared/ui/design-tokens';

export function PrimaryDispatchButton(
  props: PressableProps & { label: string; icon?: keyof typeof Ionicons.glyphMap; loading?: boolean },
) {
  const { label, icon, loading, className, disabled, ...rest } = props;
  return (
    <Pressable
      className={`min-h-[48px] flex-row items-center justify-center gap-2 rounded-terminal bg-primary px-4 py-3.5 active:opacity-90 ${disabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={tokens.onPrimary} />
      ) : (
        <>
          <Text className="font-sans text-base font-bold uppercase tracking-wide text-on-primary">
            {label}
          </Text>
          {icon ? <Ionicons name={icon} size={20} color={tokens.onPrimary} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function SecondaryDispatchButton(props: PressableProps & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <Pressable
      className={`min-h-[48px] items-center justify-center rounded-terminal border border-border bg-transparent px-4 py-3.5 active:opacity-90 ${className ?? ''}`}
      {...rest}>
      <Text className="font-sans text-base font-semibold text-foreground">{props.label}</Text>
    </Pressable>
  );
}

export function EmergencyButton(props: PressableProps & { label: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const { label, icon, className, ...rest } = props;
  return (
    <Pressable
      className={`min-h-[56px] flex-row items-center justify-center gap-2 rounded-terminal bg-emergency px-4 py-4 active:opacity-90 ${className ?? ''}`}
      {...rest}>
      {icon ? <Ionicons name={icon} size={22} color={tokens.onEmergency} /> : null}
      <Text className="font-sans text-base font-bold uppercase tracking-wide text-on-danger">{label}</Text>
    </Pressable>
  );
}

export function EndTripButton(props: PressableProps) {
  const { className, children, ...rest } = props;
  return (
    <Pressable
      className={`mt-6 min-h-[48px] flex-row items-center justify-center gap-2 rounded-terminal border border-danger/60 bg-transparent px-4 py-3.5 active:opacity-90 ${className ?? ''}`}
      {...rest}>
      <Ionicons name="stop-circle-outline" size={22} color={tokens.emergency} />
      <Text className="font-sans text-base font-bold uppercase tracking-wide text-danger">
        End trip
      </Text>
    </Pressable>
  );
}
