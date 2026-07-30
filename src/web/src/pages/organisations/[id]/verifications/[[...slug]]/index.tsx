import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "node:querystring";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { FaDownload, FaThumbsDown, FaThumbsUp, FaUpload } from "react-icons/fa";
import {
  IoIosCheckmark,
  IoIosClose,
  IoIosSettings,
  IoMdAlert,
  IoMdCheckmark,
  IoMdClose,
  IoMdFlame,
} from "react-icons/io";
import {
  IoInformationCircleOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import Moment from "react-moment";
import { toast } from "react-toastify";
import { type SelectOption } from "~/api/models/lookups";
import {
  VerificationStatus,
  type MyOpportunityInfo,
  type MyOpportunityRequestVerifyFinalizeBatch,
  type MyOpportunityResponseVerifyFinalizeBatch,
  type MyOpportunitySearchFilterAdmin,
} from "~/api/models/myOpportunity";
import {
  getOpportunitiesForVerification,
  performActionVerifyBulk,
} from "~/api/services/myOpportunities";
import {
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "~/components/Common/buttonStyles";
import CustomModal from "~/components/Common/CustomModal";
import {
  MODAL_ACTION_WIDTH,
  ModalActions,
  ModalHeader,
} from "~/components/Common/ModalChrome";
import DropdownMenu from "~/components/Common/DropdownMenu";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import ListPageFilterBadges from "~/components/Common/ListPage/ListPageFilterBadges";
import {
  ListPagePagination,
  ListPageResults,
} from "~/components/Common/ListPage/ListPageResults";
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
import NoRowsMessage from "~/components/NoRowsMessage";
import VerificationExport from "~/components/Opportunity/Admin/VerificationExport";
import { VerificationImport } from "~/components/Opportunity/Admin/VerificationImport";
import { OpportunityCompletionRead } from "~/components/Opportunity/OpportunityCompletionRead";
import MobileCard from "~/components/Organisation/Verifications/MobileCard";
import VerificationAdminFilterVertical, {
  VerificationFilterOptions,
} from "~/components/Organisation/Verifications/VerificationAdminFilterVertical";
import {
  parseVerificationFilterFromQuery,
  VERIFICATION_FILTER_SPEC,
  VERIFICATION_STATUS_PARAM,
} from "~/components/Organisation/Verifications/verificationAdminFilter";
import { PageBackground } from "~/components/PageBackground";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { UserInitialsAvatar } from "~/components/User/UserInitialsAvatar";
import {
  OPPORTUNITY_QUERY_KEYS,
  useOrgVerificationCountQuery,
  useOrgVerificationsSearchQuery,
} from "~/hooks/useOpportunityMutations";
import { analytics } from "~/lib/analytics";
import { DATE_FORMAT_HUMAN, PAGE_SIZE } from "~/lib/constants";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
}

const isPartnerManagedSubmission = (item: MyOpportunityInfo) =>
  item.syncedInfo?.syncType === "Pull" || item.syncedInfo?.locked === true;

const getPartnerSourceLabel = (item: MyOpportunityInfo) =>
  item.syncedInfo?.partners?.map((partner) => partner.partner).join(", ") ||
  null;

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
      id: id ?? null,
      returnUrl: returnUrl ?? null,
      theme: theme,
      error: null,
    },
  };
}

