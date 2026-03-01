import React from "react";
import { StyleSheet } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { colors } from "@/theme/theme";

interface ConfirmDialogAction {
  label: string;
  onPress: () => void;
  color?: string;
}

interface ConfirmDialogProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  message: string;
  cancelAction?: ConfirmDialogAction;
  confirmAction: ConfirmDialogAction;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  onDismiss,
  title,
  message,
  cancelAction,
  confirmAction,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.message}>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={cancelAction?.onPress ?? onDismiss}
            textColor={cancelAction?.color ?? colors.slate400}
          >
            {cancelAction?.label ?? "Cancel"}
          </Button>
          <Button
            onPress={confirmAction.onPress}
            textColor={confirmAction.color ?? colors.red500}
          >
            {confirmAction.label}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: colors.slate900,
  },
  title: {
    color: colors.white,
  },
  message: {
    color: colors.slate400,
  },
});
