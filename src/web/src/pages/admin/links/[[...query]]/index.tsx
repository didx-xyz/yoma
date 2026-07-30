import { useQueryClient } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { IoMdCalendar, IoMdClose, IoMdLock, IoMdPerson } from "react-icons/io";
import { IoShareSocialOutline } from "react-icons/io5";
import Moment from "react-moment";
import {
  ActionLinkStatus,
  type LinkInfo,
  type LinkSearchFilter,
} from "~/api/models/actionLinks";
import type { SelectOption } from "~/api/models/lookups";
import { getLinkById } from "~/api/services/actionLinks";
import {
  BTN_DIALOG_CLOSE,
  BTN_SECONDARY,
} from "~/components/Common/buttonStyles";
import CustomModal from "~/components/Common/CustomModal";
import LinkAdminFilterBadges from "~/components/Links/LinkAdminFilterBadges";
import ListPageSearchToolbar from "~/components/Common/ListPage/ListPageSearchToolbar";
import ListPageStatusTabs from "~/components/Common/ListPage/ListPageStatusTabs";
import {
  ListPagePagination,
  ListPageResults,
} from "~/components/Common/ListPage/ListPageResults";
import {
  buildListPageQueryString,
  getAppliedFilterCount,
  getFilterKeyParts,
  isSearchPerformed as getIsSearchPerformed,
  parseStatusTab,
  type ListPageRouterQuery,
} from "~/components/Common/ListPage/listPageFilter";
import MainLayout from "~/components/Layout/Main";
import LinkAdminFilterVertical, {
  LinkAdminFilterOptions,
} from "~/components/Links/LinkAdminFilterVertical";
import {
  isLinkFilterMappingReady,
  LINK_ADMIN_FILTER_SPEC,
  LINK_STATUS_PARAM,
  mapLinkFilterToApi,
  parseLinkFilterFromQuery,
} from "~/components/Links/linkAdminFilter";
import { LinkActionOptions, LinkActions } from "~/components/Links/LinkActions";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  ACTION_LINK_QUERY_KEYS,
  useLinkStatusCountQuery,
  useLinksSearchQuery,
} from "~/hooks/useActionLinkMutations";
import {
  useAdminOpportunityOrganisationsQuery,
  useOpportunityTitlesByIdQuery,
} from "~/hooks/useOpportunityMutations";
import {
  DATE_FORMAT_HUMAN,
  PAGE_SIZE,
  ROLE_ADMIN,
  THEME_BLUE,
} from "~/lib/constants";
import { getSafeUrl } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { returnUrl } = context.query;

  // 👇 ensure authenticated and authorized
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }
  if (!session.user?.roles?.includes(ROLE_ADMIN)) {
    return {
      props: {
        error: 403,
      },
    };
  }

  // NB: the filters are driven by the querystring (router.query), not by props
  return {
    props: {
      error: null,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Links: NextPageWithLayout<{
  error?: number;
  returnUrl?: string;
}> = ({ error, returnUrl }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const myRef = useRef<HTMLDivElement>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeImageData, setQRCodeImageData] = useState<
    string | null | undefined
  >(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);

  // 👇 filters are driven by the querystring (shared vocabulary with /organisations/[id]/links)
  const routerQuery = router.query as ListPageRouterQuery;
  const status = useMemo(
    () => parseStatusTab(routerQuery, LINK_ADMIN_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  // display (name-based) filter — what the filter modal and the badges bind to
  const searchFilter = useMemo<LinkSearchFilter>(
    () =>
      parseLinkFilterFromQuery(routerQuery, LINK_ADMIN_FILTER_SPEC, PAGE_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const isSearchPerformed = useMemo(
    () => getIsSearchPerformed(routerQuery, LINK_ADMIN_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const appliedFilterCount = useMemo(
    () => getAppliedFilterCount(searchFilter, LINK_ADMIN_FILTER_SPEC),
    [searchFilter],
  );

  //#region LOOKUPS
  // NB: the same organisation lookup the admin opportunity search uses — action links are
  // always attached to an opportunity, so the two lists cover the same organisations
  const { data: lookups_organisations } = useAdminOpportunityOrganisationsQuery(
    { enabled: !error },
  );

  // the opportunity filter is id-based; resolve the titles for the badges & the picker
  const { data: lookups_entities } = useOpportunityTitlesByIdQuery(
    searchFilter.entities,
    { enabled: !error },
  );
  const entityOptions = useMemo<SelectOption[]>(
    () =>
      (lookups_entities?.items ?? []).map((item) => ({
        value: item.id,
        label: item.title,
      })),
    [lookups_entities],
  );
  //#endregion LOOKUPS

  // the filter values from the querystring are mapped to their corresponding id's
  const apiFilter = useMemo<LinkSearchFilter>(
    () =>
      mapLinkFilterToApi(searchFilter, {
        organisations: lookups_organisations,
      }),
    [searchFilter, lookups_organisations],
  );

  // only search once the lookups needed to map the applied filters have loaded
  const filterMappingReady = useMemo(
    () =>
      isLinkFilterMappingReady(searchFilter, {
        organisations: lookups_organisations,
      }),
    [searchFilter, lookups_organisations],
  );

  const filterKeyParts = useMemo(
    () => getFilterKeyParts(routerQuery, LINK_ADMIN_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  // QUERY: SEARCH RESULTS
  const {
    data: links,
    isLoading: isLoadingSearchResults,
    isPlaceholderData: isShowingPreviousResults,
  } = useLinksSearchQuery(null, apiFilter, filterKeyParts, {
    enabled: !error && filterMappingReady,
  });

  // status tab counts — these honour every applied filter
  const countsEnabled = !error && filterMappingReady;
  const { data: totalCountAll } = useLinkStatusCountQuery(
    null,
    apiFilter,
    null,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountActive } = useLinkStatusCountQuery(
    null,
    apiFilter,
    ActionLinkStatus.Active,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountInactive } = useLinkStatusCountQuery(
    null,
    apiFilter,
    ActionLinkStatus.Inactive,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountExpired } = useLinkStatusCountQuery(
    null,
    apiFilter,
    ActionLinkStatus.Expired,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountLimitReached } = useLinkStatusCountQuery(
    null,
    apiFilter,
    ActionLinkStatus.LimitReached,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountDeleted } = useLinkStatusCountQuery(
    null,
    apiFilter,
    ActionLinkStatus.Deleted,
    filterKeyParts,
    { enabled: countsEnabled },
  );

  const tabCounts = useMemo(
    () => ({
      all: totalCountAll,
      [ActionLinkStatus.Active]: totalCountActive,
      [ActionLinkStatus.Inactive]: totalCountInactive,
      [ActionLinkStatus.Expired]: totalCountExpired,
      [ActionLinkStatus.LimitReached]: totalCountLimitReached,
      [ActionLinkStatus.Deleted]: totalCountDeleted,
    }),
    [
      totalCountAll,
      totalCountActive,
      totalCountInactive,
      totalCountExpired,
      totalCountLimitReached,
      totalCountDeleted,
    ],
  );

  // 🎈 FUNCTIONS
  const redirectWithSearchFilterParams = useCallback(
    (filter: LinkSearchFilter) => {
      let url = "/admin/links";
      const params = buildListPageQueryString(filter, LINK_ADMIN_FILTER_SPEC);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router],
  );

  // querystring of the current filters excluding status & paging (used by the tabs)
  const tabBaseParams = useMemo(
    () =>
      buildListPageQueryString(
        { ...searchFilter, statuses: null },
        LINK_ADMIN_FILTER_SPEC,
      ),
    [searchFilter],
  );

  // 🔔 CHANGE EVENTS
  const handlePagerChange = useCallback(
    (value: number) => {
      redirectWithSearchFilterParams({ ...searchFilter, pageNumber: value });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      redirectWithSearchFilterParams({
        ...searchFilter,
        pageNumber: 1,
        valueContains: query.length > 2 ? query : null,
      });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  // filter popup handlers
  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, []);

  const onSubmitFilter = useCallback(
    (filter: LinkSearchFilter) => {
      setFilterFullWindowVisible(false);
      // the status tab is preserved; paging is reset when filters change
      redirectWithSearchFilterParams({
        ...filter,
        statuses: filter.statuses ?? searchFilter.statuses,
        pageNumber: 1,
      });
    },
    [redirectWithSearchFilterParams, searchFilter.statuses],
  );

  const onClick_GenerateQRCode = useCallback(
    (item: LinkInfo) => {
      // fetch the QR code
      queryClient
        .fetchQuery({
          queryKey: ACTION_LINK_QUERY_KEYS.detail(item.id, true),
          queryFn: () => getLinkById(item.id, true),
        })
        .then(() => {
          // get the QR code from the cache
          const qrCode = queryClient.getQueryData<LinkInfo | null>(
            ACTION_LINK_QUERY_KEYS.detail(item.id, true),
          );

          // show the QR code
          setQRCodeImageData(qrCode?.qrCodeBase64);
          setShowQRCode(true);
        });
    },
    [queryClient],
  );

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🔗 Links</title>
      </Head>

      <PageBackground className="h-[14.3rem] md:h-[18.4rem]" />

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* POPUP FILTER */}
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseFilter}
        className={`md:max-h-[400px] md:w-[500px]`}
      >
        {lookups_organisations && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto">
            <LinkAdminFilterVertical
              htmlRef={myRef.current!}
              searchFilter={searchFilter}
              lookups_organisations={lookups_organisations}
              entityOptions={entityOptions}
              onCancel={onCloseFilter}
              onSubmit={onSubmitFilter}
              filterOptions={[
                LinkAdminFilterOptions.ORGANIZATIONS,
                LinkAdminFilterOptions.ENTITIES,
              ]}
            />
          </div>
        )}
      </CustomModal>

      {/* QR CODE DIALOG */}
      <CustomModal
        isOpen={showQRCode}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setShowQRCode(false);
          setQRCodeImageData(null);
        }}
        className={`md:max-h-[650px] md:w-[600px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          {/* HEADER WITH CLOSE BUTTON */}
          <div className="bg-theme flex flex-row p-4 shadow-lg">
            <h1 className="grow"></h1>
            <button
              type="button"
              className={BTN_DIALOG_CLOSE}
              aria-label="Close"
              onClick={() => {
                setShowQRCode(false);
                setQRCodeImageData(null);
              }}
            >
              <IoMdClose className="h-5 w-5" />
            </button>
          </div>
          {/* MAIN CONTENT */}
          <div className="flex flex-col items-center justify-center gap-4 p-8">
            <div className="border-green-dark -mt-16 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <IoShareSocialOutline className="h-7 w-7" />
            </div>

            {/* QR CODE */}
            {showQRCode && qrCodeImageData && (
              <>
                <h5>Scan the QR Code with your device&apos;s camera</h5>
                <Image
                  src={qrCodeImageData}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="h-auto"
                />
              </>
            )}

            <button
              type="button"
              className={`${BTN_SECONDARY} mt-10 w-64`}
              onClick={() => {
                setShowQRCode(false);
                setQRCodeImageData(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </CustomModal>

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            🔗 Links <LimitedFunctionalityBadge />
          </h3>

          {/* TABBED NAVIGATION */}
          <ListPageStatusTabs
            basePath="/admin/links"
            baseParams={tabBaseParams}
            statusSpec={LINK_STATUS_PARAM}
            status={status}
            counts={tabCounts}
            idPrefix="link"
          />

          {/* SEARCH & FILTERS */}
          <ListPageSearchToolbar
            defaultValue={searchFilter.valueContains}
            onSearch={onSearchInputSubmit}
            openFilter={setFilterFullWindowVisible}
            appliedFilterCount={appliedFilterCount}
          />

          {/* APPLIED FILTER BADGES */}
          {appliedFilterCount > 0 && (
            <LinkAdminFilterBadges
              searchFilter={searchFilter}
              spec={LINK_ADMIN_FILTER_SPEC}
              entityOptions={entityOptions}
              onSubmit={onSubmitFilter}
              className="-ml-2"
            />
          )}
        </div>

        {/* MAIN CONTENT */}
        <ListPageResults
          isLoading={isLoadingSearchResults}
          isShowingPreviousResults={isShowingPreviousResults}
          id="results"
        >
          <div className="md:shadow-custom rounded-lg md:bg-white md:p-4">
            {/* NO ROWS */}
            {links && links.items?.length === 0 && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                <NoRowsMessage
                  title={"No links found"}
                  description={
                    isSearchPerformed || status !== null
                      ? "Please try refining your search query."
                      : "This is where you will find all the links that have been created."
                  }
                />
              </div>
            )}

            {/* GRID */}
            {links && links.items?.length > 0 && (
              <>
                {/* MOBILE */}
                <div className="flex flex-col gap-4 md:hidden">
                  {links.items.map((item) => (
                    <div
                      key={`sm_${item.id}`}
                      className="shadow-custom flex flex-col gap-2 rounded-lg bg-white p-4"
                    >
                      {/* Link & Actions */}
                      <div className="border-gray-light flex flex-row gap-2 border-b-2 pb-2">
                        <div className="flex w-full flex-col gap-1">
                          <Link
                            title={item.name}
                            href={`/organisations/${
                              item.entityOrganizationId
                            }/links/${item.id}${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl, router.asPath),
                            )}`}`}
                            className="text-gray-dark block w-full max-w-[300px] overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap underline"
                          >
                            {item.name}
                          </Link>
                          {item.description && (
                            <span
                              title={item.description}
                              className="block w-full max-w-[300px] overflow-hidden text-xs text-ellipsis whitespace-nowrap text-gray-500"
                            >
                              {item.description}
                            </span>
                          )}
                        </div>

                        <LinkActions
                          link={item}
                          onGenerateQRCode={onClick_GenerateQRCode}
                          returnUrl={returnUrl?.toString()}
                          actionOptions={[
                            LinkActionOptions.ACTIVATE,
                            LinkActionOptions.GO_TO_OVERVIEW,
                            LinkActionOptions.REMIND_PARTICIPANTS,
                            LinkActionOptions.COPY_LINK,
                            LinkActionOptions.GENERATE_QR_CODE,
                            LinkActionOptions.DELETE,
                          ]}
                        />
                      </div>

                      {/* Opportunity */}
                      <div className="flex flex-row items-start justify-between py-1">
                        <span className="text-gray-dark text-sm font-normal">
                          Opportunity
                        </span>
                        <span className="text-sm">
                          <Link
                            href={`/organisations/${
                              item.entityOrganizationId
                            }/opportunities/${
                              item.entityId
                            }/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl, router.asPath),
                            )}`}`}
                            className="text-gray-dark block max-w-[160px] overflow-hidden text-sm font-normal text-ellipsis whitespace-nowrap underline"
                          >
                            {item.entityTitle}
                          </Link>
                        </span>
                      </div>

                      {/* Organisation */}
                      <div className="flex flex-row items-start justify-between py-1">
                        <span className="text-gray-dark text-sm font-normal">
                          Organisation
                        </span>
                        <span className="text-sm">
                          <Link
                            href={`/organisations/dashboard?organisations=${
                              item.entityOrganizationId
                            }${`&returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl, router.asPath),
                            )}`}`}
                            className="text-gray-dark block max-w-[160px] overflow-hidden text-sm font-normal text-ellipsis whitespace-nowrap underline"
                          >
                            {item.entityOrganizationName}
                          </Link>
                        </span>
                      </div>

                      {/* Usage */}
                      <div className="flex flex-row items-center justify-between py-1">
                        <span className="text-gray-dark text-sm font-normal">
                          Usage
                        </span>
                        {item.lockToDistributionList ? (
                          <span className="badge bg-green-light text-yellow flex items-center">
                            <IoMdLock className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              {item.usagesTotal ?? "0"} /{" "}
                              {item.usagesLimit ?? "0"}
                            </span>
                          </span>
                        ) : (
                          <span className="badge bg-green-light text-green flex items-center">
                            <IoMdPerson className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              {item.usagesTotal ?? "0"} /{" "}
                              {item.usagesLimit ?? "0"}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Expires */}
                      <div className="flex flex-row items-center justify-between py-1">
                        <span className="text-gray-dark text-sm font-normal">
                          Expires
                        </span>
                        {item.dateEnd ? (
                          <span className="badge bg-yellow-light text-yellow flex items-center">
                            <IoMdCalendar className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                {item.dateEnd}
                              </Moment>
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">N/A</span>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex flex-row items-center justify-between py-1">
                        <span className="text-gray-dark text-sm font-normal">
                          Status
                        </span>
                        {item.status == "Active" && (
                          <span className="badge bg-blue-light text-blue">
                            Active
                          </span>
                        )}
                        {item.status == "Expired" && (
                          <span className="badge bg-green-light text-yellow">
                            Expired
                          </span>
                        )}
                        {item.status == "Inactive" && (
                          <span className="badge bg-yellow-tint text-yellow">
                            Inactive
                          </span>
                        )}
                        {item.status == "LimitReached" && (
                          <span className="badge bg-green-light text-red-400">
                            Limit Reached
                          </span>
                        )}
                        {item.status == "Deleted" && (
                          <span className="badge bg-green-light text-red-400">
                            Deleted
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* DEKSTOP */}
                <table className="border-gray-light hidden border-separate rounded-lg border-x-2 border-t-2 md:table md:table-auto">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light border-b-2 !py-4">
                        Link
                      </th>
                      <th className="border-gray-light border-b-2 !py-4">
                        Opportunity
                      </th>
                      <th className="border-gray-light border-b-2 !py-4">
                        Organisation
                      </th>
                      <th className="border-gray-light border-b-2">Usage</th>
                      <th className="border-gray-light border-b-2">Expires</th>
                      <th className="border-gray-light border-b-2">Status</th>
                      <th className="border-gray-light border-b-2 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.items.map((item) => (
                      <tr key={`grid_md_${item.id}`} className="">
                        {/* Link */}
                        <td className="border-gray-light w-[180px] max-w-[220px] border-b-2 !py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <Link
                              title={item.name}
                              href={`/organisations/${
                                item.entityOrganizationId
                              }/links/${
                                item.id
                              }${`?returnUrl=${encodeURIComponent(
                                getSafeUrl(returnUrl, router.asPath),
                              )}`}`}
                              className="text-gray-dark block w-full max-w-[160px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                            >
                              {item.name}
                            </Link>
                          </div>
                        </td>

                        {/* Opportunity */}
                        <td className="border-gray-light w-[180px] max-w-[180px] border-b-2 !py-4 align-top">
                          {item.entityType == "Opportunity" &&
                            item.entityOrganizationId && (
                              <Link
                                title={item.entityTitle}
                                href={`/organisations/${
                                  item.entityOrganizationId
                                }/opportunities/${
                                  item.entityId
                                }/info${`?returnUrl=${encodeURIComponent(
                                  getSafeUrl(returnUrl, router.asPath),
                                )}`}`}
                                className="text-gray-dark block w-full max-w-[160px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                              >
                                {item.entityTitle}
                              </Link>
                            )}
                          {item.entityType != "Opportunity" && (
                            <span
                              title={item.entityTitle}
                              className="block w-full max-w-[160px] overflow-hidden text-sm text-ellipsis whitespace-nowrap"
                            >
                              {item.entityTitle}
                            </span>
                          )}
                        </td>

                        {/* Organisation */}
                        <td className="border-gray-light w-[180px] max-w-[180px] border-b-2 !py-4 align-top">
                          {item.entityOrganizationId &&
                            item.entityOrganizationName && (
                              <Link
                                href={`/organisations/dashboard?organisations=${
                                  item.entityOrganizationId
                                }${`&returnUrl=${encodeURIComponent(
                                  getSafeUrl(returnUrl, router.asPath),
                                )}`}`}
                                className="text-gray-dark block w-full max-w-[160px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                              >
                                {item.entityOrganizationName}
                              </Link>
                            )}
                        </td>

                        <td className="border-gray-light border-b-2">
                          {item.lockToDistributionList && (
                            <span className="badge bg-green-light text-yellow">
                              <IoMdLock className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {item.usagesTotal ?? "0"} /{" "}
                                {item.usagesLimit !== null
                                  ? item.usagesLimit
                                  : "No limit"}
                              </span>
                            </span>
                          )}

                          {!item.lockToDistributionList && (
                            <span className="badge bg-green-light text-green">
                              <IoMdPerson className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {item.usagesTotal ?? "0"} /{" "}
                                {item.usagesLimit !== null
                                  ? item.usagesLimit
                                  : "No limit"}
                              </span>
                            </span>
                          )}
                        </td>

                        <td className="border-gray-light border-b-2">
                          {item.dateEnd ? (
                            <span className="badge bg-yellow-light text-yellow">
                              <IoMdCalendar className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                  {item.dateEnd}
                                </Moment>
                              </span>
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="border-gray-light border-b-2">
                          {item.status == "Active" && (
                            <span className="badge bg-blue-light text-blue">
                              Active
                            </span>
                          )}
                          {item.status == "Expired" && (
                            <span className="badge bg-green-light text-yellow">
                              Expired
                            </span>
                          )}
                          {item.status == "Inactive" && (
                            <span className="badge bg-yellow-tint text-yellow">
                              Inactive
                            </span>
                          )}
                          {item.status == "LimitReached" && (
                            <span className="badge bg-green-light text-red-400">
                              Limit Reached
                            </span>
                          )}
                          {item.status == "Deleted" && (
                            <span className="badge bg-green-light text-red-400">
                              Deleted
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="border-gray-light border-b-2 whitespace-nowrap">
                          <div className="flex flex-row items-center justify-center gap-2">
                            <LinkActions
                              link={item}
                              onGenerateQRCode={onClick_GenerateQRCode}
                              returnUrl={returnUrl?.toString()}
                              actionOptions={[
                                LinkActionOptions.ACTIVATE,
                                LinkActionOptions.GO_TO_OVERVIEW,
                                LinkActionOptions.REMIND_PARTICIPANTS,
                                LinkActionOptions.COPY_LINK,
                                LinkActionOptions.GENERATE_QR_CODE,
                                LinkActionOptions.DELETE,
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PAGINATION */}
                <ListPagePagination
                  currentPage={searchFilter.pageNumber ?? 1}
                  totalItems={links?.totalCount ?? 0}
                  pageSize={PAGE_SIZE}
                  onClick={handlePagerChange}
                  isShowingPreviousResults={isShowingPreviousResults}
                  className="mt-2"
                />
              </>
            )}
          </div>
        </ListPageResults>
      </div>
    </>
  );
};

Links.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

Links.theme = function getTheme() {
  return THEME_BLUE;
};

export default Links;
