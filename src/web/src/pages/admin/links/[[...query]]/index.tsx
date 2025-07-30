import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import {
  IoIosLink,
  IoIosSettings,
  IoMdCalendar,
  IoMdClose,
  IoMdLock,
  IoMdPerson,
  IoMdWarning,
} from "react-icons/io";
import { IoQrCode, IoShareSocialOutline } from "react-icons/io5";
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
import {
  getLinkById,
  searchLinks,
  updateLinkStatus,
} from "~/api/services/actionLinks";
import CustomSlider from "~/components/Carousel/CustomSlider";
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import {
  LinkFilterOptions,
  LinkSearchFilters,
} from "~/components/Links/LinkSearchFilter";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import {
  DATE_FORMAT_HUMAN,
  GA_ACTION_OPPORTUNITY_LINK_UPDATE_STATUS,
  GA_CATEGORY_OPPORTUNITY_LINK,
  PAGE_SIZE,
  THEME_BLUE,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { getSafeUrl } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const {
    type,
    action,
    statuses,
    organizations,
    entities,
    valueContains,
    page,
    returnUrl,
  } = context.query;
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
      type: type ?? null,
      action: action ?? null,
      statuses: statuses ?? null,
      organizations: organizations ?? null,
      entities: entities ?? null,
      valueContains: valueContains ?? null,
      page: page ?? null,
      error: null,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Links: NextPageWithLayout<{
  type?: string;
  action?: string;
  statuses?: string;
  organizations?: string;
  entities?: string;
  valueContains?: string;
  page?: string;
  error?: number;
  returnUrl?: string;
}> = ({
  type,
  action,
  statuses,
  organizations,
  entities,
  valueContains,
  page,
  error,
  returnUrl,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeImageData, setQRCodeImageData] = useState<
    string | null | undefined
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalContext = useConfirmationModalContext();

  // 👇 use prefetched queries from server
  const { data: links } = useQuery<LinkSearchResult>({
    queryKey: [
      "Admin",
      "Links",
      type ?? "",
      action ?? "",
      statuses ?? "",
      organizations ?? "",
      entities ?? "",
      valueContains ?? "",
      page ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        organizations: organizations ? organizations.split("|") : null,
        entities: entities ? entities.split("|") : null,
        statuses: statuses ? statuses.split("|") : null,
        valueContains: valueContains ?? null,
      }),
    enabled: !error,
  });
  const { data: totalCountAll } = useQuery<number>({
    queryKey: [
      "Admin",
      "Links",
      "TotalCount",
      null,
      type ?? "",
      action ?? "",
      organizations ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: null,
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountActive } = useQuery<number>({
    queryKey: [
      "Admin",
      "Links",
      "TotalCount",
      LinkStatus.Active,
      type ?? "",
      action ?? "",
      organizations ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: [LinkStatus.Active],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountInactive } = useQuery<number>({
    queryKey: [
      "Admin",
      "Links",
      "TotalCount",
      LinkStatus.Inactive,
      type ?? "",
      action ?? "",
      organizations ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: [LinkStatus.Inactive],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountExpired } = useQuery<number>({
    queryKey: [
      "Admin",
      "Links",
      "TotalCount",
      LinkStatus.Expired,
      type ?? "",
      action ?? "",
      organizations ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: [LinkStatus.Expired],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountLimitReached } = useQuery<number>({
    queryKey: [
      "Admin",
      "Links",
      "TotalCount",
      LinkStatus.LimitReached,
      type ?? "",
      action ?? "",
      organizations ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: [LinkStatus.LimitReached],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountDeleted } = useQuery<number>({
    queryKey: [
      "Admin",
      "Links",
      "TotalCount",
      LinkStatus.Deleted,
      type ?? "",
      action ?? "",
      organizations ?? "",
      entities ?? "",
      valueContains ?? "",
    ],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: organizations ? organizations.split("|") : null,
        statuses: [LinkStatus.Deleted],
        valueContains: valueContains ?? null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });

  // search filter state
  const [searchFilter] = useState<LinkSearchFilter>({
    pageNumber: page ? parseInt(page) : 1,
    pageSize: PAGE_SIZE,
    entityType: type ?? LinkEntityType.Opportunity,
    action: action ?? LinkAction.Verify,
    organizations: organizations ? organizations.split("|") : null,
    entities: entities ? entities.split("|") : null,
    statuses: statuses ? statuses.split("|") : null,
    valueContains: valueContains ?? null,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: LinkSearchFilter) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (
        searchFilter?.organizations?.length !== undefined &&
        searchFilter.organizations.length > 0
      )
        params.append("organizations", searchFilter.organizations.join("|"));

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
      let url = `/admin/links`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0) url = `${url}?${params}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
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

  const updateStatus = useCallback(
    async (item: LinkInfo, status: LinkStatus) => {
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
              {status === LinkStatus.Active && (
                <>
                  Are you sure you want to <i>activate</i> this link?
                </>
              )}
              {status === LinkStatus.Inactive && (
                <>
                  Are you sure you want to <i>inactivate</i> this link?
                </>
              )}
              {status === LinkStatus.Deleted && (
                <>
                  Are you sure you want to <i>delete</i> this link?
                </>
              )}
            </p>
          </div>
        </div>,
      );
      if (!result) return;

      setIsLoading(true);

      try {
        // call api
        await updateLinkStatus(item.id, status);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_OPPORTUNITY_LINK,
          GA_ACTION_OPPORTUNITY_LINK_UPDATE_STATUS,
          `Status Changed to ${status} for Opportunity Link ID: ${item.id}`,
        );

        // invalidate cache
        // this will match all queries with the following prefixes ['Links', id] (list data) & ['Links_TotalCount', id] (tab counts)
        await queryClient.invalidateQueries({
          queryKey: ["Admin", "Links"],
          exact: false,
        });
        // await queryClient.invalidateQueries({
        //   queryKey: ["Links_TotalCount", id],
        //   exact: false,
        // });

        toast.success("Link status updated");
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: `error-${item.id}`,
          autoClose: false,
          icon: false,
        });
      }
      setIsLoading(false);

      return;
    },
    [queryClient, modalContext, setIsLoading],
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
          <div className="bg-theme flex flex-row p-4 shadow-lg">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="bg-theme btn rounded-full border-0 p-3 text-white brightness-75"
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
              href={`/admin/links`}
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
              href={`/admin/links?statuses=active`}
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
              href={`/admin/links?statuses=inactive`}
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
              href={`/admin/links?statuses=expired`}
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                statuses === "expired"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
              role="tab"
            >
              Expired
              {(totalCountExpired ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountExpired}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/links?statuses=limitReached`}
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                statuses === "limitReached"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
              role="tab"
            >
              Limit Reached
              {(totalCountLimitReached ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountLimitReached}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/links?statuses=deleted`}
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

          {/* SEARCH INPUT */}
          <div className="flex w-full grow items-center justify-between gap-4 sm:justify-end">
            {/* LINKS FILTER */}
            <LinkSearchFilters
              searchFilter={searchFilter}
              filterOptions={[
                LinkFilterOptions.VALUECONTAINS,
                LinkFilterOptions.ORGANIZATIONS,
                LinkFilterOptions.ENTITIES,
              ]}
              onSubmit={(e) => onSubmitFilter(e)}
            />
          </div>
        </div>

        <div className="md:shadow-custom rounded-lg md:bg-white md:p-4">
          {/* NO ROWS */}
          {links && links.items?.length === 0 && (
            <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
              <NoRowsMessage
                title={"No links found"}
                description={"Please try refining your search query."}
              />
            </div>
          )}

          {/* GRID */}
          {links && links.items?.length > 0 && (
            <div className="">
              {/* MOBILE */}
              <div className="flex flex-col gap-4 md:hidden">
                {links.items.map((item) => (
                  <div
                    key={`grid_xs_${item.id}`}
                    className="shadow-custom rounded-lg bg-white p-4"
                  >
                    <div className="mb-2 flex flex-col">
                      {item.entityOrganizationId &&
                        item.entityOrganizationName && (
                          <Link
                            href={`/organisations/${
                              item.entityOrganizationId
                            }${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl, router.asPath),
                            )}`}`}
                            className="text-gray-dark max-w-[300px] overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap underline"
                          >
                            {item.entityOrganizationName}
                          </Link>
                        )}

                      {item.entityType == "Opportunity" &&
                        item.entityOrganizationId && (
                          <Link
                            href={`/organisations/${
                              item.entityOrganizationId
                            }/opportunities/${
                              item.entityId
                            }/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl, router.asPath),
                            )}`}`}
                            className="text-gray-dark max-w-[300px] overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap underline"
                          >
                            {item.entityTitle}
                          </Link>
                        )}
                      {item.entityType != "Opportunity" && (
                        <>{item.entityTitle}</>
                      )}

                      <span className="text-gray-dark mt-2 overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap">
                        {item.name}
                      </span>

                      <span className="text-gray-dark overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                        {item.description}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <p className="text-sm tracking-wider">Usage</p>

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
                      </div>

                      <div className="flex justify-between">
                        <p className="text-sm tracking-wider">Expires</p>
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
                      </div>

                      <div className="flex justify-between">
                        <p className="text-sm tracking-wider">Status</p>
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

                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            onClick_CopyToClipboard(
                              item?.shortURL ?? item?.uRL ?? "",
                            )
                          }
                          className="badge bg-green-light text-green cursor-pointer"
                          title="Copy Link to Clipboard"
                        >
                          <IoIosLink className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onClick_GenerateQRCode(item)}
                          className="badge bg-green-light text-green cursor-pointer"
                          title="Generate QR Code"
                        >
                          <IoQrCode className="h-4 w-4" />
                        </button>

                        {(item?.status == "Inactive" ||
                          item?.status == "Active") && (
                          <div className="dropdown dropdown-left -mr-3 w-10 md:-mr-4">
                            <button
                              className="badge bg-green-light text-green cursor-pointer"
                              title="Actions"
                            >
                              <IoIosSettings className="h-4 w-4" />
                            </button>

                            <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-52 p-2 shadow">
                              <li>
                                <button
                                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                                  onClick={() =>
                                    updateStatus(item, LinkStatus.Deleted)
                                  }
                                >
                                  Delete
                                </button>
                              </li>

                              {item?.status == "Inactive" && (
                                <li>
                                  <button
                                    className="text-gray-dark flex flex-row items-center hover:brightness-50"
                                    onClick={() =>
                                      updateStatus(item, LinkStatus.Active)
                                    }
                                  >
                                    Activate
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DEKSTOP */}
              <table className="border-gray-light hidden border-separate rounded-lg border-x-2 border-t-2 md:table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th className="border-gray-light border-b-2 !py-4">
                      Organisation
                    </th>
                    <th className="border-gray-light border-b-2 !py-4">
                      Opportunity
                    </th>
                    <th className="border-gray-light border-b-2 !py-4">Name</th>
                    <th className="border-gray-light border-b-2">
                      Description
                    </th>
                    <th className="border-gray-light border-b-2">Usage</th>
                    <th className="border-gray-light border-b-2">Expires</th>
                    <th className="border-gray-light border-b-2">Status</th>
                    <th className="border-gray-light border-b-2">Link</th>
                    <th className="border-gray-light border-b-2">QR</th>
                    <th className="border-gray-light border-b-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.items.map((item) => (
                    <tr key={`grid_md_${item.id}`} className="">
                      <td className="border-gray-light max-w-[200px] truncate border-b-2 !py-4">
                        {item.entityOrganizationId &&
                          item.entityOrganizationName && (
                            <Link
                              href={`/organisations/${
                                item.entityOrganizationId
                              }${`?returnUrl=${encodeURIComponent(
                                getSafeUrl(returnUrl, router.asPath),
                              )}`}`}
                              className="text-gray-dark max-w-[80px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                            >
                              {item.entityOrganizationName}
                            </Link>
                          )}
                      </td>
                      <td className="border-gray-light max-w-[200px] truncate border-b-2 !py-4">
                        {item.entityType == "Opportunity" &&
                          item.entityOrganizationId && (
                            <Link
                              href={`/organisations/${
                                item.entityOrganizationId
                              }/opportunities/${
                                item.entityId
                              }/info${`?returnUrl=${encodeURIComponent(
                                getSafeUrl(returnUrl, router.asPath),
                              )}`}`}
                              className="text-gray-dark max-w-[80px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                            >
                              {item.entityTitle}
                            </Link>
                          )}
                        {item.entityType != "Opportunity" && (
                          <>{item.entityTitle}</>
                        )}
                      </td>

                      <td className="border-gray-light max-w-[100px] truncate border-b-2 !py-4">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                          {item.name}
                        </div>
                      </td>

                      <td className="border-gray-light max-w-[100px] border-b-2">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                          {item.description}
                        </div>
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

                      {/* LINK */}
                      <td className="border-gray-light border-b-2">
                        <button
                          onClick={() =>
                            onClick_CopyToClipboard(
                              item?.shortURL ?? item?.uRL ?? "",
                            )
                          }
                          className="badge bg-green-light text-green cursor-pointer"
                          title="Copy Link to Clipboard"
                        >
                          <IoIosLink className="h-4 w-4" />
                        </button>
                      </td>

                      {/* QR */}
                      <td className="border-gray-light border-b-2">
                        <button
                          onClick={() => onClick_GenerateQRCode(item)}
                          className="badge bg-green-light text-green cursor-pointer"
                          title="Generate QR Code"
                        >
                          <IoQrCode className="h-4 w-4" />
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="border-gray-light border-b-2">
                        {(item?.status == "Inactive" ||
                          item?.status == "Active") && (
                          <div className="dropdown dropdown-left -mr-3 w-10 md:-mr-4">
                            <button
                              className="badge bg-green-light text-green cursor-pointer"
                              title="Actions"
                            >
                              <IoIosSettings className="h-4 w-4" />
                            </button>

                            <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-52 p-2 shadow">
                              <li>
                                <button
                                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                                  onClick={() =>
                                    updateStatus(item, LinkStatus.Deleted)
                                  }
                                >
                                  Delete
                                </button>
                              </li>

                              {item?.status == "Inactive" && (
                                <li>
                                  <button
                                    className="text-gray-dark flex flex-row items-center hover:brightness-50"
                                    onClick={() =>
                                      updateStatus(item, LinkStatus.Active)
                                    }
                                  >
                                    Activate
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
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
            </div>
          )}
        </div>
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
