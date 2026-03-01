import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Modal, Portal, Text, TextInput } from "react-native-paper";
import { useCurrentUser, useUpdateProfile } from "@/hooks/useAuth";
import { colors } from "@/theme/theme";

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
        contentContainerStyle={styles.modal}
      >
        <Text variant="titleLarge" style={styles.title}>
          User Settings
        </Text>

        <Text style={styles.email}>{user?.email}</Text>

        <TextInput
          label="Username (optional)"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
          maxLength={30}
        />

        <View style={styles.actions}>
          <Button mode="text" onPress={onDismiss} textColor={colors.slate400}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={updateProfile.isPending}
            disabled={updateProfile.isPending}
            buttonColor={colors.emerald600}
            textColor={colors.white}
          >
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.slate900,
    margin: 24,
    padding: 24,
    borderRadius: 16,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    color: colors.white,
    fontWeight: "bold",
    marginBottom: 20,
  },
  email: {
    color: colors.slate400,
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.slate950,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
});
