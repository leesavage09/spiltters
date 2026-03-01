import React, { useCallback, useMemo } from "react";
import { SectionList, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import type { ExpenseResponseDto } from "@/generated/api.schemas";
import { colors } from "@/theme/theme";

interface ExpenseListProps {
  expenses: ExpenseResponseDto[];
  currentUserId: string;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
  onExpensePress: (id: string) => void;
}

interface Section {
  title: string;
  data: ExpenseResponseDto[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
};

const formatAmount = (pence: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${(pence / 100).toFixed(2)}`;
};

const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatSectionDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();

  const toLocalDate = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const localDate = toLocalDate(date);
  const today = toLocalDate(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (localDate.getTime() === today.getTime()) return "Today";
  if (localDate.getTime() === yesterday.getTime()) return "Yesterday";

  const day = localDate.getDate();
  return `${day}${getOrdinalSuffix(day)} ${MONTHS[localDate.getMonth()]} ${localDate.getFullYear()}`;
};

const toLocalDateKey = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currentUserId,
  onEndReached,
  isFetchingNextPage,
  onExpensePress,
}) => {
  const sections = useMemo((): Section[] => {
    const grouped = new Map<string, ExpenseResponseDto[]>();
    for (const expense of expenses) {
      const key = toLocalDateKey(expense.date);
      const existing = grouped.get(key);
      if (existing) existing.push(expense);
      else grouped.set(key, [expense]);
    }
    return Array.from(grouped.entries()).map(([, items]) => ({
      title: formatSectionDate(items[0]!.date),
      data: items,
    }));
  }, [expenses]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <Text style={styles.sectionHeader}>{section.title}</Text>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: ExpenseResponseDto }) => {
      const userShare = item.shares.find((s) => s.userId === currentUserId);
      const isPayer = item.paidBy.id === currentUserId;
      const paidByLabel = isPayer ? "You paid" : `${item.paidBy.email} paid`;

      let lentBorrowedLabel = "";
      if (userShare) {
        if (isPayer) {
          const lentAmount = item.amount - userShare.amount;
          if (lentAmount > 0)
            lentBorrowedLabel = `You lent ${formatAmount(lentAmount, item.currency)}`;
        } else {
          lentBorrowedLabel = `You borrowed ${formatAmount(userShare.amount, item.currency)}`;
        }
      }

      return (
        <TouchableOpacity
          style={styles.expenseItem}
          onPress={() => onExpensePress(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.expenseLeft}>
            <Text style={styles.expenseTitle}>{item.title}</Text>
            <Text style={styles.expenseSubtitle}>{paidByLabel}</Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expenseAmount}>
              {formatAmount(item.amount, item.currency)}
            </Text>
            {lentBorrowedLabel ? (
              <Text
                style={[
                  styles.expenseLentBorrowed,
                  isPayer ? styles.lentColor : styles.borrowedColor,
                ]}
              >
                {lentBorrowedLabel}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [currentUserId, onExpensePress],
  );

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={(item) => item.id}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={<Text style={styles.emptyText}>No expenses yet</Text>}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator style={styles.loader} color={colors.blue500} />
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  sectionHeader: {
    color: colors.slate400,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.slate400,
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.slate900,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  expenseLeft: {
    flex: 1,
    marginRight: 12,
  },
  expenseTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseSubtitle: {
    color: colors.slate400,
    fontSize: 13,
    marginTop: 4,
  },
  expenseAmount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  expenseLentBorrowed: {
    fontSize: 13,
    fontWeight: "600",
  },
  lentColor: {
    color: colors.emerald600,
  },
  borrowedColor: {
    color: colors.red500,
  },
  loader: {
    marginVertical: 16,
  },
});
