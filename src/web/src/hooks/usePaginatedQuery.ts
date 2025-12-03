import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";

interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
}

interface UsePaginatedQueryOptions<T> {
  queryKey: string[];
  queryFn: (
    pageNumber: number,
    pageSize: number,
  ) => Promise<PaginatedResult<T>>;
  pageSize: number;
  enabled?: boolean;
}

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  pageSize,
  enabled = true,
}: UsePaginatedQueryOptions<T>) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [...queryKey, "infinite", pageSize],
    queryFn: ({ pageParam }) => queryFn(pageParam as number, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (acc, page) => acc + page.items.length,
        0,
      );
      if (loadedCount < lastPage.totalCount) {
        return allPages.length + 1;
      }
      return undefined;
    },
    enabled,
  });

  const items = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const reset = useCallback(() => {
    // No-op: useInfiniteQuery manages cache automatically
  }, []);

  return {
    items,
    totalCount,
    error,
    isLoading,
    isFetching,
    hasMore: hasNextPage,
    loadMore,
    reset,
  };
}
