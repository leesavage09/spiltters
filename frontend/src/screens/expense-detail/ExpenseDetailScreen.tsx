import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Menu, Text } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/navigationRef";
import { useDeleteExpense, useExpenses } from "../../hooks/useExpenses";
import { useCurrentUser } from "../../hooks/useAuth";
import { useSplits } from "../../hooks/useSplits";
import { colors } from "../../theme/theme";
import { Page } from "@/components/ui/page/page";
import { useSnackbar } from "@/components/ui/snackbar/snackbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog/confirmDialog";
import { ExpenseModal } from "@/components/ui/expense-modal/expenseModal";
import { formatAmount } from "@/utils/currencyUtils";
import { formatFullDate } from "@/utils/dateUtils";

const ExpenseDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ExpenseDetail">>();
  const { splitId, expenseId } = route.params;
  const { data: user } = useCurrentUser();
  const { data: splits } = useSplits();
  const split = splits?.find((s) => s.id === splitId);
  const deleteExpense = useDeleteExpense(splitId);
  const { showSnackbar } = useSnackbar();
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const { data: expensePages } = useExpenses(splitId);
  const expense = expensePages?.pages
    .flatMap((p) => p.items)
    .find((e) => e.id === expenseId);

  React.useEffect(() => {
    if (expensePages && !expense) navigation.goBack();
  }, [expensePages, expense, navigation]);

  if (!expense) return null;

  return (
    <Page
      appBarContent={
        <>
          <Appbar.BackAction
            onPress={() => navigation.goBack()}
            iconColor={colors.white}
          />
          <Appbar.Content
            title={expense.title}
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.date}>{formatFullDate(expense.date)}</Text>

          <Text style={styles.sectionHeading}>Paid by</Text>
          <View style={styles.card}>
            <Text style={styles.cardEmail}>{expense.paidBy.email}</Text>
            <Text style={styles.cardAmount}>
              {formatAmount(expense.amount, expense.currency)}
            </Text>
          </View>

          <Text style={styles.sectionHeading}>Participants</Text>
          {expense.shares.map((share) => (
            <View key={share.userId} style={styles.card}>
              <Text style={styles.cardEmail}>{share.email}</Text>
              <Text style={styles.cardAmount}>
                {formatAmount(share.amount, expense.currency)}
              </Text>
            </View>
          ))}
        </ScrollView>

        <ConfirmDialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          title="Delete Expense"
          message="Are you sure you want to delete this expense?"
          confirmAction={{
            label: "Delete",
            onPress: () => {
              setDeleteDialogVisible(false);
              deleteExpense.mutate(
                { splitId, expenseId },
                {
                  onSuccess: () => {
                    navigation.goBack();
                    showSnackbar({ message: "Expense deleted", type: "success" });
                  },
                  onError: (error) => {
                    showSnackbar({
                      message: error.response?.data?.message ?? "Failed to delete expense",
                      type: "error",
                    });
                  },
                },
              );
            },
          }}
        />

        {user && split && (
          <ExpenseModal
            visible={editModalVisible}
            onDismiss={() => setEditModalVisible(false)}
            members={[{ id: user.id, email: user.email }, ...split.users]}
            currentUserId={user.id}
            splitId={splitId}
            mode="edit"
            expenseId={expenseId}
            initialValues={{
              title: expense.title,
              amount: expense.amount,
              currency: expense.currency,
              paidBy: expense.paidBy.id,
              date: expense.date,
              shares: expense.shares.map((s) => ({
                userId: s.userId,
                amount: s.amount,
              })),
            }}
            onSuccess={() => showSnackbar({ message: "Expense updated", type: "success" })}
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
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  date: {
    color: colors.slate400,
    fontSize: 14,
    marginBottom: 24,
  },
  sectionHeading: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.slate900,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  cardEmail: {
    color: colors.white,
    fontSize: 14,
    flex: 1,
  },
  cardAmount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ExpenseDetailScreen;
