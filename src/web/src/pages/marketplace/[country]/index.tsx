import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import type {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { env } from "process";
import type { ParsedUrlQuery } from "querystring";
import React, { useCallback, useRef, useState, type ReactElement } from "react";
import { FaLock } from "react-icons/fa";
import { FcKey } from "react-icons/fc";
import { IoMdClose, IoMdCloseCircleOutline, IoMdWarning } from "react-icons/io";
import Select from "react-select";
import { useConfirmationModalContext } from "src/context/modalConfirmationContext";
import type { ErrorResponseItem } from "~/api/models/common";
import type { Country } from "~/api/models/lookups";
import type {
  Store,
  StoreCategory,
  StoreItemCategory,
  StoreItemCategorySearchResults,
} from "~/api/models/marketplace";
import {
  buyItem,
  listSearchCriteriaCountries,
  listStoreCategories,
  searchStoreItemCategories,
  searchStores,
} from "~/api/services/marketplace";
import { getUserProfile } from "~/api/services/user";
import { AvatarImage } from "~/components/AvatarImage";
import CustomCarousel from "~/components/Carousel/CustomCarousel";
import CustomModal from "~/components/Common/CustomModal";
import Suspense from "~/components/Common/Suspense";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { ItemCardComponent } from "~/components/Marketplace/ItemCard";
import NoRowsMessage from "~/components/NoRowsMessage";
import { SignInButton } from "~/components/SignInButton";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { MarketplaceDown } from "~/components/Status/MarketplaceDown";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  COUNTRY_CODE_WW,
  GA_ACTION_MARKETPLACE_ITEM_BUY,
  GA_CATEGORY_OPPORTUNITY,
  THEME_BLUE,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { userCountrySelectionAtom, userProfileAtom } from "~/lib/store";
import { type NextPageWithLayout } from "~/pages/_app";

interface IParams extends ParsedUrlQuery {
  country: string;
}

interface MarketplaceData {
  lookups_countries: Country[];
  data_storeItems: {
    category: StoreCategory;
    storeItems: { store: Store; items: StoreItemCategorySearchResults }[];
  }[];
}

async function fetchMarketplaceData(
  country: string,
  context?: GetStaticPropsContext,
): Promise<MarketplaceData> {
  const lookups_countries = await listSearchCriteriaCountries(context);
  const lookups_categories = await listStoreCategories(
    country ?? COUNTRY_CODE_WW,
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
          pageNumber: null,
          pageSize: null,
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
  if (country !== COUNTRY_CODE_WW) {
    const lookups_categoriesWW = await listStoreCategories(
      COUNTRY_CODE_WW,
      context,
    );

    for (const category of lookups_categoriesWW) {
      const stores = await searchStores(
        {
          pageNumber: null,
          pageSize: null,
          countryCodeAlpha2: COUNTRY_CODE_WW,
          categoryId: category.id ?? null,
        },
        context,
      );

      const storeItems = [];

      for (const store of stores.items) {
        const items = await searchStoreItemCategories(
          {
            pageNumber: null,
            pageSize: null,
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

  return { lookups_countries, data_storeItems };
}

// 👇 SSG
// This page undergoes static generation at run time on the server-side for anonymous users.
// For authenticated users, client-side queries are performed using react-query.
// This process ensures that the initial data required for the filter options
// and the first four items in the carousels are readily available upon page load for anonymous users.
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
  const { lookups_countries, data_storeItems } = await fetchMarketplaceData(
    country,
    context,
  );

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
  const [buyDialogVisible, setBuyDialogVisible] = useState(false);
  const [buyDialogConfirmationVisible, setBuyDialogConfirmationVisible] =
    useState(false);
  const [buyDialogErrorVisible, setBuyDialogErrorVisible] = useState(false);
  const [buyDialogErrorMessages, setBuyDialogErrorMessages] = useState<
    ErrorResponseItem[] | null
  >(null);
  const [itemLockedDialogVisible, setItemLockedDialogVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<StoreItemCategory | null>(
    null,
  );
  const [loginDialogVisible, setLoginDialogVisible] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);
  const setUserCountrySelection = useSetAtom(userCountrySelectionAtom);
  const modalContext = useConfirmationModalContext();
  const myRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 👇 authenticated query
  const {
    data: data_storeItems_authenticated,
    isLoading: isLoading_storeItems_authenticated,
    error: error_storeItems_authenticated,
  } = useQuery({
    queryKey: ["marketplace", "items", session?.user?.id, country],
    queryFn: async () => {
      return await fetchMarketplaceData(country);
    },
    enabled: !!session,
  });

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
  // NB: paging has been disabled for now because the data is already fetched at build time
  // const fetchDataAndUpdateCache = useCallback(
  //   async (
  //     queryKey: string[],
  //     filter: StoreItemCategorySearchFilter,
  //   ): Promise<StoreItemCategorySearchResults> => {
  //     const cachedData =
  //       queryClient.getQueryData<StoreItemCategorySearchResults>(queryKey);

  //     if (cachedData) {
  //       return cachedData;
  //     }

  //     const data = await searchStoreItemCategories(filter);

  //     queryClient.setQueryData(queryKey, data);

  //     return data;
  //   },
  //   [queryClient],
  // );

  // const loadData = useCallback(
  //   (startRow: number, storeId: string) => {
  //     const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

  //     return fetchDataAndUpdateCache([storeId, pageNumber.toString()], {
  //       pageNumber: pageNumber,
  //       pageSize: PAGE_SIZE_MINIMUM,
  //       storeId: storeId,
  //     });
  //   },
  //   [fetchDataAndUpdateCache],
  // );

  const onBuyClick = useCallback(
    async (item: StoreItemCategory) => {
      if (!session || !userProfile) {
        setBuyDialogVisible(false);
        setItemLockedDialogVisible(false);
        setLoginDialogVisible(true);
        return;
      }

      setCurrentItem(item);

      // check locked
      if (item.storeAccessControlRuleResult?.locked) {
        setItemLockedDialogVisible(true);

        return;
      }

      // check availability
      if (item.count <= 0) {
        // show confirm dialog
        await modalContext.showConfirmation(
          "",
          <div
            key="confirm-dialog-content"
            className="flex h-full flex-col space-y-2 text-gray-500"
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
            className="flex h-full flex-col space-y-2 text-gray-500"
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

      setBuyDialogVisible(true);
    },
    [
      session,
      setCurrentItem,
      setBuyDialogVisible,
      setLoginDialogVisible,
      setItemLockedDialogVisible,
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

  const renderStoreItems = (
    data_storeItems: {
      category: StoreCategory;
      storeItems: { store: Store; items: StoreItemCategorySearchResults }[];
    }[],
  ) => {
    if (data_storeItems.length === 0) {
      return <NoRowsMessage title="No items found" />;
    }

    return data_storeItems.map((category_storeItems, index) => (
      <div
        key={`category_${category_storeItems.category.id}_${index}`}
        className="mb-8x md:mb-4x"
      >
        {category_storeItems.storeItems.map((storeItem, index2) => (
          <div
            key={`category_${category_storeItems.category.id}_${index}_${index2}`}
          >
            <CustomCarousel
              id={`CompletedOpportunities_CustomCarousel`}
              title={category_storeItems.category.name}
              data={storeItem.items.items}
              renderSlide={(item, index) => (
                <ItemCardComponent
                  id={`storeItem_${category_storeItems.category.id}_${index}_${index2}`}
                  item={item}
                  company={storeItem.store?.name}
                  onClick={() => onBuyClick(item)}
                />
              )}
            />
          </div>
        ))}
      </div>
    ));
  };

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
      <CustomModal
        isOpen={loginDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setLoginDialogVisible(false);
        }}
        className={`md:max-h-[300px] md:w-[450px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
          <div className="bg-blue flex flex-row p-4 shadow-lg">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={() => {
                setLoginDialogVisible(false);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <FcKey className="mr-px h-7 w-7 text-white" />
            </div>

            <h5>Please sign-in to continue</h5>

            <div className="mt-4 flex grow gap-4">
              <button
                type="button"
                className="btn border-purple text-purple rounded-full bg-white normal-case md:w-[150px]"
                onClick={() => setLoginDialogVisible(false)}
              >
                Cancel
              </button>

              <SignInButton className="btn bg-purple hover:bg-purple-light disabled:bg-purple-light transform gap-2 border-0 border-none px-4 shadow-lg transition-all duration-300 ease-in-out hover:brightness-95 disabled:animate-pulse disabled:!cursor-wait md:w-[150px]" />
            </div>
          </div>
        </div>
      </CustomModal>

      {/* PURCHASE DIALOG */}
      <CustomModal
        isOpen={buyDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setBuyDialogVisible(false);
        }}
        className={`md:max-h-[400px] md:w-[550px]`}
      >
        {currentItem && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
            <div className="flex flex-row p-4">
              <h1 className="grow"></h1>
              <button
                type="button"
                className="btn btn-circle text-gray-dark hover:bg-gray"
                onClick={() => {
                  setBuyDialogVisible(false);
                }}
              >
                <IoMdClose className="h-6 w-6"></IoMdClose>
              </button>
            </div>
            <div className="flex flex-col items-center justify-center gap-4">
              {currentItem?.imageURL && (
                <div className="border-green-dark -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg">
                  <Image
                    src={currentItem?.imageURL ?? ""}
                    alt="Icon Zlto"
                    width={40}
                    className="h-auto"
                    sizes="100vw"
                    priority={true}
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

              <div className="-mt-2 flex grow gap-4">
                <button
                  type="button"
                  className="btn bg-purple hover:bg-purple rounded-full text-white normal-case hover:text-white md:w-[150px]"
                  onClick={() => {
                    onBuyConfirm(currentItem);
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="btn border-purple text-purple hover:bg-purple rounded-full bg-white normal-case hover:text-white md:w-[150px]"
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
      </CustomModal>

      {/* PURCHASE CONFIRMATION DIALOG */}
      <CustomModal
        isOpen={buyDialogConfirmationVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setBuyDialogConfirmationVisible(false);
        }}
        className={`md:max-h-[520px] md:w-[550px]`}
      >
        {currentItem && (
          <div className="pb-12x flex h-full flex-col gap-2 overflow-y-auto pb-6">
            <div className="flex flex-row p-4">
              <h1 className="grow"></h1>
              <button
                type="button"
                className="btn btn-circle text-gray-dark hover:bg-gray"
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

              <div className="border-gray flex w-full flex-col gap-4 rounded-lg border-2 border-dotted p-4 text-center">
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

              <div className="flex grow gap-4">
                <Link
                  href="/yoid/wallet"
                  className="btn bg-purple hover:bg-purple rounded-full text-white normal-case hover:text-white md:w-[150px]"
                >
                  My Products
                </Link>

                <button
                  type="button"
                  className="btn border-purple text-purple hover:bg-purple rounded-full bg-white normal-case hover:text-white md:w-[150px]"
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
      </CustomModal>

      {/* PURCHASE ERROR DIALOG */}
      <CustomModal
        isOpen={buyDialogErrorVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setBuyDialogErrorVisible(false);
        }}
        className={`md:max-h-[350px] md:w-[550px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
          <div className="flex flex-row p-4">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
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

            <div className="mt-4 flex grow gap-4">
              <button
                type="button"
                className="btn bg-purple hover:bg-purple rounded-full text-white normal-case hover:text-white md:w-[150px]"
                onClick={() => {
                  setBuyDialogErrorVisible(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* PURCHASE LOCKED DIALOG */}
      <CustomModal
        isOpen={itemLockedDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setItemLockedDialogVisible(false);
        }}
        className={`md:max-h-[350px] md:w-[550px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
          <div className="flex flex-row p-4">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={() => {
                setItemLockedDialogVisible(false);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            {currentItem?.imageURL && (
              <div className="relative -mt-8 h-12 w-12 cursor-pointer overflow-hidden rounded-full shadow">
                <Image
                  src={currentItem?.imageURL}
                  alt={`${currentItem.name} Logo`}
                  width={48}
                  className="h-auto"
                />
                {currentItem?.storeAccessControlRuleResult?.locked && (
                  <div className="bg-gray-dark/50 absolute inset-0 flex items-center justify-center">
                    <FaLock className="text-white" />
                  </div>
                )}
              </div>
            )}

            <h3 className="text-center">Purchase Locked</h3>

            <div className="flex flex-col items-center justify-center gap-4">
              <div className="rounded-lg p-2 text-center md:w-[450px]">
                This item is currently locked for purchase:
                <br />
                <br />
                {currentItem?.storeAccessControlRuleResult?.rules?.map(
                  (rule, ruleIndex) => (
                    <div key={`rule_${ruleIndex}`}>
                      <ul>
                        {rule.reasons
                          .filter((x) => x.conditionPassed == false)
                          .map((reason, reasonIndex) => (
                            <li key={`reason_${reasonIndex}`}>
                              <div className="flex flex-row items-center gap-2">
                                <IoMdCloseCircleOutline className="h-6 w-6 text-red-400" />

                                <p className="text-sm">{reason.reason}</p>
                              </div>

                              <ul className="list-insidex mt-2 ml-10 list-disc text-left">
                                {reason.links?.map((link, linkIndex) => (
                                  <li key={`link_${linkIndex}`}>
                                    <Link
                                      key={`link_${linkIndex}`}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue text-sm hover:underline"
                                    >
                                      {link.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="mt-4 flex grow gap-4">
              <button
                type="button"
                className="btn bg-purple hover:bg-purple rounded-full text-white normal-case hover:text-white md:w-[150px]"
                onClick={() => {
                  setItemLockedDialogVisible(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* MAIN CONTENT */}
      <div className="flex w-full flex-col gap-4 md:max-w-7xl">
        {/* FILTER: COUNTRY */}
        <div className="flex flex-row items-center justify-start gap-4">
          <div className="text-gray-dark text-sm font-semibold">Filter by:</div>
          <Select
            instanceId={"country"}
            classNames={{
              control: () => "input input-xs w-[200px]",
            }}
            options={countryOptions}
            onChange={(val) => onFilterCountry(val?.value ?? "")}
            value={countryOptions?.find(
              (c) => c.value === (country?.toString() ?? COUNTRY_CODE_WW),
            )}
            placeholder="Country"
            // fix menu z-index issue
            menuPortalTarget={myRef.current}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>

        {/* RESULTS */}
        <div className="mt-4 flex flex-col">
          {/* anonymous users */}
          {!session &&
            sessionStatus != "loading" &&
            renderStoreItems(data_storeItems)}

          {/* authenticated users */}
          {!!session && sessionStatus == "authenticated" && (
            <Suspense
              isLoading={
                isLoading_storeItems_authenticated ||
                !data_storeItems_authenticated?.data_storeItems
              }
              error={error_storeItems_authenticated}
              loader={<LoadingSkeleton rows={3} columns={3} />}
            >
              {renderStoreItems(
                data_storeItems_authenticated?.data_storeItems ?? [],
              )}
            </Suspense>
          )}
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
