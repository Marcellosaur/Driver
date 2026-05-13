import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppPalette } from '@/shared/ui/theme';
import { useAppPalette } from '@/shared/ui/useAppTheme';

function makeStyles(t: AppPalette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: t.overlay,
      justifyContent: 'center',
      padding: 24,
    },
    sheet: {
      backgroundColor: t.modalSurface,
      borderRadius: 16,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.modalBorder,
    },
    title: { fontSize: 18, fontWeight: '700', color: t.modalText },
    countdown: { marginTop: 8, color: t.modalTextSecondary },
    input: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: t.modalBorder,
      borderRadius: 8,
      padding: 12,
      minHeight: 72,
      textAlignVertical: 'top',
      color: t.modalText,
      backgroundColor: t.surfaceElevated,
    },
    row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    btnSecondary: { paddingVertical: 10, paddingHorizontal: 16 },
    btnSecondaryText: { color: t.modalTextSecondary },
    btnPrimary: {
      backgroundColor: t.danger,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    btnPrimaryText: { color: t.onDanger, fontWeight: '700' },
  });
}

export function AlertConfirmModal(props: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (message: string) => void;
}) {
  const t = useAppPalette();
  const styles = useMemo(() => makeStyles(t), [t]);

  const { visible, onCancel, onConfirm } = props;
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [message, setMessage] = useState('');
  const messageRef = useRef('');
  const firedRef = useRef(false);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  messageRef.current = message;

  useEffect(() => {
    if (!visible) {
      setSecondsLeft(3);
      setMessage('');
      firedRef.current = false;
      return;
    }
    firedRef.current = false;
    let left = 3;
    setSecondsLeft(3);
    const id = setInterval(() => {
      left -= 1;
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        if (!firedRef.current) {
          firedRef.current = true;
          onConfirmRef.current(messageRef.current.trim());
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Send SOS alert?</Text>
          <Text style={styles.countdown}>Auto-send in {Math.max(0, secondsLeft)}s unless cancelled.</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional message"
            placeholderTextColor={t.placeholder}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <View style={styles.row}>
            <Pressable style={styles.btnSecondary} onPress={onCancel}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.btnPrimary}
              onPress={() => {
                firedRef.current = true;
                onConfirmRef.current(message.trim());
              }}>
              <Text style={styles.btnPrimaryText}>Send now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
