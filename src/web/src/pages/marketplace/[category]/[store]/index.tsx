import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import React, { useCallback, type ReactElement, useState } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import { buyItem, searchStoreItemCategories } from "~/api/services/marketplace";
import { authOptions } from "~/server/auth";
import { type ParsedUrlQuery } from "querystring";
import { config } from "~/lib/react-query-config";
import type {
  StoreItemCategory,
  StoreItemCategorySearchResults,
} from "~/api/models/marketplace";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import {
  GA_ACTION_MARKETPLACE_ITEM_BUY as GA_ACTION_MARKETPLACE_ITEM_PURCHASE,
  GA_CATEGORY_OPPORTUNITY,
  PAGE_SIZE,
  THEME_BLUE,
} from "~/lib/constants";
import { ItemCardComponent } from "~/components/Marketplace/ItemCard";
import { IoMdArrowRoundBack, IoMdClose, IoMdFingerPrint } from "react-icons/io";
import Breadcrumb from "~/components/Breadcrumb";
import { useRouter } from "next/router";
import { PaginationButtons } from "~/components/PaginationButtons";
import ReactModal from "react-modal";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import iconBell from "public/images/icon-bell.webp";
import { fetchClientEnv } from "~/lib/utils";
import type { ErrorResponseItem } from "~/api/models/common";
import { trackGAEvent } from "~/lib/google-analytics";

interface IParams extends ParsedUrlQuery {
  category: string;
  store: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient(config);
  const { category, store } = context.params as IParams;
  const { countryId, categoryId, storeId, page } = context.query;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: [`StoreCategoryItems_${category}_${store}_${page}`],
    queryFn: () =>
      searchStoreItemCategories(
        {
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          storeId: storeId?.toString() ?? "",
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      countryId: countryId ?? null,
      category: category ?? null,
      categoryId: categoryId ?? null,
      store: store ?? null,
      storeId: storeId ?? null,
      page: page ?? "1",
    },
  };
}

