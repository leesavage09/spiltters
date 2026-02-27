import React from "react";
import { StyleSheet } from "react-native";
import { FAB } from "react-native-paper";
import type { Props as FABProps } from "react-native-paper/lib/typescript/components/FAB/FAB";
import { colors } from "@/theme/theme";

export const Fab: React.FC<Omit<FABProps, "style" | "color">> = (props) => {
  return (
    <FAB
      {...props}
      label={props.label || ""}
      style={styles.fab}
      color={colors.white}
    />
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: colors.blue600,
  },
});
