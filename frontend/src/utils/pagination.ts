import { useCallback } from "react";
import type { InfiniteData } from "@tanstack/react-query";

export const PAGE_SIZE = 20;

export const flattenPages = <T>(
  data: InfiniteData<{ items: T[] }> | undefined,
): T[] => data?.pages.flatMap((p) => p.items) ?? [];

export const useLoadMore = (
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
) => {
  return useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
};
