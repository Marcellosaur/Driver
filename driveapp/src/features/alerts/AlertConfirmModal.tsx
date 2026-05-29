import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { EmergencyButton } from '@/shared/ui/dispatch/DispatchButtons';
import { LabelCaps } from '@/shared/ui/dispatch/Typography';
import { tokens } from '@/shared/ui/design-tokens';
import { useAppPalette } from '@/shared/ui/useAppTheme';

export function AlertConfirmModal(props: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (message: string) => void;
}) {
  const t = useAppPalette();
  const [message, setMessage] = useState('');

  if (!props.visible) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={props.onCancel}>
      <View className="flex-1 justify-center bg-black/70 px-5">
        <View className="overflow-hidden rounded-card border border-border">
          <View className="items-center bg-emergency-surface px-5 pb-5 pt-6">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-emergency">
              <Ionicons name="warning" size={28} color={tokens.onEmergency} />
            </View>
            <Text className="text-center font-sans text-headline-sm font-bold text-emergency">
              Send emergency alert?
            </Text>
          </View>
          <View className="bg-surface px-5 pb-5 pt-4">
            <Text className="text-center font-sans text-body-md text-foreground-secondary">
              Dispatch will be notified immediately with your location.
            </Text>
            <LabelCaps className="mb-2 mt-5">Add a message (optional)</LabelCaps>
            <TextInput
              className="min-h-[88px] rounded-terminal border border-input-border bg-input px-3 py-3 font-sans text-body-md text-foreground"
              placeholder="Describe the situation…"
              placeholderTextColor={t.placeholder}
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
            />
            <EmergencyButton
              label="Send alert now"
              icon="radio-outline"
              className="mt-4"
              onPress={() => props.onConfirm(message.trim())}
            />
            <Pressable
              className="mt-3 min-h-[48px] items-center justify-center rounded-terminal border border-primary px-4 py-3.5 active:opacity-90"
              onPress={() => {
                setMessage('');
                props.onCancel();
              }}>
              <Text className="font-sans text-base font-semibold text-primary">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
