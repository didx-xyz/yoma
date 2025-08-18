import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import {
  IoIosAdd,
  IoMdCalendar,
  IoMdClose,
  IoMdLock,
  IoMdPerson,
} from "react-icons/io";
import { IoShareSocialOutline } from "react-icons/io5";
import Moment from "react-moment";
import { toast } from "react-toastify";
import {
  LinkAction,
  LinkEntityType,
  LinkStatus,
  type LinkInfo,
  type LinkSearchFilter,
  type LinkSearchResult,
} from "~/api/models/actionLinks";
import { getLinkById, searchLinks } from "~/api/services/actionLinks";
import CustomSlider from "~/components/Carousel/CustomSlider";
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import {
  LinkFilterOptions,
  LinkSearchFilters,
} from "~/components/Links/LinkSearchFilter";
import { LinkActionOptions, LinkActions } from "~/components/Links/LinkActions";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { DATE_FORMAT_HUMAN, PAGE_SIZE } from "~/lib/constants";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
  type?: string;
  action?: string;
  status?: string;
  entities?: string;
  page?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { type, action, statuses, entities, valueContains, page, returnUrl } =
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

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  return {
    props: {
      id: id,
      type: type ?? null,
      action: action ?? null,
      statuses: statuses ?? null,
      entities: entities ?? null,
      valueContains: valueContains ?? null,
      page: page ?? null,
      theme: theme,
      error: null,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Links: NextPageWithLayout<{
  id: string;
  type?: string;
  action?: string;
  statuses?: string;
  entities?: string;
  valueContains?: string;
  page?: string;
  theme: string;
  error?: number;
  returnUrl?: string;
}> = ({
  id,
  type,
  action,
  statuses,
  entities,
  valueContains,
  page,
  error,
  returnUrl,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeImageData, setQRCodeImageData] = useState<
    string | null | undefined
  >(null);
  const [isLoading] = useState(false);

  // 👇 use prefetched queries from server
  const { data: links } = useQuery<LinkSearchResult>({
    queryKey: [
      "Links",
      id,
      type ?? "",
      action ?? "",
      statuses ?? "",
      entities ?? "",
      valueContains ?? "",
      page ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.toString().split("|") : null,
        organizations: [id],
        statuses: statuses ? statuses.toString().split("|") : null,
        valueContains: valueContains ?? null,
      }),
    enabled: !error,
  });
  const { data: totalCountAll } = useQuery<number>({
    queryKey: [
      "Links_TotalCount",
      id,
      null,
      type ?? "",
      action ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.toString().split("|") : null,
        organizations: [id],
        statuses: null,
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountActive } = useQuery<number>({
    queryKey: [
      "Links_TotalCount",
      id,
      LinkStatus.Active,
      type ?? "",
      action ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.toString().split("|") : null,
        organizations: [id],
        statuses: [LinkStatus.Active],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountInactive } = useQuery<number>({
    queryKey: [
      "Links_TotalCount",
      id,
      LinkStatus.Inactive,
      type ?? "",
      action ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.toString().split("|") : null,
        organizations: [id],
        statuses: [LinkStatus.Inactive],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountExpired } = useQuery<number>({
    queryKey: [
      "Links_TotalCount",
      id,
      LinkStatus.Expired,
      type ?? "",
      action ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.toString().split("|") : null,
        organizations: [id],
        statuses: [LinkStatus.Expired],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountLimitReached } = useQuery<number>({
    queryKey: [
      "Links_TotalCount",
      id,
      LinkStatus.LimitReached,
      type ?? "",
      action ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.toString().split("|") : null,
        organizations: [id],
        statuses: [LinkStatus.LimitReached],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountDeleted } = useQuery<number>({
    queryKey: [
      "Links_TotalCount",
      id,
      LinkStatus.Deleted,
      type ?? "",
      action ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.toString().split("|") : null,
        organizations: [id],
        statuses: [LinkStatus.Deleted],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });

  // search filter state
  const [searchFilter] = useState<LinkSearchFilter>({
    pageNumber: page ? parseInt(page.toString()) : 1,
    pageSize: PAGE_SIZE,
    entityType: type ?? LinkEntityType.Opportunity,
    action: action ?? LinkAction.Verify,
    entities: entities ? entities.toString().split("|") : null,
    statuses: statuses ? statuses.toString().split("|") : null,
    organizations: [id],
    valueContains: valueContains ?? null,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: LinkSearchFilter) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (
        searchFilter?.entities?.length !== undefined &&
        searchFilter.entities.length > 0
      )
        params.append("entities", searchFilter.entities.join("|"));

      if (
        searchFilter?.statuses !== undefined &&
        searchFilter?.statuses !== null &&
        searchFilter?.statuses.length > 0
      )
        params.append("statuses", searchFilter?.statuses.join("|"));

      if (searchFilter?.valueContains)
        params.append("valueContains", searchFilter.valueContains);

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
    (filter: LinkSearchFilter) => {
      let url = `/organisations/${id}/links`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, router, getSearchFilterAsQueryString],
  );

  // filter popup handlers
  const onSubmitFilter = useCallback(
    (val: LinkSearchFilter) => {
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

  const onClick_CopyToClipboard = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!", { autoClose: 2000 });
  }, []);

  const onClick_GenerateQRCode = useCallback(
    (item: LinkInfo) => {
      // fetch the QR code
      queryClient
        .fetchQuery({
          queryKey: ["OpportunityLink", item.id],
          queryFn: () => getLinkById(item.id, true),
        })
        .then(() => {
          // get the QR code from the cache
          const qrCode = queryClient.getQueryData<LinkInfo | null>([
            "OpportunityLink",
            item.id,
          ]);

          // show the QR code
          setQRCodeImageData(qrCode?.qrCodeBase64);
          setShowQRCode(true);
        });
    },
    [queryClient],
  );

  const renderAddLinkButton = useCallback(() => {
    if (currentOrganisationInactive) {
      return (
        <span className="bg-theme flex w-56 cursor-not-allowed flex-row items-center justify-center rounded-full p-1 text-xs whitespace-nowrap text-white brightness-75">
          Add link (disabled)
        </span>
      );
    }

    return (
      <Link
        href={`/organisations/${id}/links/create${`?returnUrl=${encodeURIComponent(
          getSafeUrl(returnUrl, router.asPath),
        )}`}`}
        className="bg-theme btn btn-circle btn-secondary btn-sm shadow-custom h-fit w-fit !border-none p-1 text-xs whitespace-nowrap text-white brightness-105 md:p-2 md:px-4"
        id="btnCreateLink"
      >
        <IoIosAdd className="h-7 w-7 md:h-5 md:w-5" />
        <span className="hidden md:inline">Add link</span>
      </Link>
    );
  }, [currentOrganisationInactive, id, returnUrl, router]);

  // memo for isSearchPerformed based on filter parameters
  const isSearchPerformed = useMemo<boolean>(() => {
    return (
      type != undefined ||
      action != undefined ||
      statuses != undefined ||
      entities != undefined ||
      valueContains != undefined
    );
  }, [type, action, statuses, entities, valueContains]);

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

      {isLoading && <Loading />}

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
          <div className="bg-green flex flex-row p-4 shadow-lg">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={() => {
                setShowQRCode(false);
                setQRCodeImageData(null);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
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
              className="btn border-purple text-purple mt-10 rounded-full bg-white normal-case md:w-[150px]"
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
          <CustomSlider sliderClassName="!gap-6">
            <Link
              href={`/organisations/${id}/links`}
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
              href={`/organisations/${id}/links?statuses=active`}
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
              href={`/organisations/${id}/links?statuses=inactive`}
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
              href={`/organisations/${id}/links?statuses=expired`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                statuses === "expired"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Expired
              {(totalCountExpired ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountExpired}
                </div>
              )}
            </Link>
            <Link
              href={`/organisations/${id}/links?statuses=limitReached`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                statuses === "limitReached"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Limit Reached
              {(totalCountLimitReached ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountLimitReached}
                </div>
              )}
            </Link>
            <Link
              href={`/organisations/${id}/links?statuses=deleted`}
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

          {/* FILTERS */}
          <div className="flex w-full grow items-center justify-between gap-4 sm:justify-end">
            <LinkSearchFilters
              searchFilter={searchFilter}
              filterOptions={[
                LinkFilterOptions.VALUECONTAINS,
                LinkFilterOptions.ENTITIES,
              ]}
              onSubmit={(e) => onSubmitFilter(e)}
            />

            {renderAddLinkButton()}
          </div>
        </div>

        <div className="md:shadow-custom rounded-lg md:bg-white md:p-4">
          {/* NO ROWS */}
          {links && links.items?.length === 0 && (
            <>
              {/* ALL TAB */}
              {!isSearchPerformed && (
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

              {/* OTHER TABS */}
              {isSearchPerformed && (
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
                        onCopyToClipboard={onClick_CopyToClipboard}
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
              <table className="border-gray-light hidden border-separate rounded-lg border-x-2 border-t-2 md:table md:table-auto">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th className="border-gray-light border-b-2 !py-4">Link</th>
                    <th className="border-gray-light border-b-2 !py-4">
                      Opportunity
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
                            }/links/${item.id}${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl, router.asPath),
                            )}`}`}
                            className="text-gray-dark block w-full max-w-[160px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                          >
                            {item.name}
                          </Link>
                          {/* {item.description && (
                            <span
                              title={item.description}
                              className="block w-full max-w-[160px] overflow-hidden text-xs text-ellipsis whitespace-nowrap text-gray-500"
                            >
                              {item.description}
                            </span>
                          )} */}
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

                      <td className="border-gray-light border-b-2">
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

                      {/* BUTTONS */}
                      <td className="border-gray-light border-b-2 whitespace-nowrap">
                        <div className="flex flex-row items-center justify-center gap-2">
                          {/* ACTIONS */}
                          <LinkActions
                            link={item}
                            onCopyToClipboard={onClick_CopyToClipboard}
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
              <div className="mt-2 grid place-items-center justify-center">
                <PaginationButtons
                  currentPage={page ? parseInt(page) : 1}
                  totalItems={links?.totalCount ?? 0}
                  pageSize={PAGE_SIZE}
                  onClick={handlePagerChange}
                  showPages={false}
                  showInfo={true}
                />
              </div>
            </>
          )}
        </div>
      </div>
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
