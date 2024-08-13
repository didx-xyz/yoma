import { useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ButtonBack,
  ButtonNext,
  Carousel,
  type OnSlideProps,
  Slide,
  Slider,
} from "react-scroll-snap-anime-slider";
import type { OpportunityCategory } from "~/api/models/opportunity";
import {
  LG_BREAKPOINT,
  MD_BREAKPOINT,
  SM_BREAKPOINT,
  XS2_BREAKPOINT,
  XS_BREAKPOINT,
} from "~/lib/constants";
import { screenWidthAtom } from "~/lib/store";
import { LoadingInline } from "../Status/LoadingInline";
import { OpportunityCategoryHorizontalCard } from "./OpportunityCategoryHorizontalCard";

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
          <LoadingInline classNameSpinner="border-green" />
        </div>
      ) : (
        <>
          <Slider
            className="flex items-center justify-center"
            trayProps={{
              // center align the slides when there's less than the visible slides available
              className: `${
                totalSlides < visibleSlides ? "flex justify-center " : ""
              } mx-6 lg:mx-0`,
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

          {/* NB: the pointer-events-none & pointer-events-auto classes are needed to ensure that both the buttons and the carousel items are clickable */}
          <div className="pointer-events-none absolute -inset-x-1 inset-y-0 -ml-1 mr-[1px] flex items-center justify-between lg:mx-12 ">
            <ButtonBack className="group pointer-events-auto -mt-4 h-8 w-8 transform-gpu animate-wiggle cursor-pointer text-4xl transition-all duration-300 ease-bounce active:ml-1 disabled:invisible md:h-8 md:w-8">
              👈
            </ButtonBack>

            <ButtonNext className="group pointer-events-auto -mt-4 h-8 w-8 transform-gpu animate-wiggle cursor-pointer text-4xl transition-all duration-300 ease-bounce active:mr-1 disabled:invisible md:h-8 md:w-8">
              👉
            </ButtonNext>
          </div>
        </>
      )}
    </Carousel>
  );
};

export default OpportunityCategoriesHorizontalFilter;
