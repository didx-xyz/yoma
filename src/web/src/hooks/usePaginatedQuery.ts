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
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // Advance by requested pages, not returned rows: concurrent changes can leave a short page.
      // Counting loaded items can leave See More enabled forever when rows disappeared between reads.
      // A short nonempty page may still have a next page; an empty page stops even with a stale total.
      if (
        lastPage.items.length === 0 ||
        lastPageParam * pageSize >= lastPage.totalCount
      ) {
        return undefined;
      }
      return lastPageParam + 1;
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
