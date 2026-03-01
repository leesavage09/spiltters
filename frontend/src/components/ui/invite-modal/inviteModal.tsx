import React, { useState } from "react";
import { Modal, Portal, Text, TextInput } from "react-native-paper";
import { useCreateInvitation } from "@/hooks/useInvitations";
import { useSnackbar } from "@/components/ui/snackbar/snackbar";
import { colors } from "@/theme/theme";
import { modalStyles } from "@/components/ui/modal-styles/modalStyles";
import { extractErrorMessage } from "@/types/api";
import { ModalActions } from "@/components/ui/modal-styles/ModalActions";

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showSnackbar({ message: "Please enter a valid email address", type: "error" });
      return;
    }

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
            message: extractErrorMessage(error, "Failed to send invitation"),
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
        contentContainerStyle={modalStyles.modal}
      >
        <Text variant="titleLarge" style={modalStyles.title}>
          Invite to Split
        </Text>

        <TextInput
          label="Email address"
          value={email}
          onChangeText={setEmail}
          style={modalStyles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ModalActions
          onCancel={handleDismiss}
          onConfirm={handleInvite}
          loading={createInvitation.isPending}
          disabled={createInvitation.isPending || !email}
          confirmLabel="Invite"
        />
      </Modal>
    </Portal>
  );
};
