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
import CustomSlider from "./CustomSlider";

const OpportunityCategoriesHorizontalFilter: React.FC<{
  lookups_categories: OpportunityCategory[];
  selected_categories: string[] | null | undefined;
  onClick?: (item: OpportunityCategory) => void;
}> = ({ lookups_categories, selected_categories, onClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  // const screenWidth = useAtomValue(screenWidthAtom);
  // const [visibleSlides, setVisibleSlides] = useState(2);
  // const [currentSlide, setCurrentSlide] = useState(0);
  // const [totalSlides] = useState(lookups_categories?.length ?? 0);

  // useEffect(() => {
  //   if (screenWidth < XS2_BREAKPOINT) {
  //     // Very small screens
  //     setVisibleSlides(3);
  //   } else if (screenWidth >= XS2_BREAKPOINT && screenWidth < XS_BREAKPOINT) {
  //     // Mobile
  //     setVisibleSlides(4);
  //   } else if (screenWidth >= XS_BREAKPOINT && screenWidth < SM_BREAKPOINT) {
  //     // Between mobile and tablet
  //     setVisibleSlides(5);
  //   } else if (screenWidth >= SM_BREAKPOINT && screenWidth < MD_BREAKPOINT) {
  //     // Tablet
  //     setVisibleSlides(6);
  //   } else if (screenWidth >= MD_BREAKPOINT && screenWidth < LG_BREAKPOINT) {
  //     // Small desktop
  //     setVisibleSlides(7);
  //   } else {
  //     // Large desktop
  //     setVisibleSlides(8);
  //   }
  //   setIsLoading(false);
  // }, [screenWidth, setVisibleSlides, setIsLoading]);

  //const lastSlideRef = useRef<number>(-1);

  // const onSlide = useCallback(
  //   (props: OnSlideProps) => {
  //     // prevent multiple calls if current slide remains unchanged during scroll
  //     if (lastSlideRef.current === props.currentSlide) return;

  //     setCurrentSlide(props.currentSlide);

  //     // update the lastSlideRef with the new current slide
  //     lastSlideRef.current = props.currentSlide;
  //   },
  //   [setCurrentSlide],
  // );

  return (
    <CustomSlider
      lookups_categories={lookups_categories}
      selected_categories={selected_categories}
      onClick={onClick}
    />
  );
};

export default OpportunityCategoriesHorizontalFilter;
