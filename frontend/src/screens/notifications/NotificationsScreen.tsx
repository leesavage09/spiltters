import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/navigationRef";
import type { NotificationResponseDto } from "../../generated/api.schemas";
import { useMarkNotificationRead, useNotifications } from "../../hooks/useNotifications";
import { useAcceptInvitation } from "../../hooks/useInvitations";
import { timeAgo } from "../../utils/timeAgo";
import { colors } from "../../theme/theme";
import { Page } from "@/components/ui/page/page";
import { ConfirmDialog } from "@/components/ui/confirm-dialog/confirmDialog";
import { useSnackbar } from "@/components/ui/snackbar/snackbar";

const NotificationsScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    data: notificationPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const acceptInvitation = useAcceptInvitation();
  const { showSnackbar } = useSnackbar();
  const [selectedNotification, setSelectedNotification] = useState<NotificationResponseDto | null>(null);

  const notifications = useMemo(
    () => notificationPages?.pages.flatMap((p) => p.items) ?? [],
    [notificationPages],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePress = useCallback(
    (notification: NotificationResponseDto) => {
      if (!notification.readAt) markAsRead.mutate(notification.id);

      if (notification.type === "INVITATION") {
        setSelectedNotification(notification);
        return;
      }

      console.log(notification.entityId);
    },
    [markAsRead],
  );

  const handleAccept = () => {
    if (!selectedNotification) return;

    acceptInvitation.mutate(selectedNotification.entityId, {
      onSuccess: (data) => {
        setSelectedNotification(null);
        navigation.navigate("SplitDetail", { splitId: data.splitId });
      },
      onError: (error) => {
        setSelectedNotification(null);
        showSnackbar({
          message: error.response?.data?.message ?? "Failed to join split",
          type: "error",
        });
      },
    });
  };

  const renderItem = ({ item }: { item: NotificationResponseDto }) => (
    <TouchableOpacity
      style={[styles.card, !item.readAt && styles.cardUnread]}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Page
      appBarContent={
        <>
          <Appbar.BackAction
            onPress={() => navigation.goBack()}
            iconColor={colors.white}
          />
          <Appbar.Content
            title="Notifications"
            titleStyle={styles.headerTitle}
          />
        </>
      }
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.blue500} />
        </View>
      ) : !notifications.length ? (
        <Text style={styles.emptyText}>No notifications yet</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={colors.blue500} /> : null
          }
        />
      )}

      <ConfirmDialog
        visible={!!selectedNotification}
        onDismiss={() => setSelectedNotification(null)}
        title="Join Split"
        message={selectedNotification?.message ?? ""}
        confirmAction={{
          label: "Join",
          onPress: handleAccept,
          color: colors.emerald600,
        }}
      />
    </Page>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    color: colors.white,
    fontWeight: "bold",
  },
  list: {
    gap: 10,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: colors.slate900,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate800,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.blue600,
  },
  cardContent: {
    gap: 4,
  },
  notificationTitle: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 15,
  },
  notificationMessage: {
    color: colors.slate400,
    fontSize: 14,
  },
  notificationTime: {
    color: colors.slate400,
    fontSize: 12,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: colors.slate400,
    textAlign: "center",
    marginTop: 32,
  },
});

export default NotificationsScreen;
