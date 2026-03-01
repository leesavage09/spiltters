import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Modal, Portal, Text, TextInput } from "react-native-paper";
import { useCreateSplit, useUpdateSplit } from "@/hooks/useSplits";
import { colors } from "@/theme/theme";

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
        contentContainerStyle={styles.modal}
      >
        <Text variant="titleLarge" style={styles.title}>
          {isEdit ? "Edit Split" : "Create New Split"}
        </Text>

        <TextInput
          label="Emoji"
          value={emoji}
          onChangeText={(text) => setEmoji(text.slice(0, 2))}
          style={styles.input}
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
          style={styles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
          maxLength={50}
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
            onPress={handleSave}
            loading={mutation.isPending}
            disabled={mutation.isPending || !emoji || !name}
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
