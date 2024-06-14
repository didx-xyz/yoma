import type { EmblaOptionsType } from "embla-carousel";
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
  options?: EmblaOptionsType;
}> = ({ id, title, description, viewAllUrl, loadData, data }) => {
  const [slides, setSlides] = useState(data.items);
  const screenWidth = useAtomValue(screenWidthAtom);
  const [visibleSlides, setVisibleSlides] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasMoreToLoad, setHasMoreToLoad] = useState(true);
  //const [totalSlides, setTotalSlides] = useState(slides.length);
  const totalSlides = useMemo(() => slides.length, [slides]);

  const totalAll = data.totalCount ?? 0;

  useEffect(() => {
    if (screenWidth < 600) {
      // Mobile
      setVisibleSlides(1);
    } else if (screenWidth >= 600 && screenWidth < 1024) {
      // Tablet
      setVisibleSlides(2);
    } else {
      // Large desktop
      setVisibleSlides(4);
    }
  }, [screenWidth, setVisibleSlides]);

  const lastSlideRef = useRef(-1);
  const hasMoreToLoadRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const onSlide = useCallback(
    (props: OnSlideProps) => {
      // prevent multiple calls if current slide remains unchanged during scroll
      if (lastSlideRef.current === props.currentSlide) return;

      // update the lastSlideRef with the new current slide
      lastSlideRef.current = props.currentSlide;
      setCurrentSlide(props.currentSlide);
      console.warn(
        `currentSlide: ${props.currentSlide} totalSlides: ${totalSlides}`,
      );

      // check if more slides need to be loaded
      if (
        props.currentSlide + 1 + visibleSlides > totalSlides &&
        hasMoreToLoadRef.current &&
        !loadingMoreRef.current
      ) {
        loadingMoreRef.current = true;
        console.warn("Loading more...");

        loadData(totalSlides + 1).then((data) => {
          console.warn("Loaded more", data.items.length);

          if (data.items.length === 0) {
            hasMoreToLoadRef.current = false;
          }

          setSlides((prevSlides) => [...prevSlides, ...data.items]);

          loadingMoreRef.current = false;
        });
      }
    },
    [visibleSlides, totalSlides],
  );

  // const onSlide = useCallback(
  //   (props: OnSlideProps) => {
  //     // prevent multiple calls if current slide remains unchanged during scroll
  //     if (lastSlideRef.current === props.currentSlide) return;

  //     // update the lastSlideRef with the new current slide
  //     lastSlideRef.current = props.currentSlide;
  //     setCurrentSlide(props.currentSlide);
  //     console.warn("currentSlide", props.currentSlide);

  //     if (
  //       props.currentSlide + 1 + visibleSlides >= totalSlides &&
  //       hasMoreToLoadRef.current &&
  //       loadingMoreRef.current == false
  //     ) {
  //       loadingMoreRef.current = true;

  //       console.warn("Loading more...");

  //       loadData(totalSlides).then((data) => {
  //         console.warn("Loaded more", data.items.length);

  //         if (data.items.length == 0) {
  //           //setHasMoreToLoad(false);
  //           hasMoreToLoadRef.current = false;
  //           //emblaApi.off("scroll", scrollListenerRef.current);
  //         }

  //         setSlides((prevSlides) => [...prevSlides, ...data.items]);

  //         loadingMoreRef.current = false;
  //       });
  //     }
  //   },
  //   [visibleSlides, totalSlides, loadData, setCurrentSlide, setSlides],
  // );

  // const scrollListenerRef = useRef<() => void>(() => undefined);
  // const listenForScrollRef = useRef(true);
  // const hasMoreToLoadRef = useRef(true);
  // const [slides, setSlides] = useState(propData.items);
  // const [hasMoreToLoad, setHasMoreToLoad] = useState(true);
  // const [loadingMore, setLoadingMore] = useState(false);
  // const screenWidth = useAtomValue(screenWidthAtom);
  // const [options, setOptions] = useState<EmblaOptionsType>({
  //   dragFree: true,
  //   containScroll: "trimSnaps",
  //   watchSlides: true,
  //   watchResize: true,
  //   align: "start",
  // });

  // useEffect(() => {
  //   if (screenWidth < 768) {
  //     setOptions((prevOptions) => ({
  //       ...prevOptions,
  //       align: "center",
  //     }));
  //   } else {
  //     setOptions((prevOptions) => ({
  //       ...prevOptions,
  //       align: "start",
  //     }));
  //   }
  // }, [screenWidth]);

  // const [emblaRef, emblaApi] = useEmblaCarousel({
  //   ...options,
  //   watchSlides: (emblaApi) => {
  //     const reloadEmbla = (): void => {
  //       const oldEngine = emblaApi.internalEngine();

  //       emblaApi.reInit();
  //       const newEngine = emblaApi.internalEngine();
  //       const copyEngineModules: (keyof EngineType)[] = [
  //         "location",
  //         "target",
  //         "scrollBody",
  //       ];
  //       copyEngineModules.forEach((engineModule) => {
  //         Object.assign(newEngine[engineModule], oldEngine[engineModule]);
  //       });

  //       newEngine.translate.to(oldEngine.location.get());
  //       const { index } = newEngine.scrollTarget.byDistance(0, false);
  //       newEngine.index.set(index);
  //       newEngine.animation.start();

  //       setLoadingMore(false);
  //       listenForScrollRef.current = true;
  //     };

  //     const reloadAfterPointerUp = (): void => {
  //       emblaApi.off("pointerUp", reloadAfterPointerUp);
  //       reloadEmbla();
  //     };

  //     const engine = emblaApi.internalEngine();

  //     if (hasMoreToLoadRef.current && engine.dragHandler.pointerDown()) {
  //       const boundsActive = engine.limit.reachedMax(engine.target.get());
  //       engine.scrollBounds.toggleActive(boundsActive);
  //       emblaApi.on("pointerUp", reloadAfterPointerUp);
  //     } else {
  //       reloadEmbla();
  //     }
  //   },
  // });
  // const { selectedSnap, snapCount } = useSelectedSnapDisplay(emblaApi);

  // const {
  //   prevBtnDisabled,
  //   nextBtnDisabled,
  //   onPrevButtonClick,
  //   onNextButtonClick,
  // } = usePrevNextButtons(emblaApi);

  // const onScroll = useCallback(
  //   (emblaApi: EmblaCarouselType) => {
  //     if (!listenForScrollRef.current) return;

  //     setLoadingMore((loadingMore) => {
  //       const lastSlide = emblaApi.slideNodes().length - 1;
  //       const lastSlideInView = emblaApi.slidesInView().includes(lastSlide);
  //       let loadMore = !loadingMore && lastSlideInView;

  //       if (emblaApi.slideNodes().length < PAGE_SIZE_MINIMUM) {
  //         loadMore = false;
  //       }

  //       if (loadMore) {
  //         listenForScrollRef.current = false;

  //         loadData(emblaApi.slideNodes().length).then((data) => {
  //           if (data.items.length == 0) {
  //             setHasMoreToLoad(false);
  //             emblaApi.off("scroll", scrollListenerRef.current);
  //           }

  //           setSlides((prevSlides) => [...prevSlides, ...data.items]);
  //         });
  //       }

  //       return loadingMore || lastSlideInView;
  //     });
  //   },
  //   [loadData],
  // );

  // const addScrollListener = useCallback(
  //   (emblaApi: EmblaCarouselType) => {
  //     scrollListenerRef.current = () => onScroll(emblaApi);
  //     emblaApi.on("scroll", scrollListenerRef.current);
  //   },
  //   [onScroll],
  // );

  // useEffect(() => {
  //   if (!emblaApi) return;
  //   addScrollListener(emblaApi);

  //   const onResize = () => emblaApi.reInit();
  //   window.addEventListener("resize", onResize);
  //   emblaApi.on("destroy", () =>
  //     window.removeEventListener("resize", onResize),
  //   );
  // }, [emblaApi, addScrollListener]);

  // useEffect(() => {
  //   hasMoreToLoadRef.current = hasMoreToLoad;
  // }, [hasMoreToLoad]);

  return (
    <Carousel
      id={`${id}-carousel`}
      totalSlides={totalAll}
      visibleSlides={visibleSlides}
      onSlide={onSlide}
      currentSlide={currentSlide}
      step={visibleSlides}
    >
      <div className="mb-12 md:mb-20">
        <div className="mb-2 flex flex-col gap-6">
          <div className="flex max-w-full flex-row px-4 md:max-w-7xl md:px-0">
            <div className="flex flex-grow flex-col">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold text-black md:max-w-[800px]">
                {title}
              </div>
              <div className="text-gray-dark">{description}</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="hidden w-full gap-4 md:flex">
                  currentSlide: {currentSlide}
                  visibleSlides: {visibleSlides}
                  totalSlides: {totalSlides}
                  <SelectedSnapDisplay
                    selectedSnap={currentSlide + visibleSlides - 1}
                    snapCount={totalAll}
                  />
                  <NavigationButtons
                    currentSlide={currentSlide}
                    totalSlides={totalAll}
                    visibleSlides={visibleSlides}
                  />
                </div>
              </div>

              {viewAllUrl && (
                <Link
                  href={viewAllUrl}
                  className="flex w-14 select-none whitespace-nowrap border-b-2 border-transparent text-center text-sm tracking-wide text-gray-dark duration-300 xl:hover:border-purple xl:hover:text-purple"
                >
                  View All
                </Link>
              )}
            </div>
          </div>
          {/* {slidePercentage <= 0 && (
        <div className="flex items-center justify-center">
          <LoadingSkeleton />
        </div>
      )} */}
        </div>

        <Slider>
          {slides.map((item, index) => {
            return (
              <Slide key={`categories_${index}`}>
                <div className="flex justify-center">
                  <OpportunityPublicSmallComponent
                    key={`${id}_${item.id}_component`}
                    data={item}
                  />
                </div>
              </Slide>
            );
          })}
        </Slider>

        <div className="my-2 mt-2 flex w-full place-content-start md:mb-10 md:mt-1">
          <div className="mx-auto flex w-full justify-center gap-4 md:mx-0 md:mr-auto md:justify-start md:gap-6">
            {screenWidth < 768 && (
              <>
                <SelectedSnapDisplay
                  selectedSnap={currentSlide + visibleSlides - 1}
                  snapCount={totalAll}
                />
                <NavigationButtons
                  currentSlide={currentSlide}
                  totalSlides={totalAll}
                  visibleSlides={visibleSlides}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Carousel>
  );
};

export default OpportunitiesCarousel;
