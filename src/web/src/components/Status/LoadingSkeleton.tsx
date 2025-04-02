import React from "react";

export const LoadingSkeleton: React.FC<{
  className?: string;
  columns?: number;
  rows?: number;
}> = ({ className = "w-full h-full", columns = 1, rows = 1 }) => {
  const rowsArray = Array.from({ length: rows });
  const columnsArray = Array.from({ length: columns });

  return (
    <div className={`flex flex-col gap-8 ${className}`}>
      {rowsArray.map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex flex-row gap-8">
          {columnsArray.map((_, colIndex) => (
            <div key={`col-${colIndex}`} className="flex w-full flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="skeleton bg-gray h-16 w-20 shrink-0 rounded-full"></div>
                <div className="flex flex-col gap-4">
                  <div className="skeleton bg-gray h-4 w-24"></div>
                  <div className="skeleton bg-gray h-4 w-32"></div>
                </div>
              </div>
              <div className="skeleton bg-gray h-32 w-full"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
