import React, { useCallback, useEffect, useRef, useState } from "react";
import { IoIosClose } from "react-icons/io";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import sliderStyles from "./Carousel/CustomSlider.module.css";

type FilterBadgesVariant = "slider" | "wrap";

const FilterBadges: React.FC<{
  searchFilter: any;
  excludeKeys: string[];
  resolveValue: (key: string, item: any) => any;
  onSubmit: (filter: any) => void;
  variant?: FilterBadgesVariant;
  className?: string;
  sliderClassName?: string;
}> = ({
  searchFilter,
  excludeKeys,
  resolveValue,
  onSubmit,
  variant = "slider",
  className = "",
  sliderClassName = "",
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showPrevButton, setShowPrevButton] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);

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

  const content = (
    <>
      {filteredKeys.map(([key, value]) => {
        const renderBadge = (item: string) => {
          const lookup = resolveValue(key, item);
          return (
            <button
              type="button"
              key={`searchFilter_filter_badge_${key}_${item}`}
              className="bg-green-light text-green flex max-w-[150px] cursor-pointer items-center rounded-md border-none px-2 py-1 select-none sm:max-w-[200px]"
              onClick={() => removeFilter(key, item)}
            >
              <p className="mr-2 truncate text-center text-xs leading-none font-semibold">
                {lookup ?? ""}
              </p>

              <IoIosClose className="h-5 w-5 shrink-0" />
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
          className="bg-gray text-gray-dark flex max-w-full cursor-pointer items-center justify-between rounded-md border-none px-2 py-1 select-none sm:max-w-[200px]"
          onClick={() => onSubmit({})}
        >
          <p className="mr-2 truncate text-center text-xs leading-none font-semibold">
            Clear All
          </p>

          <IoIosClose className="h-5 w-5" />
        </button>
      )}
    </>
  );

  if (variant === "wrap") {
    return (
      <div className={`flex w-full flex-wrap items-center gap-2 ${className}`}>
        {content}
      </div>
    );
  }

  const handleScroll = useCallback(() => {
    const tolerance = 2;
    const el = sliderRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowPrevButton(scrollLeft > tolerance);
    setShowNextButton(
      scrollWidth > clientWidth &&
        scrollLeft < scrollWidth - clientWidth - tolerance,
    );
  }, []);

  useEffect(() => {
    handleScroll();
  }, [handleScroll, filteredKeys.length]);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    const observer = new MutationObserver(() => handleScroll());
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      observer.disconnect();
    };
  }, [handleScroll]);

  const scrollByAmount = useCallback((delta: number) => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  return (
    <div
      className={`relative flex min-h-[40px] w-full min-w-0 items-center overflow-x-hidden ${className}`}
    >
      {showPrevButton && (
        <>
          <div className="absolute top-0 left-0 z-10 h-full w-10 backdrop-blur-[0.6px] md:w-12" />
          <div className="absolute top-1/2 left-0 z-20 flex h-fit w-10 -translate-y-1/2 items-center justify-center md:w-12">
            <button
              type="button"
              onClick={() => scrollByAmount(-200)}
              className="group btn btn-circle btn-sm border-orange bg-orange hover:border-orange hover:bg-orange h-8 w-8 cursor-pointer border-[1.5px] px-2 text-black hover:brightness-90 disabled:!cursor-not-allowed md:h-10 md:w-10"
            >
              <MdKeyboardArrowLeft className="text-lg md:text-3xl" />
            </button>
          </div>
        </>
      )}

      <div
        ref={sliderRef}
        className={`flex min-w-0 flex-1 items-center justify-start gap-4 overflow-x-auto overflow-y-hidden px-2 whitespace-nowrap ${sliderStyles.noscrollbar} ${sliderClassName}`}
      >
        {content}
      </div>

      {showNextButton && (
        <>
          <div className="absolute top-0 right-0 z-10 h-full w-10 backdrop-blur-[0.6px] md:w-12" />
          <div className="absolute top-1/2 right-0 z-20 flex h-fit w-10 -translate-y-1/2 items-center justify-center md:w-12">
            <button
              type="button"
              onClick={() => scrollByAmount(200)}
              className="group btn btn-circle btn-sm border-orange bg-orange hover:border-orange hover:bg-orange h-8 w-8 cursor-pointer border-[1.5px] px-2 text-black delay-300 hover:brightness-90 disabled:!cursor-not-allowed md:h-10 md:w-10"
            >
              <MdKeyboardArrowRight className="text-lg md:text-3xl" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterBadges;
