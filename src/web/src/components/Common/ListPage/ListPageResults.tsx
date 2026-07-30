import type { ReactNode } from "react";
import { PaginationButtons } from "~/components/PaginationButtons";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";

/** First-load placeholder. Only shown on the first load — see ListPageResults. */
export const ListPageSkeleton: React.FC<{ rows?: number }> = ({ rows }) => (
  <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8 md:pb-16">
    <LoadingSkeleton rows={rows} />
  </div>
);

/**
 * Keeps the previous page's rows mounted (dimmed) while the next page loads, so paging
 * never changes the page height and never moves the scroll position. Pair with
 * `placeholderData: keepPreviousData` on the query.
 */
export const ListPageResults: React.FC<{
  /** true only on the very first load — the one time a skeleton is right */
  isLoading: boolean;
  /** true while the next page is being fetched (react-query's isPlaceholderData) */
  isShowingPreviousResults?: boolean;
  skeletonRows?: number;
  id?: string;
  children: ReactNode;
}> = ({ isLoading, isShowingPreviousResults, skeletonRows, id, children }) => {
  if (isLoading) return <ListPageSkeleton rows={skeletonRows} />;

  return (
    <div
      id={id}
      className={`transition-opacity ${
        isShowingPreviousResults ? "opacity-50" : ""
      }`}
    >
      {children}
    </div>
  );
};

/**
 * Pager plus the inline "Updating..." affordance. The rows above stay put (dimmed) while
 * the next page loads, so this is the only progress indicator; its slot has a fixed height
 * so showing it causes no layout shift.
 */
export const ListPagePagination: React.FC<{
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onClick: (pageNumber: number, pageSize?: number) => void;
  isShowingPreviousResults?: boolean;
  showPages?: boolean;
  showInfo?: boolean;
  showPageSizes?: boolean;
  className?: string;
}> = ({
  currentPage,
  totalItems,
  pageSize,
  onClick,
  isShowingPreviousResults,
  showPages = false,
  showInfo = true,
  showPageSizes,
  className = "mt-4",
}) => (
  <div className={`grid place-items-center justify-center ${className}`}>
    <PaginationButtons
      currentPage={currentPage}
      totalItems={totalItems}
      pageSize={pageSize}
      onClick={onClick}
      showPages={showPages}
      showInfo={showInfo}
      showPageSizes={showPageSizes}
      themed // the list pages are theme-coloured throughout
    />

    <div className="flex h-6 items-center">
      {isShowingPreviousResults && (
        <LoadingInline
          classNameSpinner="h-4 w-4 border-purple"
          classNameLabel="text-xs text-gray-dark"
          className="gap-2"
          label="Updating..."
        />
      )}
    </div>
  </div>
);

export default ListPageResults;
