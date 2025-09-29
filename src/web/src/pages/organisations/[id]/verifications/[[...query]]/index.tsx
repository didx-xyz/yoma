import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import React, {
  useCallback,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { FaDownload, FaThumbsDown, FaThumbsUp, FaUpload } from "react-icons/fa";
import {
  IoIosCheckmark,
  IoIosClose,
  IoMdAlert,
  IoMdCheckmark,
  IoMdClose,
  IoMdFlame,
} from "react-icons/io";
import { IoInformationCircleOutline } from "react-icons/io5";
import Moment from "react-moment";
import Select from "react-select";
import { toast } from "react-toastify";
import { type SelectOption } from "~/api/models/lookups";
import {
  Action,
  VerificationStatus,
  type MyOpportunityInfo,
  type MyOpportunityRequestVerifyFinalizeBatch,
  type MyOpportunityResponseVerifyFinalizeBatch,
  type MyOpportunitySearchFilterAdmin,
  type MyOpportunitySearchResults,
} from "~/api/models/myOpportunity";
import {
  getOpportunitiesForVerification,
  performActionVerifyBulk,
  searchMyOpportunitiesAdmin,
} from "~/api/services/myOpportunities";
import CustomSlider from "~/components/Carousel/CustomSlider";
import CustomModal from "~/components/Common/CustomModal";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import VerificationExport from "~/components/Opportunity/Admin/VerificationExport";
import { VerificationImport } from "~/components/Opportunity/Admin/VerificationImport";
import { OpportunityCompletionRead } from "~/components/Opportunity/OpportunityCompletionRead";
import MobileCard from "~/components/Organisation/Verifications/MobileCard";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { SearchInput } from "~/components/SearchInput";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Loading } from "~/components/Status/Loading";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { DATE_FORMAT_HUMAN, PAGE_SIZE } from "~/lib/constants";
import { analytics } from "~/lib/analytics";
import { config } from "~/lib/react-query-config";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  opportunity?: string;
  verificationStatus?: string;
  page?: string;
  returnUrl?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { query, opportunity, verificationStatus, page } = context.query;
  const queryClient = new QueryClient(config);
  const session = await getServerSession(context.req, context.res, authOptions);
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
    // NB: disabled as we getting 502 bad gateway error on stage
    // 👇 prefetch queries on server
    // const dataVerifications = await searchMyOpportunitiesAdmin(
    //   {
    //     organizations: [id],
    //     pageNumber: page ? parseInt(page.toString()) : 1,
    //     pageSize: PAGE_SIZE,
    //     opportunity: opportunity?.toString() ?? null,
    //     userId: null,
    //     valueContains: query?.toString() ?? null,
    //     action: Action.Verification,
    //     verificationStatuses: verificationStatus
    //       ? [parseInt(verificationStatus.toString())]
    //       : [
    //           VerificationStatus.Pending,
    //           VerificationStatus.Completed,
    //           VerificationStatus.Rejected,
    //         ],
    //   },
    //   context,
    // );
    // const dataOpportunitiesForVerification = (
    //   await getOpportunitiesForVerification([id], undefined, context)
    // ).map((x) => ({
    //   value: x.id,
    //   label: x.title,
    // }));
    // await Promise.all([
    //   await queryClient.prefetchQuery({
    //     queryKey: [
    //       "Verifications",
    //       id,
    //       `${query?.toString()}_${opportunity?.toString()}_${verificationStatus}_${page?.toString()}`,
    //     ],
    //     queryFn: () => dataVerifications,
    //   }),
    //   await queryClient.prefetchQuery({
    //     queryKey: ["OpportunitiesForVerification", id],
    //     queryFn: () => dataOpportunitiesForVerification,
    //   }),
    // ]);
  } catch (error) {
    console.error(error);
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
      user: session?.user ?? null,
      id: id ?? null,
      query: query ?? null,
      opportunity: opportunity ?? null,
      verificationStatus: verificationStatus ?? null,
      page: page ?? "1",
      theme: theme,
      error: errorCode,
    },
  };
}

