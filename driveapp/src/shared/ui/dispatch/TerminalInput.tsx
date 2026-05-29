import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { LabelCaps } from '@/shared/ui/dispatch/Typography';
import { tokens } from '@/shared/ui/design-tokens';

type Props = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
};

export function TerminalInput(props: Props) {
  const { label, icon, trailingIcon, className, ...rest } = props;
  return (
    <View className="gap-2">
      <LabelCaps>{label}</LabelCaps>
      <View className="flex-row items-center rounded-terminal border border-input-border bg-input px-3">
        {icon ? (
          <Ionicons name={icon} size={20} color={tokens.outline} style={{ marginRight: 10 }} />
        ) : null}
        <TextInput
          className={`min-h-[48px] flex-1 font-sans text-body-md text-foreground ${className ?? ''}`}
          placeholderTextColor={tokens.outline}
          {...rest}
        />
        {trailingIcon ? <Ionicons name={trailingIcon} size={20} color={tokens.outline} /> : null}
      </View>
    </View>
  );
}

export function TerminalTextArea(props: TextInputProps & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <View className="gap-2">
      <LabelCaps>{label}</LabelCaps>
      <TextInput
        className={`min-h-[88px] rounded-terminal border border-input-border bg-input px-3 py-3 font-sans text-body-md text-foreground ${className ?? ''}`}
        placeholderTextColor={tokens.outline}
        multiline
        textAlignVertical="top"
        {...rest}
      />
    </View>
  );
}

export function SecureConnectionBadge() {
  return (
    <View className="mt-6 flex-row items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
      <Ionicons name="shield-checkmark" size={16} color={tokens.primary} />
      <Text className="font-mono text-[11px] uppercase tracking-wider text-primary">
        Secure connection active
      </Text>
    </View>
  );
}
