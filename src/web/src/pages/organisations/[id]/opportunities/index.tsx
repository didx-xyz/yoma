import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconZlto from "public/images/icon-zlto.svg";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import { FaDownload, FaPlusCircle, FaRocket, FaUpload } from "react-icons/fa";
import { IoIosAdd, IoIosWarning } from "react-icons/io";
import { toast } from "react-toastify";
import {
  Status,
  type OpportunitySearchFilterAdmin,
  type OpportunitySearchResults,
} from "~/api/models/opportunity";
import { downloadVerificationFilesAdmin } from "~/api/services/myOpportunities";
import { getOpportunitiesAdmin } from "~/api/services/opportunities";
import CustomSlider from "~/components/Carousel/CustomSlider";
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import OpportunityExport from "~/components/Opportunity/Admin/OpportunityExport";
import { OpportunityImport } from "~/components/Opportunity/Admin/OpportunityImport";
import {
  OpportunityActions,
  OpportunityActionOptions,
} from "~/components/Opportunity/OpportunityActions";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { SearchInput } from "~/components/SearchInput";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
  status?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { query, page, status, returnUrl } = context.query;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

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

  try {
    // 👇 prefetch queries on server
    const data = await getOpportunitiesAdmin(
      {
        organizations: [id],
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        startDate: null,
        endDate: null,
        statuses:
          status === "active"
            ? [Status.Active]
            : status === "inactive"
              ? [Status.Inactive]
              : status === "expired"
                ? [Status.Expired]
                : status === "deleted"
                  ? [Status.Deleted]
                  : [
                      Status.Active,
                      Status.Expired,
                      Status.Inactive,
                      Status.Deleted,
                    ],
        types: null,
        categories: null,
        languages: null,
        countries: null,
        valueContains: query?.toString() ?? null,
        featured: null,
        engagementTypes: null,
      },
      context,
    );

    await queryClient.prefetchQuery({
      queryKey: [
        "opportunities",
        id,
        `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
      ],
      queryFn: () => data,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
          props: { theme: theme },
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      id: id,
      query: query ?? null,
      page: page ?? null,
      status: status ?? null,
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Opportunities: NextPageWithLayout<{
  id: string;
  query?: string;
  page?: string;
  theme: string;
  error?: number;
  status?: string;
  returnUrl?: string;
}> = ({ id, query, page, status, error, returnUrl }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // search filter state
  const searchFilter = useMemo<OpportunitySearchFilterAdmin>(
    () => ({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      organizations: [id],
      startDate: null,
      endDate: null,
      statuses: status
        ? status.toString().split("|")
        : [Status.Active, Status.Expired, Status.Inactive, Status.Deleted],
      types: null,
      categories: null,
      languages: null,
      countries: null,
      valueContains: query?.toString() ?? null,
      featured: null,
      engagementTypes: null,
    }),
    [id, page, query, status],
  );

  // 👇 use prefetched queries from server
  // NB: these queries (with ['opportunities', id]) will be invalidated by create/edit operations on other pages
  const { data: searchResults, isLoading: isLoadingSearchResults } =
    useQuery<OpportunitySearchResults>({
      queryKey: [
        "opportunities",
        id,
        `_${query?.toString()}_${page?.toString()}_${status?.toString()}`,
      ],
      queryFn: () => getOpportunitiesAdmin(searchFilter),
      enabled: !error,
    });

  const { data: totalCountAll } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      null,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [
        Status.Active,
        Status.Expired,
        Status.Inactive,
        Status.Deleted,
      ];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });
  const { data: totalCountActive } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      Status.Active,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [Status.Active];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });
  const { data: totalCountInactive } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      Status.Inactive,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [Status.Inactive];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });
  const { data: totalCountExpired } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      Status.Expired,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [Status.Expired];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });
  const { data: totalCountDeleted } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      Status.Deleted,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [Status.Deleted];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: OpportunitySearchFilterAdmin) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (
        searchFilter.valueContains !== undefined &&
        searchFilter.valueContains !== null &&
        searchFilter.valueContains.length > 0
      )
        params.append("query", searchFilter.valueContains);

      if (
        searchFilter?.statuses !== undefined &&
        searchFilter?.statuses !== null &&
        searchFilter?.statuses.length > 0 &&
        searchFilter?.statuses.length !== 4 // hack to prevent all" statuses from being added to the query string
      )
        params.append("status", searchFilter?.statuses.join("|"));

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
    (filter: OpportunitySearchFilterAdmin) => {
      let url = `/organisations/${id}/opportunities`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, router, getSearchFilterAsQueryString],
  );

  //#region Event Handlers
  const onSearch = useCallback(
    (query: string) => {
      searchFilter.pageNumber = 1;
      searchFilter.valueContains = query.length > 2 ? query : null;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

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
  //#endregion Event Handlers

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🏆 Opportunities</title>
      </Head>

      <PageBackground className="h-[14.3rem] md:h-[18.4rem]" />

      {/* IMPORT DIALOG */}
      <CustomModal
        isOpen={importDialogOpen}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setImportDialogOpen(false);
        }}
        className={`md:max-h-[650px] md:w-[700px]`}
      >
        <OpportunityImport
          id={id}
          onClose={() => {
            setImportDialogOpen(false);
          }}
          onSave={async () => {
            // invalidate queries
            //NB: this is the query on the opportunities page
            await queryClient.invalidateQueries({
              queryKey: ["opportunities", id],
            });
          }}
        />
      </CustomModal>

      {/* EXPORT DIALOG */}
      <CustomModal
        isOpen={exportDialogOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setExportDialogOpen(false);
        }}
        className={`md:max-h-[740px] md:w-[600px]`}
      >
        <OpportunityExport
          totalCount={searchResults?.totalCount ?? 0}
          searchFilter={searchFilter}
          onClose={() => setExportDialogOpen(false)}
          onSave={() => setExportDialogOpen(false)}
        />
      </CustomModal>

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            🏆 Opportunities <LimitedFunctionalityBadge />
          </h3>

          {/* TABBED NAVIGATION */}
          <CustomSlider sliderClassName="!gap-6">
            <Link
              href={`/organisations/${id}/opportunities`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                !status
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
              href={`/organisations/${id}/opportunities?status=Active`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "Active"
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
              href={`/organisations/${id}/opportunities?status=Inactive`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "Inactive"
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
              href={`/organisations/${id}/opportunities?status=Expired`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "Expired"
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
              href={`/organisations/${id}/opportunities?status=Deleted`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "Deleted"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Archived
              {(totalCountDeleted ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountDeleted}
                </div>
              )}
            </Link>
          </CustomSlider>

          {/* FILTERS */}
          <div className="flex w-full grow flex-col items-center justify-between gap-4 sm:justify-end md:flex-row">
            <div className="flex w-full grow flex-row flex-wrap gap-2">
              <SearchInput defaultValue={query} onSearch={onSearch} />
            </div>
            {/* BUTTONS */}
            <div className="flex w-full flex-row flex-nowrap items-center justify-between gap-2 sm:justify-end md:w-auto">
              <Link
                href={`/organisations/${id}/opportunities/create${`?returnUrl=${encodeURIComponent(
                  getSafeUrl(returnUrl?.toString(), router.asPath),
                )}`}`}
                className={`btn btn-sm md:btn-md border-green text-green hover:bg-green w-36 flex-nowrap bg-white hover:text-white ${
                  currentOrganisationInactive ? "disabled" : ""
                }`}
                id="btnCreateOpportunity" // e2e
              >
                <FaPlusCircle className="h-4 w-4" /> Add
              </Link>

              <button
                type="button"
                onClick={() => {
                  setImportDialogOpen(true);
                }}
                className={`btn btn-sm md:btn-md border-green bg-green hover:text-green w-36 flex-nowrap text-white hover:bg-white ${
                  currentOrganisationInactive ? "disabled" : ""
                }`}
              >
                <FaUpload className="h-4 w-4" /> Import
              </button>

              <button
                type="button"
                onClick={() => setExportDialogOpen(true)}
                className="btn btn-sm md:btn-md border-green bg-green hover:text-green w-36 flex-nowrap text-white hover:bg-white"
              >
                <FaDownload className="h-4 w-4" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        {isLoadingSearchResults && (
          <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8 md:pb-16">
            <LoadingSkeleton />
          </div>
        )}

        {!isLoadingSearchResults && (
          <div className="md:shadow-custom rounded-lg md:bg-white md:p-4">
            {/* NO ROWS */}
            {searchResults &&
              searchResults.items?.length === 0 &&
              !query &&
              !status && (
                <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                  <NoRowsMessage
                    title={"Ready to share amazing opportunities?"}
                    description={
                      "Create your first opportunity and start making a positive impact in your community"
                    }
                    icon={<FaRocket className="text-warning size-6" />}
                  />
                  {currentOrganisationInactive ? (
                    <span className="btn btn-primary bg-purple rounded-3xl px-16 brightness-75">
                      Add opportunity (disabled)
                    </span>
                  ) : (
                    <Link
                      href={`/organisations/${id}/opportunities/create${`?returnUrl=${encodeURIComponent(
                        getSafeUrl(returnUrl?.toString(), router.asPath),
                      )}`}`}
                      className="bg-theme btn btn-primary rounded-3xl border-0 px-16 brightness-105 hover:brightness-110"
                      id="btnCreateOpportunity" // e2e
                    >
                      <IoIosAdd className="mr-1 h-5 w-5" />
                      Add opportunity
                    </Link>
                  )}
                </div>
              )}
            {searchResults &&
              searchResults.items?.length === 0 &&
              (query || status) && (
                <div className="py-32x flex flex-col place-items-center">
                  <NoRowsMessage
                    title={"No opportunities found"}
                    description={"Please try refining your search query."}
                  />
                </div>
              )}

            {/* RESULTS */}
            {searchResults && searchResults.items?.length > 0 && (
              <>
                {/* MOBILE */}
                <div className="flex flex-col gap-4 md:hidden">
                  {searchResults.items.map((opportunity) => (
                    <div
                      key={`sm_${opportunity.id}`}
                      className="shadow-custom flex flex-col justify-between gap-4 rounded-lg bg-white p-4"
                    >
                      <div className="border-gray-light flex flex-row gap-2 border-b-2">
                        <span title={opportunity.title} className="w-full">
                          <Link
                            href={`/organisations/${id}/opportunities/${opportunity.id}/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl?.toString(), router.asPath),
                            )}`}`}
                            className="line-clamp-1 text-start font-semibold"
                          >
                            {opportunity.title}
                          </Link>
                        </span>

                        <OpportunityActions
                          opportunity={opportunity}
                          organizationId={id}
                          onCopyToClipboard={onClick_CopyToClipboard}
                          onDownloadCompletionFiles={async (
                            opportunityId: string,
                          ) => {
                            try {
                              await downloadVerificationFilesAdmin({
                                opportunity: opportunityId,
                                verificationTypes: null,
                              });
                              toast.success(
                                "Your request is scheduled for processing. You will receive an email when the download is ready.",
                              );
                            } catch (error) {
                              console.error(error);
                              toast.error(
                                "Download failed. Please try again later.",
                                {
                                  autoClose: false,
                                },
                              );
                            }
                          }}
                          returnUrl={getSafeUrl(
                            returnUrl?.toString(),
                            router.asPath,
                          )}
                          actionOptions={[
                            OpportunityActionOptions.EDIT_DETAILS,
                            OpportunityActionOptions.DOWNLOAD_COMPLETION_FILES,
                            OpportunityActionOptions.COPY_EXTERNAL_LINK,
                            OpportunityActionOptions.VIEW_ATTENDANCE_LINKS,
                            OpportunityActionOptions.CREATE_ATTENDANCE_LINK,
                            OpportunityActionOptions.MAKE_ACTIVE,
                            OpportunityActionOptions.MAKE_INACTIVE,
                            OpportunityActionOptions.MAKE_VISIBLE,
                            OpportunityActionOptions.MAKE_HIDDEN,
                            OpportunityActionOptions.MARK_FEATURED,
                            OpportunityActionOptions.UNMARK_FEATURED,
                            OpportunityActionOptions.DELETE,
                          ]}
                        />
                      </div>

                      <div className="text-gray-dark flex flex-col gap-2">
                        {/* ZLTO Reward */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">ZLTO</p>
                          <div className="flex flex-col gap-2">
                            {opportunity.zltoReward == null && (
                              <span
                                className={`badge bg-orange-light text-orange px-4`}
                              >
                                <span className="ml-1 text-xs">Disabled</span>
                              </span>
                            )}
                            {opportunity.zltoReward != null && (
                              <span
                                className={`badge bg-gray-light text-gray-dark min-w-20 px-4`}
                              >
                                <Image
                                  src={iconZlto}
                                  alt="Zlto icon"
                                  width={16}
                                  className="h-auto"
                                />
                                <span className="ml-1 text-xs">
                                  {opportunity.zltoReward}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ZLTO Reward Cumulative */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">
                            ZLTO Cumulative
                          </p>
                          <div className="flex flex-col gap-2">
                            <span
                              className={`badge bg-gray-light text-gray-dark min-w-20 px-4`}
                            >
                              <Image
                                src={iconZlto}
                                alt="Zlto icon"
                                width={16}
                                className="h-auto"
                              />
                              <span className="ml-1 text-xs">
                                {opportunity.zltoRewardCumulative ?? 0}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Views</p>
                          <span
                            className={`badge min-w-20 ${
                              opportunity.countViewed > 0
                                ? "bg-green-light text-green"
                                : "bg-gray-light text-gray-dark"
                            }`}
                          >
                            <span className="text-xs">
                              {opportunity.countViewed}
                            </span>
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Clicks</p>
                          <span
                            className={`badge min-w-20 ${
                              opportunity.countNavigatedExternalLink > 0
                                ? "bg-green-light text-green"
                                : "bg-gray-light text-gray-dark"
                            }`}
                          >
                            <span className="text-xs">
                              {opportunity.countNavigatedExternalLink}
                            </span>
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Completions</p>
                          <span
                            className={`badge min-w-20 ${
                              opportunity.participantCountCompleted > 0
                                ? "bg-green-light text-green"
                                : "bg-gray-light text-gray-dark"
                            }`}
                          >
                            <span className="text-xs">
                              {opportunity.participantCountCompleted}
                            </span>
                          </span>
                        </div>

                        {/* Pending */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Pending</p>
                          {opportunity.participantCountPending > 0 ? (
                            <Link
                              href={`/organisations/${id}/verifications?opportunity=${opportunity.id}&verificationStatus=Pending`}
                              className="badge bg-orange-light text-orange min-w-20"
                            >
                              <IoIosWarning className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </Link>
                          ) : (
                            <span className="badge bg-gray-light text-gray-dark min-w-20">
                              <span className="text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Status</p>
                          <div className="flex justify-start gap-2">
                            <OpportunityStatus
                              status={opportunity?.status?.toString()}
                            />
                          </div>
                        </div>

                        {/* Visible */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Visible</p>
                          <div className="flex justify-start gap-2">
                            {opportunity?.hidden ? (
                              <span className="badge bg-yellow-tint text-yellow w-20">
                                Hidden
                              </span>
                            ) : (
                              <span className="badge bg-green-light text-green w-20">
                                Visible
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP */}
                <table className="border-gray-light hidden border-separate rounded-lg border-x-2 border-t-2 md:table md:table-auto">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light border-b-2 !py-4">
                        Title
                      </th>
                      <th className="border-gray-light border-b-2">ZLTO</th>
                      <th className="border-gray-light border-b-2">Views</th>
                      <th className="border-gray-light border-b-2">Clicks</th>
                      <th className="border-gray-light border-b-2">
                        Completions
                      </th>
                      <th className="border-gray-light border-b-2">Pending</th>
                      <th className="border-gray-light border-b-2">Status</th>
                      <th className="border-gray-light border-b-2">Visible</th>
                      <th className="border-gray-light border-b-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((opportunity) => (
                      <tr key={`md_${opportunity.id}`}>
                        <td className="border-gray-light max-w-[200px] truncate border-b-2 !py-4">
                          <Link
                            title={opportunity.title}
                            href={`/organisations/${id}/opportunities/${opportunity.id}/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl?.toString(), router.asPath),
                            )}`}`}
                            className="text-gray-dark max-w-[80px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                          >
                            {opportunity.title}
                          </Link>
                        </td>
                        <td className="border-gray-light border-b-2">
                          {opportunity.zltoReward == null && (
                            <span
                              className={`badge bg-orange-light text-orange px-4`}
                            >
                              <span className="ml-1 text-xs">Disabled</span>
                            </span>
                          )}
                          {opportunity.zltoReward != null && (
                            <span
                              className={`badge bg-gray-light text-gray-dark px-4`}
                            >
                              <Image
                                src={iconZlto}
                                alt="Zlto icon"
                                width={16}
                                className="h-auto"
                              />
                              <span className="ml-1 text-xs">
                                {opportunity.zltoReward}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="border-gray-light border-b-2">
                          <span
                            className={`badge ${opportunity.countViewed > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                          >
                            <span className="text-xs">
                              {opportunity.countViewed}
                            </span>
                          </span>
                        </td>
                        <td className="border-gray-light border-b-2">
                          <span
                            className={`badge ${opportunity.countNavigatedExternalLink > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                          >
                            {opportunity.countNavigatedExternalLink}
                          </span>
                        </td>
                        <td className="border-gray-light border-b-2">
                          <span
                            className={`badge ${opportunity.participantCountCompleted > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                          >
                            {opportunity.participantCountCompleted}
                          </span>
                        </td>
                        <td className="border-gray-light border-b-2">
                          {opportunity.participantCountPending > 0 ? (
                            <Link
                              href={`/organisations/${id}/verifications?opportunity=${opportunity.id}&verificationStatus=Pending`}
                              className="badge bg-orange-light text-orange"
                            >
                              <IoIosWarning className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </Link>
                          ) : (
                            <span className="badge bg-gray-light text-gray-dark">
                              <span className="text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="border-gray-light border-b-2">
                          <OpportunityStatus
                            status={opportunity?.status?.toString()}
                          />
                        </td>
                        <td className="border-gray-light border-b-2">
                          {opportunity?.hidden ? (
                            <span className="badge bg-yellow-tint text-yellow w-20">
                              Hidden
                            </span>
                          ) : (
                            <span className="badge bg-green-light text-green w-20">
                              Visible
                            </span>
                          )}
                        </td>
                        <td className="border-gray-light border-b-2 whitespace-nowrap">
                          <div className="flex flex-row items-center justify-center gap-2">
                            {/* ACTIONS */}
                            <OpportunityActions
                              opportunity={opportunity}
                              organizationId={id}
                              onCopyToClipboard={onClick_CopyToClipboard}
                              onDownloadCompletionFiles={async (
                                opportunityId: string,
                              ) => {
                                try {
                                  await downloadVerificationFilesAdmin({
                                    opportunity: opportunityId,
                                    verificationTypes: null,
                                  });
                                  toast.success(
                                    "Your request is scheduled for processing. You will receive an email when the download is ready.",
                                  );
                                } catch (error) {
                                  console.error(error);
                                  toast.error(
                                    "Download failed. Please try again later.",
                                    {
                                      autoClose: false,
                                    },
                                  );
                                }
                              }}
                              returnUrl={getSafeUrl(
                                returnUrl?.toString(),
                                router.asPath,
                              )}
                              actionOptions={[
                                OpportunityActionOptions.EDIT_DETAILS,
                                OpportunityActionOptions.DOWNLOAD_COMPLETION_FILES,
                                OpportunityActionOptions.COPY_EXTERNAL_LINK,
                                OpportunityActionOptions.VIEW_ATTENDANCE_LINKS,
                                OpportunityActionOptions.CREATE_ATTENDANCE_LINK,
                                OpportunityActionOptions.MAKE_ACTIVE,
                                OpportunityActionOptions.MAKE_INACTIVE,
                                OpportunityActionOptions.MAKE_VISIBLE,
                                OpportunityActionOptions.MAKE_HIDDEN,
                                OpportunityActionOptions.MARK_FEATURED,
                                OpportunityActionOptions.UNMARK_FEATURED,
                                OpportunityActionOptions.DELETE,
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
                    totalItems={searchResults?.totalCount ?? 0}
                    pageSize={PAGE_SIZE}
                    onClick={handlePagerChange}
                    showPages={false}
                    showInfo={true}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Opportunities.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default Opportunities;
