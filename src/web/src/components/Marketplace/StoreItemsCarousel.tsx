import React, { useCallback, useEffect, useRef, useState } from "react";
import type { EngineType } from "embla-carousel/components/Engine";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import type { StoreItemCategorySearchResults } from "~/api/models/marketplace";
import { ItemCardComponent } from "./ItemCard";
import Link from "next/link";
import { PAGE_SIZE_MINIMUM } from "~/lib/constants";
import {
  usePrevNextButtons,
  PrevButton,
  NextButton,
} from "../Carousel/ArrowButtons";
import {
  SelectedSnapDisplay,
  useSelectedSnapDisplay,
} from "../Carousel/SelectedSnapDisplay";

const OPTIONS: EmblaOptionsType = {
  dragFree: false,
  containScroll: "keepSnaps",
  watchSlides: true,
  watchResize: true,
};

const StoreItemsCarousel: React.FC<{
  [id: string]: any;
  title?: string;
  viewAllUrl?: string;
  loadData: (startRow: number) => Promise<StoreItemCategorySearchResults>;
  onClick: (item: any) => void;
  data: StoreItemCategorySearchResults;
  options?: EmblaOptionsType;
}> = (props) => {
  const { id, title, viewAllUrl, loadData, onClick, data: propData } = props;
  const scrollListenerRef = useRef<() => void>(() => undefined);
  const listenForScrollRef = useRef(true);
  const hasMoreToLoadRef = useRef(true);
  const [slides, setSlides] = useState(propData.items);
  const [hasMoreToLoad, setHasMoreToLoad] = useState(
    propData.items.length >= PAGE_SIZE_MINIMUM,
  );
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

        if (emblaApi.slideNodes().length < PAGE_SIZE_MINIMUM) {
          loadMore = false;
          setHasMoreToLoad(false);
        }

        if (loadMore) {
          listenForScrollRef.current = false;

          loadData(emblaApi.slideNodes().length).then((data) => {
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
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-row">
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
      </div>

      <div className="embla h-60">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container max-3">
            {slides?.map((item, index) => (
              <div className="embla__slide" key={index}>
                <div className="embla__slide__number">
                  <ItemCardComponent
                    key={`storeCategoryItem_${id}_${index}`}
                    id={`storeCategoryItem_${id}_${index}`}
                    company={item.name}
                    name={item.name}
                    imageURL={item.imageURL}
                    //summary={item.summary}
                    amount={item.amount}
                    count={item.count}
                    onClick={() => onClick(item)}
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
                snapCount={snapCount}
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
    </>
  );
};

export default StoreItemsCarousel;