// 👇 PAGE COMPONENT: Opportunity Verifications (Single & Bulk)
// this page is accessed from the /organisations/[id]/.. pages (OrgAdmin role)
// or from the /admin/opportunities/.. pages (Admin role). the returnUrl query param is used to redirect back to the admin page
const OpportunityVerifications: NextPageWithLayout<{
  id: string;
  returnUrl?: string;
  theme: string;
  error?: number;
}> = ({ id, returnUrl, error }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const myRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const [modalVerifyVisible, setModalVerifyVisible] = useState(false);
  const [verifyComments, setVerifyComments] = useState("");

  const [selectedRows, setSelectedRows] = useState<MyOpportunityInfo[]>(); // grid selected rows
  const [tempSelectedRows, setTempSelectedRows] =
    useState<MyOpportunityInfo[]>(); // temp rows for single/bulk verification

  // controls the visibility of the verification approve/reject buttons
  const [bulkActionApprove, setBulkActionApprove] = useState<boolean | null>(
    false,
  );
  const [modalVerificationResultVisible, setModalVerificationResultVisible] =
    useState(false);
  const [verificationResponse, setVerificationResponse] =
    useState<MyOpportunityResponseVerifyFinalizeBatch | null>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // 👇 filters are driven by the querystring
  const routerQuery = router.query as ListPageRouterQuery;
  const status = useMemo(
    () => parseStatusTab(routerQuery, VERIFICATION_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  // display filter — what the filter modal and the badges bind to
  const searchFilter = useMemo<MyOpportunitySearchFilterAdmin>(
    () => parseVerificationFilterFromQuery(routerQuery, PAGE_SIZE, id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query, id],
  );

  const isSearchPerformed = useMemo(
    () => getIsSearchPerformed(routerQuery, VERIFICATION_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const appliedFilterCount = useMemo(
    () => getAppliedFilterCount(searchFilter, VERIFICATION_FILTER_SPEC),
    [searchFilter],
  );

  const filterKeyParts = useMemo(
    () => getFilterKeyParts(routerQuery, VERIFICATION_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  // 👇 use client-side queries
  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    isPlaceholderData: isShowingPreviousResults,
    error: searchResultsError,
  } = useOrgVerificationsSearchQuery(id, searchFilter, filterKeyParts, {
    enabled: !error,
  });
  const resolvedError =
    error ?? getErrorStatus(searchResultsError) ?? undefined;
  const selectableItems = useMemo(
    () =>
      (searchResults?.items ?? []).filter(
        (item) => !isPartnerManagedSubmission(item),
      ),
    [searchResults?.items],
  );
  const hasActionablePendingRows = useMemo(
    () =>
      (searchResults?.items ?? []).some(
        (item) =>
          item.verificationStatus?.toString() === "Pending" &&
          !isPartnerManagedSubmission(item),
      ),
    [searchResults?.items],
  );
  //#region LOOKUPS
  const { data: dataOpportunitiesForVerification } = useQuery<SelectOption[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.opportunitiesForVerification(id, status),
    queryFn: async () =>
      (
        await getOpportunitiesForVerification([id], status ? [status] : null)
      ).map((x) => ({
        value: x.id,
        label: x.title,
      })),
    enabled: !error,
  });
  //#endregion LOOKUPS

  // status tab counts — these honour every applied filter
  const { data: totalCountAll } = useOrgVerificationCountQuery(
    id,
    searchFilter,
    null,
    filterKeyParts,
    { enabled: !error },
  );
  const { data: totalCountPending } = useOrgVerificationCountQuery(
    id,
    searchFilter,
    VerificationStatus[VerificationStatus.Pending],
    filterKeyParts,
    { enabled: !error },
  );
  const { data: totalCountCompleted } = useOrgVerificationCountQuery(
    id,
    searchFilter,
    VerificationStatus[VerificationStatus.Completed],
    filterKeyParts,
    { enabled: !error },
  );
  const { data: totalCountRejected } = useOrgVerificationCountQuery(
    id,
    searchFilter,
    VerificationStatus[VerificationStatus.Rejected],
    filterKeyParts,
    { enabled: !error },
  );

  const tabCounts = useMemo(
    () => ({
      all: totalCountAll,
      [VerificationStatus[VerificationStatus.Pending]]: totalCountPending,
      [VerificationStatus[VerificationStatus.Completed]]: totalCountCompleted,
      [VerificationStatus[VerificationStatus.Rejected]]: totalCountRejected,
    }),
    [totalCountAll, totalCountPending, totalCountCompleted, totalCountRejected],
  );

  // 🎈 FUNCTIONS
  const redirectWithSearchFilterParams = useCallback(
    (filter: MyOpportunitySearchFilterAdmin) => {
      let url = `/organisations/${id}/verifications`;
      const params = buildListPageQueryString(filter, VERIFICATION_FILTER_SPEC);
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
        { ...searchFilter, verificationStatuses: null },
        VERIFICATION_FILTER_SPEC,
      ),
    [searchFilter],
  );

  //#region Event Handlers
  const onChangeBulkAction = useCallback(
    (approve: boolean) => {
      setVerifyComments("");

      const actionableSelectedRows = (selectedRows ?? []).filter(
        (row) => !isPartnerManagedSubmission(row),
      );

      if (actionableSelectedRows.length === 0) {
        toast("Please select at least one row to continue", {
          type: "error",
          toastId: "verifyCredentialError",
          icon: <IoMdFlame />,
        });
        return;
      }

      setBulkActionApprove(approve);
      setTempSelectedRows(actionableSelectedRows);
      setModalVerifyVisible(true);
    },
    [
      selectedRows,
      setModalVerifyVisible,
      setBulkActionApprove,
      setTempSelectedRows,
      setVerifyComments,
    ],
  );

  const onCloseVerificationModal = useCallback(() => {
    setTempSelectedRows([]);
    setVerifyComments("");
    setBulkActionApprove(false);
    setModalVerifyVisible(false);
  }, [
    setTempSelectedRows,
    setVerifyComments,
    setBulkActionApprove,
    setModalVerifyVisible,
  ]);

  const onCloseVerificationResultModal = useCallback(() => {
    setModalVerificationResultVisible(false);
    setSelectedRows([]);
  }, [setModalVerificationResultVisible, setSelectedRows]);

  const onVerify = useCallback(
    async (approved: boolean) => {
      if (tempSelectedRows?.some(isPartnerManagedSubmission)) {
        toast.error(
          "Partner-managed submissions cannot be approved or declined manually.",
        );
        return;
      }

      const model: MyOpportunityRequestVerifyFinalizeBatch = {
        status: approved
          ? VerificationStatus.Completed
          : VerificationStatus.Rejected,
        comment: verifyComments,
        items:
          tempSelectedRows?.map((item) => ({
            opportunityId: item.opportunityId,
            userId: item.userId,
          })) ?? [],
      };

      setIsLoading(true);

      try {
        // update api
        const result = await performActionVerifyBulk(model);

        // show the results in modal
        setVerificationResponse(result);

        // 📊 ANALYTICS: track opportunity completion verification
        analytics.trackEvent("opportunity_completions_verified", {
          organizationId: id,
          verificationCount: tempSelectedRows?.length ?? 0,
          verificationResult: approved ? "approved" : "rejected",
        });

        // invalidate queries
        await queryClient.invalidateQueries({
          queryKey: OPPORTUNITY_QUERY_KEYS.verificationListAll(id),
        });
        await queryClient.invalidateQueries({
          queryKey: OPPORTUNITY_QUERY_KEYS.opportunitiesForVerificationAll(id),
        });
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

      // close and open results
      setIsLoading(false);
      onCloseVerificationModal();
      setModalVerificationResultVisible(true);
    },
    [
      id,
      queryClient,
      verifyComments,
      tempSelectedRows,
      setIsLoading,
      onCloseVerificationModal,
      setModalVerificationResultVisible,
      setVerificationResponse,
    ],
  );

  const handleRowSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, row: MyOpportunityInfo) => {
      if (isPartnerManagedSubmission(row)) return;

      if (e.target.checked) {
        setSelectedRows((prev: MyOpportunityInfo[] | undefined) => [
          ...(prev ?? []),
          row,
        ]);
      } else {
        setSelectedRows((prev: MyOpportunityInfo[] | undefined) =>
          prev?.filter((item) => item.id !== row.id),
        );
      }
    },
    [setSelectedRows],
  );

  const handleAllSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setSelectedRows(selectableItems);
      } else {
        setSelectedRows([]);
      }
    },
    [selectableItems, setSelectedRows],
  );

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

  const onSubmitFilter = useCallback(
    (filter: MyOpportunitySearchFilterAdmin) => {
      setFilterFullWindowVisible(false);
      // the status tab is preserved; paging is reset when filters change
      redirectWithSearchFilterParams({
        ...filter,
        verificationStatuses:
          filter.verificationStatuses ?? searchFilter.verificationStatuses,
        pageNumber: 1,
      });
    },
    [redirectWithSearchFilterParams, searchFilter.verificationStatuses],
  );
  //#endregion Event Handlers

  const actionMenuItems = useMemo(
    () => [
      {
        label: "Import",
        onClick: () => {
          setImportDialogOpen(true);
        },
        icon: <FaUpload className="h-4 w-4" />,
      },
      {
        label: "Export",
        onClick: () => {
          setExportDialogOpen(true);
        },
        icon: <FaDownload className="h-4 w-4" />,
      },
      ...((status === null ||
        status === VerificationStatus[VerificationStatus.Pending]) &&
      !isLoadingSearchResults &&
      hasActionablePendingRows
        ? [
            {
              label: "Approve",
              onClick: () => {
                onChangeBulkAction(true);
              },
              icon: <FaThumbsUp className="h-4 w-4" />,
            },
            {
              label: "Decline",
              onClick: () => {
                onChangeBulkAction(false);
              },
              icon: <FaThumbsDown className="h-4 w-4" />,
            },
          ]
        : []),
    ],
    [
      status,
      isLoadingSearchResults,
      hasActionablePendingRows,
      onChangeBulkAction,
      setImportDialogOpen,
      setExportDialogOpen,
    ],
  );

  if (resolvedError) {
    if (resolvedError === 401) return <Unauthenticated />;
    else if (resolvedError === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | ✅ Submissions</title>
      </Head>

      {isLoading && <Loading />}

      <PageBackground className="h-[14.3rem] md:h-[18.4rem]" />

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* POPUP FILTER */}
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseFilter}
        className={`md:max-h-[300px] md:w-[600px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <VerificationAdminFilterVertical
            htmlRef={myRef.current!}
            searchFilter={searchFilter}
            lookups_opportunities={dataOpportunitiesForVerification ?? []}
            onCancel={onCloseFilter}
            onSubmit={onSubmitFilter}
            filterOptions={[VerificationFilterOptions.OPPORTUNITY]}
          />
        </div>
      </CustomModal>

      {/* MODAL DIALOG FOR VERIFY */}
      <CustomModal
        isOpen={modalVerifyVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseVerificationModal}
        className={`md:max-h-[620px] md:w-[800px]`}
      >
        <div className="flex h-full flex-col space-y-2">
          <ModalHeader
            title={`${tempSelectedRows?.length ?? 0} Participant${
              (tempSelectedRows?.length ?? 0) > 1 ? "s" : ""
            }`}
            icon={<IoCheckmarkCircleOutline className="h-5 w-5" />}
            onClose={onCloseVerificationModal}
          />

          <div className="bg-gray-light flex grow flex-col gap-3 p-4 pt-4">
            <div className="bg-gray-lightx flex grow flex-col gap-3">
              {tempSelectedRows?.map((row) => (
                <OpportunityCompletionRead data={row} key={row?.id} />
              ))}
            </div>

            <div className="flex flex-col gap-4 pb-10">
              <fieldset className="fieldset rounded-lg bg-white px-4 py-2">
                <label className="label">
                  <span className="text-gray-dark font-semibold">
                    Enter comments below:
                  </span>
                </label>
                <textarea
                  className="input border-gray-light my-2 h-[100px] w-full p-2"
                  onChange={(e) => setVerifyComments(e.target.value)}
                />
              </fieldset>
            </div>
          </div>

          {/* BUTTONS */}
          <ModalActions>
            <button
              type="button"
              className={`${BTN_SECONDARY} ${MODAL_ACTION_WIDTH}`}
              onClick={onCloseVerificationModal}
            >
              <IoMdClose className="h-5 w-5" />
              Cancel
            </button>

            {(bulkActionApprove == null || !bulkActionApprove) && (
              <button
                type="button"
                className={`${BTN_DANGER} ${MODAL_ACTION_WIDTH}`}
                onClick={() => onVerify(false)}
              >
                <FaThumbsDown className="h-4 w-4" />
                Decline
              </button>
            )}

            {(bulkActionApprove == null || bulkActionApprove) && (
              <button
                type="button"
                className={`${BTN_PRIMARY} ${MODAL_ACTION_WIDTH}`}
                onClick={() => onVerify(true)}
              >
                <FaThumbsUp className="h-4 w-4" />
                Approve
              </button>
            )}
          </ModalActions>
        </div>
      </CustomModal>

      {/* MODAL DIALOG FOR VERIFICATION RESULT */}
      <CustomModal
        isOpen={modalVerificationResultVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseVerificationResultModal}
        className={`md:max-h-[620px] md:w-[800px]`}
      >
        <div className="flex h-full flex-col space-y-2 overflow-y-auto">
          <ModalHeader
            title={`${verificationResponse?.items?.length ?? 0} Participant${
              (verificationResponse?.items?.length ?? 0) > 1 ? "s" : ""
            }`}
            icon={<IoCheckmarkCircleOutline className="h-5 w-5" />}
            onClose={onCloseVerificationResultModal}
          />
          <div className="bg-gray flex grow flex-col">
            <div className="bg-gray-light flex grow flex-col px-6 py-8">
              <div className="flex h-full w-full flex-col gap-4 rounded-lg bg-white p-4 text-center">
                {verificationResponse?.items.map((item) => (
                  <div
                    key={`verificationResult_${item.userId}-${item.opportunityId}`}
                    className="border-gray-light gap-4 space-y-2 rounded-lg border-2 p-4"
                  >
                    <div className="text-gray-dark flex h-fit flex-col items-center gap-4 md:flex-row">
                      <div className="bg-green-light h-fit rounded-full">
                        {item.success && (
                          <IoIosCheckmark className="text-green h-8 w-8 md:h-10 md:w-10" />
                        )}
                        {!item.success && (
                          <IoIosClose className="h-8 w-8 text-red-400 md:h-10 md:w-10" />
                        )}
                      </div>
                      <p
                        className="text-md text-gray-dark w-full truncate text-start leading-5 font-bold tracking-wide"
                        title={item.opportunityTitle!}
                      >
                        {item.opportunityTitle}
                      </p>
                    </div>
                    <div className="border-gray">
                      <div>
                        <div className="text-gray-dark flex flex-row items-center gap-2 text-center text-sm md:text-left md:text-base">
                          {item.success && (
                            <>
                              {verificationResponse.status == "Completed" && (
                                <div className="flex flex-col gap-2">
                                  <p>
                                    <div
                                      className="w-32 truncate font-bold text-black md:w-96"
                                      title={item.userDisplayName!}
                                    >
                                      {item.userDisplayName}
                                    </div>{" "}
                                    was successfully
                                    <strong className="text-green mx-1">
                                      approved.
                                    </strong>
                                  </p>
                                  <p className="flex flex-row gap-2 text-sm">
                                    <IoInformationCircleOutline className="text-blue size-5" />
                                    We&apos;ve sent them a notification to share
                                    the good news!
                                  </p>
                                </div>
                              )}
                              {verificationResponse.status == "Rejected" && (
                                <div className="flex flex-col gap-2">
                                  <p>
                                    <strong className="text-gray-dark">
                                      {item.userDisplayName}
                                    </strong>{" "}
                                    was successfully
                                    <strong className="text-error mx-1">
                                      declined.
                                    </strong>
                                  </p>
                                  <p className="flex flex-row gap-2 text-sm">
                                    <IoInformationCircleOutline className="text-blue size-5" />
                                    We&apos;ve sent them a notification with
                                    your comments.
                                  </p>
                                </div>
                              )}
                            </>
                          )}

                          {!item.success && (
                            <FormMessage messageType={FormMessageType.Error}>
                              {item.failure?.message ||
                                "An error occurred while processing the request."}
                            </FormMessage>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BUTTON */}
          <ModalActions>
            <button
              type="button"
              className={`${BTN_SECONDARY} ${MODAL_ACTION_WIDTH}`}
              onClick={onCloseVerificationResultModal}
            >
              <IoMdClose className="h-5 w-5" />
              Close
            </button>
          </ModalActions>
        </div>
      </CustomModal>

      {/* IMPORT DIALOG */}
      <CustomModal
        isOpen={importDialogOpen}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setImportDialogOpen(false);
        }}
        className={`md:max-h-[650px] md:w-[700px]`}
      >
        <VerificationImport
          id={id}
          onClose={() => {
            setImportDialogOpen(false);
          }}
          onSave={async () => {
            // invalidate queries
            //NB: this is the query on the opportunities page
            await queryClient.invalidateQueries({
              queryKey: OPPORTUNITY_QUERY_KEYS.verificationListAll(id),
            });
            await queryClient.invalidateQueries({
              queryKey:
                OPPORTUNITY_QUERY_KEYS.opportunitiesForVerificationAll(id),
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
        <VerificationExport
          totalCount={searchResults?.totalCount ?? 0}
          searchFilter={searchFilter}
          onClose={() => setExportDialogOpen(false)}
          onSave={() => setExportDialogOpen(false)}
        />
      </CustomModal>

      {/* PAGE */}
      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            ✅ Submissions <LimitedFunctionalityBadge />
          </h3>

          {/* TABBED NAVIGATION */}
          <ListPageStatusTabs
            basePath={`/organisations/${id}/verifications`}
            baseParams={tabBaseParams}
            statusSpec={VERIFICATION_STATUS_PARAM}
            status={status}
            counts={tabCounts}
            idPrefix="verification"
          />

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
              items={actionMenuItems}
            />
          </ListPageSearchToolbar>

          {/* APPLIED FILTER BADGES */}
          {appliedFilterCount > 0 && (
            <ListPageFilterBadges<MyOpportunitySearchFilterAdmin>
              searchFilter={searchFilter}
              spec={VERIFICATION_FILTER_SPEC}
              onSubmit={onSubmitFilter}
              className="-ml-2"
              resolveValue={(key, value) => {
                // the opportunity filter is an id — show its title
                if (key === "opportunity")
                  return (
                    dataOpportunitiesForVerification?.find(
                      (option) => option.value === value,
                    )?.label ?? value
                  );
                return value;
              }}
            />
          )}
        </div>

        {/* MAIN CONTENT */}
        <ListPageResults
          isLoading={isLoadingSearchResults}
          isShowingPreviousResults={isShowingPreviousResults}
          id="results"
        >
          {/* NO RESULTS */}
          {searchResults && searchResults.totalCount === 0 && (
            <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
              <NoRowsMessage
                title={"No results found"}
                description={
                  isSearchPerformed || status !== null
                    ? "Please try refining your search query."
                    : "This is where you will find the submissions awaiting your review."
                }
              />
            </div>
          )}

          {/* RESULTS */}
          {searchResults && searchResults.items?.length > 0 && (
            <>
              {/* MOBILE */}
              <div className="flex flex-col gap-4 md:hidden">
                {searchResults.items.map((item) => (
                  <MobileCard
                    key={`MobileCard_${item.id}`}
                    item={item}
                    handleRowSelect={handleRowSelect}
                    selectedRows={selectedRows}
                    returnUrl={returnUrl}
                    id={id}
                    onVerify={() => {
                      if (isPartnerManagedSubmission(item)) return;
                      setBulkActionApprove(null);
                      setTempSelectedRows([item]);
                      setModalVerifyVisible(true);
                    }}
                  />
                ))}
              </div>

              <table className="border-gray-light hidden w-full border-separate rounded-lg bg-white md:table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th className="border-gray-light w-[35px] !py-4 pr-4">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={
                          selectableItems.length > 0 &&
                          selectedRows?.length === selectableItems.length
                        }
                        onChange={handleAllSelect}
                      />
                    </th>
                    <th className="border-gray-light pl-0">Student</th>
                    <th className="border-gray-light">Opportunity</th>
                    <th className="border-gray-light w-[195px]">
                      Date connected
                    </th>
                    <th className="border-gray-light">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.items.map((item) => (
                    <tr key={item.id}>
                      <td className="border-gray-light text-gray-dark w-[35px] border-t-2 pt-4 !align-top">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-primary"
                          checked={selectedRows?.some((x) => x.id == item.id)}
                          disabled={isPartnerManagedSubmission(item)}
                          title={
                            isPartnerManagedSubmission(item)
                              ? "Partner-managed submissions cannot be approved or declined manually"
                              : undefined
                          }
                          onChange={(e) => handleRowSelect(e, item)}
                        />
                      </td>
                      <td className="border-gray-light text-gray-dark w-[200px] border-t-2 pl-0 !align-top">
                        <div className="flex items-center gap-2 text-sm">
                          <UserInitialsAvatar
                            displayName={item?.userDisplayName}
                            photoURL={item?.userPhotoURL ?? null}
                            alt="Icon User"
                            size={32}
                          />
                          <div>{item.userDisplayName}</div>
                        </div>
                      </td>
                      <td className="border-gray-light text-gray-dark w-[420px] border-t-2 !align-top">
                        {(() => {
                          const detailsHref = `/organisations/${id}/opportunities/${item.opportunityId}/info?returnUrl=${encodeURIComponent(
                            getSafeUrl(returnUrl?.toString(), router.asPath),
                          )}`;

                          return (
                            <Link
                              className="line-clamp-2 max-w-[420px] font-medium text-black underline"
                              href={detailsHref}
                            >
                              {item.opportunityTitle}
                            </Link>
                          );
                        })()}
                      </td>
                      <td className="border-gray-light text-gray-dark w-[185px] border-t-2 !align-top">
                        {item.dateModified && (
                          <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                            {item.dateModified}
                          </Moment>
                        )}
                      </td>
                      <td className="border-gray-light text-gray-dark w-[140px] border-t-2 !align-top">
                        <div className="flex justify-start">
                          {/* Pending Button or Pending Progress (externally managed) */}
                          {item.verificationStatus &&
                            item.verificationStatus == "Pending" && (
                              <div className="flex flex-col gap-2">
                                {!isPartnerManagedSubmission(item) && (
                                  <button
                                    type="button"
                                    className="btn border-gray text-gray-dark btn-sm hover:bg-gray flex-nowrap bg-white hover:text-white"
                                    onClick={() => {
                                      setBulkActionApprove(null);
                                      setTempSelectedRows([item]);
                                      setModalVerifyVisible(true);
                                    }}
                                  >
                                    <IoMdAlert className="text-yellow mr-2 h-6 w-6" />
                                    Pending
                                  </button>
                                )}

                                {isPartnerManagedSubmission(item) &&
                                  item.percentComplete !== null &&
                                  item.percentComplete !== undefined && (
                                    <div className="flex w-full max-w-[130px] flex-col gap-1 text-xs">
                                      <span className="text-gray-dark">
                                        {item.percentComplete}% complete
                                        <span
                                          title={`Managed by ${getPartnerSourceLabel(item)}`}
                                        >
                                          <IoInformationCircleOutline className="text-blue ml-1 inline-block size-5" />
                                        </span>
                                      </span>
                                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                        <div
                                          className="bg-green h-full rounded-full"
                                          style={{
                                            width: `${Math.min(Math.max(item.percentComplete ?? 0, 0), 100)}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}

                          {/* Status Badges */}
                          {item.verificationStatus &&
                            item.verificationStatus == "Completed" && (
                              <div title="Submission has been completed.">
                                <span
                                  className={`badge bg-green-light text-green border-green/10 gap-1 border border-none text-[10px] font-semibold select-none`}
                                >
                                  <IoMdCheckmark className="h-3.5 w-3.5" />
                                  Completed
                                </span>
                              </div>
                            )}

                          {item.verificationStatus &&
                            item.verificationStatus == "Rejected" && (
                              <div title="Submission was declined.">
                                <span
                                  className={`badge gap-1 border border-none border-red-100 bg-red-50 text-[10px] font-semibold text-red-500 select-none`}
                                >
                                  <IoMdClose className="h-3.5 w-3.5" />
                                  Declined
                                </span>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
              <ListPagePagination
                currentPage={searchFilter.pageNumber ?? 1}
                totalItems={searchResults?.totalCount ?? 0}
                pageSize={PAGE_SIZE}
                onClick={handlePagerChange}
                isShowingPreviousResults={isShowingPreviousResults}
                className="mt-2"
              />
            </>
          )}
        </ListPageResults>
      </div>
    </>
  );
};

OpportunityVerifications.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OpportunityVerifications.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  return page.props.theme;
};

export default OpportunityVerifications;
