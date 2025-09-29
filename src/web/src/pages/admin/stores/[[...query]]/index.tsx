import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import {
  IoIosAdd,
  IoIosSettings,
  IoMdCalendar,
  IoMdWarning,
} from "react-icons/io";
import Moment from "react-moment";
import { toast } from "react-toastify";
import { LinkStatus } from "~/api/models/actionLinks";
import {
  StoreAccessControlRuleStatus,
  type StoreAccessControlRuleInfo,
  type StoreAccessControlRuleSearchFilter,
  type StoreAccessControlRuleSearchResults,
} from "~/api/models/marketplace";
import {
  searchStoreAccessControlRule,
  updateStatusStoreAccessControlRule,
} from "~/api/services/marketplace";
import CustomSlider from "~/components/Carousel/CustomSlider";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { InfoModal } from "~/components/StoreAccessControlRule/InfoModal";
import {
  StoreAccessControlRuleSearchFilterOptions,
  StoreAccessControlRuleSearchFilters,
} from "~/components/StoreAccessControlRule/StoreAccessControlRuleSearchFilter";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import { DATE_FORMAT_HUMAN, PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import { analytics } from "~/lib/analytics";
import { getSafeUrl } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { nameContains, stores, organizations, statuses, page, returnUrl } =
    context.query;
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  return {
    props: {
      nameContains: nameContains ?? null,
      stores: stores ?? null,
      organizations: organizations ?? null,
      statuses: statuses ?? null,
      page: page ?? null,
      error: null,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Stores: NextPageWithLayout<{
  nameContains?: string;
  stores?: string;
  organizations?: string;
  statuses?: string;
  page?: string;
  error?: number;
  returnUrl?: string;
}> = ({
  nameContains,
  stores,
  organizations,
  statuses,
  page,
  error,
  returnUrl,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const modalContext = useConfirmationModalContext();
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  // 👇 use prefetched queries from server
  const { data: dataRules } = useQuery<StoreAccessControlRuleSearchResults>({
    queryKey: [
      "Admin",
      "StoreAccessControlRule",
      `${nameContains}_${stores}_${organizations}_${statuses}_${page}`,
    ],
    queryFn: () =>
      searchStoreAccessControlRule({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        nameContains: nameContains ?? null,
        stores: stores ? stores.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: statuses ? statuses.split("|") : null,
      }),
    enabled: !error,
  });
  const { data: totalCountAll } = useQuery<number>({
    queryKey: [
      "Admin",
      "StoreAccessControlRule",
      `${nameContains}_${stores}_${organizations}_${statuses}_${page}`,
      "TotalCount",
      null,
    ],
    queryFn: () =>
      searchStoreAccessControlRule({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        nameContains: nameContains ?? null,
        stores: stores ? stores.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountActive } = useQuery<number>({
    queryKey: [
      "Admin",
      "StoreAccessControlRule",
      `${nameContains}_${stores}_${organizations}_${statuses}_${page}`,
      "TotalCount",
      LinkStatus.Active,
    ],
    queryFn: () =>
      searchStoreAccessControlRule({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        nameContains: nameContains ?? null,
        stores: stores ? stores.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: [StoreAccessControlRuleStatus.Active],
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountInactive } = useQuery<number>({
    queryKey: [
      "Admin",
      "StoreAccessControlRule",
      `${nameContains}_${stores}_${organizations}_${statuses}_${page}`,
      "TotalCount",
      LinkStatus.Inactive,
    ],
    queryFn: () =>
      searchStoreAccessControlRule({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        nameContains: nameContains ?? null,
        stores: stores ? stores.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: [StoreAccessControlRuleStatus.Inactive],
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountDeleted } = useQuery<number>({
    queryKey: [
      "Admin",
      "StoreAccessControlRule",
      `${nameContains}_${stores}_${organizations}_${statuses}_${page}`,
      "TotalCount",
      LinkStatus.Deleted,
    ],
    queryFn: () =>
      searchStoreAccessControlRule({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        nameContains: nameContains ?? null,
        stores: stores ? stores.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: [StoreAccessControlRuleStatus.Deleted],
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });

  // search filter state
  const [searchFilter] = useState<StoreAccessControlRuleSearchFilter>({
    pageNumber: page ? parseInt(page) : 1,
    pageSize: PAGE_SIZE,
    nameContains: nameContains ?? null,
    stores: stores ? stores.split("|") : null,
    organizations: organizations ? organizations.split("|") : null,
    statuses: statuses ? statuses.split("|") : null,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: StoreAccessControlRuleSearchFilter) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (searchFilter?.nameContains)
        params.append("nameContains", searchFilter.nameContains);

      if (
        searchFilter?.organizations?.length !== undefined &&
        searchFilter.organizations.length > 0
      )
        params.append("organizations", searchFilter.organizations.join("|"));

      if (
        searchFilter?.stores?.length !== undefined &&
        searchFilter.stores.length > 0
      )
        params.append("stores", searchFilter.stores.join("|"));

      if (
        searchFilter?.statuses !== undefined &&
        searchFilter?.statuses !== null &&
        searchFilter?.statuses.length > 0
      )
        params.append("statuses", searchFilter?.statuses.join("|"));

      if (
        searchFilter.pageNumber !== null &&
        searchFilter.pageNumber !== undefined &&
        searchFilter.pageNumber !== 1
      )
        params.append("page", searchFilter.pageNumber.toString());

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: StoreAccessControlRuleSearchFilter) => {
      let url = `/admin/stores`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0) url = `${url}?${params}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
  );

  // filter popup handlers
  const onSubmitFilter = useCallback(
    (val: StoreAccessControlRuleSearchFilter) => {
      redirectWithSearchFilterParams(val);
    },
    [redirectWithSearchFilterParams],
  );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      searchFilter.pageNumber = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const updateRuleStatus = useCallback(
    async (id: string, status: StoreAccessControlRuleStatus) => {
      // show confirmation dialog
      // confirm dialog
      const result = await modalContext.showConfirmation(
        "",
        <div
          key="confirm-dialog-content"
          className="flex h-full flex-col space-y-2 text-gray-500"
        >
          <div className="flex flex-row items-center gap-2">
            <IoMdWarning className="text-warning h-6 w-6" />
            <p className="text-lg">Confirm</p>
          </div>

          <div>
            <p className="text-sm leading-6">
              {status === StoreAccessControlRuleStatus.Deleted && (
                <>
                  Are you sure you want to delete this rule?
                  <br />
                  This action cannot be undone.
                </>
              )}
              {status === StoreAccessControlRuleStatus.Active && (
                <>Are you sure you want to activate this rule?</>
              )}
              {status === StoreAccessControlRuleStatus.Inactive && (
                <>Are you sure you want to inactivate this rule?</>
              )}
            </p>
          </div>
        </div>,
      );
      if (!result) return;

      setIsLoading(true);

      try {
        // call api
        await updateStatusStoreAccessControlRule(id, status);

        // 📊 GOOGLE ANALYTICS: track event
        // 📊 ANALYTICS: track store access control rule status update
        analytics.trackEvent("store_access_control_rule_status_updated", {
          ruleId: id,
          status: status,
        });

        // invalidate cache
        // this will match all queries with the following prefixes ['Admin', 'Links', ...] (list data) & [''Admin', 'Links', 'TotalCount', ...] (tab counts)
        await queryClient.invalidateQueries({
          queryKey: ["Admin", "StoreAccessControlRule"],
          exact: false,
        });

        toast.success("Rule status updated");
      } catch (error) {
        toast(<ApiErrors error={error} />, {
          type: "error",
          toastId: "rule",
          autoClose: 2000,
          icon: false,
        });

        setIsLoading(false);

        return;
      }

      setIsLoading(false);
    },
    [queryClient, setIsLoading, modalContext],
  );

  const renderDropdown = (
    item: StoreAccessControlRuleInfo,
    className = "dropdown-left",
  ) => {
    if (
      item?.status !== "Inactive" &&
      item?.status !== "Active" &&
      item?.status !== "Declined"
    ) {
      return null;
    }

    return (
      <div className={`dropdown ${className} -mr-3 w-10 md:-mr-4`}>
        <button className="badge bg-green-light text-green">
          <IoIosSettings className="h-4 w-4" />
        </button>

        <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-52 p-2 shadow">
          {item?.status === "Active" && (
            <li>
              <button
                className="text-gray-dark flex flex-row items-center hover:brightness-50"
                onClick={() =>
                  updateRuleStatus(
                    item.id,
                    StoreAccessControlRuleStatus.Inactive,
                  )
                }
              >
                Make inactive
              </button>
            </li>
          )}
          {item?.status === "Inactive" && (
            <li>
              <button
                className="text-gray-dark flex flex-row items-center hover:brightness-50"
                onClick={() =>
                  updateRuleStatus(item.id, StoreAccessControlRuleStatus.Active)
                }
              >
                Make active
              </button>
            </li>
          )}

          {(item?.status === "Active" || item?.status === "Inactive") && (
            <>
              <li>
                <button
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() =>
                    router.push(
                      `/admin/stores/${item.id}?returnUrl=${encodeURIComponent(
                        getSafeUrl(returnUrl, router.asPath),
                      )}`,
                    )
                  }
                >
                  Edit
                </button>
              </li>
              <li>
                <button
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() =>
                    updateRuleStatus(
                      item.id,
                      StoreAccessControlRuleStatus.Deleted,
                    )
                  }
                >
                  Delete
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    );
  };

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🛒 Marketplace Store Access Rules</title>
      </Head>

      <PageBackground className="h-[14.8rem] md:h-[18.4rem]" />

      {isLoading && <Loading />}

      <InfoModal
        isOpen={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
      />
      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center truncate text-3xl font-semibold tracking-normal text-white md:mt-0 md:mb-9">
            🛒 Marketplace Store Access Rules
          </h3>

          {/* TABBED NAVIGATION */}
          <CustomSlider sliderClassName="!gap-6">
            <Link
              href={`/admin/stores`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                !statuses
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              All
              {(totalCountAll ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountAll}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/stores?statuses=active`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                statuses === "active"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Active
              {(totalCountActive ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountActive}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/stores?statuses=inactive`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                statuses === "inactive"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Inactive
              {(totalCountInactive ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountInactive}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/stores?statuses=deleted`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                statuses === "deleted"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Deleted
              {(totalCountDeleted ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountDeleted}
                </div>
              )}
            </Link>
          </CustomSlider>

          {/* INFO MESSAGE AND OPEN POPUP */}
          <FormMessage messageType={FormMessageType.Info}>
            Marketplace Store Access Rules control the visibility of a ZLTO
            store and its item categories to users. Click{" "}
            <button
              className="text-green underline"
              onClick={() => setInfoModalVisible(true)}
            >
              here
            </button>{" "}
            to learn more.
          </FormMessage>

          {/* SEARCH INPUT */}
          <div className="flex w-full grow items-center justify-between gap-4 sm:justify-end">
            {/* FILTER */}
            <StoreAccessControlRuleSearchFilters
              searchFilter={searchFilter}
              filterOptions={[
                StoreAccessControlRuleSearchFilterOptions.ORGANIZATIONS,
                StoreAccessControlRuleSearchFilterOptions.STORES,
              ]}
              onSubmit={(e) => onSubmitFilter(e)}
            />

            {/* ADD BUTTON */}
            <Link
              href={`/admin/stores/create${`?returnUrl=${encodeURIComponent(
                getSafeUrl(returnUrl, router.asPath),
              )}`}`}
              className="bg-theme btn btn-circle btn-secondary btn-sm shadow-custom h-fit w-fit !border-none p-1 text-xs whitespace-nowrap text-white brightness-105 md:p-2 md:px-4"
              id="btnCreateLink"
            >
              <IoIosAdd className="h-7 w-7 md:h-5 md:w-5" />
              <span className="hidden md:inline">Add Rule</span>
            </Link>
          </div>
        </div>

        <div className="md:shadow-custom rounded-lg md:bg-white md:p-4">
          {/* NO ROWS */}
          {dataRules && dataRules.items?.length === 0 && (
            <div className="flex h-fit flex-col items-center rounded-lg bg-white">
              <NoRowsMessage
                title={"No rules found"}
                description={"Please try refining your search query."}
              />
            </div>
          )}

          {/* GRID */}
          {dataRules && dataRules.items?.length > 0 && (
            <div className="">
              {/* MOBILE */}
              <div className="flex flex-col gap-4 md:hidden">
                {dataRules.items.map((item) => (
                  <div
                    key={`grid_xs_${item.id}`}
                    className="shadow-custom rounded-lg bg-white p-4"
                  >
                    <div className="mb-2 flex flex-col">
                      <Link
                        href={`/organisations/${
                          item.organizationId
                        }${`?returnUrl=${encodeURIComponent(
                          getSafeUrl(returnUrl, router.asPath),
                        )}`}`}
                        className="max-w-[340px] truncate text-sm font-bold text-black underline"
                      >
                        {item.organizationName}
                      </Link>

                      <span className="mt-2 max-w-[340px] truncate text-sm font-semibold">
                        {item.name}
                      </span>

                      <span className="font-semiboldx text-gray-dark max-w-[340px] truncate text-xs">
                        {item.description}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row justify-between">
                        <p className="text-xs font-bold tracking-widest">
                          Store
                        </p>
                        {item.store ? (
                          <span className="badge badge-primary">
                            {item.store.name}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </div>

                      <div className="flex flex-row justify-between">
                        <p className="text-xs font-bold tracking-widest">
                          Store Categories
                        </p>
                        {item.store ? (
                          <div className="flex flex-col">
                            {item?.storeItemCategories?.map((o) => (
                              <div key={o.id}>
                                <div className="text-gray-dark max-w-[200px] truncate overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                                  {o.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </div>

                      <div className="flex flex-row justify-between">
                        <span className="text-xs font-bold tracking-widest">
                          Age:
                        </span>
                        <span className="text-gray-dark text-xs font-semibold">
                          {item.ageFrom && item.ageTo
                            ? `From ${item.ageFrom} To ${item.ageTo}`
                            : item.ageFrom
                              ? `From ${item.ageFrom}`
                              : item.ageTo
                                ? `To ${item.ageTo}`
                                : "No age range specified"}
                        </span>
                      </div>

                      <div className="flex flex-row justify-between">
                        <span className="text-xs font-bold tracking-widest">
                          Gender:
                        </span>
                        <span className="text-gray-dark text-xs font-semibold">
                          {item.gender}
                        </span>
                      </div>

                      <div className="flex flex-row justify-between">
                        <span className="text-xs font-bold tracking-widest">
                          Opportunities:
                        </span>
                        <span>
                          {item?.opportunities?.map((o) => (
                            <div key={o.id} className="w-[200px] truncate">
                              <Link
                                href={`/organisations/${item.organizationId}/opportunities/${o.id}`}
                                className="text-gray-dark text-xs font-semibold underline"
                              >
                                {o.title}
                              </Link>
                            </div>
                          ))}
                        </span>
                      </div>

                      <div className="flex flex-row justify-between">
                        <p className="text-xs font-bold tracking-widest">
                          Date
                        </p>
                        {item.dateModified ? (
                          <span className="badge bg-yellow-light text-yellow">
                            <IoMdCalendar className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                {item.dateModified}
                              </Moment>
                            </span>
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </div>

                      <div className="flex flex-row justify-between">
                        <p className="text-xs font-bold tracking-widest">
                          Status
                        </p>
                        {item.status == "Active" && (
                          <span className="badge bg-blue-light text-blue">
                            Active
                          </span>
                        )}
                        {item.status == "Inactive" && (
                          <span className="badge bg-yellow-tint text-yellow">
                            Inactive
                          </span>
                        )}
                        {item.status == "Deleted" && (
                          <span className="badge bg-green-light text-red-400">
                            Deleted
                          </span>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex flex-row justify-center">
                        {renderDropdown(item, "dropdown-top")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DEKSTOP */}
              <table className="border-gray-light md:table-xs hidden border-separate rounded-lg border-x-2 border-t-2 md:table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th className="border-gray-light border-b-2 !py-4">
                      Organisation
                    </th>
                    <th className="border-gray-light border-b-2 !py-4">Name</th>
                    <th className="border-gray-light border-b-2">
                      Description
                    </th>
                    <th className="border-gray-light border-b-2 !py-4">
                      Store / Item Categories
                    </th>
                    <th className="border-gray-light border-b-2 !py-4">
                      Conditions
                    </th>
                    <th className="border-gray-light border-b-2">Date</th>
                    <th className="border-gray-light border-b-2">Status</th>
                    <th className="border-gray-light border-b-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRules.items.map((item) => (
                    <tr key={`grid_md_${item.id}`}>
                      <td className="border-gray-light max-w-[200px] truncate border-b-2 !py-4 !align-top">
                        <Link
                          href={`/organisations/${
                            item.organizationId
                          }${`?returnUrl=${encodeURIComponent(
                            getSafeUrl(returnUrl, router.asPath),
                          )}`}`}
                          className="text-gray-dark max-w-[80px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                        >
                          {item.organizationName}
                        </Link>
                      </td>

                      <td className="border-gray-light max-w-[100px] truncate border-b-2 !py-4 !align-top">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                          {item.name}
                        </div>
                      </td>

                      <td className="border-gray-light max-w-[100px] truncate border-b-2 !py-4 !align-top">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                          {item.description}
                        </div>
                      </td>

                      {/* <td className="max-w-[200px] truncate border-b-2 border-gray-light !py-4 !align-top">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                          <FormField
                            label="Country"
                            subLabel={item.store.countryName}
                          />
                        </div>
                      </td> */}

                      <td className="border-gray-light max-w-[200px] truncate border-b-2 !py-4 !align-top">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                          {item.store.name!}
                        </div>

                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                          {item.storeItemCategories?.map((item, index) => {
                            return (
                              <span
                                key={`storeItemCategories_${index}`}
                                className="text-gray-dark text-xs"
                              >
                                {item.name}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="border-gray-light max-w-[200px] truncate border-b-2 !py-4 !align-top">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[300px]">
                          <span className="mr-1 font-bold">Age:</span>
                          <span>
                            {item.ageFrom && item.ageTo
                              ? `From ${item.ageFrom} To ${item.ageTo}`
                              : item.ageFrom
                                ? `From ${item.ageFrom}`
                                : item.ageTo
                                  ? `To ${item.ageTo}`
                                  : "No age range specified"}
                          </span>
                        </div>

                        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                          <span className="mr-1 font-bold">Gender:</span>
                          <span>{item.gender}</span>
                        </div>

                        <div className="flex flex-col">
                          <span className="mr-1 font-bold">Opportunities:</span>
                          <span>
                            {item?.opportunities?.map((o) => (
                              <div key={o.id} className="w-[120px] truncate">
                                <Link
                                  href={`/organisations/${item.organizationId}/opportunities/${o.id}`}
                                  className="text-gray-dark text-xs font-semibold underline"
                                >
                                  {o.title}
                                </Link>
                              </div>
                            ))}
                          </span>
                        </div>
                      </td>

                      <td className="border-gray-light border-b-2 !py-4 !align-top">
                        {item.dateModified ? (
                          <span className="badge bg-yellow-light text-yellow">
                            <IoMdCalendar className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                {item.dateModified}
                              </Moment>
                            </span>
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="border-gray-light border-b-2 !py-4 !align-top">
                        {item.status == "Active" && (
                          <span className="badge bg-blue-light text-blue">
                            Active
                          </span>
                        )}
                        {item.status == "Inactive" && (
                          <span className="badge bg-yellow-tint text-yellow">
                            Inactive
                          </span>
                        )}

                        {item.status == "Deleted" && (
                          <span className="badge bg-green-light text-red-400">
                            Deleted
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="border-gray-light border-b-2 !py-4 !align-top">
                        {renderDropdown(item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
              <div className="mt-2 grid place-items-center justify-center">
                <PaginationButtons
                  currentPage={page ? parseInt(page) : 1}
                  totalItems={dataRules?.totalCount ?? 0}
                  pageSize={PAGE_SIZE}
                  onClick={handlePagerChange}
                  showPages={false}
                  showInfo={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

Stores.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

Stores.theme = function getTheme() {
  return THEME_BLUE;
};

export default Stores;
