import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { OpportunityCategory } from "~/api/models/opportunity";
import { OpportunityCategoryHorizontalCard } from "./OpportunityCategoryHorizontalCard";
import {
  ButtonBack,
  ButtonNext,
  Carousel,
  Slide,
  Slider,
  SliderBarLine,
  SliderBarDotGroup,
  renderDotsDynamicPill,
  OnSlideProps,
} from "react-scroll-snap-anime-slider";
import { setOptions } from "filepond";
import { useAtomValue } from "jotai";
import { screenWidthAtom } from "~/lib/store";
import { IoMdArrowDropright } from "react-icons/io";

const NavigationButtons: React.FC<{
  currentSlide: number;
  totalSlides: number;
  visibleSlides: number;
}> = ({ currentSlide, totalSlides, visibleSlides }) => {
  const isPrevDisabled = currentSlide <= 0;
  const isNextDisabled = currentSlide + visibleSlides >= totalSlides;

  return (
    <div className="flex justify-center gap-2">
      <ButtonBack
        className="group btn btn-circle btn-sm h-10 w-10 transform-gpu cursor-pointer border-[1.5px] border-purple bg-transparent text-black transition-all duration-500 ease-bounce md:h-8 md:w-8 xl:hover:scale-110 xl:hover:border-purple xl:hover:bg-purple"
        disabled={isPrevDisabled}
      >
        <svg
          className="mr-[2px] h-[45%] w-[45%] transform text-purple transition-all duration-500 ease-bounce group-disabled:text-gray xl:group-hover:scale-110 xl:group-hover:text-white"
          viewBox="0 0 532 532"
        >
          <path
            fill="currentColor"
            d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
          />
        </svg>
      </ButtonBack>
      <ButtonNext
        className="group btn btn-circle btn-sm h-10 w-10 transform-gpu cursor-pointer border-[1.5px] border-purple bg-transparent text-black transition-all duration-500 ease-bounce md:h-8 md:w-8 xl:hover:scale-110 xl:hover:border-purple xl:hover:bg-purple"
        disabled={isNextDisabled}
      >
        <svg
          className="ml-[2px] h-[45%] w-[45%] transform text-purple transition-all duration-500 ease-bounce group-disabled:text-gray xl:group-hover:scale-110 xl:group-hover:text-white"
          viewBox="0 0 532 532"
        >
          <path
            fill="currentColor"
            d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
          />
        </svg>
      </ButtonNext>
    </div>
  );
};

const OpportunityCategoriesHorizontalFilter: React.FC<{
  lookups_categories: OpportunityCategory[];
  selected_categories: string[] | null | undefined;
  onClick?: (item: OpportunityCategory) => void;
}> = ({ lookups_categories, selected_categories, onClick }) => {
  const screenWidth = useAtomValue(screenWidthAtom);
  //let visible = 8;
  const [visibleSlides, setVisibleSlides] = useState(1);
  //let currentSlide = 1;
  const [currentSlide, setCurrentSlide] = useState(1);
  let totalSlides = lookups_categories.length;

  useEffect(() => {
    if (screenWidth < 480) {
      // Very small screens
      setVisibleSlides(1);
    } else if (screenWidth >= 480 && screenWidth < 600) {
      // Mobile
      setVisibleSlides(2);
    } else if (screenWidth >= 600 && screenWidth < 768) {
      // Between mobile and tablet
      setVisibleSlides(3);
    } else if (screenWidth >= 768 && screenWidth < 1024) {
      // Tablet
      setVisibleSlides(4);
    } else if (screenWidth >= 1024 && screenWidth < 1440) {
      // Small desktop
      setVisibleSlides(6);
    } else {
      // Large desktop
      setVisibleSlides(8);
    }
  }, [screenWidth, setVisibleSlides]);

  const lastSlideRef = useRef<number>(-1); // Initialize with -1 or any value that won't be a valid slide index

  const onSlide = useCallback(
    (props: OnSlideProps) => {
      // prevent multiple calls if current slide remains unchanged during scroll
      if (lastSlideRef.current === props.currentSlide) return;

      setCurrentSlide(props.currentSlide);
      console.log("currentSlide", props.currentSlide);

      if (props.currentSlide + visibleSlides >= totalSlides) {
        console.warn("Loading more...");
      }

      // update the lastSlideRef with the new current slide
      lastSlideRef.current = props.currentSlide;
    },
    [setCurrentSlide, visibleSlides, totalSlides],
  );

  return (
    // <div className="flex justify-center gap-4 md:w-full">
    //   {lookups_categories.map((item) => (
    //     <OpportunityCategoryHorizontalCard
    //       key={`categories_${item.id}`}
    //       data={item}
    //       selected={selected_categories?.includes(item.name)}
    //       onClick={onClick}
    //     />
    //   ))}
    // </div>
    <>
      currentSlide: {currentSlide}
      visibleSlides: {visibleSlides}
      totalSlides: {totalSlides}
      <Carousel
        totalSlides={totalSlides}
        visibleSlides={visibleSlides}
        onSlide={onSlide}
        currentSlide={currentSlide}
      >
        <Slider>
          {lookups_categories.map((item, i) => {
            return (
              <Slide key={`categories_${item.id}`}>
                <div className="flex justify-center">
                  <OpportunityCategoryHorizontalCard
                    key={`categories_${item.id}`}
                    data={item}
                    selected={selected_categories?.includes(item.name)}
                    onClick={onClick}
                  />
                </div>
              </Slide>
            );
          })}
        </Slider>

        {/* <SliderBarLine /> */}

        <SliderBarDotGroup
          id="my-slider-dot-group"
          aria-label="slider bar"
          dotGroupProps={{
            id: "my-slider-bar-dot-group",
          }}
          renderDots={renderDotsDynamicPill}
        />

        <NavigationButtons
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          visibleSlides={visibleSlides}
        />
      </Carousel>
    </>
  );
};

export default OpportunityCategoriesHorizontalFilter;
