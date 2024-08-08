import { useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Carousel,
  ButtonBack,
  ButtonNext,
  type OnSlideProps,
  Slide,
  Slider,
} from "react-scroll-snap-anime-slider";
import type { OpportunityCategory } from "~/api/models/opportunity";
import { screenWidthAtom } from "~/lib/store";
import { OpportunityCategoryHorizontalCard } from "./OpportunityCategoryHorizontalCard";
import {
  XS2_BREAKPOINT,
  XS_BREAKPOINT,
  SM_BREAKPOINT,
  MD_BREAKPOINT,
  LG_BREAKPOINT,
} from "~/lib/constants";

const OpportunityCategoriesHorizontalFilter: React.FC<{
  lookups_categories: OpportunityCategory[];
  selected_categories: string[] | null | undefined;
  onClick?: (item: OpportunityCategory) => void;
}> = ({ lookups_categories, selected_categories, onClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const screenWidth = useAtomValue(screenWidthAtom);
  const [visibleSlides, setVisibleSlides] = useState(2);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides] = useState(lookups_categories?.length ?? 0);

  useEffect(() => {
    if (screenWidth < XS2_BREAKPOINT) {
      // Very small screens
      setVisibleSlides(2);
    } else if (screenWidth >= XS2_BREAKPOINT && screenWidth < XS_BREAKPOINT) {
      // Mobile
      setVisibleSlides(3);
    } else if (screenWidth >= XS_BREAKPOINT && screenWidth < SM_BREAKPOINT) {
      // Between mobile and tablet
      setVisibleSlides(4);
    } else if (screenWidth >= SM_BREAKPOINT && screenWidth < MD_BREAKPOINT) {
      // Tablet
      setVisibleSlides(5);
    } else if (screenWidth >= MD_BREAKPOINT && screenWidth < LG_BREAKPOINT) {
      // Small desktop
      setVisibleSlides(6);
    } else {
      // Large desktop
      setVisibleSlides(8);
    }
    setIsLoading(false);
  }, [screenWidth, setVisibleSlides, setIsLoading]);

  const lastSlideRef = useRef<number>(-1);

  const onSlide = useCallback(
    (props: OnSlideProps) => {
      // prevent multiple calls if current slide remains unchanged during scroll
      if (lastSlideRef.current === props.currentSlide) return;

      setCurrentSlide(props.currentSlide);

      // update the lastSlideRef with the new current slide
      lastSlideRef.current = props.currentSlide;
    },
    [setCurrentSlide],
  );

  return (
    <Carousel
      id="categories-carousel"
      totalSlides={totalSlides}
      visibleSlides={visibleSlides}
      onSlide={onSlide}
      currentSlide={currentSlide}
      className="relative"
    >
      {isLoading ? (
        <div className="flex h-[135px] items-center justify-center">
          {/* prevents the carousels from showing all items before the screen width has been determined */}
        </div>
      ) : (
        <Slider
          className="flex items-center justify-center"
          trayProps={{
            // center align the slides when there's less than the visible slides available
            className: `${
              totalSlides < visibleSlides ? "flex justify-center" : ""
            }`,
          }}
        >
          {lookups_categories.map((item, index) => {
            return (
              <Slide
                key={`categories_${index}`}
                className="flex justify-center"
              >
                <OpportunityCategoryHorizontalCard
                  key={`categories_${item.id}`}
                  data={item}
                  selected={selected_categories?.includes(item.name)}
                  onClick={onClick}
                />
              </Slide>
            );
          })}
        </Slider>
      )}
      {/* NB: the pointer-events-none & pointer-events-auto classes are needed to ensure that both the buttons and the carousel items are clickable */}
      <div className="pointer-events-none absolute -inset-x-1 inset-y-0 flex items-center justify-between">
        <ButtonBack className="group btn btn-circle btn-sm pointer-events-auto h-8 w-8 transform-gpu cursor-pointer border-[1.5px] border-purple bg-white text-black transition-all duration-500 ease-bounce hover:border-purple hover:bg-white disabled:invisible md:h-8 md:w-8 xl:hover:scale-110 xl:hover:bg-purple">
          <svg
            className="mr-[2px] h-[45%] w-[45%] transform text-purple group-disabled:text-gray"
            viewBox="0 0 532 532"
          >
            <path
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="45"
              d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
            />
          </svg>
        </ButtonBack>

        <ButtonNext className="group btn btn-circle btn-sm pointer-events-auto h-8 w-8 transform-gpu cursor-pointer border-[1.5px] border-purple bg-white text-black transition-all duration-500 ease-bounce hover:border-purple hover:bg-white disabled:invisible md:h-8 md:w-8 xl:hover:scale-110 xl:hover:bg-purple">
          <svg
            className="ml-[2px] h-[45%] w-[45%] transform text-purple transition-all duration-500 ease-bounce group-disabled:text-gray xl:group-hover:scale-110 xl:group-hover:text-white"
            viewBox="0 0 532 532"
          >
            <path
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="45"
              d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
            />
          </svg>
        </ButtonNext>
      </div>
    </Carousel>
  );
};

export default OpportunityCategoriesHorizontalFilter;
