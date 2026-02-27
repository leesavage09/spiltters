import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Appbar, FAB, Menu, Snackbar, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/navigationRef";
import { useDeleteSplit, useSplits } from "../hooks/useSplits";
import { colors } from "../theme/theme";
import { Fab } from "@/components/ui/fab/fab";

const SplitDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "SplitDetail">>();
  const { data: splits, isLoading } = useSplits();
  const deleteSplit = useDeleteSplit();
  const [menuVisible, setMenuVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const split = splits?.find((s) => s.id === route.params.splitId);

  React.useEffect(() => {
    if (!isLoading && !split) navigation.replace("Home");
  }, [isLoading, split, navigation]);

  if (isLoading || !split) return null;

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <Appbar.Header style={styles.header}>
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
              console.log("Edit split:", split.id);
              setMenuVisible(false);
            }}
            title="Edit"
            titleStyle={styles.menuItemText}
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              deleteSplit.mutate(split.id, {
                onSuccess: () => navigation.replace("Home"),
                onError: (error) => {
                  setSnackbarMessage(
                    error.response?.data?.message ?? "Failed to delete split",
                  );
                },
              });
            }}
            title="Delete"
            titleStyle={styles.menuItemTextDestructive}
          />
        </Menu>
      </Appbar.Header>

      <View style={styles.content}>
        <Text style={styles.placeholder}>Split details coming soon...</Text>
      </View>

      <Fab
        icon="plus"
        label="Add Expense"
        onPress={() => console.log("Add expense to split:", split.id)}
      />
      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage("")}
        duration={4000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate950,
  },
  header: {
    backgroundColor: colors.slate900,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate800,
  },
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  placeholder: {
    color: colors.slate400,
    fontSize: 16,
  },
  snackbar: {
    backgroundColor: colors.red500,
  },
});

export default SplitDetailScreen;
