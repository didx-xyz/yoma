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
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import { screenWidthAtom } from "~/lib/store";
import { SelectedSnapDisplay } from "../Carousel/SelectedSnapDisplay";
import { OpportunityPublicSmallComponent } from "./OpportunityPublicSmall";
import { NavigationButtons } from "../Carousel/NavigationButtons";

const OpportunitiesCarousel: React.FC<{
  [id: string]: any;
  title?: string;
  description?: string;
  viewAllUrl?: string;
  loadData: (startRow: number) => Promise<OpportunitySearchResultsInfo>;
  data: OpportunitySearchResultsInfo;
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
  }, [screenWidth, setVisibleSlides]);

  const onSlide = useCallback(
    (props: OnSlideProps) => {
      // prevent multiple calls if current slide remains unchanged during scroll
      if (lastSlideRef.current === props.currentSlide) return;

      // update the lastSlideRef with the new current slide
      lastSlideRef.current = props.currentSlide;
      setCurrentSlide(props.currentSlide);
      // console.warn(
      //   `currentSlide: ${props.currentSlide} totalSlides: ${totalSlides}`,
      // );

      // check if more slides need to be loaded
      if (
        props.currentSlide + 1 + visibleSlides > totalSlides &&
        hasMoreToLoadRef.current &&
        !loadingMoreRef.current
      ) {
        loadingMoreRef.current = true;
        //console.warn("Loading more...");

        loadData(totalSlides + 1).then((data) => {
          //console.warn("Loaded more", data.items.length);

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
        nextDisabled={selectedSnap + 1 >= totalAll && !loadingMoreRef.current} //TODO: remove +1 when SelectedSnapDisplay has been fixed
      />
    );
  }, [currentSlide, selectedSnap, totalAll]);

  return (
    <Carousel
      id={`${id}-carousel`}
      totalSlides={totalAll}
      visibleSlides={visibleSlides}
      onSlide={onSlide}
      currentSlide={currentSlide}
      step={visibleSlides}
      //slideMargin="4px"
      // trayPadding="32px"
    >
      <div className="mb-12 md:mb-20">
        <div className="mb-2 flex flex-col gap-6">
          <div className="flex max-w-full flex-row px-0 md:max-w-7xl md:px-2">
            <div className="flex flex-grow flex-col">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold text-black md:max-w-[800px]">
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
          {slides.map((item, index) => {
            return (
              <Slide
                key={`categories_${index}`}
                className="mt-2 flex justify-center"
                id={`${id}_${item.id}`}
              >
                <OpportunityPublicSmallComponent
                  key={`${id}_${item.id}_component`}
                  data={item}
                />
              </Slide>
            );
          })}
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
