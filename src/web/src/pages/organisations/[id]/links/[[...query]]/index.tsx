import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { FaPlusCircle } from "react-icons/fa";
import {
  IoIosSettings,
  IoMdCalendar,
  IoMdClose,
  IoMdLock,
  IoMdPerson,
} from "react-icons/io";
import { IoShareSocialOutline } from "react-icons/io5";
import Moment from "react-moment";
import {
  ActionLinkStatus,
  type LinkInfo,
  type LinkSearchFilter,
} from "~/api/models/actionLinks";
import type { SelectOption } from "~/api/models/lookups";
import { getLinkById } from "~/api/services/actionLinks";
import { BTN_SECONDARY } from "~/components/Common/buttonStyles";
import CustomModal from "~/components/Common/CustomModal";
import {
  MODAL_ACTION_WIDTH,
  ModalActions,
  ModalBody,
  ModalHeader,
} from "~/components/Common/ModalChrome";
import DropdownMenu from "~/components/Common/DropdownMenu";
import {
  ListPagePagination,
  ListPageResults,
} from "~/components/Common/ListPage/ListPageResults";
import {
  ListPageBody,
  ListPageHeader,
  ListPageShell,
} from "~/components/Common/ListPage/ListPageHeader";
import ListPageSearchToolbar, {
  LIST_PAGE_TOOLBAR_BUTTON_CLASSES,
} from "~/components/Common/ListPage/ListPageSearchToolbar";
import ListPageStatusTabs from "~/components/Common/ListPage/ListPageStatusTabs";
import {
  buildListPageQueryString,
  getAppliedFilterCount,
  getFilterKeyParts,
  isSearchPerformed as getIsSearchPerformed,
  parseStatusTab,
  type ListPageRouterQuery,
} from "~/components/Common/ListPage/listPageFilter";
import MainLayout from "~/components/Layout/Main";
import { LinkActionOptions, LinkActions } from "~/components/Links/LinkActions";
import LinkAdminFilterBadges from "~/components/Links/LinkAdminFilterBadges";
import LinkAdminFilterVertical, {
  LinkAdminFilterOptions,
} from "~/components/Links/LinkAdminFilterVertical";
import {
  LINK_ORG_ADMIN_FILTER_SPEC,
  LINK_STATUS_PARAM,
  mapLinkFilterToApi,
  parseLinkFilterFromQuery,
} from "~/components/Links/linkAdminFilter";
import NoRowsMessage from "~/components/NoRowsMessage";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  ACTION_LINK_QUERY_KEYS,
  useLinkStatusCountQuery,
  useLinksSearchQuery,
} from "~/hooks/useActionLinkMutations";
import { useOpportunityTitlesByIdQuery } from "~/hooks/useOpportunityMutations";
import { DATE_FORMAT_HUMAN, PAGE_SIZE } from "~/lib/constants";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
}

