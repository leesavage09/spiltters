import React, { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/navigationRef";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { useSplits } from "../hooks/useSplits";
import { useHealth } from "../hooks/useHealth";
import CreateSplitModal from "../components/CreateSplitModal";
import { colors } from "../theme/theme";
import type { SplitResponseDto } from "../generated/api.schemas";
import { getApiUrl } from "@/api/client";
import { Fab } from "@/components/ui/fab/fab";

const HomeScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: user } = useCurrentUser();
  const { data: splits, isLoading: splitsLoading } = useSplits();
  const { data: health } = useHealth();
  const logout = useLogout();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigation.replace("Login"),
    });
  };

  const renderSplitItem = ({ item }: { item: SplitResponseDto }) => (
    <TouchableOpacity
      style={styles.splitCard}
      onPress={() => navigation.navigate("SplitDetail", { splitId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.splitCardContent}>
        <Text style={styles.splitEmoji}>{item.emoji}</Text>
        <Text style={styles.splitName}>{item.name}</Text>
      </View>
      <Text style={styles.chevron}>{"\u203A"}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Splitters" titleStyle={styles.headerTitle} />
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Appbar.Action
          icon="logout"
          onPress={handleLogout}
          iconColor={colors.slate400}
        />
      </Appbar.Header>

      <View style={styles.content}>
        <View style={styles.healthRow}>
          <View
            style={[
              styles.healthDot,
              {
                backgroundColor:
                  health?.status === "ok" ? colors.emerald600 : colors.red500,
              },
            ]}
          />
          <Text style={styles.healthText}>
            {health?.status === "ok"
              ? "Backend connected " +
                (getApiUrl() === "" ? "(locally)" : getApiUrl())
              : "Backend unavailable " + getApiUrl()}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Your Splits
          </Text>
        </View>

        {splitsLoading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : !splits?.length ? (
          <Text style={styles.emptyText}>No splits yet</Text>
        ) : (
          <FlatList
            data={splits}
            renderItem={renderSplitItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      <Fab
        icon="plus"
        label="Create new split"
        onPress={() => setModalVisible(true)}
      />

      <CreateSplitModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
      />
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
  },
  userEmail: {
    color: colors.slate400,
    fontSize: 12,
    marginRight: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  healthText: {
    color: colors.slate400,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.white,
    fontWeight: "bold",
  },
  list: {
    gap: 10,
  },
  splitCard: {
    backgroundColor: colors.slate900,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.slate800,
  },
  splitCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  splitEmoji: {
    fontSize: 24,
  },
  splitName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  chevron: {
    color: colors.slate400,
    fontSize: 24,
  },
  emptyText: {
    color: colors.slate400,
    textAlign: "center",
    marginTop: 32,
  },
});

export default HomeScreen;
