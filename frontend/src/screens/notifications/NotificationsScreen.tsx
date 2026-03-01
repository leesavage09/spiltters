import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/navigationRef";
import type { NotificationResponseDto } from "../../generated/api.schemas";
import { useMarkNotificationRead, useNotifications } from "../../hooks/useNotifications";
import { timeAgo } from "../../utils/timeAgo";
import { colors } from "../../theme/theme";
import { Page } from "@/components/ui/page/page";

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

  const notifications = useMemo(
    () => notificationPages?.pages.flatMap((p) => p.items) ?? [],
    [notificationPages],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePress = useCallback(
    (notification: NotificationResponseDto) => {
      console.log(notification.entityId);
      if (!notification.readAt) markAsRead.mutate(notification.id);
    },
    [markAsRead],
  );

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
