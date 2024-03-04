import React, { useCallback } from "react";
import { IoIosClose } from "react-icons/io";

const FilterBadges: React.FC<{
  searchFilter: any;
  excludeKeys: string[];
  resolveValue: (key: string, item: string) => any;
  onSubmit: (filter: any) => void;
}> = ({ searchFilter, excludeKeys, resolveValue: resolveLookup, onSubmit }) => {
  // function to handle removing an item from an array in the filter object
  const removeFromArray = useCallback(
    (key: string, item: string) => {
      if (!searchFilter || !onSubmit) return;
      if (searchFilter) {
        const updatedFilter: any = {
          ...searchFilter,
        };
        updatedFilter[key] = updatedFilter[key]?.filter(
          (val: any) => val !== item,
        );
        onSubmit(updatedFilter);
      }
    },
    [searchFilter, onSubmit],
  );

  // function to handle removing a value from the filter object
  const removeValue = useCallback(
    (key: string) => {
      if (!searchFilter || !onSubmit) return;
      if (searchFilter) {
        debugger;
        const updatedFilter = { ...searchFilter };
        updatedFilter[key] = null;
        onSubmit(updatedFilter);
      }
    },
    [searchFilter, onSubmit],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {searchFilter &&
        Object.entries(searchFilter).map(([key, value]) =>
          !excludeKeys.includes(key) &&
          value != null &&
          (Array.isArray(value) ? value.length > 0 : true) ? (
            <>
              {Array.isArray(value) ? (
                value.map((item: string) => {
                  const lookup = resolveLookup(key, item);
                  return (
                    <span
                      key={`searchFilter_filter_badge_${item}`}
                      className="badge h-6 max-w-[200px] rounded-md border-none bg-green-light p-2 text-green"
                    >
                      <p className="truncate text-center text-xs font-semibold">
                        {lookup ?? ""}
                      </p>
                      <button
                        className="btn h-fit w-fit border-none p-0 shadow-none"
                        onClick={() => removeFromArray(key, item)}
                      >
                        <IoIosClose className="-mr-2 h-6 w-6" />
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="badge h-6 max-w-[200px] rounded-md border-none bg-green-light p-2 text-green">
                  <p className="truncate text-center text-xs font-semibold">
                    {resolveLookup(key, value as string) ?? (value as string)}
                  </p>
                  <button
                    className="btn h-fit w-fit border-none p-0 shadow-none"
                    onClick={() => removeValue(key)}
                  >
                    <IoIosClose className="-mr-2 h-6 w-6" />
                  </button>
                </span>
              )}
            </>
          ) : null,
        )}
    </div>
  );
};

export default FilterBadges;
