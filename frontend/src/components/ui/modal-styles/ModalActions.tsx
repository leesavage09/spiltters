import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { colors } from "@/theme/theme";
import { modalStyles } from "./modalStyles";

interface ModalActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  confirmLabel?: string;
}

export const ModalActions: React.FC<ModalActionsProps> = ({
  onCancel,
  onConfirm,
  loading = false,
  disabled = false,
  confirmLabel = "Save",
}) => (
  <View style={modalStyles.actions}>
    <Button mode="text" onPress={onCancel} textColor={colors.slate400}>
      Cancel
    </Button>
    <Button
      mode="contained"
      onPress={onConfirm}
      loading={loading}
      disabled={disabled}
      buttonColor={colors.emerald600}
      textColor={colors.white}
    >
      {confirmLabel}
    </Button>
  </View>
);
