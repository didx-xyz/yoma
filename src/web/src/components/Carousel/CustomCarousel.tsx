import { useAtomValue } from "jotai";
import Link from "next/link";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Carousel,
  Slide,
  Slider,
  type OnSlideProps,
} from "react-scroll-snap-anime-slider";
import { NavigationButtons } from "~/components/Carousel/NavigationButtons";
import { SelectedSnapDisplay } from "~/components/Carousel/SelectedSnapDisplay";
import { screenWidthAtom } from "~/lib/store";

const CustomCarousel: React.FC<{
  [id: string]: any;
  title?: string;
  description?: string;
  viewAllUrl?: string;
  loadData?: (startRow: number) => Promise<any>;
  data: any[];
  renderSlide: (item: any, index: number) => React.ReactElement;
  totalAll?: number;
}> = ({
  id,
  title,
  description,
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
    return (
      <NavigationButtons
        prevDisabled={currentSlide === 0}
        nextDisabled={
          selectedSnap + 1 >= effectiveTotalAll && !loadingMoreRef.current
        }
      />
    );
  }, [currentSlide, selectedSnap, effectiveTotalAll]);

  return (
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
        <div className="px-2x flex max-w-full flex-row md:max-w-7xl">
          <div className="flex min-w-0 grow flex-col">
            <div className="font-family-nunito max-w-full overflow-hidden text-base font-semibold text-ellipsis whitespace-nowrap text-black md:text-lg">
              {title}
            </div>
            <div className="text-gray-dark text-sm md:text-base">
              {description}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {/* DESKTOP */}
              <div className="hidden w-full gap-4 md:flex">
                <SelectedSnapDisplay
                  selectedSnap={selectedSnap}
                  snapCount={effectiveTotalAll}
                />
                {renderButtons()}
              </div>
            </div>

            {viewAllUrl && (
              <Link
                href={viewAllUrl}
                className="text-gray-dark xl:hover:border-purple xl:hover:text-purple flex w-14 border-b-2 border-transparent text-center text-sm tracking-wide whitespace-nowrap duration-300 select-none md:mb-[3.5px]"
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

        {/* MOBILE */}
        <div className="my-2 flex w-full flex-col items-center justify-center gap-2 text-center md:hidden">
          {renderButtons()}
          <SelectedSnapDisplay
            selectedSnap={selectedSnap}
            snapCount={effectiveTotalAll}
          />
        </div>
      </div>
    </Carousel>
  );
};

export default CustomCarousel;
