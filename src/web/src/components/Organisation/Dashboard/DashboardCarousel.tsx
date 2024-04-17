import React, { useState, useRef, useEffect, useCallback } from "react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import type { EngineType } from "embla-carousel/components/Engine";
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from "../../Carousel/ArrowButtons";
import useEmblaCarousel from "embla-carousel-react";
import { OpportunityCard } from "./OpportunityCard";
import {
  SelectedSnapDisplay,
  useSelectedSnapDisplay,
} from "../../Carousel/SelectedSnapDisplay";
import type {
  OpportunityInfoAnalytics,
  YouthInfo,
} from "~/api/models/organizationDashboard";
import { YouthCompletedCard } from "./YouthCompletedCard";

interface PropType {
  slides: OpportunityInfoAnalytics[] | YouthInfo[];
  orgId: string;
  loadData: (startRow: number) => Promise<any>;
  totalSildes: number;
}

const OPTIONS: EmblaOptionsType = {
  dragFree: false,
  containScroll: "keepSnaps",
  watchSlides: true,
  watchResize: true,
};

const DashboardCarousel: React.FC<PropType> = (props: PropType) => {
  const { orgId, loadData, totalSildes } = props;
  const scrollListenerRef = useRef<() => void>(() => undefined);
  const listenForScrollRef = useRef(true);
  const hasMoreToLoadRef = useRef(true);
  const [slides, setSlides] = useState(props.slides);
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

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const { selectedSnap, snapCount } = useSelectedSnapDisplay(emblaApi);

  const onScroll = useCallback(
    (emblaApi: EmblaCarouselType) => {
      if (!listenForScrollRef.current) return;

      setLoadingMore((loadingMore) => {
        const lastSlide = emblaApi.slideNodes().length - 1;
        const lastSlideInView = emblaApi.slidesInView().includes(lastSlide);
        let loadMore = !loadingMore && lastSlideInView;

        if (emblaApi.slideNodes().length < 1) {
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
    <div>
      <div className="embla">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container max-1">
            {slides?.map((item: any, index) => (
              <div className="embla__slide" key={index}>
                <div className="embla__slide__number">
                  {/* Check if item has a unique property of YouthInfo */}
                  {"userDisplayName" in item ? (
                    <YouthCompletedCard
                      key={`${item.id}_component`}
                      opportunity={item}
                      orgId={orgId}
                    />
                  ) : (
                    <OpportunityCard
                      key={`${item.id}_component`}
                      opportunity={item}
                      orgId={orgId}
                    />
                  )}
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
          <div className="mt-2 flex w-full place-content-center justify-center">
            <div className="flex justify-center gap-4">
              <SelectedSnapDisplay
                selectedSnap={selectedSnap}
                snapCount={totalSildes ?? slides.length}
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

export default DashboardCarousel;
