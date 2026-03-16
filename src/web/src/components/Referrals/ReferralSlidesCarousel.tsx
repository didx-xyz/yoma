import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  ButtonBack,
  ButtonNext,
  Carousel,
  Slide,
  Slider,
  type OnSlideProps,
} from "react-scroll-snap-anime-slider";
import { screenWidthAtom } from "~/lib/store";

interface ReferralSlidesCarouselProps<T> {
  carouselId: string;
  items: T[];
  renderSlide: (item: T) => ReactNode;
  getSlideKey: (item: T) => string;
  emptyState?: ReactNode;
  totalSlides?: number;
  onSlide?: (props: OnSlideProps) => void;
  controlsClassName?: string;
}

export const ReferralSlidesCarousel = <T,>({
  carouselId,
  items,
  renderSlide,
  getSlideKey,
  emptyState,
  totalSlides,
  onSlide,
  controlsClassName,
}: ReferralSlidesCarouselProps<T>) => {
  const screenWidth = useAtomValue(screenWidthAtom);
  const [visibleSlides, setVisibleSlides] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (screenWidth < 600) {
      setVisibleSlides(1);
    } else if (screenWidth >= 600 && screenWidth < 768) {
      setVisibleSlides(2);
    } else if (screenWidth >= 768 && screenWidth < 1024) {
      setVisibleSlides(3);
    } else {
      setVisibleSlides(4);
    }
  }, [screenWidth]);

  const slideKeys = useMemo(() => {
    return items.map((item, index) => `${getSlideKey(item)}_${index}`);
  }, [items, getSlideKey]);

  const dataSignature = useMemo(() => slideKeys.join("|"), [slideKeys]);

  useEffect(() => {
    if (totalSlides === undefined) {
      setCurrentSlide(0);
    }
  }, [dataSignature, totalSlides]);

  const slideMargin = useMemo(() => {
    if (screenWidth < 600) return "4px";
    if (screenWidth >= 600 && screenWidth < 768) return "6px";
    if (screenWidth >= 768 && screenWidth < 1024) return "8px";
    return "10px";
  }, [screenWidth]);

  const totalSlidesCount = totalSlides ?? items.length;
  const availableSlidesCount = items.length;

  const selectedSnap = useMemo(() => {
    return availableSlidesCount <= visibleSlides
      ? Math.max(availableSlidesCount - 1, 0)
      : Math.min(
          currentSlide + visibleSlides - 1,
          Math.max(availableSlidesCount - 1, 0),
        );
  }, [availableSlidesCount, visibleSlides, currentSlide]);

  useEffect(() => {
    const maxStartIndex = Math.max(0, availableSlidesCount - visibleSlides);
    if (currentSlide > maxStartIndex) {
      setCurrentSlide(maxStartIndex);
    }
  }, [availableSlidesCount, visibleSlides, currentSlide]);

  if (items.length === 0) {
    return <>{emptyState || null}</>;
  }

  const prevDisabled = currentSlide === 0;
  const nextDisabled = selectedSnap + 1 >= totalSlidesCount;
  const hideControls = prevDisabled && nextDisabled;

  return (
    <Carousel
      key={
        totalSlides === undefined
          ? `${carouselId}_${dataSignature}`
          : carouselId
      }
      id={carouselId}
      totalSlides={totalSlidesCount}
      visibleSlides={visibleSlides}
      slideMargin={slideMargin}
      currentSlide={currentSlide}
      step={Math.max(
        1,
        Math.min(visibleSlides, availableSlidesCount - visibleSlides || 1),
      )}
      onSlide={(props) => {
        setCurrentSlide(props.currentSlide);
        onSlide?.(props);
      }}
    >
      <Slider>
        {items.map((item, index) => {
          const slideKey = slideKeys[index] || `slide_${index}`;

          return (
            <Slide
              key={slideKey}
              className="flex justify-center select-none md:justify-start"
              id={`${carouselId}_${slideKey}`}
            >
              <div className="w-full px-1 pb-1 md:px-1.5">
                {renderSlide(item)}
              </div>
            </Slide>
          );
        })}
      </Slider>

      <div
        className={`md:text-gray-dark mt-4 flex w-full items-center justify-center gap-3 text-xs font-semibold whitespace-nowrap select-none md:text-sm md:font-normal ${hideControls ? "hidden" : ""} ${controlsClassName ?? ""}`}
      >
        <ButtonBack
          disabled={prevDisabled}
          aria-label="Previous"
          className="btn btn-circle btn-outline border-orange btn-sm text-orange hover:bg-orange disabled:!border-orange disabled:!text-orange h-8 min-h-0 w-8 p-0 hover:text-white disabled:!bg-transparent disabled:!opacity-70"
        >
          <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
        </ButtonBack>

        <span>
          {selectedSnap + 1} / {totalSlidesCount}
        </span>

        <ButtonNext
          disabled={nextDisabled}
          aria-label="Next"
          className="btn btn-circle btn-outline border-orange btn-sm text-orange hover:bg-orange disabled:!border-orange disabled:!text-orange h-8 min-h-0 w-8 p-0 hover:text-white disabled:!bg-transparent disabled:!opacity-70"
        >
          <FiChevronRight className="h-5 w-5" aria-hidden="true" />
        </ButtonNext>
      </div>
    </Carousel>
  );
};
