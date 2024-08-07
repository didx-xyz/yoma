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
import { MAX_INT32, THEME_BLUE } from "~/lib/constants";
import type { WalletVoucherSearchResults } from "~/api/models/marketplace";
import { IoMdClose, IoMdCopy } from "react-icons/io";
import ReactModal from "react-modal";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { TransactionItemComponent } from "~/components/Marketplace/TransactionItem";
import Link from "next/link";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  const { page } = context.query;
  let errorCode = null;

  try {
    // 👇 prefetch queries on server
    const data = await searchVouchers(
      {
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: MAX_INT32, // paging disabled, get all
      },
      context,
    );

    await queryClient.prefetchQuery({
      queryKey: ["Vouchers"],
      queryFn: () => data,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      page: page ?? "1",
      error: errorCode,
    },
  };
}

const MarketplaceTransactions: NextPageWithLayout<{
  page?: string;
  error?: number;
}> = ({ page, error }) => {
  const [currentItem, setCurrentItem] = useState<WalletVoucher | null>(null);
  const [itemDialogVisible, setItemDialogVisible] = useState(false);

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(itemDialogVisible);

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
        pageSize: MAX_INT32, // paging disabled, get all
      }),
    enabled: !error,
  });

  const onItemClick = useCallback(
    (item: WalletVoucher) => {
      setCurrentItem(item);
      setItemDialogVisible(true);
    },
    [setCurrentItem, setItemDialogVisible],
  );

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

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      {/* ITEM DIALOG */}
      <ReactModal
        isOpen={itemDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setItemDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[550px] md:w-[550px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        {currentItem && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto pb-2">
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
            <div className="flex flex-col items-center justify-center gap-4 p-2 md:p-8">
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

              <div className="flex w-full flex-col justify-center gap-4">
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

                <div className="flex w-full flex-col md:flex-row">
                  <div className="w-full text-xs text-gray-dark">Paid with</div>
                  <div className=" whitespace-nowrap text-sm font-semibold">
                    {currentItem.amount} ZLTO
                  </div>
                </div>

                <div className="flex w-full flex-col md:flex-row">
                  <div className="w-full text-xs text-gray-dark">
                    Transaction number
                  </div>
                  <div className="text-sm font-semibold">{currentItem.id}</div>
                </div>

                <div className="flex w-full flex-col gap-2">
                  <div className="w-full text-xs text-gray-dark">
                    Instructions
                  </div>
                  <div
                    className="text-sm font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: currentItem.instructions,
                    }}
                  ></div>
                </div>
              </div>

              <div className="mt-2 flex flex-grow gap-4">
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

      <div className="flex w-full max-w-7xl flex-col items-start gap-4">
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
        {data?.items && data.items.length > 0 && (
          <div className="grid w-full place-items-center">
            <div className="xs:grid-cols-1 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((item, index) => (
                <TransactionItemComponent
                  key={`transaction-${index}`}
                  data={item}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* MARKETPLACE BUTTON */}
        <div className="flex w-full justify-center">
          <Link
            href="/marketplace"
            className="btn mt-8 w-[260px] rounded-xl border-none bg-green normal-case text-white hover:bg-green hover:text-white hover:brightness-110"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </>
  );
};

MarketplaceTransactions.getLayout = function getLayout(page: ReactElement) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

MarketplaceTransactions.theme = function getTheme() {
  return THEME_BLUE;
};

export default MarketplaceTransactions;
