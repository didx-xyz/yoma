import { useMemo } from "react";

interface InputProps {
  [key: string]: any;
  currentPage: number;
  totalItems: number;
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

  // const startRow = useMemo(() => {
  //   if (!currentPage) return 1;

  //   const numPage = parseInt(currentPage.toString());
  //   return (numPage - 1) * pageSize + 1;
  // }, [currentPage, pageSize]);

  const handlePagerChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    onClick(value);
  };

  return (
    <>
      {totalPages > 1 && (
        <div className="flex w-full items-center justify-center gap-2">
          {/* PREVIOUS BUTTON */}
          {!(currentPage > 1 && totalPages >= currentPage) && (
            <button
              key={`PaginationItem_Prev`}
              type="button"
              className="btn btn-square btn-primary btn-sm border-0 bg-white text-black hover:bg-gray"
              style={{ borderWidth: "0px" }}
              disabled
            >
              «
            </button>
          )}
          {currentPage > 1 && totalPages >= currentPage && (
            <button
              key={`PaginationItem_Prev`}
              type="button"
              className="btn btn-square btn-primary btn-sm border-0 bg-white text-black hover:bg-gray"
              onClick={(e) => handlePagerChange(e, currentPage - 1)}
            >
              «
            </button>
          )}

          {/* page buttons */}
          {showPages &&
            currentPages.map((pageNumber, index) => {
              return (
                <div key={`PaginationItem_${index}`}>
                  {pageNumber === currentPage && (
                    <button
                      type="button"
                      className="btn btn-square btn-primary btn-sm border-0 bg-white text-black hover:bg-gray disabled:bg-gray-light"
                      disabled
                    >
                      {pageNumber}
                    </button>
                  )}

                  {pageNumber !== currentPage && (
                    <button
                      type="button"
                      className="btn btn-square btn-primary btn-sm cursor-pointer border-0 bg-white text-black hover:bg-gray"
                      onClick={(e) => handlePagerChange(e, pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  )}
                </div>
              );
            })}

          {/* info */}
          {showInfo && (
            <div className="text-sm font-bold">
              {currentPage} of {totalPages}
            </div>
          )}

          {/* NEXT BUTTON */}
          {totalPages <= currentPage && (
            <button
              key={`PaginationItem_Next`}
              type="button"
              className="btn btn-square btn-primary btn-sm border-0 bg-white text-black hover:bg-gray disabled:bg-gray-light"
              disabled
            >
              »
            </button>
          )}
          {totalPages > currentPage && (
            <button
              key={`PaginationItem_Next`}
              type="button"
              className="btn btn-square btn-primary btn-sm cursor-pointer border-0 bg-white text-black hover:bg-gray"
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
