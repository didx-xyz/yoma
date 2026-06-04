import { useAtomValue } from "jotai";
import Link from "next/link";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IoBriefcase } from "react-icons/io5";
import {
  Carousel,
  Slide,
  Slider,
  type OnSlideProps,
} from "react-scroll-snap-anime-slider";
import { NavigationButtons } from "~/components/Carousel/NavigationButtons";
import { SelectedSnapDisplay } from "~/components/Carousel/SelectedSnapDisplay";
import { screenWidthAtom } from "~/lib/store";

// V2 of CustomCarousel — used exclusively for Job opportunities.
// Wraps the slider in a purple-bordered, gradient "Jobs in your area" panel.
const CustomCarouselV2: React.FC<{
  [id: string]: any;
  title?: string;
  // gray sub-text describing the country scope (e.g. "South Africa & Worldwide")
  subtitle?: string;
  viewAllUrl?: string;
  loadData?: (startRow: number) => Promise<any>;
  data: any[];
  renderSlide: (item: any, index: number) => React.ReactElement;
  totalAll?: number;
}> = ({
  id,
  title,
  subtitle,
  viewAllUrl,
  loadData,
  data,
  renderSlide,
  totalAll,
}) => {
  const [slides, setSlides] = useState(data);
  const screenWidth = useAtomValue(screenWidthAtom);
  const [visibleSlides, setVisibleSlides] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = useMemo(() => slides.length, [slides]);
  // use the provided totalAll or default to initial data length
  const effectiveTotalAll = totalAll ?? data.length;

  const slideMargin = useMemo(() => {
    if (screenWidth >= 1440) return "12px";
    if (screenWidth >= 1024) return "8px";
    return "0px";
  }, [screenWidth]);

  const lastSlideRef = useRef(-1);
  const hasMoreToLoadRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const selectedSnap = useMemo(() => {
    return slides.length <= visibleSlides
      ? slides.length - 1
      : currentSlide + visibleSlides - 1; //TODO: remove -1 when SelectedSnapDisplay has been fixed
  }, [slides.length, visibleSlides, currentSlide]);

  useEffect(() => {
    if (screenWidth < 600) {
      // Mobile
      setVisibleSlides(1);
    } else if (screenWidth >= 600 && screenWidth < 1024) {
      // Tablet
      setVisibleSlides(2);
    } else if (screenWidth >= 1024 && screenWidth < 1440) {
      // Small desktop
      setVisibleSlides(3);
    } else {
      // Large desktop
      setVisibleSlides(4);
    }
  }, [screenWidth]);

  useEffect(() => {
    setSlides(data);
    setCurrentSlide(0);
    lastSlideRef.current = -1;
    hasMoreToLoadRef.current = true;
    loadingMoreRef.current = false;
  }, [data]);

  const onSlide = useCallback(
    (props: OnSlideProps) => {
      if (lastSlideRef.current === props.currentSlide) return;
      lastSlideRef.current = props.currentSlide;
      setCurrentSlide(props.currentSlide);

      // only attempt loading more slides if loadData is provided
      if (
        loadData &&
        props.currentSlide + 1 + visibleSlides > totalSlides &&
        hasMoreToLoadRef.current &&
        !loadingMoreRef.current
      ) {
        loadingMoreRef.current = true;
        loadData(totalSlides + 1).then((data) => {
          if (data.items.length === 0) {
            hasMoreToLoadRef.current = false;
          }
          setSlides((prevSlides) => [...prevSlides, ...data.items]);
          loadingMoreRef.current = false;
        });
      }
    },
    [visibleSlides, totalSlides, loadData],
  );

  const renderButtons = useCallback(() => {
    const prevDisabled = currentSlide === 0;
    const nextDisabled =
      selectedSnap + 1 >= effectiveTotalAll && !loadingMoreRef.current;

    if (prevDisabled && nextDisabled) {
      return null;
    }

    return (
      <NavigationButtons
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
      />
    );
  }, [currentSlide, selectedSnap, effectiveTotalAll]);

  return (
    <div className="border-purple from-purple-tint to-purple-tint/40 rounded-2xl border-2 bg-gradient-to-br p-4 md:p-6">
      <Carousel
        id={`${id}-carousel`}
        totalSlides={effectiveTotalAll}
        visibleSlides={visibleSlides}
        slideMargin={slideMargin}
        onSlide={onSlide}
        currentSlide={currentSlide}
        step={visibleSlides}
      >
        <div className="mb-2 flex flex-col gap-4">
          {/* HEADER */}
          <div className="flex max-w-full flex-row flex-wrap items-center gap-x-3 gap-y-2 md:max-w-7xl">
            {/* BADGE */}
            <span className="bg-purple flex h-6 items-center gap-3 rounded-md px-3 text-xs font-bold tracking-wide text-white uppercase">
              <IoBriefcase className="size-3" /> <span>Jobs · New</span>
            </span>

            <div className="flex min-w-0 flex-col overflow-hidden md:flex-row md:items-baseline md:gap-x-2">
              {/* ROW 1 on mobile / inline on desktop: TITLE + COUNTRY SCOPE */}
              <div className="flex min-w-0 flex-row items-baseline gap-x-2 overflow-hidden md:flex-1">
                <span className="font-family-nunito shrink-0 text-base font-semibold whitespace-nowrap text-black md:text-lg">
                  {title}
                </span>

                {/* COUNTRY SCOPE (gray) */}
                {subtitle && (
                  <span className="text-gray-dark min-w-0 flex-1 truncate text-sm md:text-base">
                    · {subtitle}
                  </span>
                )}
              </div>

              {/* ROW 2 on mobile / inline on desktop: HIGHLIGHT (purple) */}
              <span className="text-purple shrink-0 text-sm font-semibold whitespace-nowrap md:text-base">
                · {effectiveTotalAll} {effectiveTotalAll === 1 ? "job" : "jobs"}{" "}
                · Apply now!
              </span>
            </div>

            {/* DESKTOP NAV + VIEW ALL (override) */}
            <div className="ml-auto flex items-center gap-4">
              <div className="hidden items-center gap-4 md:flex">
                <SelectedSnapDisplay
                  selectedSnap={selectedSnap}
                  snapCount={effectiveTotalAll}
                />
                {renderButtons()}
              </div>

              {viewAllUrl && (
                <Link
                  href={viewAllUrl}
                  className="text-purple hover:border-purple flex border-b-2 border-transparent text-center text-sm font-semibold tracking-wide whitespace-nowrap duration-300 select-none"
                >
                  View All
                </Link>
              )}
            </div>
          </div>

          <Slider>
            {slides.map((item, index) => {
              return (
                <Slide
                  key={`slide_${id}_${index}`}
                  className="flex justify-center md:justify-start"
                  id={`${id}_${item.id}`}
                >
                  {renderSlide(item, index)}
                </Slide>
              );
            })}
          </Slider>

          {/* MOBILE NAV */}
          <div className="flex w-full flex-col items-center justify-center gap-2 text-center md:hidden">
            {renderButtons()}
            <SelectedSnapDisplay
              selectedSnap={selectedSnap}
              snapCount={effectiveTotalAll}
            />
          </div>
        </div>
      </Carousel>
    </div>
  );
};

export default CustomCarouselV2;
