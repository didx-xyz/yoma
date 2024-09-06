import React, { useCallback } from "react";
import { IoIosClose } from "react-icons/io";
import CustomSlider from "./Carousel/CustomSlider";

const FilterBadges: React.FC<{
  searchFilter: any;
  excludeKeys: string[];
  resolveValue: (key: string, item: any) => any;
  onSubmit: (filter: any) => void;
}> = ({ searchFilter, excludeKeys, resolveValue, onSubmit }) => {
  const filteredKeys = Object.entries(searchFilter).filter(
    ([key, value]) => !excludeKeys.includes(key) && value,
  );

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
  // const removeValue = useCallback(
  //   (key: string) => {
  //     if (!searchFilter || !onSubmit) return;
  //     if (searchFilter) {
  //       const updatedFilter = { ...searchFilter };
  //       updatedFilter[key] = null;
  //       onSubmit(updatedFilter);
  //     }
  //   },
  //   [searchFilter, onSubmit],
  // );

  return (
    <div className="relative flex justify-start">
      <CustomSlider>
        {filteredKeys.map(([key, value]) => {
          const renderBadge = (item: string) => {
            const lookup = resolveValue(key, item);
            return (
              <div
                key={`searchFilter_filter_badge_${key}_${item}`}
                className="flex h-6 max-w-[200px] select-none items-center justify-between rounded-md border-none bg-green-light p-2 text-green"
              >
                <p className="truncate text-center text-xs font-semibold">
                  {lookup ?? ""}
                </p>
                <button
                  className="btn h-fit w-fit border-none p-0 shadow-none"
                  onClick={() => removeFromArray(key, item)}
                >
                  <IoIosClose className="h-6 w-6" />
                </button>
              </div>
            );
          };

          if (Array.isArray(value) && value.length > 0) {
            return value.map((item: string) => renderBadge(item));
          } else if (resolveValue(key, value as string) ?? (value as string)) {
            return renderBadge(value as string);
          }
          return null;
        })}

        {/* clear all button */}
        {filteredKeys.length > 0 && (
          <div className="flex h-6 max-w-[200px] select-none items-center justify-between rounded-md border-none bg-gray p-2 text-gray-dark">
            <p className="truncate text-center text-xs font-semibold">
              Clear All
            </p>
            <button
              className="btn h-fit w-fit border-none p-0 shadow-none"
              onClick={() => onSubmit({})}
            >
              <IoIosClose className="h-6 w-6" />
            </button>
          </div>
        )}
      </CustomSlider>
    </div>
  );
};

export default FilterBadges;