const MarketplaceStoreItemCategories: NextPageWithLayout<{
  countryId: string;
  category: string;
  categoryId: string;
  store: string;
  storeId: string;
  page?: string;
}> = ({ category, categoryId, store, storeId, countryId, page }) => {
  const router = useRouter();
  const [buyDialogVisible, setBuyDialogVisible] = useState(false);
  const [buyDialogConfirmationVisible, setBuyDialogConfirmationVisible] =
    useState(false);
  const [buyDialogErrorVisible, setBuyDialogErrorVisible] = useState(false);
  const [buyDialogErrorMessages, setBuyDialogErrorMessages] = useState<
    ErrorResponseItem[] | null
  >(null);
  const [currentItem, setCurrentItem] = useState<StoreItemCategory | null>(
    null,
  );
  const [loginDialogVisible, setLoginDialogVisible] = useState(false);
  const { data: session } = useSession();

  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<StoreItemCategorySearchResults>({
    queryKey: [`StoreCategoryItems_${category}_${store}_${page}`],
    queryFn: () =>
      searchStoreItemCategories({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        storeId: storeId?.toString() ?? "",
      }),
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/marketplace/${category}/${store}`,
        query: {
          categoryId: categoryId,
          storeId: storeId,
          page: value,
        },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [category, categoryId, store, storeId, router],
  );

  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const onLogin = useCallback(async () => {
    setIsButtonLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    signIn(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
        "") as string,
    );
  }, [setIsButtonLoading]);

  const onBuyClick = useCallback(
    (item: StoreItemCategory) => {
      if (!session) {
        setBuyDialogVisible(false);
        setLoginDialogVisible(true);
        return;
      }
      setCurrentItem(item);
      setBuyDialogVisible(true);
    },
    [session, setCurrentItem, setBuyDialogVisible, setLoginDialogVisible],
  );

  const onBuyConfirm = useCallback(
    (item: StoreItemCategory) => {
      setBuyDialogVisible(false);

      // update api
      buyItem(storeId, item.id)
        .then(() => {
          // 📊 GOOGLE ANALYTICS: track event
          trackGAEvent(
            GA_CATEGORY_OPPORTUNITY,
            GA_ACTION_MARKETPLACE_ITEM_PURCHASE,
            `Marketplace Item Purchased. Store: ${store}, Item: ${item.name}`,
          );

          // show confirmation dialog
          setBuyDialogConfirmationVisible(true);
        })
        .catch((err) => {
          const customErrors = err.response?.data as ErrorResponseItem[];
          setBuyDialogErrorMessages(customErrors);
          setBuyDialogErrorVisible(true);
        });

      //TODO: update zlto balance
    },
    [
      store,
      storeId,
      setBuyDialogVisible,
      setBuyDialogConfirmationVisible,
      setBuyDialogErrorVisible,
      setBuyDialogErrorMessages,
    ],
  );

  return (
    <>
      {/* LOGIN DIALOG */}
      <ReactModal
        isOpen={loginDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setLoginDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[300px] md:w-[450px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-row bg-blue p-4 shadow-lg">
            <h1 className="flex-grow"></h1>
            <button
              type="button"
              className="btn rounded-full border-0 bg-gray p-3 text-gray-dark hover:bg-gray-light"
              onClick={() => {
                setLoginDialogVisible(false);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
              <Image
                src={iconBell}
                alt="Icon Bell"
                width={28}
                height={28}
                sizes="100vw"
                priority={true}
                style={{ width: "28px", height: "28px" }}
              />
            </div>

            <h5>Please login to continue</h5>

            <div className="mt-4 flex flex-grow gap-4">
              <button
                type="button"
                className="btn rounded-full border-purple bg-white normal-case text-purple md:w-[150px]"
                onClick={() => setLoginDialogVisible(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn rounded-full bg-purple normal-case text-white hover:bg-purple-light md:w-[150px]"
                onClick={onLogin}
              >
                {isButtonLoading && (
                  <span className="loading loading-spinner loading-md mr-2 text-warning"></span>
                )}
                {!isButtonLoading && (
                  <IoMdFingerPrint className="h-5 w-5 text-white" />
                )}
                <p className="text-white">Login</p>
              </button>
            </div>
          </div>
        </div>
      </ReactModal>

      {/* PURCHASE DIALOG */}
      <ReactModal
        isOpen={buyDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setBuyDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[350px] md:w-[550px] md:rounded-3xl`}
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
                  setBuyDialogVisible(false);
                }}
              >
                <IoMdClose className="h-6 w-6"></IoMdClose>
              </button>
            </div>
            <div className="flex flex-col items-center justify-center gap-4">
              {currentItem?.imageURL && (
                <div className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
                  <Image
                    src={currentItem?.imageURL ?? ""}
                    alt="Icon Zlto"
                    width={40}
                    height={40}
                    sizes="100vw"
                    priority={true}
                    style={{ width: "40px", height: "40px" }}
                  />
                </div>
              )}

              <h3>You are about to purchase:</h3>
              <div className="w-[450px] rounded-lg p-2 text-center">
                <strong>{currentItem.name}</strong> voucher for{" "}
                <strong>{currentItem.amount} Zlto</strong>.
                <br /> <br />
                Would you like to proceed?
              </div>

              <div className="-mt-2 flex flex-grow gap-4">
                <button
                  type="button"
                  className="btn rounded-full border-purple bg-white normal-case text-purple hover:bg-purple hover:text-white md:w-[150px]"
                  onClick={() => {
                    setBuyDialogVisible(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn rounded-full bg-purple normal-case text-white hover:bg-purple hover:text-white md:w-[150px]"
                  onClick={() => {
                    onBuyConfirm(currentItem);
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </ReactModal>

      {/* PURCHASE CONFIRMATION DIALOG */}
      <ReactModal
        isOpen={buyDialogConfirmationVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setBuyDialogConfirmationVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[450px] md:w-[550px] md:rounded-3xl`}
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
                  setBuyDialogConfirmationVisible(false);
                }}
              >
                <IoMdClose className="h-6 w-6"></IoMdClose>
              </button>
            </div>

            <h3 className="text-center">Thank you for your purchase</h3>

            <div className="flex flex-col items-center justify-center gap-4">
              {currentItem?.imageURL && (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
                  <Image
                    src={currentItem?.imageURL ?? ""}
                    alt="Icon Zlto"
                    width={40}
                    height={40}
                    sizes="100vw"
                    priority={true}
                    style={{ width: "40px", height: "40px" }}
                  />
                </div>
              )}

              <div className="h-[180px] overflow-y-scroll text-ellipsis">
                <div className=" rounded-lg p-4 text-center">
                  {currentItem.description}
                </div>
                <div className="  rounded-lg p-4 text-center">
                  {currentItem.summary}
                </div>
              </div>

              <div className="flex flex-grow gap-4">
                <button
                  type="button"
                  className="btn rounded-full bg-purple normal-case text-white hover:bg-purple hover:text-white md:w-[150px]"
                  onClick={() => {
                    setBuyDialogConfirmationVisible(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </ReactModal>

      {/* PURCHASE ERROR DIALOG */}
      <ReactModal
        isOpen={buyDialogErrorVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setBuyDialogErrorVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[350px] md:w-[550px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-row p-4">
            <h1 className="flex-grow"></h1>
            <button
              type="button"
              className="btn rounded-full border-0 bg-gray p-3 text-gray-dark hover:bg-gray-light"
              onClick={() => {
                setBuyDialogErrorVisible(false);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>

          <h3 className="text-center">Purchase unsuccessful</h3>

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-[450px] rounded-lg p-2 text-center">
              Your purchase was unsuccessful. Please try again later.
              <br />
              <br />
              {buyDialogErrorMessages?.map((error, index) => (
                <div key={`error_${index}`}>{error.message}</div>
              ))}
            </div>

            <div className="mt-4 flex flex-grow gap-4">
              <button
                type="button"
                className="btn rounded-full bg-purple normal-case text-white hover:bg-purple hover:text-white md:w-[150px]"
                onClick={() => {
                  setBuyDialogErrorVisible(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ReactModal>

      <div className="flex w-full max-w-5xl flex-col items-start gap-4">
        {/* BREADCRUMB */}
        <Breadcrumb
          items={[
            {
              title: "Marketplace",
              url: `/marketplace?countryId=${countryId}`,
              iconElement: (
                <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
              ),
            },
            {
              title: category,
              url: `/marketplace/${category}?countryId=${countryId}&categoryId=${categoryId}`,
            },
            {
              title: store,
              url: "",
            },
          ]}
        />

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
          <div className="flex flex-row flex-wrap gap-4">
            {data.items.map((item, index) => (
              <ItemCardComponent
                key={index}
                company={store}
                name={item.name}
                imageURL={item.imageURL}
                summary={item.summary}
                amount={item.amount}
                count={item.count}
                onClick={() => onBuyClick(item)}
              />
            ))}
          </div>
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

MarketplaceStoreItemCategories.getLayout = function getLayout(
  page: ReactElement,
) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

MarketplaceStoreItemCategories.theme = function getTheme() {
  return THEME_BLUE;
};

export default MarketplaceStoreItemCategories;
