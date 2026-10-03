import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { colors, fonts } from '../../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string | null;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: Props): React.JSX.Element {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.msg}>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          {cancelLabel ? (
            <Button onPress={onCancel} textColor={colors.textMuted} accessibilityLabel={cancelLabel}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button onPress={onConfirm} textColor={destructive ? colors.danger : colors.violet} accessibilityLabel={confirmLabel}>
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: { backgroundColor: colors.white, borderRadius: 20, maxWidth: 420, width: '88%', alignSelf: 'center' },
  title: { fontFamily: fonts.display, color: colors.text },
  msg: { fontFamily: fonts.body, fontSize: 16, color: colors.textMuted, lineHeight: 22 },
});
