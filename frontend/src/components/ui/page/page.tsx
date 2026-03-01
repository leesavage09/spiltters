import React from "react";
import { StyleSheet, View } from "react-native";
import { Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/theme";

type PageProps = React.PropsWithChildren<{
  appBarContent: React.ReactNode;
}>;

export const Page: React.FC<PageProps> = (props) => {
  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <Appbar.Header style={styles.header}>{props.appBarContent}</Appbar.Header>

      <View style={styles.content}>{props.children}</View>
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
    // paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
});
