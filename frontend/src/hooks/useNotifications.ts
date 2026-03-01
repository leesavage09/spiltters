import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { NotificationResponseDto, PaginatedNotificationsResponseDto, UnreadCountResponseDto } from "../generated/api.schemas";
import { getNotifications } from "../generated/notifications/notifications";

import type { ErrorResponse } from "../types/api";
import { PAGE_SIZE } from "../utils/pagination";

const { notificationsControllerFindAll, notificationsControllerGetUnreadCount, notificationsControllerMarkAsRead } = getNotifications();

export const useNotifications = () => {
  return useInfiniteQuery<PaginatedNotificationsResponseDto>({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) =>
      notificationsControllerFindAll({
        skip: pageParam as number,
        take: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + PAGE_SIZE : undefined,
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery<UnreadCountResponseDto>({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsControllerGetUnreadCount,
    refetchInterval: 30000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationResponseDto,
    AxiosError<ErrorResponse>,
    string
  >({
    mutationFn: notificationsControllerMarkAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] }).catch(() => {});
    },
  });
};
