import { useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Carousel,
  type OnSlideProps,
  Slide,
  Slider,
  SliderBarDotGroup,
  renderDotsDynamicPill,
} from "react-scroll-snap-anime-slider";
import type { OpportunityCategory } from "~/api/models/opportunity";
import { screenWidthAtom } from "~/lib/store";
import { OpportunityCategoryHorizontalCard } from "./OpportunityCategoryHorizontalCard";

const OpportunityCategoriesHorizontalFilter: React.FC<{
  lookups_categories: OpportunityCategory[];
  selected_categories: string[] | null | undefined;
  onClick?: (item: OpportunityCategory) => void;
}> = ({ lookups_categories, selected_categories, onClick }) => {
  const screenWidth = useAtomValue(screenWidthAtom);
  const [visibleSlides, setVisibleSlides] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = lookups_categories.length;

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

  const lastSlideRef = useRef<number>(-1);

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
    <Carousel
      id="categories-carousel"
      totalSlides={totalSlides}
      visibleSlides={visibleSlides}
      onSlide={onSlide}
      currentSlide={currentSlide}
    >
      <Slider>
        {lookups_categories.map((item, index) => {
          return (
            <Slide key={`categories_${index}`}>
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

      <SliderBarDotGroup
        id="categories-carousel-slider-dot-group"
        aria-label="slider bar"
        dotGroupProps={{
          id: "categories-carousel-slider-bar-dot-group",
        }}
        renderDots={renderDotsDynamicPill}
      />

      {/* <NavigationButtons
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        visibleSlides={visibleSlides}
      /> */}
    </Carousel>
  );
};

export default OpportunityCategoriesHorizontalFilter;
