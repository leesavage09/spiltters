import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Modal, Portal, Text, TextInput } from "react-native-paper";
import { useCurrentUser, useUpdateProfile } from "@/hooks/useAuth";
import { colors } from "@/theme/theme";
import { modalStyles } from "@/components/ui/modal-styles/modalStyles";
import { ModalActions } from "@/components/ui/modal-styles/ModalActions";

interface UserSettingsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (visible) setUsername(user?.username ?? "");
  }, [visible, user?.username]);

  const handleSave = () => {
    updateProfile.mutate(
      { username: username.trim() || undefined },
      { onSuccess: onDismiss },
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={modalStyles.modal}
      >
        <Text variant="titleLarge" style={modalStyles.title}>
          User Settings
        </Text>

        <Text style={styles.email}>{user?.email}</Text>

        <TextInput
          label="Username (optional)"
          value={username}
          onChangeText={setUsername}
          style={modalStyles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
          maxLength={30}
        />

        <ModalActions
          onCancel={onDismiss}
          onConfirm={handleSave}
          loading={updateProfile.isPending}
          disabled={updateProfile.isPending}
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  email: {
    color: colors.slate400,
    fontSize: 14,
    marginBottom: 16,
  },
});
