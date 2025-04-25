import { useCallback, useMemo, useState } from "react";

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
}) => {
  const [inputValue, setInputValue] = useState(currentPage);

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
            className="select select-sm border-grayx rounded-mdx w-20 focus:outline-none"
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
          className="join-item btn btn-secondary"
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
              <div key={`PaginationItem_${index}`} className="join-item join">
                {pageNumber === currentPage && (
                  <button
                    type="button"
                    className="join-item btn-secondary btn btn-active"
                    disabled
                  >
                    {pageNumber}
                  </button>
                )}

                {pageNumber !== currentPage && (
                  <button
                    type="button"
                    className="join-item btn-secondary btn"
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
          //className="btn btn-square btn-sm bg-gray hover:bg-gray !rounded-md border-0 text-black disabled:invisible"
          className="join-item btn-secondary btn"
          disabled={totalPages != null && currentPage >= totalPages}
          onClick={() => handlePagerChange(currentPage + 1)}
        >
          »
        </button>
      </div>
    </div>
  );
};
