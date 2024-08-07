import type { GetStaticPaths, GetStaticProps } from "next";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, type ReactElement, useState, useRef } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import {
  listStoreCategories,
  listSearchCriteriaCountries,
  searchStoreItemCategories,
  searchStores,
  buyItem,
} from "~/api/services/marketplace";
import type {
  Store,
  StoreCategory,
  StoreItemCategory,
  StoreItemCategorySearchFilter,
  StoreItemCategorySearchResults,
} from "~/api/models/marketplace";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import {
  COUNTRY_WW,
  GA_ACTION_MARKETPLACE_ITEM_BUY,
  GA_CATEGORY_OPPORTUNITY,
  PAGE_SIZE_MINIMUM,
  THEME_BLUE,
} from "~/lib/constants";
import type { Country } from "~/api/models/lookups";
import Select from "react-select";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { AvatarImage } from "~/components/AvatarImage";
import { IoMdClose, IoMdFingerPrint, IoMdWarning } from "react-icons/io";
import ReactModal from "react-modal";
import { useAtomValue, useSetAtom } from "jotai";
import { signIn, useSession } from "next-auth/react";
import type { ErrorResponseItem } from "~/api/models/common";
import { userCountrySelectionAtom, userProfileAtom } from "~/lib/store";
import iconBell from "public/images/icon-bell.webp";
import Image from "next/image";
import { getUserProfile } from "~/api/services/user";
import { trackGAEvent } from "~/lib/google-analytics";
import { fetchClientEnv } from "~/lib/utils";
import { useConfirmationModalContext } from "src/context/modalConfirmationContext";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { env } from "process";
import { MarketplaceDown } from "~/components/Status/MarketplaceDown";
import StoreItemsCarousel from "~/components/Marketplace/StoreItemsCarousel";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { Loading } from "~/components/Status/Loading";
import Link from "next/link";

interface IParams extends ParsedUrlQuery {
  country: string;
}

// 👇 SSG
// This page undergoes static generation at run time on the server-side.
// The build-time SSG has been disabled due to missing API url configuration in the CI pipeline (see getStaticPaths below).
// This process ensures that the initial data required for the filter options
// and the first four items in the carousels are readily available upon page load.
// Subsequent client-side queries are executed and cached using the queryClient
// whenever additional data is requested in the carousels (during paging).
export const getStaticProps: GetStaticProps = async (context) => {
  // check if marketplace is enabled
  const marketplace_enabled =
    env.MARKETPLACE_ENABLED?.toLowerCase() == "true" ? true : false;

  if (!marketplace_enabled)
    return {
      props: { marketplace_enabled },
    };

  const { country } = context.params as IParams;
  const lookups_countries = await listSearchCriteriaCountries(context);
  const lookups_categories = await listStoreCategories(
    country ?? COUNTRY_WW,
    context,
  );
  const data_storeItems = [];

  // get store items for above categories
  for (const category of lookups_categories) {
    const stores = await searchStores(
      {
        pageNumber: null,
        pageSize: null,
        countryCodeAlpha2: country,
        categoryId: category.id ?? null,
      },
      context,
    );

    const storeItems = [];

    for (const store of stores.items) {
      const items = await searchStoreItemCategories(
        {
          pageNumber: 1,
          pageSize: PAGE_SIZE_MINIMUM,
          storeId: store.id?.toString() ?? "",
        },
        context,
      );

      // filter available items
      items.items = items.items.filter((item) => item.count > 0);

      // only add to storeItems if items is not empty
      if (items && items.items.length > 0) {
        storeItems.push({ store, items });
      }
    }

    // only add to data_storeItems if storeItems is not empty
    if (storeItems.length > 0) {
      data_storeItems.push({ category, storeItems });
    }
  }

  // if country not WW, then include some WW items
  if (country !== COUNTRY_WW) {
    const lookups_categoriesWW = await listStoreCategories(COUNTRY_WW, context);

    for (const category of lookups_categoriesWW) {
      const stores = await searchStores(
        {
          pageNumber: null,
          pageSize: null,
          countryCodeAlpha2: COUNTRY_WW,
          categoryId: category.id ?? null,
        },
        context,
      );

      const storeItems = [];

      for (const store of stores.items) {
        const items = await searchStoreItemCategories(
          {
            pageNumber: 1,
            pageSize: PAGE_SIZE_MINIMUM,
            storeId: store.id?.toString() ?? "",
          },
          context,
        );

        // filter available items
        items.items = items.items.filter((item) => item.count > 0);

        // only add to storeItems if items is not empty
        if (items && items.items.length > 0) {
          storeItems.push({ store, items });
        }
      }

      // only add to data_storeItems if storeItems is not empty
      if (storeItems.length > 0) {
        data_storeItems.push({ category, storeItems });
      }
    }
  }

  return {
    props: { country, lookups_countries, data_storeItems, marketplace_enabled },

    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 300 seconds
    revalidate: 300,
  };
};