const getErrorStatus = (error: unknown): number | null => {
  if (!axios.isAxiosError(error)) return null;
  return error.response?.status ?? null;
};

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { returnUrl } = context.query;
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  // NB: the filters are driven by the querystring (router.query), not by props
  return {
    props: {
      id: id,
      theme: theme,
      error: null,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Links: NextPageWithLayout<{
  id: string;
  theme: string;
  error?: number;
  returnUrl?: string;
}> = ({ id, error, returnUrl }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const myRef = useRef<HTMLDivElement>(null);
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeImageData, setQRCodeImageData] = useState<
    string | null | undefined
  >(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);

  // 👇 filters are driven by the querystring (shared vocabulary with /admin/links)
  const routerQuery = router.query as ListPageRouterQuery;
  const status = useMemo(
    () => parseStatusTab(routerQuery, LINK_ORG_ADMIN_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  // display filter — what the filter modal and the badges bind to
  const searchFilter = useMemo<LinkSearchFilter>(
    () =>
      parseLinkFilterFromQuery(
        routerQuery,
        LINK_ORG_ADMIN_FILTER_SPEC,
        PAGE_SIZE,
        id,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query, id],
  );

  const isSearchPerformed = useMemo(
    () => getIsSearchPerformed(routerQuery, LINK_ORG_ADMIN_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const appliedFilterCount = useMemo(
    () => getAppliedFilterCount(searchFilter, LINK_ORG_ADMIN_FILTER_SPEC),
    [searchFilter],
  );

  //#region LOOKUPS
  // NB: the opportunity criteria search REQUIRES the organisation for the org-admin role
  const orgScope = useMemo(() => [id], [id]);

  // the opportunity filter is id-based; resolve the titles for the badges & the picker
  const { data: lookups_entities } = useOpportunityTitlesByIdQuery(
    searchFilter.entities,
    orgScope,
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

  // org-scoped page: the only mapping is the organisation, which is already an id
  const apiFilter = useMemo<LinkSearchFilter>(
    () => mapLinkFilterToApi(searchFilter, {}, id),
    [searchFilter, id],
  );

  const filterKeyParts = useMemo(
    () => getFilterKeyParts(routerQuery, LINK_ORG_ADMIN_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const {
    data: links,
    isLoading: isLoadingSearchResults,
    isPlaceholderData: isShowingPreviousResults,
    error: linksError,
  } = useLinksSearchQuery(id, apiFilter, filterKeyParts, {
    enabled: !error,
  });
  const resolvedError = error ?? getErrorStatus(linksError) ?? undefined;

  // status tab counts — these honour every applied filter
  const { data: totalCountAll } = useLinkStatusCountQuery(
    id,
    apiFilter,
    null,
    filterKeyParts,
    { enabled: !error },
  );
  const { data: totalCountActive } = useLinkStatusCountQuery(
    id,
    apiFilter,
    ActionLinkStatus.Active,
    filterKeyParts,
    { enabled: !error },
  );
  const { data: totalCountInactive } = useLinkStatusCountQuery(
    id,
    apiFilter,
    ActionLinkStatus.Inactive,
    filterKeyParts,
    { enabled: !error },
  );
  const { data: totalCountExpired } = useLinkStatusCountQuery(
    id,
    apiFilter,
    ActionLinkStatus.Expired,
    filterKeyParts,
    { enabled: !error },
  );
  const { data: totalCountLimitReached } = useLinkStatusCountQuery(
    id,
    apiFilter,
    ActionLinkStatus.LimitReached,
    filterKeyParts,
    { enabled: !error },
  );
  const { data: totalCountDeleted } = useLinkStatusCountQuery(
    id,
    apiFilter,
    ActionLinkStatus.Deleted,
    filterKeyParts,
    { enabled: !error },
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
      let url = `/organisations/${id}/links`;
      const params = buildListPageQueryString(
        filter,
        LINK_ORG_ADMIN_FILTER_SPEC,
      );
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, router],
  );

  // querystring of the current filters excluding status & paging (used by the tabs)
  const tabBaseParams = useMemo(
    () =>
      buildListPageQueryString(
        { ...searchFilter, statuses: null },
        LINK_ORG_ADMIN_FILTER_SPEC,
      ),
    [searchFilter],
  );

  //#region Event Handlers
  const onSearch = useCallback(
    (query: string) => {
      redirectWithSearchFilterParams({
        ...searchFilter,
        pageNumber: 1,
        valueContains: query.length > 2 ? query : null,
      });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const handlePagerChange = useCallback(
    (value: number) => {
      redirectWithSearchFilterParams({ ...searchFilter, pageNumber: value });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, []);

  const onCloseQRCode = useCallback(() => {
    setShowQRCode(false);
    setQRCodeImageData(null);
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
  //#endregion Event Handlers

  if (resolvedError) {
    if (resolvedError === 401) return <Unauthenticated />;
    else if (resolvedError === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🔗 Links</title>
      </Head>

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* POPUP FILTER */}
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseFilter}
        className={`md:max-h-[400px] md:w-[600px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <LinkAdminFilterVertical
            htmlRef={myRef.current!}
            searchFilter={searchFilter}
            lookups_organisations={[]} // org-scoped page: not applicable
            organizationId={id} // scopes the opportunity search
            entityOptions={entityOptions}
            onCancel={onCloseFilter}
            onSubmit={onSubmitFilter}
            filterOptions={[LinkAdminFilterOptions.ENTITIES]}
          />
        </div>
      </CustomModal>

      {/* QR CODE DIALOG */}
      <CustomModal
        isOpen={showQRCode}
        shouldCloseOnOverlayClick={false}
        onRequestClose={onCloseQRCode}
        className={`md:max-h-[650px] md:w-[600px]`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <ModalHeader
            title="QR code"
            icon={<IoShareSocialOutline className="h-5 w-5" />}
            onClose={onCloseQRCode}
          />

          <ModalBody>
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
          </ModalBody>

          <ModalActions>
            <button
              type="button"
              className={`${BTN_SECONDARY} ${MODAL_ACTION_WIDTH}`}
              onClick={onCloseQRCode}
            >
              <IoMdClose className="h-5 w-5" />
              Close
            </button>
          </ModalActions>
        </div>
      </CustomModal>

      <ListPageShell>
        <ListPageHeader
          title={
            <>
              🔗 Links <LimitedFunctionalityBadge />
            </>
          }
          description="Links that let youth claim your opportunities instantly, with usage limits and expiry."
        >
          {/* TABBED NAVIGATION */}
          <ListPageStatusTabs
            basePath={`/organisations/${id}/links`}
            baseParams={tabBaseParams}
            statusSpec={LINK_STATUS_PARAM}
            status={status}
            counts={tabCounts}
            idPrefix="link"
          />
        </ListPageHeader>

        {/* MAIN CONTENT */}
        <ListPageBody>
          {/* SEARCH & FILTERS */}
          <ListPageSearchToolbar
            defaultValue={searchFilter.valueContains}
            onSearch={onSearch}
            openFilter={setFilterFullWindowVisible}
            appliedFilterCount={appliedFilterCount}
          >
            <DropdownMenu
              label="Actions"
              triggerIcon={<IoIosSettings className="h-5 w-5" />}
              // sized & coloured to match the Filters button next to it
              className="w-full md:w-40"
              buttonClassName={LIST_PAGE_TOOLBAR_BUTTON_CLASSES}
              items={[
                {
                  label: "Add link",
                  href: `/organisations/${id}/links/create${`?returnUrl=${encodeURIComponent(
                    getSafeUrl(returnUrl, router.asPath),
                  )}`}`,
                  icon: <FaPlusCircle className="h-4 w-4" />,
                  disabled: currentOrganisationInactive,
                  disabledTooltip:
                    "Links cannot be created while the organisation is inactive",
                  id: "btnCreateLink",
                },
              ]}
            />
          </ListPageSearchToolbar>
          {/* APPLIED FILTER BADGES */}
          {appliedFilterCount > 0 && (
            <LinkAdminFilterBadges
              searchFilter={searchFilter}
              spec={LINK_ORG_ADMIN_FILTER_SPEC}
              entityOptions={entityOptions}
              onSubmit={onSubmitFilter}
              className="-ml-2"
            />
          )}
          <ListPageResults
            isLoading={isLoadingSearchResults}
            isShowingPreviousResults={isShowingPreviousResults}
            id="results"
          >
            {/* NO ROWS */}
            {links && links.items?.length === 0 && (
              <>
                {/* ALL TAB, NO FILTERS */}
                {!isSearchPerformed && status === null && (
                  <div className="flex flex-col items-center">
                    <NoRowsMessage
                      title={"Welcome to Links!"}
                      description={
                        "Create a link to auto-verify participants for your opportunities!<br/><br/>When the link is clicked, Youth will enter Yoma to claim their opportunity.<br/><br/>The link needs limits on usage and an expiry date.<br/><br/>Create a QR code from your link, and let youth scan to complete."
                      }
                      icon="🚀"
                    />
                  </div>
                )}

                {/* OTHER TABS / FILTERED */}
                {(isSearchPerformed || status !== null) && (
                  <div className="flex flex-col items-center">
                    <NoRowsMessage
                      title={"No links found"}
                      description={"Please try refining your search query."}
                    />
                  </div>
                )}
              </>
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
                      <div className="flex flex-row gap-2">
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
                          organizationId={id}
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
                              {item.usagesLimit !== null
                                ? item.usagesLimit
                                : "No limit"}
                            </span>
                          </span>
                        ) : (
                          <span className="badge bg-green-light text-green flex items-center">
                            <IoMdPerson className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              {item.usagesTotal ?? "0"} /{" "}
                              {item.usagesLimit !== null
                                ? item.usagesLimit
                                : "No limit"}
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
                <table className="border-gray-light hidden border-separate rounded-lg bg-white md:table md:table-auto">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light !py-4">Link</th>
                      <th className="border-gray-light !py-4">Opportunity</th>
                      <th className="border-gray-light">Usage</th>
                      <th className="border-gray-light">Expires</th>
                      <th className="border-gray-light">Status</th>
                      <th className="border-gray-light text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.items.map((item) => (
                      <tr key={`grid_md_${item.id}`} className="">
                        {/* Link */}
                        <td className="border-gray-light w-[180px] max-w-[220px] border-t-2 !py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <Link
                              title={item.name}
                              href={`/organisations/${
                                item.entityOrganizationId
                              }/links/${item.id}${`?returnUrl=${encodeURIComponent(
                                getSafeUrl(returnUrl, router.asPath),
                              )}`}`}
                              className="text-gray-dark block w-full max-w-[160px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                            >
                              {item.name}
                            </Link>
                          </div>
                        </td>

                        {/* Opportunity */}
                        <td className="border-gray-light w-[180px] max-w-[180px] border-t-2 !py-4 align-top">
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

                        <td className="border-gray-light border-t-2">
                          {item.lockToDistributionList && (
                            <span className="badge bg-green-light text-yellow">
                              <IoMdLock className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {item.usagesTotal ?? "0"} /{" "}
                                {item.usagesLimit ?? "0"}
                              </span>
                            </span>
                          )}

                          {!item.lockToDistributionList && (
                            <span className="badge bg-green-light text-green">
                              <IoMdPerson className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {item.usagesTotal ?? "0"} /{" "}
                                {item.usagesLimit ?? "0"}
                              </span>
                            </span>
                          )}
                        </td>

                        <td className="border-gray-light border-t-2">
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
                        <td className="border-gray-light border-t-2">
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

                        {/* BUTTONS */}
                        <td className="border-gray-light border-t-2 whitespace-nowrap">
                          <div className="flex flex-row items-center justify-center gap-2">
                            {/* ACTIONS */}
                            <LinkActions
                              link={item}
                              onGenerateQRCode={onClick_GenerateQRCode}
                              returnUrl={returnUrl?.toString()}
                              organizationId={id}
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
          </ListPageResults>
        </ListPageBody>
      </ListPageShell>
    </>
  );
};

Links.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Links.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default Links;
