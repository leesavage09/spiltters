import React, { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Badge, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/navigationRef";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { useSplits } from "../hooks/useSplits";
import { useHealth } from "../hooks/useHealth";
import { SplitModal } from "@/components/ui/split-modal/splitModal";
import { UserSettingsModal } from "@/components/ui/user-settings-modal/userSettingsModal";
import { colors } from "../theme/theme";
import type { SplitResponseDto } from "../generated/api.schemas";
import { getApiUrl } from "@/api/client";
import { Fab } from "@/components/ui/fab/fab";
import { Page } from "@/components/ui/page/page";
import { getDisplayName } from "@/utils/displayName";
import { useUnreadNotificationCount } from "../hooks/useNotifications";

const HomeScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: user } = useCurrentUser();
  const { data: splits, isLoading: splitsLoading } = useSplits();
  const { data: health } = useHealth();
  const { data: unreadCount } = useUnreadNotificationCount();
  const logout = useLogout();
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

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
    <Page
      appBarContent={
        <>
          <Appbar.Content title="Splitters" titleStyle={styles.headerTitle} />
          <View style={styles.bellContainer}>
            <Appbar.Action
              icon="bell-outline"
              onPress={() => navigation.navigate("Notifications")}
              iconColor={colors.slate400}
            />
            {unreadCount?.count ? (
              <Badge style={styles.badge} size={18}>
                {unreadCount.count}
              </Badge>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => setSettingsVisible(true)}>
            <Text style={styles.userEmail}>
              {user ? getDisplayName(user) : ""}
            </Text>
          </TouchableOpacity>
          <Appbar.Action
            icon="logout"
            onPress={handleLogout}
            iconColor={colors.slate400}
          />
        </>
      }
    >
      <>
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

        <Fab
          icon="plus"
          label="Create new split"
          onPress={() => setModalVisible(true)}
        />

        <SplitModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          mode="create"
        />

        <UserSettingsModal
          visible={settingsVisible}
          onDismiss={() => setSettingsVisible(false)}
        />
      </>
    </Page>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    color: colors.white,
    fontWeight: "bold",
    marginLeft: 10,
  },
  userEmail: {
    color: colors.slate400,
    fontSize: 12,
    marginRight: 4,
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
  bellContainer: {
    position: "relative" as const,
  },
  badge: {
    position: "absolute" as const,
    top: 4,
    right: 4,
    backgroundColor: colors.red500,
  },
});

export default HomeScreen;