// 👇 PAGE COMPONENT: Opportunity Verifications (Single & Bulk)
// this page is accessed from the /organisations/[id]/.. pages (OrgAdmin role)
// or from the /admin/opportunities/.. pages (Admin role). the returnUrl query param is used to redirect back to the admin page
const OpportunityVerifications: NextPageWithLayout<{
  id: string;
  query?: string;
  opportunity?: string;
  verificationStatus?: string;
  page?: string;
  theme: string;
  error?: number;
}> = ({ id, query, opportunity, verificationStatus, page, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
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

  // search filter state
  const searchFilter = useMemo<MyOpportunitySearchFilterAdmin>(
    () => ({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      valueContains: query?.toString() ?? null,
      organizations: [id],
      opportunity: opportunity?.toString() ?? null,
      userId: null,
      action: Action.Verification,
      verificationStatuses: verificationStatus
        ? verificationStatus.toString().split("|")
        : [
            VerificationStatus.Pending,
            VerificationStatus.Completed,
            VerificationStatus.Rejected,
          ],
    }),
    [id, opportunity, page, query, verificationStatus],
  );

  // 👇 use prefetched queries from server
  const { data: searchResults, isLoading: isLoadingSearchResults } =
    useQuery<MyOpportunitySearchResults>({
      queryKey: [
        "Verifications",
        id,
        `${query?.toString()}_${opportunity?.toString()}_${verificationStatus}_${page?.toString()}`,
      ],
      queryFn: () => searchMyOpportunitiesAdmin(searchFilter),
      enabled: !error,
    });
  const { data: dataOpportunitiesForVerification } = useQuery<SelectOption[]>({
    queryKey: ["OpportunitiesForVerification", id, verificationStatus],
    queryFn: async () =>
      (
        await getOpportunitiesForVerification(
          [id],
          verificationStatus ? verificationStatus.split("|") : null,
        )
      ).map((x) => ({
        value: x.id,
        label: x.title,
      })),
    enabled: !error,
  });
  const { data: totalCountAll } = useQuery<number>({
    queryKey: [
      "Verifications",
      id,
      "TotalCount",
      null,
      `${query?.toString()}_${opportunity?.toString()}_${page?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as MyOpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.verificationStatuses = [
        VerificationStatus.Pending,
        VerificationStatus.Completed,
        VerificationStatus.Rejected,
      ];

      return searchMyOpportunitiesAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });
  const { data: totalCountPending } = useQuery<number>({
    queryKey: [
      "Verifications",
      id,
      "TotalCount",
      VerificationStatus.Pending,
      `${query?.toString()}_${opportunity?.toString()}_${page?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as MyOpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.verificationStatuses = [VerificationStatus.Pending];

      return searchMyOpportunitiesAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });
  const { data: totalCountCompleted } = useQuery<number>({
    queryKey: [
      "Verifications",
      id,
      "TotalCount",
      VerificationStatus.Completed,
      `${query?.toString()}_${opportunity?.toString()}_${page?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as MyOpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.verificationStatuses = [VerificationStatus.Completed];

      return searchMyOpportunitiesAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },

    enabled: !error,
  });
  const { data: totalCountRejected } = useQuery<number>({
    queryKey: [
      "Verifications",
      id,
      "TotalCount",
      VerificationStatus.Rejected,
      `${query?.toString()}_${opportunity?.toString()}_${page?.toString()}`,
    ],

    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as MyOpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.verificationStatuses = [VerificationStatus.Rejected];

      return searchMyOpportunitiesAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: MyOpportunitySearchFilterAdmin) => {
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
        searchFilter?.opportunity?.length !== undefined &&
        searchFilter.opportunity.length > 0
      )
        params.append("opportunity", searchFilter.opportunity);

      if (
        searchFilter?.verificationStatuses !== undefined &&
        searchFilter?.verificationStatuses !== null &&
        searchFilter?.verificationStatuses.length > 0 &&
        searchFilter?.verificationStatuses.length !== 3 // hack to prevent all" statuses from being added to the query string
      )
        params.append(
          "verificationStatus",
          searchFilter?.verificationStatuses.join("|"),
        );

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
    (filter: MyOpportunitySearchFilterAdmin) => {
      let url = `/organisations/${id}/verifications`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, router, getSearchFilterAsQueryString],
  );

  //#region Event Handlers
  const onChangeBulkAction = useCallback(
    (approve: boolean) => {
      setVerifyComments("");

      if (selectedRows == null || selectedRows.length === 0) {
        toast("Please select at least one row to continue", {
          type: "error",
          toastId: "verifyCredentialError",
          icon: <IoMdFlame />,
        });
        return;
      }

      setBulkActionApprove(approve);
      setTempSelectedRows(selectedRows);
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
          queryKey: ["Verifications", id],
        });
        await queryClient.invalidateQueries({
          queryKey: ["OpportunitiesForVerification", id],
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
        setSelectedRows(searchResults?.items ?? []);
      } else {
        setSelectedRows([]);
      }
    },
    [searchResults, setSelectedRows],
  );

  const onSearch = useCallback(
    (query: string) => {
      searchFilter.pageNumber = 1;
      searchFilter.valueContains = query.length > 2 ? query : null;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onFilterOpportunity = useCallback(
    (opportunityId: string) => {
      searchFilter.pageNumber = 1;
      searchFilter.opportunity = opportunityId;
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
  //#endregion Event Handlers

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | ✅ Submissions</title>
      </Head>

      {isLoading && <Loading />}

      <PageBackground className="h-[14.3rem] md:h-[18.4rem]" />

      {/* MODAL DIALOG FOR VERIFY */}
      <CustomModal
        isOpen={modalVerifyVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseVerificationModal}
        className={`md:max-h-[620px] md:w-[800px]`}
      >
        <div className="flex h-full flex-col space-y-2">
          <div className="bg-green flex flex-row items-center p-4 shadow-lg">
            <h4 className="grow pl-2 font-semibold text-white">
              {tempSelectedRows?.length} Participant
              {(selectedRows?.length ?? 0) > 1 ? "s" : ""}
            </h4>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={onCloseVerificationModal}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>

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
          <div className="flex flex-col gap-2 px-6 py-4 pt-2 sm:flex-row sm:place-items-center sm:justify-center">
            <button
              className="btn btn-outline border-green text-green hover:bg-green w-full shrink rounded-full bg-white normal-case hover:border-0 hover:text-white sm:w-48 md:w-64"
              onClick={onCloseVerificationModal}
            >
              <IoMdClose className="h-6 w-6" />
              Cancel
            </button>

            {(bulkActionApprove == null || !bulkActionApprove) && (
              <button
                className="btn w-full shrink rounded-full border-red-500 bg-white text-red-500 normal-case hover:border-0 hover:bg-red-500 hover:text-white sm:w-48 md:w-64"
                onClick={() => onVerify(false)}
              >
                <FaThumbsDown className="h-4 w-4" />
                Decline
              </button>
            )}

            {(bulkActionApprove == null || bulkActionApprove) && (
              <button
                className="btn border-green text-green hover:bg-green w-full shrink rounded-full bg-white normal-case hover:border-0 hover:text-white sm:w-48 md:w-64"
                onClick={() => onVerify(true)}
              >
                <FaThumbsUp className="h-4 w-4" />
                Approve
              </button>
            )}
          </div>
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
          <div className="bg-green flex flex-row items-center p-4 shadow-lg">
            <h4 className="grow pl-2 font-semibold text-white">
              {verificationResponse?.items?.length} Participant
              {(verificationResponse?.items?.length ?? 0) > 1 ? "s" : ""}
            </h4>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={onCloseVerificationModal}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
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
          <div className="flex flex-row place-items-center justify-end px-6 py-4 pt-2">
            <button
              className="btn btn-outline btn-sm text-green hover:border-green hover:bg-green flex-nowrap rounded-full px-10 py-5 hover:text-white"
              onClick={onCloseVerificationResultModal}
            >
              Close
            </button>
          </div>
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
              queryKey: ["Verifications", id],
            });
            await queryClient.invalidateQueries({
              queryKey: ["OpportunitiesForVerification", id],
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
          <CustomSlider sliderClassName="!gap-6">
            <Link
              href={`/organisations/${id}/verifications`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                !verificationStatus
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
              href={`/organisations/${id}/verifications?verificationStatus=Pending`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                verificationStatus === "Pending"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Pending
              {(totalCountPending ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountPending}
                </div>
              )}
            </Link>
            <Link
              href={`/organisations/${id}/verifications?verificationStatus=Completed`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                verificationStatus === "Completed"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Completed
              {(totalCountCompleted ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountCompleted}
                </div>
              )}
            </Link>
            <Link
              href={`/organisations/${id}/verifications?verificationStatus=Rejected`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                verificationStatus === "Rejected"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Declined
              {(totalCountRejected ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountRejected}
                </div>
              )}
            </Link>
          </CustomSlider>

          {/* FILTERS */}
          <div className="flex w-full grow flex-col items-center justify-between gap-4 sm:justify-end lg:flex-row">
            <div className="flex w-full flex-col gap-4 md:flex-row">
              <Select
                instanceId={"opportunities"}
                className="w-full md:max-w-72"
                classNames={{
                  control: () => "input input-xs w-full !border-0 !rounded-lg",
                }}
                options={dataOpportunitiesForVerification}
                onChange={(val) => onFilterOpportunity(val?.value ?? "")}
                value={dataOpportunitiesForVerification?.find(
                  (c) => c.value === opportunity,
                )}
                placeholder="Opportunities"
                isClearable={true}
              />

              <SearchInput defaultValue={query} onSearch={onSearch} />
            </div>

            {/* BUTTONS */}
            <div className="flex w-full grow flex-wrap items-center gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => {
                  setImportDialogOpen(true);
                }}
                className="btn btn-sm md:btn-md border-green bg-green hover:text-green w-36 flex-nowrap text-white hover:bg-white"
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

              {/* show approve/reject buttons for 'all' & 'pending' tabs */}
              {(!verificationStatus || verificationStatus === "Pending") &&
                !isLoadingSearchResults &&
                searchResults &&
                searchResults.items?.length > 0 && (
                  <>
                    <button
                      className="btn btn-sm md:btn-md border-green text-green hover:bg-green w-36 flex-nowrap bg-white hover:text-white"
                      onClick={() => onChangeBulkAction(true)}
                    >
                      <FaThumbsUp className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      className="btn btn-sm md:btn-md w-36 flex-nowrap border-red-500 bg-white text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => onChangeBulkAction(false)}
                    >
                      <FaThumbsDown className="h-4 w-4" />
                      Decline
                    </button>
                  </>
                )}
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
          <>
            {/* NO RESULTS */}
            {searchResults && searchResults.totalCount === 0 && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                <NoRowsMessage
                  title={"No results found"}
                  description={"Please try refining your search query."}
                />
              </div>
            )}

            {/* RESULTS */}
            {searchResults && searchResults.items?.length > 0 && (
              <div className="md:shadow-custom overflow-x-auto md:rounded-lg">
                {/* DESKTOP */}
                <table className="hidden bg-white md:table md:rounded-lg">
                  <thead className="text-sm">
                    <tr className="!border-gray bg-gray-light text-gray-dark">
                      <th className="w-[35px] !py-6 pr-4">
                        <input
                          type="checkbox"
                          className="checkbox-primary checkbox checkbox-sm border-gray-dark rounded bg-white"
                          checked={
                            selectedRows?.length === searchResults.items?.length
                          }
                          onChange={handleAllSelect}
                        />
                      </th>
                      <th className="pl-0">Student</th>
                      <th>Opportunity</th>
                      <th className="w-[195px]">Date connected</th>
                      <th className="">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((item) => (
                      <tr
                        key={item.id}
                        className="!border-gray text-gray-dark !h-[70px] bg-white"
                      >
                        <td className="w-[35px] pt-4">
                          <input
                            type="checkbox"
                            className="checkbox-primary checkbox checkbox-sm border-gray-dark rounded bg-white"
                            checked={selectedRows?.some((x) => x.id == item.id)}
                            onChange={(e) => handleRowSelect(e, item)}
                          />
                        </td>
                        <td className="w-[200px] pl-0">
                          {item.userDisplayName}
                        </td>
                        <td className="w-[420px]">
                          <Link
                            className="line-clamp-2"
                            href={`/organisations/${id}/opportunities/${
                              item.opportunityId
                            }/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl?.toString(), router.asPath),
                            )}`}`}
                          >
                            {item.opportunityTitle}
                          </Link>
                        </td>
                        <td className="w-[185px]">
                          {item.dateModified && (
                            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                              {item.dateModified}
                            </Moment>
                          )}
                        </td>
                        <td className="w-[120px]">
                          <div className="flex justify-start">
                            {item.verificationStatus &&
                              item.verificationStatus == "Pending" && (
                                <button
                                  type="button"
                                  className="btn btn-sm border-gray text-gray-dark hover:bg-gray flex-nowrap bg-white hover:text-white"
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

                            {/* Status Badges */}
                            {item.verificationStatus &&
                              item.verificationStatus == "Completed" && (
                                <div className="flex flex-row">
                                  <IoMdCheckmark className="text-green mr-2 h-6 w-6" />
                                  Completed
                                </div>
                              )}
                            {item.verificationStatus &&
                              item.verificationStatus == "Rejected" && (
                                <div className="flex flex-row">
                                  <IoMdClose className="mr-2 h-6 w-6 text-red-400" />
                                  Declined
                                </div>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* MOBILE */}
                <div className="my-4 space-y-4 md:hidden">
                  {searchResults.items.map((item) => (
                    <MobileCard
                      key={`MobileCard_${item.id}`}
                      item={item}
                      handleRowSelect={handleRowSelect}
                      selectedRows={selectedRows}
                      returnUrl={returnUrl}
                      id={id}
                      onVerify={() => {
                        setBulkActionApprove(null);
                        setTempSelectedRows([item]);
                        setModalVerifyVisible(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

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
