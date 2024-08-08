import { useCallback, useMemo, useState } from "react";
import { debounce } from "~/lib/utils";
import FormInput from "./Common/FormInput";

interface InputProps {
  [key: string]: any;
  currentPage: number;
  totalItems: number | null;
  pageSize: number;
  showPages?: boolean;
  showInfo?: boolean;
  onClick: (page: number) => void;
}
export const PaginationButtons: React.FC<InputProps> = ({
  currentPage,
  totalItems,
  pageSize,
  showPages,
  showInfo,
  onClick,
}) => {
  const [inputValue, setInputValue] = useState(currentPage);

  // 🧮 calculated fields
  const totalPages = useMemo(() => {
    const totalItemCount = totalItems ?? 0;
    if (totalItemCount == 0) return 0;
    const totalPages = totalItemCount / pageSize;
    if (totalPages < 1) return 1;
    else return Math.ceil(totalPages);
  }, [totalItems, pageSize]);

  const currentPages = useMemo(() => {
    // return an array of pages to render the pager buttons
    const result = Array.apply(null, new Array(totalPages)).map(
      function (value, index) {
        return index + 1;
      },
    );

    return result;
  }, [totalPages]);

  const handlePagerChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    onClick(value);
  };

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
        if (!isNaN(value) && value >= 1 && value <= totalPages) {
          handlePagerChange(event, value);
        } else {
          setInputValue(currentPage);
        }
      }
    },
    [totalPages, handlePagerChange],
  );

  return (
    <>
      {totalPages > 1 && (
        <div className="mb-4 flex w-full items-center justify-center gap-2">
          {/* PREVIOUS BUTTON */}
          {!(currentPage > 1 && totalPages >= currentPage) && (
            <button
              key={`PaginationItem_Prev`}
              type="button"
              className="btn btn-square btn-primary btn-sm !rounded-md border-0 bg-white text-black hover:bg-gray"
              disabled
            >
              «
            </button>
          )}
          {currentPage > 1 && totalPages >= currentPage && (
            <button
              key={`PaginationItem_Prev`}
              type="button"
              className="btn btn-square btn-primary btn-sm !rounded-md border-0 bg-white text-black hover:bg-gray"
              onClick={(e) => handlePagerChange(e, currentPage - 1)}
            >
              «
            </button>
          )}

          {/* PAGER BUTTONS */}
          {showPages &&
            currentPages.map((pageNumber, index) => {
              return (
                <div key={`PaginationItem_${index}`}>
                  {pageNumber === currentPage && (
                    <button
                      type="button"
                      className="btn btn-square btn-primary btn-sm !rounded-md border-0 bg-white text-black hover:bg-gray disabled:bg-gray-light"
                      disabled
                    >
                      {pageNumber}
                    </button>
                  )}

                  {pageNumber !== currentPage && (
                    <button
                      type="button"
                      className="btn btn-square btn-primary btn-sm cursor-pointer !rounded-md border-0 bg-white text-black hover:bg-gray"
                      onClick={(e) => handlePagerChange(e, pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  )}
                </div>
              );
            })}

          {/* INFO */}
          {showInfo && (
            <div className="text-sm font-bold">
              <input
                type="number"
                className="input input-bordered input-sm rounded-md border-gray focus:border-gray focus:outline-none"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputChange}
                onKeyDown={handleInputChange}
                min={1}
                max={totalPages}
              />{" "}
              of {totalPages}
            </div>
          )}

          {/* NEXT BUTTON */}
          {totalPages <= currentPage && (
            <button
              key={`PaginationItem_Next`}
              type="button"
              className="btn btn-square btn-primary btn-sm !rounded-md border-0 bg-white text-black hover:bg-gray disabled:bg-gray-light"
              disabled
            >
              »
            </button>
          )}
          {totalPages > currentPage && (
            <button
              key={`PaginationItem_Next`}
              type="button"
              className="btn btn-square btn-primary btn-sm cursor-pointer !rounded-md border-0 bg-white text-black hover:bg-gray"
              onClick={(e) => handlePagerChange(e, currentPage + 1)}
            >
              »
            </button>
          )}
        </div>
      )}
    </>
  );
};
