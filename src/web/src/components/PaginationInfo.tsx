import { useMemo } from "react";

interface InputProps {
  [key: string]: any;
  currentPage: number;
  itemCount: number;
  totalItems: number;
  pageSize: number;
  query: string | null;
}

export const PaginationInfoComponent: React.FC<InputProps> = ({
  currentPage,
  itemCount,
  totalItems,
  pageSize,
  query,
}) => {
  // 🧮 calculated fields
  const totalPages = useMemo(() => {
    const totalItemCount = totalItems ?? 0;
    if (totalItemCount == 0) return 0;
    const totalPages = totalItemCount / pageSize;
    if (totalPages < 1) return 1;
    else return Math.ceil(totalPages);
  }, [totalItems, pageSize]);

  const startRow = useMemo(() => {
    if (!currentPage) return 1;

    const numPage = parseInt(currentPage.toString());
    return (numPage - 1) * pageSize + 1;
  }, [currentPage, pageSize]);

  return (
    <div className="flex gap-2 text-sm text-gray-dark">
      {totalPages == 0 && <span>Showing 0 results</span>}
      {totalPages > 0 && (
        <span>
          Showing {startRow} - {startRow - 1 + itemCount} out of {totalItems}
          {query && (
            <span>
              {" "}
              for:
              <span className="ml-2 font-bold">{query}</span>
            </span>
          )}
        </span>
      )}
    </div>
  );
};
