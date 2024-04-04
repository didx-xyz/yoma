import React, { useCallback, useEffect, useRef, useState } from "react";
import type { EngineType } from "embla-carousel/components/Engine";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import Link from "next/link";
import { PAGE_SIZE_MINIMUM } from "~/lib/constants";
import { OpportunityPublicSmallComponent } from "./OpportunityPublicSmall";
import {
  SelectedSnapDisplay,
  useSelectedSnapDisplay,
} from "../Carousel/SelectedSnapDisplay";
import {
  usePrevNextButtons,
  PrevButton,
  NextButton,
} from "../Carousel/ArrowButtons";

const OPTIONS: EmblaOptionsType = {
  dragFree: false,
  containScroll: "keepSnaps",
  watchSlides: true,
  watchResize: true,
};

const OpportunitiesCarousel: React.FC<{
  [id: string]: any;
  title?: string;
  viewAllUrl?: string;
  loadData: (startRow: number) => Promise<OpportunitySearchResultsInfo>;
  data: OpportunitySearchResultsInfo;
  options?: EmblaOptionsType;
}> = (props) => {
  const { id, title, viewAllUrl, loadData, data: propData } = props;
  const scrollListenerRef = useRef<() => void>(() => undefined);
  const listenForScrollRef = useRef(true);
  const hasMoreToLoadRef = useRef(true);
  const [slides, setSlides] = useState(propData.items);
  const [hasMoreToLoad, setHasMoreToLoad] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    ...OPTIONS,
    watchSlides: (emblaApi) => {
      const reloadEmbla = (): void => {
        const oldEngine = emblaApi.internalEngine();

        emblaApi.reInit();
        const newEngine = emblaApi.internalEngine();
        const copyEngineModules: (keyof EngineType)[] = [
          "location",
          "target",
          "scrollBody",
        ];
        copyEngineModules.forEach((engineModule) => {
          Object.assign(newEngine[engineModule], oldEngine[engineModule]);
        });

        newEngine.translate.to(oldEngine.location.get());
        const { index } = newEngine.scrollTarget.byDistance(0, false);
        newEngine.index.set(index);
        newEngine.animation.start();

        setLoadingMore(false);
        listenForScrollRef.current = true;
      };

      const reloadAfterPointerUp = (): void => {
        emblaApi.off("pointerUp", reloadAfterPointerUp);
        reloadEmbla();
      };

      const engine = emblaApi.internalEngine();

      if (hasMoreToLoadRef.current && engine.dragHandler.pointerDown()) {
        const boundsActive = engine.limit.reachedMax(engine.target.get());
        engine.scrollBounds.toggleActive(boundsActive);
        emblaApi.on("pointerUp", reloadAfterPointerUp);
      } else {
        reloadEmbla();
      }
    },
  });
  const { selectedSnap, snapCount } = useSelectedSnapDisplay(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const onScroll = useCallback(
    (emblaApi: EmblaCarouselType) => {
      if (!listenForScrollRef.current) return;

      setLoadingMore((loadingMore) => {
        const lastSlide = emblaApi.slideNodes().length - 1;
        const lastSlideInView = emblaApi.slidesInView().includes(lastSlide);
        let loadMore = !loadingMore && lastSlideInView;

        // console.warn(
        //   `onScroll... lastSlide: ${lastSlide} lastSlideInView: ${lastSlideInView} loadMore: ${loadMore}`,
        // );
        if (emblaApi.slideNodes().length < PAGE_SIZE_MINIMUM) {
          loadMore = false;
        }

        if (loadMore) {
          listenForScrollRef.current = false;

          console.warn(
            `Loading more data... ${lastSlide} lastSlideInView: ${lastSlideInView} nextStartRow: ${
              emblaApi.slideNodes().length + 1
            }`,
          );

          loadData(emblaApi.slideNodes().length + 1).then((data) => {
            // debugger;
            if (data.items.length == 0) {
              setHasMoreToLoad(false);
              emblaApi.off("scroll", scrollListenerRef.current);
            }

            setSlides((prevSlides) => [...prevSlides, ...data.items]);
          });
        }

        return loadingMore || lastSlideInView;
      });
    },
    [loadData],
  );

  const addScrollListener = useCallback(
    (emblaApi: EmblaCarouselType) => {
      scrollListenerRef.current = () => onScroll(emblaApi);
      emblaApi.on("scroll", scrollListenerRef.current);
    },
    [onScroll],
  );

  useEffect(() => {
    if (!emblaApi) return;
    addScrollListener(emblaApi);

    const onResize = () => emblaApi.reInit();
    window.addEventListener("resize", onResize);
    emblaApi.on("destroy", () =>
      window.removeEventListener("resize", onResize),
    );
  }, [emblaApi, addScrollListener]);

  useEffect(() => {
    hasMoreToLoadRef.current = hasMoreToLoad;
  }, [hasMoreToLoad]);

  return (
    <div className="mb-12 md:mb-8">
      <div className="mb-2 flex flex-col gap-6">
        <div className="flex max-w-full flex-row px-4 md:max-w-7xl md:px-0">
          <div className="flex flex-grow">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold text-black md:max-w-[800px]">
              {title}
            </div>
          </div>
          {viewAllUrl && (
            <Link
              href={viewAllUrl}
              className="my-auto items-end text-sm text-gray-dark"
            >
              View all
            </Link>
          )}
        </div>
        {/* {slidePercentage <= 0 && (
        <div className="flex items-center justify-center">
          <LoadingSkeleton />
        </div>
      )} */}
      </div>

      <div className="embla">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container max-4">
            {slides?.map((item, index) => (
              <div className="embla__slide" key={index}>
                <div className="embla__slide__number">
                  <OpportunityPublicSmallComponent
                    key={`${id}_${item.id}_component`}
                    data={item}
                  />
                </div>
              </div>
            ))}
            {hasMoreToLoad && (
              <div
                className={"embla-infinite-scroll".concat(
                  loadingMore ? " embla-infinite-scroll--loading-more" : "",
                )}
              >
                <span className="embla-infinite-scroll__spinner" />
              </div>
            )}
          </div>
        </div>

        {snapCount > 1 && selectedSnap < snapCount && (
          <div className="my-2 mt-0 flex w-full place-content-start md:mb-10">
            <div className="mx-auto flex scale-100 justify-center gap-4 md:mx-0 md:mr-auto md:scale-[0.85] md:justify-start md:gap-2">
              <SelectedSnapDisplay
                selectedSnap={selectedSnap}
                snapCount={propData.totalCount ?? snapCount}
              />
              <PrevButton
                onClick={onPrevButtonClick}
                disabled={prevBtnDisabled}
              />
              <NextButton
                onClick={onNextButtonClick}
                disabled={nextBtnDisabled}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunitiesCarousel;