export const getStaticPaths: GetStaticPaths = async (context) => {
  // disable build-time SSG in CI environment
  if (env.CI) {
    return {
      paths: [],
      fallback: "blocking",
    };
  }

  // generate paths for all countries (runtime)
  const lookups_countries = await listSearchCriteriaCountries(context);

  const paths = lookups_countries.map((country) => ({
    params: { country: country.codeAlpha2 },
  }));

  return {
    paths,
    fallback: "blocking",
  };
};

const MarketplaceStoreCategories: NextPageWithLayout<{
  country: string;
  lookups_countries: Country[];
  data_storeItems: {
    category: StoreCategory;
    storeItems: { store: Store; items: StoreItemCategorySearchResults }[];
  }[];
  error?: number;
  marketplace_enabled: boolean;
}> = ({
  country,
  lookups_countries,
  data_storeItems,
  error,
  marketplace_enabled,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);
  const setUserCountrySelection = useSetAtom(userCountrySelectionAtom);
  const modalContext = useConfirmationModalContext();
  const myRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(
    loginDialogVisible ||
      buyDialogVisible ||
      buyDialogConfirmationVisible ||
      buyDialogErrorVisible,
  );

  const onFilterCountry = useCallback(
    (value: string) => {
      setUserCountrySelection(value);
      if (value) router.push(`/marketplace/${value}`);
      else router.push(`/marketplace`);
    },
    [router, setUserCountrySelection],
  );

  // memo for countries
  const countryOptions = React.useMemo(() => {
    if (!lookups_countries) return [];
    return lookups_countries.map((c) => ({
      value: c.codeAlpha2,
      label: c.name,
    }));
  }, [lookups_countries]);

  // 🎠 CAROUSEL: data fetching
  const fetchDataAndUpdateCache = useCallback(
    async (
      queryKey: string[],
      filter: StoreItemCategorySearchFilter,
    ): Promise<StoreItemCategorySearchResults> => {
      const cachedData =
        queryClient.getQueryData<StoreItemCategorySearchResults>(queryKey);

      if (cachedData) {
        return cachedData;
      }

      const data = await searchStoreItemCategories(filter);

      queryClient.setQueryData(queryKey, data);

      return data;
    },
    [queryClient],
  );

  const loadData = useCallback(
    (startRow: number, storeId: string) => {
      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache([storeId, pageNumber.toString()], {
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE_MINIMUM,
        storeId: storeId,
      });
    },
    [fetchDataAndUpdateCache],
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
    async (item: StoreItemCategory) => {
      if (!session || !userProfile) {
        setBuyDialogVisible(false);
        setLoginDialogVisible(true);
        return;
      }

      // check availability
      if (item.count <= 0) {
        // show confirm dialog
        await modalContext.showConfirmation(
          "",
          <div
            key="confirm-dialog-content"
            className="text-gray-500 flex h-full flex-col space-y-2"
          >
            <div className="flex flex-row space-x-2">
              <IoMdWarning className="gl-icon-yellow h-6 w-6" />
              <p className="text-lg">Unavailable</p>
            </div>

            <div>
              <p className="text-sm leading-6">
                This item is currently not available. Please try again later.
              </p>
            </div>
          </div>,
          false,
          true,
        );

        return;
      }

      // check price
      if (userProfile.zlto.available < item.amount) {
        // show confirm dialog
        await modalContext.showConfirmation(
          "",
          <div
            key="confirm-dialog-content"
            className="text-gray-500 flex h-full flex-col space-y-2"
          >
            <div className="flex flex-row space-x-2">
              <IoMdWarning className="gl-icon-yellow h-6 w-6" />
              <p className="text-lg">Insufficient funds</p>
            </div>

            <div>
              <p className="text-sm leading-6">
                You do not have sufficient Zlto to purchase this item.
              </p>
            </div>
          </div>,
          false,
          true,
        );

        return;
      }

      setCurrentItem(item);
      setBuyDialogVisible(true);
    },
    [
      session,
      setCurrentItem,
      setBuyDialogVisible,
      setLoginDialogVisible,
      userProfile,
      modalContext,
    ],
  );

  const onBuyConfirm = useCallback(
    (item: StoreItemCategory) => {
      setIsLoading(true);
      setBuyDialogVisible(false);

      // update api
      buyItem(item.storeId, item.id)
        .then(() => {
          // 📊 GOOGLE ANALYTICS: track event
          trackGAEvent(
            GA_CATEGORY_OPPORTUNITY,
            GA_ACTION_MARKETPLACE_ITEM_BUY,
            `Marketplace Item Purchased. Store: ${item.storeId}, Item: ${item.name}`,
          );

          // show confirmation dialog
          setBuyDialogConfirmationVisible(true);

          // update user profile (zlto balance)
          getUserProfile().then((res) => {
            setUserProfile(res);
            setIsLoading(false);
          });
        })
        .catch((err) => {
          const customErrors = err.response?.data as ErrorResponseItem[];
          setBuyDialogErrorMessages(customErrors);
          setBuyDialogErrorVisible(true);
          setIsLoading(false);
        });
    },
    [
      setBuyDialogVisible,
      setBuyDialogConfirmationVisible,
      setBuyDialogErrorVisible,
      setBuyDialogErrorMessages,
      setUserProfile,
      setIsLoading,
    ],
  );

  if (!marketplace_enabled) return <MarketplaceDown />;

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      {isLoading && <Loading />}

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
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
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
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[400px] md:w-[550px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        {currentItem && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
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

              <div className="rounded-lg p-2 text-center md:w-[450px]">
                <strong>{currentItem.name}</strong> voucher for{" "}
                <strong>{currentItem.amount} Zlto</strong>.
                <br /> <br />
                Would you like to proceed?
              </div>

              <div className="-mt-2 flex flex-grow gap-4">
                <button
                  type="button"
                  className="btn rounded-full bg-purple normal-case text-white hover:bg-purple hover:text-white md:w-[150px]"
                  onClick={() => {
                    onBuyConfirm(currentItem);
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="btn rounded-full border-purple bg-white normal-case text-purple hover:bg-purple hover:text-white md:w-[150px]"
                  onClick={() => {
                    setBuyDialogVisible(false);
                  }}
                >
                  No
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
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[520px] md:w-[550px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        {currentItem && (
          <div className="pb-12x flex h-full flex-col gap-2 overflow-y-auto pb-6">
            <div className="flex flex-row p-4">
              <h1 className="flex-grow"></h1>
              <button
                type="button"
                className="btn rounded-full border-0 bg-gray p-3 text-gray-dark hover:bg-gray-light"
                onClick={() => {
                  // reload the page to refresh the data
                  router.reload();
                }}
              >
                <IoMdClose className="h-6 w-6"></IoMdClose>
              </button>
            </div>

            <h3 className="text-center">Purchase Success!</h3>

            <div className="flex flex-col items-center justify-center gap-4 px-8">
              {currentItem?.imageURL && (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg">
                  <AvatarImage
                    icon={currentItem.imageURL}
                    alt={`Product Image`}
                    size={40}
                  />
                </div>
              )}

              <div className="flex w-full flex-col gap-4 rounded-lg border-2 border-dotted border-gray p-4 text-center">
                <p
                  dangerouslySetInnerHTML={{ __html: currentItem.description }}
                ></p>
                <p
                  dangerouslySetInnerHTML={{ __html: currentItem.summary }}
                ></p>
              </div>

              <div className="p-4 text-center">
                You will be able to find your instructions within your products!
              </div>

              <div className="flex flex-grow gap-4">
                <Link
                  href="/marketplace/transactions"
                  className="btn rounded-full bg-purple normal-case text-white hover:bg-purple hover:text-white md:w-[150px]"
                >
                  My Products
                </Link>

                <button
                  type="button"
                  className="btn rounded-full border-purple bg-white normal-case text-purple hover:bg-purple hover:text-white md:w-[150px]"
                  onClick={() => {
                    // reload the page to refresh the data
                    router.reload();
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
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
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
            <div className="rounded-lg p-2 text-center md:w-[450px]">
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

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* MAIN CONTENT */}
      <div className="flex w-full flex-col gap-4 md:max-w-7xl">
        {/* FILTER: COUNTRY */}
        <div className="flex flex-row items-center justify-start gap-4">
          <div className="text-sm font-semibold text-gray-dark">Filter by:</div>
          <Select
            instanceId={"country"}
            classNames={{
              control: () => "input input-xs w-[200px] !z-50",
            }}
            options={countryOptions}
            onChange={(val) => onFilterCountry(val?.value ?? "")}
            value={countryOptions?.find(
              (c) => c.value === (country?.toString() ?? COUNTRY_WW),
            )}
            placeholder="Country"
            // fix menu z-index issue
            menuPortalTarget={myRef.current}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </div>

        {/* RESULTS */}
        <div className="flex flex-col gap-6 px-2 pb-4 md:p-0 md:pb-0">
          {data_storeItems.length == 0 && (
            <NoRowsMessage title="No items found" />
          )}

          {data_storeItems?.map((category_storeItems, index) => (
            <div
              key={`category_${category_storeItems.category.id}_${index}`}
              className="mb-8 md:mb-4"
            >
              {/* CATEGORY NAME AND IMAGES */}
              <div className="flex flex-row items-center justify-start gap-4 pb-4">
                <h1 className="text-2xl">
                  {category_storeItems.category.name}
                </h1>

                <div className="flex flex-grow flex-row items-start overflow-hidden">
                  {category_storeItems.category.storeImageURLs.map(
                    (storeImage, index2) => (
                      <div
                        className="relative -mr-4 overflow-hidden rounded-full shadow"
                        style={{
                          zIndex:
                            category_storeItems.category.storeImageURLs.length -
                            index,
                        }}
                        key={`storeItems_${category_storeItems.category.id}_${index}_${index2}`}
                      >
                        <span className="z-0">
                          <AvatarImage
                            icon={storeImage ?? null}
                            alt={`Store Image Logo ${index2}`}
                            size={40}
                          />
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {category_storeItems?.storeItems?.map((storeItem, index2) => (
                <div
                  key={`category_${category_storeItems.category.id}_${index}_${index2}`}
                >
                  <StoreItemsCarousel
                    id={`storeItem_${category_storeItems.category.id}_${index}_${index2}`}
                    title={storeItem.store?.name}
                    data={storeItem.items}
                    loadData={(startRow) =>
                      loadData(startRow, storeItem.store.id)
                    }
                    onClick={onBuyClick}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

MarketplaceStoreCategories.getLayout = function getLayout(page: ReactElement) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

MarketplaceStoreCategories.theme = function getTheme() {
  return THEME_BLUE;
};

export default MarketplaceStoreCategories;
