import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Button styling. `themed` colours the pager to the page theme — blue on admin pages, green
 * on org-admin pages — instead of daisyUI's fixed `btn-secondary`. It is opt-in, so the
 * pagers on the many pages that do not follow the admin list-page pattern are untouched.
 *
 * NB: `bg-theme` / `border-theme` / `text-theme` are hand-written, unlayered CSS, so they
 * beat daisyUI's layered `btn-*` rules. That includes the disabled background — hence the
 * explicit disabled opacity — and it means `hover:bg-theme` cannot exist, hence brightness
 * for the hover state. `bg-theme` also sets the foreground colour, so no `text-*` needed.
 */
const BUTTON_CLASSES = {
  default: {
    nav: "btn join-item btn-secondary",
    pageActive: "btn btn-active join-item btn-secondary",
    pageInactive: "btn join-item btn-secondary",
  },
  themed: {
    nav: "btn join-item bg-theme border-none brightness-[1.12] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40",
    // the current page is rendered disabled, but it should read as current rather than
    // unavailable, so it keeps full colour
    pageActive: "btn btn-active join-item bg-theme border-none",
    pageInactive:
      "btn join-item border-theme text-theme border bg-white hover:brightness-95",
  },
} as const;

interface InputProps {
  [key: string]: any;
  currentPage: number;
  totalItems?: number | null;
  pageSize: number;
  showPages?: boolean;
  showInfo?: boolean;
  onClick: (page: number, pageSize?: number) => void;
  showPageSizes?: boolean; // New prop to toggle page size dropdown
  pageSizes?: number[]; // Optional array of page sizes
  /** colour the buttons to the page theme instead of daisyUI's fixed secondary */
  themed?: boolean;
}

export const PaginationButtons: React.FC<InputProps> = ({
  currentPage,
  totalItems,
  pageSize,
  showPages,
  showInfo,
  onClick,
  showPageSizes,
  pageSizes = [50, 100, 500, 1000], // Default page sizes
  themed = false,
}) => {
  const buttonClasses = BUTTON_CLASSES[themed ? "themed" : "default"];
  const [inputValue, setInputValue] = useState(currentPage);

  // keep the input in sync when the page changes from outside (pager buttons, browser
  // back/forward). NB: without this the input keeps its stale value whenever the
  // component stays mounted, e.g. a cached result set that renders without a loading pass.
  useEffect(() => {
    setInputValue(currentPage);
  }, [currentPage]);

  // 🧮 calculated fields
  const totalPages = useMemo(() => {
    if (totalItems == null) return null;
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const currentPages = useMemo(() => {
    if (totalPages == null) return [];
    // return an array of pages to render the pager buttons
    const result = Array.apply(null, new Array(totalPages)).map(
      function (value, index) {
        return index + 1;
      },
    );

    return result;
  }, [totalPages]);

  const handlePagerChange = useCallback(
    (value: number) => {
      onClick(value, pageSize);
    },
    [onClick, pageSize],
  );

  const handleInputChange = useCallback(
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.KeyboardEvent<HTMLInputElement>,
    ) => {
      const value = parseInt((event.target as HTMLInputElement).value, 10);
      setInputValue(value);

      if (
        event.type === "blur" ||
        (event.type === "keydown" &&
          (event as React.KeyboardEvent).key === "Enter")
      ) {
        if (
          !isNaN(value) &&
          value >= 1 &&
          (totalPages == null || value <= totalPages)
        ) {
          handlePagerChange(value);
        } else {
          setInputValue(currentPage);
        }
      }
    },
    [totalPages, currentPage, handlePagerChange],
  );

  const handlePageSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newPageSize = parseInt(event.target.value, 10);
      onClick(1, newPageSize); // Reset to page 1 and pass new page size
    },
    [onClick],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* PAGE SIZE DROPDOWN */}
      {showPageSizes && (
        <div className="flex items-center gap-2">
          <span className="text-xs whitespace-nowrap">Page Size:</span>
          <select
            className="border-grayx rounded-mdx select select-sm w-20 focus:outline-none"
            onChange={handlePageSizeChange}
            value={pageSize} // Ensure the correct pageSize is selected
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="join flex w-full items-center justify-center gap-2">
        {/* PREVIOUS BUTTON */}
        <button
          key={`PaginationItem_Prev`}
          type="button"
          className={buttonClasses.nav}
          disabled={currentPage <= 1}
          onClick={() => handlePagerChange(currentPage - 1)}
        >
          «
        </button>

        {/* PAGER BUTTONS */}
        {showPages &&
          totalPages != null &&
          currentPages.map((pageNumber, index) => {
            return (
              <div key={`PaginationItem_${index}`} className="join join-item">
                {pageNumber === currentPage && (
                  <button
                    type="button"
                    className={buttonClasses.pageActive}
                    disabled
                  >
                    {pageNumber}
                  </button>
                )}

                {pageNumber !== currentPage && (
                  <button
                    type="button"
                    className={buttonClasses.pageInactive}
                    onClick={() => handlePagerChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                )}
              </div>
            );
          })}

        {/* INFO */}
        {showInfo && totalPages != null && (
          <div className="join-item flex flex-row items-center gap-2 text-xs">
            <span>Page</span>
            <input
              type="number"
              className="input input-sm border-gray focus:border-gray rounded-md font-bold focus:outline-none"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputChange}
              onKeyDown={handleInputChange}
              min={1}
              max={totalPages}
            />
            <span>of</span>
            <span className="font-bold">{totalPages}</span>
          </div>
        )}

        {/* NEXT BUTTON */}
        <button
          key={`PaginationItem_Next`}
          type="button"
          className={buttonClasses.nav}
          disabled={totalPages != null && currentPage >= totalPages}
          onClick={() => handlePagerChange(currentPage + 1)}
        >
          »
        </button>
      </div>
    </div>
  );
};
