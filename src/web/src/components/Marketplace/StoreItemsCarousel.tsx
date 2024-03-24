import Link from "next/link";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useCallback, useEffect, useRef, useState } from "react";
import { screenWidthAtom } from "~/lib/store";
import { useAtomValue } from "jotai";
import { VIEWPORT_SIZE } from "~/lib/constants";
import { LoadingSkeleton } from "../Status/LoadingSkeleton";
import type { StoreItemCategorySearchResults } from "~/api/models/marketplace";
import { ItemCardComponent } from "./ItemCard";

export const StoreItemsCarousel: React.FC<{
  [id: string]: any;
  title?: string;
  data: StoreItemCategorySearchResults;
  viewAllUrl?: string;
  loadData: (startRow: number) => Promise<StoreItemCategorySearchResults>;
  onClick: (item: any) => void;
}> = ({ id, title, data, viewAllUrl, loadData, onClick }) => {
  const screenWidth = useAtomValue(screenWidthAtom);
  const [cache, setCache] = useState(data?.items);
  const isLoadingDataRef = useRef(false);
  const [selectedItem, setSelectedItem] = useState(0);

  // viewport
  const [viewportSize, setViewportSize] = useState(screenWidth);

  useEffect(() => {
    setViewportSize(
      screenWidth < VIEWPORT_SIZE.SM
        ? 100 // 1 column
        : screenWidth < VIEWPORT_SIZE.LG
          ? 50 // 2 columns
          : screenWidth < VIEWPORT_SIZE.XL
            ? 33 // 3 columns
            : 33,
    );
    // reset to first item when resizing (UX fix with changing of carousel column)
    setSelectedItem(0);
  }, [screenWidth, setSelectedItem]);

  const onChange = useCallback(
    async (index: number) => {
      // if data is currently being loaded, do nothing
      if (isLoadingDataRef.current) return;

      // calculate the number of columns based on the viewport size
      const cols = 100 / viewportSize;

      // calculate the start row based on the current index
      const startRow = index + 1;

      const nextStartRow = Math.ceil((startRow + 1) / cols) * cols + 1;

      // HACK: Update the selected item
      // this moves the selected items along with the new data
      // prevents an issue where the selected item has a large gap (index=1)
      if (index == 1) {
        setSelectedItem(index + 1);
        return;
      }

      // if there's enough data in the cache, skip fetching more data
      if (startRow + cols <= cache.length) {
        // if the index is not close to the end, skip fetching more rows
        return;
      }

      // if we've reached this point, we need to fetch more data
      isLoadingDataRef.current = true;

      // fetch more data
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
    },
    [
      loadData,
      isLoadingDataRef,
      cache,
      setCache,
      viewportSize,
      setSelectedItem,
    ],
  );

  return (
    <div key={`StoreItemCategoriesCarousel_${id}`}>
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

          {viewportSize <= 0 && (
            <div className="flex items-center justify-center">
              <LoadingSkeleton />
            </div>
          )}

          {viewportSize > 0 && (
            <Carousel
              centerMode
              centerSlidePercentage={viewportSize}
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
              {cache.map((item: any, index: number) => (
                <div
                  className="flex items-center justify-center"
                  key={`${id}_${item.id}_${index}`}
                >
                  <ItemCardComponent
                    key={`storeCategoryItem_${index}`}
                    id={`storeCategoryItem__${index}`}
                    company={item.name}
                    name={item.name}
                    imageURL={item.imageURL}
                    summary={item.summary}
                    amount={item.amount}
                    count={item.count}
                    onClick={() => onClick(item)}
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
