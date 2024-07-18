import { useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "react-icons/io";
import { IoQrCode, IoShareSocialOutline } from "react-icons/io5";
import ReactModal from "react-modal";
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
  createLinkSharing,
  searchLinks,
  updateLinkStatus,
} from "~/api/services/actionLinks";
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
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
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
  const { type, action, statuses, organizations, entities, page, returnUrl } =
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
      type: type ?? null,
      action: action ?? null,
      statuses: statuses ?? null,
      organizations: organizations ?? null,
      entities: entities ?? null,
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
  page?: string;
  error?: number;
  returnUrl?: string;
}> = ({
  type,
  action,
  statuses,
  organizations,
  entities,
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
  const [modalActionVisible, setModalActionVisisible] = useState(false);
  const [verifyComments, setVerifyComments] = useState("");
  const [linkStatus, setLinkStatus] = useState<LinkStatus | null>(null);
  const [selectedRow, setSelectedRow] = useState<LinkInfo | null>();

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(showQRCode);

  // 👇 use prefetched queries from server
  const { data: links } = useQuery<LinkSearchResult>({
    queryKey: [
      "Admin",
      "Links",
      `${type}_${action}_${statuses}_${organizations}_${entities}_${page}`,
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
      }),
    enabled: !error,
  });
  const { data: totalCountAll } = useQuery<number>({
    queryKey: ["Admin", "Links", "TotalCount", null],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: null,
        statuses: null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountActive } = useQuery<number>({
    queryKey: ["Admin", "Links", "TotalCount", LinkStatus.Active],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: null,
        statuses: [LinkStatus.Active],
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountInactive } = useQuery<number>({
    queryKey: ["Admin", "Links", "TotalCount", LinkStatus.Inactive],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: null,
        statuses: [LinkStatus.Inactive],
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountDeclined } = useQuery<number>({
    queryKey: ["Admin", "Links", "TotalCount", LinkStatus.Declined],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: null,
        statuses: [LinkStatus.Declined],
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountExpired } = useQuery<number>({
    queryKey: ["Admin", "Links", "TotalCount", LinkStatus.Expired],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: null,
        statuses: [LinkStatus.Expired],
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountLimitReached } = useQuery<number>({
    queryKey: ["Admin", "Links", "TotalCount", LinkStatus.LimitReached],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: null,
        statuses: [LinkStatus.LimitReached],
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountDeleted } = useQuery<number>({
    queryKey: ["Admin", "Links", "TotalCount", LinkStatus.Deleted],
    queryFn: () =>
      searchLinks({
        pageNumber: page ? parseInt(page) : 1,
        pageSize: PAGE_SIZE,
        entityType: type ?? LinkEntityType.Opportunity,
        action: action ?? LinkAction.Verify,
        entities: entities ? entities.split("|") : null,
        organizations: null,
        statuses: [LinkStatus.Deleted],
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
          queryKey: ["OpportunitySharingLinkQR", item.entityId],
          queryFn: () =>
            createLinkSharing({
              name: null,
              description: null,
              entityType: item.entityType,
              entityId: item.entityId,
              includeQRCode: true,
            }),
        })
        .then(() => {
          // get the QR code from the cache
          const qrCode = queryClient.getQueryData<LinkInfo | null>([
            "OpportunitySharingLinkQR",
            item.entityId,
          ]);

          // show the QR code
          setQRCodeImageData(qrCode?.qrCodeBase64);
          setShowQRCode(true);
        });
    },
    [queryClient],
  );

  const onOpenCommentsDialog = useCallback(
    (item: LinkInfo, status: LinkStatus) => {
      setLinkStatus(status);
      setSelectedRow(item);
      setModalActionVisisible(true);
    },
    [setLinkStatus, setSelectedRow, setModalActionVisisible],
  );

  const onCloseCommentsDialog = useCallback(() => {
    setVerifyComments("");
    setLinkStatus(null);
    setSelectedRow(null);
    setModalActionVisisible(false);
  }, [
    setVerifyComments,
    setLinkStatus,
    setSelectedRow,
    setModalActionVisisible,
  ]);

  const onPerformLinkStatusChange = useCallback(async () => {
    if (!selectedRow || linkStatus == null) return;
    setIsLoading(true);

    try {
      // call api
      await updateLinkStatus(selectedRow.id, {
        status: linkStatus,
        comment: verifyComments,
      });

      // 📊 GOOGLE ANALYTICS: track event
      trackGAEvent(
        GA_CATEGORY_OPPORTUNITY_LINK,
        GA_ACTION_OPPORTUNITY_LINK_UPDATE_STATUS,
        `Status Changed to ${linkStatus} for Opportunity Link ID: ${selectedRow.id}`,
      );

      // invalidate cache
      // this will match all queries with the following prefixes ['Admin', 'Links', ...] (list data) & [''Admin', 'Links', 'TotalCount', ...] (tab counts)
      await queryClient.invalidateQueries({
        queryKey: ["Admin", "Links"],
        exact: false,
      });

      toast.success("Link status updated");
    } catch (error) {
      toast(<ApiErrors error={error} />, {
        type: "error",
        toastId: "verifyCredential",
        autoClose: 2000,
        icon: false,
      });

      setIsLoading(false);

      return;
    }

    setIsLoading(false);
    onCloseCommentsDialog();
  }, [
    queryClient,
    verifyComments,
    selectedRow,
    linkStatus,
    setIsLoading,
    onCloseCommentsDialog,
  ]);

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | Admin Links</title>
      </Head>
      <PageBackground className="h-[14.5rem] md:h-[18rem]" />

      {isLoading && <Loading />}

      {/* MODAL DIALOG FOR ACTIONS */}
      <ReactModal
        isOpen={modalActionVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseCommentsDialog}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[400px] md:w-[600px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col space-y-2">
          <div className="flex flex-row items-center bg-white px-4 pt-2">
            <div className="flex w-64 flex-grow flex-col pl-2">
              <div className="truncate text-sm font-semibold">
                {selectedRow?.name}
              </div>
              <div className="truncate text-xs">{selectedRow?.description}</div>
            </div>

            <button
              type="button"
              className="btn scale-[0.55] rounded-full border-green-dark bg-green-dark p-[7px] text-white hover:text-green"
              onClick={onCloseCommentsDialog}
            >
              <IoMdClose className="h-8 w-8"></IoMdClose>
            </button>
          </div>

          <div className="flex flex-grow flex-col gap-4 bg-gray-light px-6 pb-10">
            <div className="form-control mt-8 rounded-lg bg-white px-4 py-2">
              <label className="label">
                <span className="font-semibold text-gray-dark">
                  Enter comments below:
                </span>
              </label>
              <textarea
                className="input input-bordered my-2 h-[100px] border-gray-light p-2"
                onChange={(e) => setVerifyComments(e.target.value)}
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-row place-items-center justify-center px-6 py-4 pt-2">
            <div className="flex flex-grow">
              <button
                className="btn btn-sm flex-nowrap border-black bg-white py-5 text-black md:btn-sm hover:bg-black hover:text-white"
                onClick={onCloseCommentsDialog}
              >
                <IoMdClose className="h-6 w-6" />
                Close
              </button>
            </div>
            <div className="flex gap-4">
              {linkStatus == LinkStatus.Active && (
                <button
                  className="btn btn-sm flex-nowrap border-green bg-white py-5 text-green hover:bg-green hover:text-white"
                  onClick={onPerformLinkStatusChange}
                >
                  Approve
                </button>
              )}
              {linkStatus == LinkStatus.Declined && (
                <button
                  className="btn btn-sm flex-nowrap border-red-500 bg-white py-5 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={onPerformLinkStatusChange}
                >
                  Decline
                </button>
              )}
              {linkStatus == LinkStatus.Inactive && (
                <button
                  className="btn btn-sm flex-nowrap border-red-500 bg-white py-5 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={onPerformLinkStatusChange}
                >
                  Inactivate
                </button>
              )}
              {linkStatus == LinkStatus.Deleted && (
                <button
                  className="btn btn-sm flex-nowrap border-red-500 bg-white py-5 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={onPerformLinkStatusChange}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </ReactModal>

      {/* QR CODE DIALOG */}
      <ReactModal
        isOpen={showQRCode}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setShowQRCode(false);
          setQRCodeImageData(null);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[650px] md:w-[600px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          {/* HEADER WITH CLOSE BUTTON */}
          <div className="bg-theme flex flex-row p-4 shadow-lg">
            <h1 className="flex-grow"></h1>
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
            <div className="-mt-16 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
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
                  style={{ width: 200, height: 200 }}
                />
              </>
            )}

            <button
              type="button"
              className="btn mt-10 rounded-full border-purple bg-white normal-case text-purple md:w-[150px]"
              onClick={() => {
                setShowQRCode(false);
                setQRCodeImageData(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </ReactModal>

      <div className="container z-10 mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mb-6 mt-3 flex items-center text-3xl font-semibold tracking-normal text-white md:mb-9 md:mt-0">
            Links
          </h3>

          {/* TABBED NAVIGATION */}
          <div className="z-10 flex justify-center md:justify-start">
            <div className="flex w-full gap-2">
              {/* TABS */}
              <div
                className="tabs tabs-bordered w-full gap-2 overflow-x-scroll md:overflow-hidden"
                role="tablist"
              >
                <div className="border-b border-transparent text-center text-sm font-medium text-gray-dark">
                  <ul className="-mb-px flex w-full justify-center gap-0 overflow-x-scroll md:justify-start">
                    <li className="whitespace-nowrap px-4">
                      <Link
                        href={`/admin/links`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          !statuses
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        All
                        {(totalCountAll ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountAll}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="whitespace-nowrap px-4">
                      <Link
                        href={`/admin/links?statuses=active`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          statuses === "active"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Active
                        {(totalCountActive ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountActive}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="whitespace-nowrap px-4">
                      <Link
                        href={`/admin/links?statuses=inactive`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          statuses === "inactive"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Inactive
                        {(totalCountInactive ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountInactive}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="whitespace-nowrap px-4">
                      <Link
                        href={`/admin/links?statuses=declined`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          statuses === "declined"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Declined
                        {(totalCountDeclined ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountDeclined}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="whitespace-nowrap px-4">
                      <Link
                        href={`/admin/links?statuses=expired`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          statuses === "expired"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Expired
                        {(totalCountExpired ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountExpired}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="whitespace-nowrap px-4">
                      <Link
                        href={`/admin/links?statuses=limitReached`}
                        className={`inline-block w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          statuses === "limitReached"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Limit Reached
                        {(totalCountLimitReached ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountLimitReached}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="whitespace-nowrap px-4">
                      <Link
                        href={`/admin/links?statuses=deleted`}
                        className={`inline-block w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          statuses === "deleted"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Deleted
                        {(totalCountDeleted ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountDeleted}
                          </div>
                        )}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="flex w-full flex-grow items-center justify-between gap-4 sm:justify-end">
            {/* LINKS FILTER */}
            <LinkSearchFilters
              searchFilter={searchFilter}
              filterOptions={[
                LinkFilterOptions.ORGANIZATIONS,
                LinkFilterOptions.ENTITIES,
              ]}
              onSubmit={(e) => onSubmitFilter(e)}
            />
          </div>
        </div>

        <div className="rounded-lg md:bg-white md:p-4 md:shadow-custom">
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
                    className="rounded-lg bg-white p-4 shadow-custom"
                  >
                    <div className="mb-2 flex flex-col">
                      {item.entityOrganizationId &&
                        item.entityOrganizationName && (
                          <Link
                            href={`/organisations/${item.entityOrganizationId}${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl, router.asPath),
                            )}`}`}
                            className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-gray-dark underline"
                          >
                            {item.entityOrganizationName}
                          </Link>
                        )}

                      {item.entityType == "Opportunity" &&
                        item.entityOrganizationId && (
                          <Link
                            href={`/organisations/${item.entityOrganizationId}/opportunities/${
                              item.entityId
                            }/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl, router.asPath),
                            )}`}`}
                            className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-dark underline"
                          >
                            {item.entityTitle}
                          </Link>
                        )}
                      {item.entityType != "Opportunity" && (
                        <>{item.entityTitle}</>
                      )}

                      <span className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-dark">
                        {item.name}
                      </span>

                      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-gray-dark">
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
                        )}{" "}
                        {item.status == "Declined" && (
                          <span className="badge bg-green-light text-red-400">
                            Declined
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
                          className="badge bg-green-light text-green"
                        >
                          <IoIosLink className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onClick_GenerateQRCode(item)}
                          className="badge bg-green-light text-green"
                        >
                          <IoQrCode className="h-4 w-4" />
                        </button>

                        {(item?.status == "Inactive" ||
                          item?.status == "Active" ||
                          item?.status == "Declined") && (
                          <div className="dropdown dropdown-left -mr-3 w-10 md:-mr-4">
                            <button className="badge bg-green-light text-green">
                              <IoIosSettings className="h-4 w-4" />
                            </button>

                            <ul className="menu dropdown-content z-50 w-52 rounded-box bg-base-100 p-2 shadow">
                              {item?.status == "Inactive" && (
                                <li>
                                  <button
                                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                                    onClick={() =>
                                      onOpenCommentsDialog(
                                        item,
                                        LinkStatus.Active,
                                      )
                                    }
                                  >
                                    Approve
                                  </button>
                                </li>
                              )}

                              {item?.status == "Inactive" && (
                                <li>
                                  <button
                                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                                    onClick={() =>
                                      onOpenCommentsDialog(
                                        item,
                                        LinkStatus.Declined,
                                      )
                                    }
                                  >
                                    Decline
                                  </button>
                                </li>
                              )}

                              {(item?.status == "Active" ||
                                item?.status == "Inactive" ||
                                item?.status == "Declined") && (
                                <li>
                                  <button
                                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                                    onClick={() =>
                                      onOpenCommentsDialog(
                                        item,
                                        LinkStatus.Deleted,
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </li>
                              )}

                              {item?.status === "Declined" && (
                                <li>
                                  <button
                                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                                    onClick={() =>
                                      onOpenCommentsDialog(
                                        item,
                                        LinkStatus.Inactive,
                                      )
                                    }
                                  >
                                    Make Inactive (send for reapproval)
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
              <table className="hidden border-separate rounded-lg border-x-2 border-t-2 border-gray-light md:table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th className="border-b-2 border-gray-light !py-4">
                      Organisation
                    </th>
                    <th className="border-b-2 border-gray-light !py-4">
                      Opportunity
                    </th>
                    <th className="border-b-2 border-gray-light !py-4">Name</th>
                    <th className="border-b-2 border-gray-light">
                      Description
                    </th>
                    <th className="border-b-2 border-gray-light">Usage</th>
                    <th className="border-b-2 border-gray-light">Expires</th>
                    <th className="border-b-2 border-gray-light">Status</th>
                    <th className="border-b-2 border-gray-light">Link</th>
                    <th className="border-b-2 border-gray-light">QR</th>
                    <th className="border-b-2 border-gray-light">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.items.map((item) => (
                    <tr key={`grid_md_${item.id}`} className="">
                      <td className="max-w-[200px] truncate border-b-2 border-gray-light !py-4">
                        {item.entityOrganizationId &&
                          item.entityOrganizationName && (
                            <Link
                              href={`/organisations/${item.entityOrganizationId}${`?returnUrl=${encodeURIComponent(
                                getSafeUrl(returnUrl, router.asPath),
                              )}`}`}
                              className="max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-dark underline"
                            >
                              {item.entityOrganizationName}
                            </Link>
                          )}
                      </td>
                      <td className="max-w-[200px] truncate border-b-2 border-gray-light !py-4">
                        {item.entityType == "Opportunity" &&
                          item.entityOrganizationId && (
                            <Link
                              href={`/organisations/${item.entityOrganizationId}/opportunities/${
                                item.entityId
                              }/info${`?returnUrl=${encodeURIComponent(
                                getSafeUrl(returnUrl, router.asPath),
                              )}`}`}
                              className="max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-dark underline"
                            >
                              {item.entityTitle}
                            </Link>
                          )}
                        {item.entityType != "Opportunity" && (
                          <>{item.entityTitle}</>
                        )}
                      </td>

                      <td className="max-w-[100px] truncate border-b-2 border-gray-light !py-4">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                          {item.name}
                        </div>
                      </td>

                      <td className="max-w-[100px] border-b-2 border-gray-light">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                          {item.description}
                        </div>
                      </td>

                      <td className="border-b-2 border-gray-light">
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

                      <td className="border-b-2 border-gray-light">
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
                      <td className="border-b-2 border-gray-light">
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
                        {item.status == "Declined" && (
                          <span className="badge bg-green-light text-red-400">
                            Declined
                          </span>
                        )}
                        {item.status == "Deleted" && (
                          <span className="badge bg-green-light text-red-400">
                            Deleted
                          </span>
                        )}
                      </td>

                      {/* LINK */}
                      <td className="border-b-2 border-gray-light">
                        <button
                          onClick={() =>
                            onClick_CopyToClipboard(
                              item?.shortURL ?? item?.uRL ?? "",
                            )
                          }
                          className="badge bg-green-light text-green"
                        >
                          <IoIosLink className="h-4 w-4" />
                        </button>
                      </td>

                      {/* QR */}
                      <td className="border-b-2 border-gray-light">
                        <button
                          onClick={() => onClick_GenerateQRCode(item)}
                          className="badge bg-green-light text-green"
                        >
                          <IoQrCode className="h-4 w-4" />
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="border-b-2 border-gray-light">
                        {(item?.status == "Inactive" ||
                          item?.status == "Active" ||
                          item?.status == "Declined") && (
                          <div className="dropdown dropdown-left -mr-3 w-10 md:-mr-4">
                            <button className="badge bg-green-light text-green">
                              <IoIosSettings className="h-4 w-4" />
                            </button>

                            <ul className="menu dropdown-content z-50 w-52 rounded-box bg-base-100 p-2 shadow">
                              {item?.status == "Inactive" && (
                                <li>
                                  <button
                                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                                    onClick={() =>
                                      onOpenCommentsDialog(
                                        item,
                                        LinkStatus.Active,
                                      )
                                    }
                                  >
                                    Approve
                                  </button>
                                </li>
                              )}

                              {item?.status == "Inactive" && (
                                <li>
                                  <button
                                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                                    onClick={() =>
                                      onOpenCommentsDialog(
                                        item,
                                        LinkStatus.Declined,
                                      )
                                    }
                                  >
                                    Decline
                                  </button>
                                </li>
                              )}

                              {(item?.status == "Active" ||
                                item?.status == "Inactive" ||
                                item?.status == "Declined") && (
                                <li>
                                  <button
                                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                                    onClick={() =>
                                      onOpenCommentsDialog(
                                        item,
                                        LinkStatus.Deleted,
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </li>
                              )}

                              {item?.status === "Declined" && (
                                <li>
                                  <button
                                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                                    onClick={() =>
                                      onOpenCommentsDialog(
                                        item,
                                        LinkStatus.Inactive,
                                      )
                                    }
                                  >
                                    Make Inactive (send for reapproval)
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
            </div>
          )}

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
