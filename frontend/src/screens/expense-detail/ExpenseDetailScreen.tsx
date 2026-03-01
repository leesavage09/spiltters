import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Menu, Text } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/navigationRef";
import { useExpenses } from "../../hooks/useExpenses";
import { colors } from "../../theme/theme";
import { Page } from "@/components/ui/page/page";
import { formatAmount } from "@/utils/currencyUtils";
import { formatFullDate } from "@/utils/dateUtils";

const ExpenseDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ExpenseDetail">>();
  const { splitId, expenseId } = route.params;
  const [menuVisible, setMenuVisible] = useState(false);

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
                console.log("Edit expense", expenseId);
              }}
              title="Edit"
              titleStyle={styles.menuItemText}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                console.log("Delete expense", expenseId);
              }}
              title="Delete"
              titleStyle={styles.menuItemTextDestructive}
            />
          </Menu>
        </>
      }
    >
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
