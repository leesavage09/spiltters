import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { Appbar, Menu } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/navigationRef";
import { useDeleteSplit, useSplits } from "../../hooks/useSplits";
import { useCurrentUser } from "../../hooks/useAuth";
import { useExpenses } from "../../hooks/useExpenses";
import { colors } from "../../theme/theme";
import { Fab } from "@/components/ui/fab/fab";
import { Page } from "@/components/ui/page/page";
import { useSnackbar } from "@/components/ui/snackbar/snackbar";
import { SplitModal } from "@/components/ui/split-modal/splitModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog/confirmDialog";
import { ExpenseModal } from "@/components/ui/expense-modal/expenseModal";
import { ExpenseList } from "./components/ExpenseList";

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

  const handleExpensePress = useCallback((id: string) => {
    navigation.navigate("ExpenseDetail", { splitId: split!.id, expenseId: id });
  }, [navigation, split]);

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
        <ExpenseList
          expenses={expenses}
          currentUserId={user?.id ?? ""}
          onEndReached={handleEndReached}
          isFetchingNextPage={isFetchingNextPage}
          onExpensePress={handleExpensePress}
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
});

export default SplitDetailScreen;
