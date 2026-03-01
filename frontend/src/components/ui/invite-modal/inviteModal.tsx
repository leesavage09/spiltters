import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Modal, Portal, Text, TextInput } from "react-native-paper";
import { useCreateInvitation } from "@/hooks/useInvitations";
import { useSnackbar } from "@/components/ui/snackbar/snackbar";
import { colors } from "@/theme/theme";

interface InviteModalProps {
  visible: boolean;
  onDismiss: () => void;
  splitId: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  visible,
  onDismiss,
  splitId,
}) => {
  const [email, setEmail] = useState("");
  const createInvitation = useCreateInvitation();
  const { showSnackbar } = useSnackbar();

  const handleInvite = () => {
    createInvitation.mutate(
      { email, splitId },
      {
        onSuccess: () => {
          showSnackbar({ message: "Invitation sent", type: "success" });
          setEmail("");
          onDismiss();
        },
        onError: (error) => {
          showSnackbar({
            message: error.response?.data?.message ?? "Failed to send invitation",
            type: "error",
          });
        },
      },
    );
  };

  const handleDismiss = () => {
    setEmail("");
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modal}
      >
        <Text variant="titleLarge" style={styles.title}>
          Invite to Split
        </Text>

        <TextInput
          label="Email address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.actions}>
          <Button
            mode="text"
            onPress={handleDismiss}
            textColor={colors.slate400}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleInvite}
            loading={createInvitation.isPending}
            disabled={createInvitation.isPending || !email}
            buttonColor={colors.emerald600}
            textColor={colors.white}
          >
            Invite
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
