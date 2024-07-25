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
import { MyOpportunitySearchResults } from "~/api/models/myOpportunity";
import { screenWidthAtom } from "~/lib/store";
import { NavigationButtons } from "../Carousel/NavigationButtons";
import { SelectedSnapDisplay } from "../Carousel/SelectedSnapDisplay";
import { LoadingSkeleton } from "../Status/LoadingSkeleton";
import { OpportunityListItem } from "./OpportunityListItem";
import { OpportunityCard } from "./OpportunityCard";

const OpportunitiesCarousel: React.FC<{
  [id: string]: any;
  title?: string;
  description?: string;
  viewAllUrl?: string;
  loadData: (startRow: number) => Promise<MyOpportunitySearchResults>;
  data: MyOpportunitySearchResults;
}> = ({ id, title, description, viewAllUrl, loadData, data }) => {
  const [slides, setSlides] = useState(data.items);
  const screenWidth = useAtomValue(screenWidthAtom);
  const [visibleSlides, setVisibleSlides] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = useMemo(() => slides.length, [slides]);
  const totalAll = data.totalCount ?? 0;
  const lastSlideRef = useRef(-1);
  const hasMoreToLoadRef = useRef(true);
  const loadingMoreRef = useRef(false);

  // Determine the number of visible slides based on screen width
  useEffect(() => {
    const calculateVisibleSlides = () => {
      if (screenWidth < 600) return 1; // Mobile
      if (screenWidth >= 600 && screenWidth < 1024) return 2; // Tablet
      return 1; // Large desktop
    };
    setVisibleSlides(calculateVisibleSlides());
  }, [screenWidth]);

  // Handle slide change
  const onSlide = useCallback(
    (props: OnSlideProps) => {
      if (lastSlideRef.current === props.currentSlide) return;
      lastSlideRef.current = props.currentSlide;
      setCurrentSlide(props.currentSlide);

      const shouldLoadMoreSlides =
        props.currentSlide + 1 + visibleSlides > totalSlides &&
        hasMoreToLoadRef.current &&
        !loadingMoreRef.current;
      if (shouldLoadMoreSlides) {
        loadingMoreRef.current = true;
        loadData(totalSlides + 1).then((data) => {
          if (data.items.length === 0) hasMoreToLoadRef.current = false;
          setSlides((prevSlides) => [...prevSlides, ...data.items]);
          loadingMoreRef.current = false;
        });
      }
    },
    [visibleSlides, totalSlides, loadData],
  );

  // Calculate the selected snap
  const selectedSnap = useMemo(() => {
    // Directly calculate the index of the last visible slide
    const lastIndex = currentSlide + visibleSlides - 1;
    return Math.min(lastIndex, slides.length - 1); // Ensure it doesn't exceed the total slides
  }, [slides.length, visibleSlides, currentSlide]);

  // Determine if the next button should be disabled
  const nextDisabled = useMemo(() => {
    // Check if the current set of visible slides includes the last slide
    const isLastSlideVisible = selectedSnap >= totalAll - 1;
    return isLastSlideVisible || !hasMoreToLoadRef.current; // Disable if the last slide is visible or no more items to load
  }, [selectedSnap, totalAll, hasMoreToLoadRef.current]);

  // Render navigation buttons
  const renderButtons = useCallback(
    () => (
      <NavigationButtons
        prevDisabled={currentSlide === 0}
        nextDisabled={nextDisabled}
      />
    ),
    [currentSlide, nextDisabled],
  );

  return (
    <Carousel
      id={`${id}-carousel`}
      totalSlides={totalAll}
      visibleSlides={visibleSlides}
      onSlide={onSlide}
      currentSlide={currentSlide}
      step={visibleSlides}
      freeScroll={true}
    >
      <div className="mb-12 md:mb-20">
        <div className="mb-2 flex flex-col gap-6">
          <div className="md:max-w-7xlx flex max-w-full flex-row px-0 md:px-2">
            <div className="flex flex-grow flex-col">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold text-black md:max-w-[800pxx]">
                {title}
              </div>
              <div className="text-gray-dark">{description}</div>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex items-center">
                <div className="hidden w-full gap-4 md:flex">
                  <SelectedSnapDisplay
                    selectedSnap={selectedSnap}
                    snapCount={totalAll}
                  />
                  {renderButtons()}
                </div>
              </div>

              {viewAllUrl && (
                <Link
                  href={viewAllUrl}
                  className="flex w-14 select-none whitespace-nowrap border-b-2 border-transparent text-center text-sm tracking-wide text-gray-dark duration-300 md:mb-[3.5px] xl:hover:border-purple xl:hover:text-purple"
                >
                  View All
                </Link>
              )}
            </div>
          </div>
        </div>

        <Slider>
          {slides.map((item, index) => (
            <Slide
              key={`${id}-slide-${index}`}
              className="mt-2 flex justify-center"
              id={`${id}_${item.id}`}
            >
              <OpportunityCard
                key={`${id}_${item.id}_component`}
                data={item}
                displayDate={item.dateModified}
              />
            </Slide>
          ))}

          {!nextDisabled &&
            hasMoreToLoadRef.current &&
            [...Array(visibleSlides)].map((_, index) => (
              <Slide
                key={`${id}-loading-skeleton-${index}`}
                className="mt-2 flex items-center justify-center"
              >
                <LoadingSkeleton />
              </Slide>
            ))}
        </Slider>

        <div className="my-2 mt-2 flex w-full place-content-start md:mb-10 md:mt-1">
          <div className="mx-auto flex w-full justify-center gap-4 md:mx-0 md:mr-auto md:justify-start md:gap-6">
            {screenWidth < 768 && (
              <SelectedSnapDisplay
                selectedSnap={selectedSnap}
                snapCount={totalAll}
              />
            )}
          </div>
        </div>
      </div>
    </Carousel>
  );
};

export default OpportunitiesCarousel;
