import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [accumulatedItems, setAccumulatedItems] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: [...queryKey, currentPage, pageSize],
    queryFn: () => queryFn(currentPage, pageSize),
    enabled,
  });

  // Update accumulated items when new data arrives
  useMemo(() => {
    if (data) {
      if (currentPage === 1) {
        // First page: replace all items
        setAccumulatedItems(data.items);
      } else {
        // Subsequent pages: append new items
        setAccumulatedItems((prev) => [...prev, ...data.items]);
      }
      setTotalCount(data.totalCount);
    }
  }, [data, currentPage]);

  const hasMore = totalCount > accumulatedItems.length;

  const loadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMore, isFetching]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setAccumulatedItems([]);
    setTotalCount(0);
  }, []);

  return {
    items: accumulatedItems,
    totalCount,
    error,
    isLoading: isLoading && currentPage === 1,
    isFetching,
    hasMore,
    loadMore,
    reset,
  };
}
