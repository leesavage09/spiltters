import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Appbar, Menu, Text } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/navigationRef";
import type { ExpenseResponseDto } from "../generated/api.schemas";
import { useDeleteSplit, useSplits } from "../hooks/useSplits";
import { useCurrentUser } from "../hooks/useAuth";
import { useExpenses } from "../hooks/useExpenses";
import { colors } from "../theme/theme";
import { Fab } from "@/components/ui/fab/fab";
import { Page } from "@/components/ui/page/page";
import { useSnackbar } from "@/components/ui/snackbar/snackbar";
import { SplitModal } from "@/components/ui/split-modal/splitModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog/confirmDialog";
import { ExpenseModal } from "@/components/ui/expense-modal/expenseModal";

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
};

const formatAmount = (pence: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${(pence / 100).toFixed(2)}`;
};

const SplitDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "SplitDetail">>();
  const { data: user } = useCurrentUser();
  const { data: splits, isLoading } = useSplits();
  const deleteSplit = useDeleteSplit();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const { showSnackbar } = useSnackbar();

  const split = splits?.find((s) => s.id === route.params.splitId);

  const {
    data: expensePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExpenses(split?.id ?? "");

  const expenses = useMemo(
    () => expensePages?.pages.flatMap((p) => p.items) ?? [],
    [expensePages],
  );

  React.useEffect(() => {
    if (!isLoading && !split) navigation.replace("Home");
  }, [isLoading, split, navigation]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderExpenseItem = useCallback(
    ({ item }: { item: ExpenseResponseDto }) => {
      const currentUserId = user?.id;
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

      const dateStr = new Date(item.date).toLocaleDateString();

      return (
        <TouchableOpacity
          style={styles.expenseItem}
          onPress={() => console.log(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.expenseLeft}>
            <Text style={styles.expenseDate}>{dateStr}</Text>
            <Text style={styles.expenseTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expensePaidBy}>
              {paidByLabel} {formatAmount(item.amount, item.currency)}
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
    [user?.id],
  );

  if (isLoading || !split) return null;

  return (
    <Page
      appBarContent={
        <>
          <Appbar.BackAction
            onPress={() => navigation.goBack()}
            iconColor={colors.white}
          />
          <Appbar.Content
            title={`${split.emoji} ${split.name}`}
            titleStyle={styles.headerTitle}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
                iconColor={colors.white}
              />
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setEditModalVisible(true);
              }}
              title="Edit"
              titleStyle={styles.menuItemText}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setDeleteDialogVisible(true);
              }}
              title="Delete"
              titleStyle={styles.menuItemTextDestructive}
            />
          </Menu>
        </>
      }
    >
      <>
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No expenses yet</Text>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.loader} color={colors.blue500} />
            ) : null
          }
        />

        <Fab
          icon="plus"
          label="Add Expense"
          onPress={() => setExpenseModalVisible(true)}
        />

        <ConfirmDialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          title="Delete Split"
          message="Are you sure you want to delete this split?"
          confirmAction={{
            label: "Delete",
            onPress: () => {
              setDeleteDialogVisible(false);
              deleteSplit.mutate(split.id, {
                onSuccess: () => navigation.replace("Home"),
                onError: (error) => {
                  showSnackbar({
                    message: error.response?.data?.message ?? "Failed to delete split",
                    type: "error",
                  });
                },
              });
            },
          }}
        />

        <SplitModal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          mode="edit"
          splitId={split.id}
          initialValues={{ emoji: split.emoji, name: split.name }}
        />

        {user && (
          <ExpenseModal
            visible={expenseModalVisible}
            onDismiss={() => setExpenseModalVisible(false)}
            members={[{ id: user.id, email: user.email }, ...split.users]}
            currentUserId={user.id}
            splitId={split.id}
            onSuccess={() => showSnackbar({ message: "Expense created", type: "success" })}
            onError={(message) => showSnackbar({ message, type: "error" })}
          />
        )}
      </>
    </Page>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    color: colors.white,
    fontWeight: "bold",
    textAlign: "center",
  },
  menuContent: {
    backgroundColor: colors.slate900,
  },
  menuItemText: {
    color: colors.white,
  },
  menuItemTextDestructive: {
    color: colors.red500,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80,
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
  expenseDate: {
    color: colors.slate400,
    fontSize: 12,
    marginBottom: 4,
  },
  expenseTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expensePaidBy: {
    color: colors.slate400,
    fontSize: 13,
    marginBottom: 4,
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

export default SplitDetailScreen;
