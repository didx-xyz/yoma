import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import React, { type ReactElement, useCallback, useState } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import { searchVouchers } from "~/api/services/marketplace";
import { authOptions } from "~/server/auth";
import { config } from "~/lib/react-query-config";
import type { WalletVoucher } from "~/api/models/marketplace";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import type { WalletVoucherSearchResults } from "~/api/models/reward";
import iconZlto from "public/images/icon-zlto.svg";
import Image from "next/image";
import { toBase64, shimmer } from "~/lib/image";
import { PaginationButtons } from "~/components/PaginationButtons";
import { useRouter } from "next/router";
import { IoMdClose, IoMdCopy } from "react-icons/io";
import ReactModal from "react-modal";

// type GroupedData = {
//   [key: number]: WalletVoucher[];
// };

// interface IParams extends ParsedUrlQuery {
//   page?: string;
// }

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  const { page } = context.query;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["Vouchers"],
    queryFn: () =>
      searchVouchers(
        {
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
      page: page ?? "1",
    },
  };
}

const MarketplaceTransactions: NextPageWithLayout<{
  page?: string;
}> = ({ page }) => {
  const router = useRouter();
  const [currentItem, setCurrentItem] = useState<WalletVoucher | null>(null);
  const [itemDialogVisible, setItemDialogVisible] = useState(false);

  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<WalletVoucherSearchResults>({
    queryKey: ["Vouchers"],
    queryFn: () =>
      searchVouchers({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
      }),
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/marketplace/transactions`,
        query: {
          page: value,
        },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [router],
  );

  const onItemClick = useCallback(
    (item: WalletVoucher) => {
      setCurrentItem(item);
      setItemDialogVisible(true);
    },
    [setCurrentItem, setItemDialogVisible],
  );

  // memoize the data grouped by date (todo api)
  // const dataByDate = useMemo<GroupedData | null>(() => {
  //   if (!data?.items) return null;

  //   const groupedByDate = data.items.reduce<GroupedData>((acc: any, item) => {
  //     const date = item.amount; //TODO: hacked for now

  //     if (!acc[date]) acc[date] = [];
  //     acc[date].push(item);

  //     return acc;
  //   }, {});

  //   return groupedByDate;
  // }, [data]);

  const copyToClipboard = async () => {
    try {
      const permissions = await navigator.permissions.query({
        name: "clipboard-write" as PermissionName,
      });
      if (permissions.state === "granted" || permissions.state === "prompt") {
        await navigator.clipboard.writeText(currentItem?.code ?? "");
        alert("Text copied to clipboard!");
      } else {
        throw new Error(
          "Can't access the clipboard. Check your browser permissions.",
        );
      }
    } catch (error) {
      alert("Error copying to clipboard: " + error?.toString());
    }
  };

  return (
    <>
      {/* ITEM DIALOG */}
      <ReactModal
        isOpen={itemDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setItemDialogVisible(false);
        }}
        //className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[350px] md:w-[550px] md:rounded-3xl`}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[550px] md:w-[550px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        {currentItem && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-row p-4">
              <h1 className="flex-grow"></h1>
              <button
                type="button"
                className="btn rounded-full border-0 bg-gray p-3 text-gray-dark hover:bg-gray-light"
                onClick={() => {
                  setItemDialogVisible(false);
                }}
              >
                <IoMdClose className="h-6 w-6"></IoMdClose>
              </button>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 p-8">
              {/* {currentItem && currentItem.imageURL && (
                <div className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
                  <Image
                    src={currentItem!.imageURL!}
                    alt="Icon Zlto"
                    width={40}
                    height={40}
                    sizes="100vw"
                    priority={true}
                    style={{ width: "40px", height: "40px" }}
                  />
                </div>
              )} */}

              <h5 className="text-center">
                You purchased <strong>{currentItem.name}</strong>
              </h5>

              <div className="flex w-full flex-col justify-center gap-2">
                {/* TODO: no image from api */}
                {/* {currentItem && currentItem.imageURL && (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
      <Image
        src={currentItem!.imageURL!}
        alt="Icon Zlto"
        width={40}
        height={40}
        sizes="100vw"
        priority={true}
        style={{ width: "40px", height: "40px" }}
      />
    </div>
  )} */}
                <div className="flex w-full flex-col justify-center gap-1">
                  <div className="text-xs font-bold text-gray-dark">
                    Voucher Code
                  </div>

                  <div className="flex w-full flex-row items-center rounded-full bg-gray p-2">
                    <div className="w-full font-semibold">
                      {currentItem.code}
                    </div>
                    <div>
                      <IoMdCopy
                        className="h-4 w-4 cursor-pointer"
                        onClick={copyToClipboard}
                      />
                    </div>
                  </div>
                </div>

                {/* TODO: no status from api */}
                {/* <div className="flex w-full flex-row">
                  <div className="w-full text-xs text-gray-dark">
                    Voucher Status
                  </div>
                  <div className=" text-sm font-semibold">
                    {currentItem.?}
                  </div>
                </div> */}

                <div className="flex w-full flex-row">
                  <div className="w-full text-xs text-gray-dark">Paid with</div>
                  <div className=" whitespace-nowrap text-sm font-semibold">
                    {currentItem.amount} ZLTO
                  </div>
                </div>

                <div className="flex w-full flex-row">
                  <div className="w-full text-xs text-gray-dark">
                    Transaction number
                  </div>
                  <div className="text-sm font-semibold">{currentItem.id}</div>
                </div>

                <div className="flex w-full flex-col gap-2">
                  <div className="w-full text-xs text-gray-dark">
                    Instructions
                  </div>
                  <div className="h-[100px] overflow-y-scroll text-sm font-semibold">
                    {currentItem.instructions}
                  </div>
                </div>
              </div>

              <div className="flex flex-grow gap-4">
                <button
                  type="button"
                  className="btn w-[150px] rounded-full bg-purple normal-case text-white hover:bg-purple-light hover:text-white"
                  onClick={() => {
                    setItemDialogVisible(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </ReactModal>

      <div className="flex w-full max-w-5xl flex-col items-start gap-4">
        <h4>My vouchers</h4>

        {/* ERRROR */}
        {dataError && <ApiErrors error={dataError} />}

        {/* LOADING */}
        {dataIsLoading && (
          <div className="flex justify-center rounded-lg bg-white p-8">
            <LoadingSkeleton />
          </div>
        )}

        {/* NO ROWS */}
        {data?.items && data.items.length === 0 && (
          <div className="flex w-full justify-center rounded-lg bg-white p-8">
            <NoRowsMessage
              title={"No items found"}
              description={"Please refine your search criteria."}
            />
          </div>
        )}

        {/* GRID */}
        {/* {dataByDate && Object.keys(dataByDate).length > 0 && (
        <div className="flex w-full flex-col flex-wrap gap-4">
          {Object.entries(dataByDate).map(([date, items]) => (
            <div key={date} className="flex flex-col gap-2">
              <label className="text-sm text-gray-dark">{date}</label>
              {items.map((item, index) => (
                <TransactionItemComponent
                  key={`${date}-${index}`}
                  item={item}
                />
              ))}
            </div>
          ))}
        </div>
      )} */}

        {/* GRID */}
        {data?.items && data.items.length > 0 && (
          <>
            {data.items.map((item, index) => (
              <TransactionItemComponent
                key={`transaction-${index}`}
                item={item}
                onClick={() => onItemClick(item)}
              />
            ))}
          </>
        )}

        {/* PAGINATION BUTTONS */}
        <PaginationButtons
          currentPage={page ? parseInt(page) : 1}
          //NB: there is no totalCount from the api, so we set it to a high number
          totalItems={data?.items && data?.items.length > 0 ? 999 : null}
          pageSize={PAGE_SIZE}
          onClick={handlePagerChange}
          showPages={false}
        />
      </div>
    </>
  );
};

const TransactionItemComponent: React.FC<{
  [key: string]: any;
  item: WalletVoucher;
  onClick: () => void;
}> = ({ key, item, onClick }) => {
  return (
    <button
      type="button"
      key={key}
      className="flex h-14 w-full transform-gpu flex-row items-center gap-2 rounded-lg bg-white p-8 shadow-lg transition-transform hover:scale-105"
      onClick={onClick}
    >
      <div className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full shadow">
        {/* {imageURLs &&
            imageURLs.length > 0 &&
            imageURLs.map((url, index) => (
              <Image
                key={`${key}_${index}`}
                src={url}
                alt={`Store Category ${index}`}
                width={64}
                height={64}
                sizes="(max-width: 64px) 30vw, 50vw"
                priority={true}
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(
                  shimmer(64, 64),
                )}`}
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "64px",
                  maxHeight: "64px",
                }}
              />
            ))}
          {!imageURLs ||
            (imageURLs.length === 0 && ( */}
        <Image
          src={iconZlto}
          alt={`Zlto icon`}
          width={48}
          height={48}
          sizes="(max-width: 48px) 30vw, 50vw"
          priority={true}
          placeholder="blur"
          blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(48, 48))}`}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "48px",
            maxHeight: "48px",
          }}
        />
        {/* ))} */}
      </div>

      <div className="flex flex-grow flex-col items-start">
        <p className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-black md:max-w-[580px]">
          {item.name}
        </p>
        {/* TODO: no company from api */}
        {/* <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-black md:max-w-[580px]">
          {item.company}
        </p> */}
      </div>
    </button>
  );
};

MarketplaceTransactions.getLayout = function getLayout(page: ReactElement) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

MarketplaceTransactions.theme = function getTheme() {
  return THEME_BLUE;
};

export default MarketplaceTransactions;
