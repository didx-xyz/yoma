import { useMemo } from "react";

interface InputProps {
  [key: string]: any;
  currentPage: number;
  itemCount: number;
  totalItems?: number;
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
  const startRow = useMemo(() => {
    const numPage = parseInt(currentPage?.toString() || "1");
    return (numPage - 1) * pageSize + 1;
  }, [currentPage, pageSize]);

  return (
    <div className="text-gray-dark flex gap-2 text-sm">
      <span>
        Showing {startRow} - {startRow - 1 + itemCount}
        {totalItems && ` out of ${totalItems}`} results
        {query && ` for: `}
        {query && <span className="ml-2 font-bold">{query}</span>}
      </span>
    </div>
  );
};
