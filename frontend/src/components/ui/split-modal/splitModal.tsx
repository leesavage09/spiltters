import React, { useEffect, useState } from "react";
import { Modal, Portal, Text, TextInput } from "react-native-paper";
import { useCreateSplit, useUpdateSplit } from "@/hooks/useSplits";
import { colors } from "@/theme/theme";
import { modalStyles } from "@/components/ui/modal-styles/modalStyles";
import { ModalActions } from "@/components/ui/modal-styles/ModalActions";

interface SplitModalProps {
  visible: boolean;
  onDismiss: () => void;
  mode: "create" | "edit";
  splitId?: string;
  initialValues?: { emoji: string; name: string };
}

export const SplitModal: React.FC<SplitModalProps> = ({
  visible,
  onDismiss,
  mode,
  splitId,
  initialValues,
}) => {
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");
  const createSplit = useCreateSplit();
  const updateSplit = useUpdateSplit();

  const isEdit = mode === "edit";
  const mutation = isEdit ? updateSplit : createSplit;

  useEffect(() => {
    if (visible && initialValues) {
      setEmoji(initialValues.emoji);
      setName(initialValues.name);
    }
  }, [visible, initialValues]);

  const handleSave = () => {
    if (isEdit && splitId) {
      updateSplit.mutate(
        { id: splitId, data: { emoji, name } },
        {
          onSuccess: () => {
            onDismiss();
          },
        },
      );
    } else {
      createSplit.mutate(
        { emoji, name },
        {
          onSuccess: () => {
            setEmoji("");
            setName("");
            onDismiss();
          },
        },
      );
    }
  };

  const handleDismiss = () => {
    if (!isEdit) {
      setEmoji("");
      setName("");
    }
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
          {isEdit ? "Edit Split" : "Create New Split"}
        </Text>

        <TextInput
          label="Emoji"
          value={emoji}
          onChangeText={(text) => setEmoji(text.slice(0, 2))}
          style={modalStyles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
          maxLength={2}
        />

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={modalStyles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
          maxLength={50}
        />

        <ModalActions
          onCancel={handleDismiss}
          onConfirm={handleSave}
          loading={mutation.isPending}
          disabled={mutation.isPending || !emoji || !name}
        />
      </Modal>
    </Portal>
  );
};
