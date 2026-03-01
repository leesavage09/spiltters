import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Modal, Portal, Text, TextInput } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { DatePickerInput } from "react-native-paper-dates";
import { colors } from "@/theme/theme";
import { useCreateExpense } from "@/hooks/useExpenses";
import type { CreateExpenseDtoCurrency } from "@/generated/api.schemas";

interface Member {
  id: string;
  email: string;
}

interface ExpenseModalProps {
  visible: boolean;
  onDismiss: () => void;
  members: Member[];
  currentUserId: string;
  splitId: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface ShareEntry {
  userId: string;
  amount: string;
  locked: boolean;
}

const CURRENCIES = [
  { value: "GBP", label: "£ GBP" },
  { value: "EUR", label: "€ EUR" },
  { value: "USD", label: "$ USD" },
] as const;

type CurrencyValue = (typeof CURRENCIES)[number]["value"];

const roundTwo = (n: number): number => Math.round(n * 100) / 100;

const distributeEqually = (total: number, count: number): string[] => {
  if (count === 0) return [];
  const base = Math.floor((total * 100) / count) / 100;
  const remainder = roundTwo(total - base * count);
  return Array.from({ length: count }, (_, i) =>
    i === 0 ? roundTwo(base + remainder).toFixed(2) : base.toFixed(2),
  );
};

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  visible,
  onDismiss,
  members,
  currentUserId,
  splitId,
  onSuccess,
  onError,
}) => {
  const createExpense = useCreateExpense();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [date, setDate] = useState<Date>(new Date());
  const [currency, setCurrency] = useState<CurrencyValue>("GBP");
  const [shares, setShares] = useState<ShareEntry[]>([]);

  const initShares = useCallback(
    (totalStr: string) => {
      const total = parseFloat(totalStr) || 0;
      const amounts = distributeEqually(total, members.length);
      setShares(
        members.map((m, i) => ({
          userId: m.id,
          amount: amounts[i] ?? "0.00",
          locked: false,
        })),
      );
    },
    [members],
  );

  useEffect(() => {
    if (visible) {
      setTitle("");
      setAmount("");
      setPaidBy(currentUserId);
      setDate(new Date());
      setCurrency("GBP");
      initShares("");
    }
  }, [visible, currentUserId, initShares]);

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setAmount(cleaned);
    const total = parseFloat(cleaned) || 0;
    const amounts = distributeEqually(total, members.length);
    setShares(
      members.map((m, i) => ({
        userId: m.id,
        amount: amounts[i] ?? "0.00",
        locked: false,
      })),
    );
  };

  const handleShareChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const total = parseFloat(amount) || 0;
    const editedAmount = parseFloat(cleaned) || 0;
    const remaining = roundTwo(total - editedAmount);
    const otherCount = members.length - 1;
    const otherAmounts = distributeEqually(
      Math.max(0, remaining),
      otherCount,
    );

    let otherIdx = 0;
    setShares(
      shares.map((s, i) => {
        if (i === index) return { ...s, amount: cleaned, locked: true };
        const amt = otherAmounts[otherIdx] ?? "0.00";
        otherIdx++;
        return { ...s, amount: amt, locked: false };
      }),
    );
  };

  const handleSave = () => {
    createExpense.mutate(
      {
        splitId,
        data: {
          title,
          amount: Math.round((parseFloat(amount) || 0) * 100),
          paidBy,
          date: date.toISOString(),
          currency: currency as CreateExpenseDtoCurrency,
          shares: shares.map((s) => ({
            userId: s.userId,
            amount: Math.round((parseFloat(s.amount) || 0) * 100),
          })),
        },
      },
      {
        onSuccess: () => {
          onDismiss();
          onSuccess?.();
        },
        onError: (error) => {
          onError?.(error.response?.data?.message ?? "Failed to create expense");
        },
      },
    );
  };

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m.email])),
    [members],
  );

  const memberOptions = useMemo(
    () => members.map((m) => ({ label: m.email, value: m.id })),
    [members],
  );

  const canSave = title && amount && parseFloat(amount) > 0;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="titleLarge" style={styles.title}>
            Add Expense
          </Text>

          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            mode="outlined"
            outlineColor={colors.slate700}
            activeOutlineColor={colors.blue500}
            textColor={colors.white}
          />

          <View style={styles.row}>
            <View style={styles.currencyPicker}>
              <Dropdown
                label="Currency"
                options={CURRENCIES.map((c) => ({ label: c.label, value: c.value }))}
                value={currency}
                onSelect={(value) => { if (value) setCurrency(value as CurrencyValue); }}
                mode="outlined"
              />
            </View>

            <View style={styles.amountInput}>
              <TextInput
                label="Amount"
                value={amount}
                onChangeText={handleAmountChange}
                style={styles.input}
                mode="outlined"
                outlineColor={colors.slate700}
                activeOutlineColor={colors.blue500}
                textColor={colors.white}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Paid by"
              options={memberOptions}
              value={paidBy}
              onSelect={(value) => { if (value) setPaidBy(value); }}
              mode="outlined"
            />
          </View>

          <DatePickerInput
            locale="en-GB"
            label="Date"
            value={date}
            onChange={(d) => { if (d) setDate(d); }}
            inputMode="start"
            mode="outlined"
            style={styles.input}
            outlineColor={colors.slate700}
            activeOutlineColor={colors.blue500}
            textColor={colors.white}
          />

          <Text variant="titleMedium" style={styles.sharesTitle}>
            Split between
          </Text>

          {shares.map((share, index) => (
            <View key={share.userId} style={styles.shareRow}>
              <Text style={styles.shareEmail} numberOfLines={1}>
                {memberMap.get(share.userId) ?? share.userId}
              </Text>
              <TextInput
                value={share.amount}
                onChangeText={(text) => handleShareChange(index, text)}
                style={styles.shareInput}
                mode="outlined"
                outlineColor={colors.slate700}
                activeOutlineColor={colors.blue500}
                textColor={colors.white}
                keyboardType="decimal-pad"
                dense
              />
            </View>
          ))}

          <View style={styles.actions}>
            <Button mode="text" onPress={onDismiss} textColor={colors.slate400}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!canSave}
              buttonColor={colors.emerald600}
              textColor={colors.white}
            >
              Save
            </Button>
          </View>
        </ScrollView>
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
    maxHeight: "85%",
  },
  title: {
    color: colors.white,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.slate950,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  currencyPicker: {
    flex: 1,
  },
  amountInput: {
    flex: 1,
  },
  dropdownWrapper: {
    marginBottom: 12,
  },
  sharesTitle: {
    color: colors.white,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 12,
  },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  shareEmail: {
    color: colors.slate400,
    flex: 1,
    fontSize: 14,
  },
  shareInput: {
    width: 100,
    backgroundColor: colors.slate950,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
});
