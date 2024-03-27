import { OpportunityPublicSmallComponent } from "./OpportunityPublicSmall";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import Link from "next/link";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useCallback, useEffect, useRef, useState } from "react";
import { screenWidthAtom } from "~/lib/store";
import { useAtomValue } from "jotai";
import { VIEWPORT_SIZE } from "~/lib/constants";
import { LoadingSkeleton } from "../Status/LoadingSkeleton";

export const OpportunitiesCarousel: React.FC<{
  [id: string]: any;
  title?: string;
  data: OpportunitySearchResultsInfo;
  viewAllUrl?: string;
  loadData: (startRow: number) => Promise<OpportunitySearchResultsInfo>;
}> = ({ id, title, data, viewAllUrl, loadData }) => {
  const screenWidth = useAtomValue(screenWidthAtom);
  const [cache, setCache] = useState(data?.items);
  const isLoadingDataRef = useRef(false);
  const [selectedItem, setSelectedItem] = useState(0);
  const [cols, setCols] = useState(1);

  const getSlidePercentage = (screenWidth: number) => {
    if (screenWidth < VIEWPORT_SIZE.SM) {
      return 100; // 1 column
    } else if (screenWidth < VIEWPORT_SIZE.LG) {
      return 50; // 2 columns
    } else if (screenWidth < VIEWPORT_SIZE.XL) {
      return 33; // 3 columns
    } else if (screenWidth < VIEWPORT_SIZE["2XL"]) {
      return 25; // 4 columns
    } else {
      return 25;
    }
  };

  // calculate the slider percentage based on the viewport size
  // i.e 33% = cols 3, 25% = cols 4 etc
  const [slidePercentage, setSlidePercentage] = useState(
    getSlidePercentage(screenWidth),
  );

  useEffect(() => {
    // update the slide percentage based on the viewport size
    setSlidePercentage(getSlidePercentage(screenWidth));

    // calculate the number of columns based on the viewport size
    setCols(Math.round(100 / slidePercentage));

    // reset to first item when resizing (UX fix with changing of carousel column)
    setSelectedItem(0);
  }, [screenWidth, setSelectedItem, setCols]);

  const onChange = useCallback(
    async (index: number) => {
      // if data is currently being loaded, do nothing
      if (isLoadingDataRef.current) return;

      // calculate the start row based on the current index
      const startRow = index + 1;

      // console.warn(
      //   `index: ${index}, startRow: ${startRow}, nextStartRow: ${nextStartRow} cols: ${cols}`,
      // );

      // HACK: Update the selected item
      // this helps move the selected items along for larger displays
      // prevents large gaps around the selected item
      if (cols > 2 && index == 1) {
        //console.warn("SKIPPING... for larger displays: ", index + 1);
        setSelectedItem(index + 1);
        return;
      }

      // if there's enough data in the cache, skip fetching more data
      if (startRow + cols <= cache.length) {
        //console.warn("SKIPPING... enough data");
        // if the index is not close to the end, skip fetching more rows
        return;
      }

      // if we've reached this point, we need to fetch more data
      isLoadingDataRef.current = true;

      // fetch more data
      const nextStartRow = Math.round((startRow + 1) / cols) * cols + 1;
      const newData = await loadData?.(nextStartRow);

      // filter out any items that are already in the cacheRef.current.items
      const local = cache;
      const newItems = newData?.items.filter(
        (newItem) => !local.find((item) => item.id === newItem.id),
      );

      // set isLoadingData to false now that the data has been loaded
      isLoadingDataRef.current = false;

      // set the cacheRef.current.items to the new data
      setCache([...cache, ...newItems]);

      // HACK: this helps move the carousel along with the new data for larger displays
      if (newItems.length > 0 && cols > 2) {
        setSelectedItem(index);
      }
    },
    [
      loadData,
      isLoadingDataRef,
      cache,
      setCache,
      slidePercentage,
      setSelectedItem,
      cols,
    ],
  );

  return (
    <div key={`OpportunitiesCarousel${id}`}>
      {(data?.items?.length ?? 0) > 0 && (
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

          {slidePercentage <= 0 && (
            <div className="flex items-center justify-center">
              <LoadingSkeleton />
            </div>
          )}

          {slidePercentage > 0 && (
            <Carousel
              centerMode
              centerSlidePercentage={slidePercentage}
              swipeable={true}
              swipeScrollTolerance={5}
              showStatus={false}
              showIndicators={false}
              showThumbs={false}
              onChange={onChange}
              selectedItem={selectedItem}
              renderArrowPrev={(
                onClickHandler: () => void,
                hasPrev: boolean,
                label: string,
              ) =>
                hasPrev && (
                  <button
                    type="button"
                    onClick={() => {
                      onClickHandler();
                    }}
                    title={label}
                    className="-translate-y-1/2x btn absolute left-0 top-1/2 z-10 rounded-full border-0 bg-purple px-3 hover:border-0 hover:bg-purple hover:brightness-110"
                  >
                    <IoIosArrowBack className="h-6 w-6 text-white" />
                  </button>
                )
              }
              renderArrowNext={(
                onClickHandler: () => void,
                hasNext: boolean,
                label: string,
              ) =>
                hasNext && (
                  <button
                    type="button"
                    onClick={() => {
                      onClickHandler();
                    }}
                    title={label}
                    className="-translate-y-1/2x btn absolute right-0 top-1/2 z-10 rounded-full border-0 bg-purple px-3 hover:border-0 hover:bg-purple hover:brightness-110"
                  >
                    <IoIosArrowForward className="h-6 w-6 text-white" />
                  </button>
                )
              }
            >
              {cache.map((item: any) => (
                <div
                  className="flex items-center justify-center"
                  key={`${id}_${item.id}`}
                >
                  <OpportunityPublicSmallComponent
                    key={`${id}_${item.id}_component`}
                    data={item}
                  />
                </div>
              ))}
            </Carousel>
          )}
        </div>
      )}
    </div>
  );
};
