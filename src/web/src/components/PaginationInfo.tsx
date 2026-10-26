import { formatNumber } from "~/features/discovery/lib/format";

interface InputProps {
  currentPage: number;
  /** How many rows the current page holds. */
  itemCount: number;
  /** The whole list's size; left out where the API doesn't say (wallet products). */
  totalItems?: number;
  pageSize: number;
  /** What the list is, capitalised: "Pending opportunities", "Products". */
  label: string;
}

/**
 * The Yo-ID lists' count line (Jason, 2026-10-22): "Pending opportunities (12 of 44)" — the
 * list's name in discovery's results heading typography, then the rows loaded through the
 * current page and the total as lighter sub-text. Without a total (wallet products):
 * "Products (12)".
 */
export const PaginationInfoComponent: React.FC<InputProps> = ({
  currentPage,
  itemCount,
  totalItems,
  pageSize,
  label,
}) => {
  const through = (Math.max(currentPage, 1) - 1) * pageSize + itemCount;

  return (
    <div className="flex min-w-0 items-baseline gap-2 text-base font-bold tracking-normal md:text-lg">
      <span>{label}</span>
      <span className="text-gray-dark text-sm font-normal">
        ({formatNumber(through)}
        {totalItems != null && ` of ${formatNumber(totalItems)}`})
      </span>
    </div>
  );
};
