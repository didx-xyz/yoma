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

  const removeFilter = useCallback(
    (key: string, item?: string) => {
      if (!searchFilter || !onSubmit) return;

      const updatedFilter: any = { ...searchFilter };

      if (Array.isArray(searchFilter[key])) {
        // Handle array values (remove a specific item from the array)
        updatedFilter[key] = updatedFilter[key]?.filter(
          (val: any) => val !== item,
        );
      } else {
        // Handle single values (set the value to null)
        updatedFilter[key] = null;
      }

      onSubmit(updatedFilter);
    },
    [searchFilter, onSubmit],
  );

  return (
    <div className="relative flex justify-start">
      <CustomSlider>
        {filteredKeys.map(([key, value]) => {
          const renderBadge = (item: string) => {
            const lookup = resolveValue(key, item);
            return (
              <button
                type="button"
                key={`searchFilter_filter_badge_${key}_${item}`}
                className="justify-betweenx flex h-6 max-w-[200px] select-none items-center rounded-md border-none bg-green-light p-2 text-green"
                onClick={() => removeFilter(key, item)}
              >
                <p className="mr-2 truncate text-center text-xs font-semibold">
                  {lookup ?? ""}
                </p>

                <IoIosClose className="h-6 w-6 shrink-0" />
              </button>
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
          <button
            type="button"
            className="flex h-6 max-w-[200px] select-none items-center justify-between rounded-md border-none bg-gray p-2 text-gray-dark"
            onClick={() => onSubmit({})}
          >
            <p className="mr-2 truncate text-center text-xs font-semibold">
              Clear All
            </p>

            <IoIosClose className="h-6 w-6" />
          </button>
        )}
      </CustomSlider>
    </div>
  );
};

export default FilterBadges;
