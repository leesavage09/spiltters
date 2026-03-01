import { StyleSheet } from "react-native";
import { colors } from "./theme";

export const detailScreenStyles = StyleSheet.create({
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
