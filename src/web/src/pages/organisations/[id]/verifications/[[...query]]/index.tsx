import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import FileSaver from "file-saver";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconBell from "public/images/icon-bell.webp";
import { type ParsedUrlQuery } from "querystring";
import React, {
  useCallback,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import {
  IoIosCheckmark,
  IoIosClose,
  IoMdAlert,
  IoMdCheckmark,
  IoMdClose,
  IoMdDownload,
  IoMdFlame,
  IoMdThumbsDown,
  IoMdThumbsUp,
} from "react-icons/io";
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
  getMyOpportunitiesExportToCSV,
  getOpportunitiesForVerification,
  performActionVerifyBulk,
  searchMyOpportunitiesAdmin,
} from "~/api/services/myOpportunities";
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
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
import {
  DATE_FORMAT_HUMAN,
  GA_ACTION_OPPORTUNITY_COMPLETION_VERIFY,
  GA_CATEGORY_OPPORTUNITY,
  PAGE_SIZE,
  PAGE_SIZE_MAXIMUM,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
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
// or from the /admin/opportunities/.. pages (Admin role). the retunUrl query param is used to redirect back to the admin page
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

  const [isExportButtonLoading, setIsExportButtonLoading] = useState(false);
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
  const { data: data, isLoading: isLoadingData } =
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
  //   {
  //   pageNumber: 1,
  //   pageSize: 1,
  //   valueContains: query?.toString() ?? null,
  //   organizations: [id],
  //   opportunity: opportunity?.toString() ?? null,
  //   userId: null,
  //   action: Action.Verification,
  //   verificationStatuses: [
  //     VerificationStatus.Pending,
  //     VerificationStatus.Completed,
  //     VerificationStatus.Rejected,
  //   ],
  // }
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

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_OPPORTUNITY,
          GA_ACTION_OPPORTUNITY_COMPLETION_VERIFY,
          `${tempSelectedRows?.length ?? 0} Opportunity Completions ${
            approved ? "approved" : "rejected"
          }`,
        );

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
        setSelectedRows(data?.items ?? []);
      } else {
        setSelectedRows([]);
      }
    },
    [data, setSelectedRows],
  );

  const handleExportToCSV = useCallback(async () => {
    setIsExportButtonLoading(true);

    try {
      const searchFilterCopy = JSON.parse(JSON.stringify(searchFilter)); // deep copy

      searchFilterCopy.pageNumber = 1;
      searchFilterCopy.pageSize = PAGE_SIZE_MAXIMUM;

      const data = await getMyOpportunitiesExportToCSV(searchFilterCopy);
      if (!data) return;

      FileSaver.saveAs(data);

      setExportDialogOpen(false);
    } finally {
      setIsExportButtonLoading(false);
    }
  }, [searchFilter, setIsExportButtonLoading, setExportDialogOpen]);

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

  const onFilterVerificationStatus = useCallback(
    (verificationStatus: string) => {
      searchFilter.pageNumber = 1;
      searchFilter.verificationStatuses = verificationStatus
        ? verificationStatus.split("|")
        : null;
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
        <title>Yoma | Verifications</title>
      </Head>

      {isLoading && <Loading />}

      <PageBackground className="h-[21rem] md:h-[17rem]" />

      {/* MODAL DIALOG FOR VERIFY */}
      <CustomModal
        isOpen={modalVerifyVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseVerificationModal}
        className={`md:max-h-[400px] md:w-[600px]`}
      >
        <div className="flex h-full flex-col space-y-2">
          <div className="flex flex-row items-center bg-white px-4 pt-2">
            <h4 className="flex-grow pl-2 font-semibold">
              {tempSelectedRows?.length} Participant
              {(selectedRows?.length ?? 0) > 1 ? "s" : ""}
            </h4>
            <button
              type="button"
              className="btn scale-[0.55] rounded-full border-green-dark bg-green-dark p-[7px] text-white hover:text-green"
              onClick={onCloseVerificationModal}
            >
              <IoMdClose className="h-8 w-8"></IoMdClose>
            </button>
          </div>

          <div className="flex flex-grow flex-col overflow-x-hidden overflow-y-scroll bg-gray">
            <div className="flex flex-grow flex-col gap-4 bg-gray-light p-6 pt-8">
              {tempSelectedRows?.map((row) => (
                <OpportunityCompletionRead data={row} key={row?.id} />
              ))}
            </div>

            <div className="flex flex-col gap-4 bg-gray-light px-6 pb-10">
              <div className="form-control rounded-lg bg-white px-4 py-2">
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
          </div>

          {/* BUTTONS */}
          <div className="flex flex-row place-items-center justify-center px-6 py-4 pt-2">
            <div className="flex flex-grow">
              <button
                className="btn btn-sm flex-nowrap border-black bg-white py-5 text-black md:btn-sm hover:bg-black hover:text-white"
                onClick={onCloseVerificationModal}
              >
                <IoMdClose className="h-6 w-6" />
                Close
              </button>
            </div>
            <div className="flex gap-4">
              {(bulkActionApprove == null || !bulkActionApprove) && (
                <button
                  className="btn btn-sm flex-nowrap border-red-500 bg-white py-5 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => onVerify(false)}
                >
                  <IoMdThumbsDown className="h-6 w-6" />
                  Reject
                </button>
              )}

              {(bulkActionApprove == null || bulkActionApprove) && (
                <button
                  className="btn btn-sm flex-nowrap border-green bg-white py-5 text-green hover:bg-green hover:text-white"
                  onClick={() => onVerify(true)}
                >
                  <IoMdThumbsUp className="h-6 w-6" />
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      </CustomModal>

      {/* MODAL DIALOG FOR VERIFICATION RESULT */}
      <CustomModal
        isOpen={modalVerificationResultVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseVerificationResultModal}
        className={`md:max-h-[450px] md:w-[600px]`}
      >
        <div className="flex h-full flex-col space-y-2 overflow-y-auto">
          <div className="flex flex-row items-center bg-white px-4 pt-2">
            <h4 className="flex-grow pl-2 font-semibold">
              {verificationResponse?.items?.length} Participant
              {(verificationResponse?.items?.length ?? 0) > 1 ? "s" : ""}
            </h4>
            <button
              type="button"
              className="btn scale-[0.55] rounded-full border-green-dark bg-green-dark p-[7px] text-white hover:text-green"
              onClick={onCloseVerificationResultModal}
            >
              <IoMdClose className="h-8 w-8"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-grow flex-col overflow-x-hidden overflow-y-scroll bg-gray">
            <div className="flex flex-grow flex-col place-items-center justify-center bg-gray-light px-6 py-8">
              <div className="flex h-full w-full flex-col place-items-center justify-center gap-4 rounded-lg bg-white p-4 text-center">
                {verificationResponse?.items.map((item) => (
                  <div
                    key={`verificationResult_${item.userId}-${item.opportunityId}`}
                    className="space-y-2 rounded-lg border-2 border-gray-light p-4 md:space-y-0"
                  >
                    <div className="flex h-fit flex-col items-center gap-4 border-0 text-gray-dark md:!h-[75px] md:flex-row">
                      <div className="h-fit rounded-full bg-green-light">
                        {item.success && (
                          <IoIosCheckmark className="h-8 w-8 text-green md:h-10 md:w-10" />
                        )}
                        {!item.success && (
                          <IoIosClose className="h-8 w-8 text-red-400 md:h-10 md:w-10" />
                        )}
                      </div>
                      <p className="line-clamp-2 w-full text-ellipsis text-center text-sm font-normal leading-5 tracking-wide md:w-[420px] md:text-left md:font-semibold">
                        {item.opportunityTitle}
                      </p>
                    </div>
                    <div className="border-gray">
                      <div>
                        <div className="flex flex-row items-center gap-2 text-center text-sm text-gray-dark md:text-left md:text-base">
                          {item.success && (
                            <>
                              {verificationResponse.status == "Completed" && (
                                <div>
                                  <strong>{item.userDisplayName}</strong> was
                                  successfully
                                  <strong className="mx-1">approved.</strong>
                                  <br className="hidden md:block" />
                                  We&apos;ve sent them an email to share the
                                  good news!
                                </div>
                              )}
                              {verificationResponse.status == "Rejected" && (
                                <div>
                                  <strong>{item.userDisplayName}</strong> was
                                  successfully
                                  <strong className="mx-1">rejected.</strong>
                                  <br className="hidden md:block" />
                                  We&apos;ve sent them an email with your
                                  comments.
                                </div>
                              )}
                            </>
                          )}
                          {!item.success && (
                            <div className="text-red-400">
                              {item.failure?.message
                                ? item.failure?.message
                                : "An error occurred while processing the request."}
                            </div>
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
              className="btn btn-outline btn-sm flex-nowrap rounded-full px-10 py-5 text-green hover:border-green hover:bg-green hover:text-white"
              onClick={onCloseVerificationResultModal}
            >
              Close
            </button>
          </div>
        </div>
      </CustomModal>

      {/* EXPORT DIALOG */}
      <CustomModal
        isOpen={exportDialogOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setExportDialogOpen(false);
        }}
        className={`md:max-h-[480px] md:w-[600px]`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex h-20 flex-row bg-blue p-4 shadow-lg"></div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
              <Image
                src={iconBell}
                alt="Icon Bell"
                width={28}
                className="h-auto"
                sizes="100vw"
                priority={true}
              />
            </div>

            <div className="flex w-96 flex-col gap-4">
              <h4>
                Just a heads up, the result set is quite large and we can only
                return a maximum of {PAGE_SIZE_MAXIMUM.toLocaleString()} rows
                for each export.
              </h4>
              <h5>
                To help manage this, consider applying search filters. This will
                narrow down the size of your results and make your data more
                manageable.
              </h5>
              <h5>When you&apos;re ready, click the button to continue.</h5>
            </div>

            <div className="mt-4 flex flex-grow gap-4">
              <button
                type="button"
                className="btn bg-green normal-case text-white hover:bg-green hover:brightness-110 disabled:border-0 disabled:bg-green disabled:brightness-90 md:w-[250px]"
                onClick={handleExportToCSV}
                disabled={isExportButtonLoading}
              >
                {isExportButtonLoading && (
                  <p className="text-white">Exporting...</p>
                )}
                {!isExportButtonLoading && (
                  <>
                    <IoMdDownload className="h-5 w-5 text-white" />
                    <p className="text-white">Export to CSV</p>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* PAGE */}
      <div className="container z-10 mt-14 max-w-7xl px-2 py-8 md:mt-[4.9rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="flex items-center text-3xl font-semibold tracking-normal text-white">
            Verifications <LimitedFunctionalityBadge />
          </h3>

          {/* FILTERS */}
          <div>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex flex-grow flex-col items-center justify-start gap-4 md:flex-row">
                <div className="text-sm font-semibold text-white">
                  Filter by:
                </div>

                {/* OPPORTUNITIES FILTER */}
                <div className="w-full md:w-72">
                  <Select
                    instanceId={"opportunities"}
                    classNames={{
                      control: () =>
                        "input input-xs md:w-[330px] !border-0 !rounded-lg",
                    }}
                    options={dataOpportunitiesForVerification}
                    onChange={(val) => onFilterOpportunity(val?.value ?? "")}
                    value={dataOpportunitiesForVerification?.find(
                      (c) => c.value === opportunity,
                    )}
                    placeholder="Opportunities"
                    isClearable={true}
                  />
                </div>
              </div>

              {/* SEARCH INPUT */}
              <SearchInput defaultValue={query} onSearch={onSearch} />
            </div>
          </div>

          {/* FILTER BADGES */}
          {/* <FilterBadges
            searchFilter={searchFilter}
            excludeKeys={[
              "pageNumber",
              "pageSize",
              "userId",
              "organizations",
              "action",
              "verificationStatuses",
            ]}
            resolveValue={(key, value) => {

              return value;
            }}
            //onSubmit={(e) => onSubmitFilter(e)}
            onSubmit={(e) => {}}
          /> */}

          {/* TABBED NAVIGATION */}
          <div className="z-10x flex justify-center md:justify-start">
            <div className="flex w-full gap-2">
              {/* LEFT BUTTON MOBILE */}
              <div className="-ml-1 mb-1 flex items-center md:hidden">
                <button
                  className="ease-bounce focus:outline-none active:scale-90"
                  onClick={() => {
                    const tabList = document.querySelector('[role="tablist"]');
                    if (tabList) {
                      tabList.scrollLeft -= 100;
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              </div>

              {/* TABS */}
              <div
                className="tabs tabs-bordered w-full gap-2 overflow-x-scroll md:overflow-hidden"
                role="tablist"
              >
                <div className="border-b border-transparent text-center text-sm font-medium text-gray-dark">
                  <ul className="-mb-px flex w-full justify-center gap-8 md:justify-start">
                    <li className="whitespace-nowrap">
                      <button
                        onClick={() => onFilterVerificationStatus("")}
                        className={`inline-block h-10 w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          !verificationStatus
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
                      </button>
                    </li>
                    <li className="whitespace-nowrap">
                      <button
                        onClick={() => onFilterVerificationStatus("Pending")}
                        className={`inline-block h-10 w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          verificationStatus === "Pending"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Pending
                        {(totalCountPending ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountPending}
                          </div>
                        )}
                      </button>
                    </li>
                    <li className="whitespace-nowrap">
                      <button
                        onClick={() => onFilterVerificationStatus("Completed")}
                        className={`inline-block h-10 w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          verificationStatus === "Completed"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Completed
                        {(totalCountCompleted ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountCompleted}
                          </div>
                        )}
                      </button>
                    </li>
                    <li className="whitespace-nowrap">
                      <button
                        onClick={() => onFilterVerificationStatus("Rejected")}
                        className={`inline-block h-10 w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          verificationStatus === "Rejected"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Rejected
                        {(totalCountRejected ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountRejected}
                          </div>
                        )}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* RIGHT BUTTON MOBILE */}
              <div className="-mr-1 mb-1 flex items-center md:hidden">
                <button
                  className="ease-bounce focus:outline-none active:scale-90"
                  onClick={() => {
                    const tabList = document.querySelector('[role="tablist"]');
                    if (tabList) {
                      tabList.scrollLeft += 100;
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="my-4 flex flex-col items-center justify-between gap-6 md:flex-row">
            {/* WARNING MSG */}
            <div className="w-full max-w-5xl rounded-lg bg-orange p-2 text-xs font-semibold text-white md:w-fit">
              Bulk verifications are processed in the order in which you select
              them, we encourage selecting from top to bottom, as that is the
              order in which Youth applied.
            </div>

            {/* BUTTONS */}
            <div className="flex w-full flex-row justify-around gap-2 md:w-fit md:justify-end">
              <button
                type="button"
                className="btn btn-sm w-[120px] flex-nowrap border-green bg-green text-white hover:bg-green hover:text-white disabled:bg-green disabled:brightness-90"
                onClick={() => {
                  // show dialog if the result set is too large
                  if ((data?.totalCount ?? 0) > PAGE_SIZE_MAXIMUM) {
                    setExportDialogOpen(true);
                    return;
                  }

                  handleExportToCSV();
                }}
                disabled={isExportButtonLoading}
              >
                {isExportButtonLoading && (
                  <p className="text-white">Exporting...</p>
                )}
                {!isExportButtonLoading && (
                  <>
                    <IoMdDownload className="h-5 w-5 text-white" />
                    <p className="text-white">Export</p>
                  </>
                )}
              </button>

              {/* show approve/reject buttons for 'all' & 'pending' tabs */}
              {(!verificationStatus || verificationStatus === "Pending") &&
                !isLoadingData &&
                data &&
                data.items?.length > 0 && (
                  <>
                    <button
                      className="btn btn-sm flex-nowrap border-green bg-white text-green hover:bg-green hover:text-white"
                      onClick={() => onChangeBulkAction(true)}
                    >
                      <IoMdThumbsUp className="h-6 w-6" />
                      Approve
                    </button>
                    <button
                      className="btn btn-sm flex-nowrap border-red-500 bg-white text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => onChangeBulkAction(false)}
                    >
                      <IoMdThumbsDown className="h-6 w-6" />
                      Reject
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        {isLoadingData && (
          <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8 md:pb-16">
            <LoadingSkeleton />
          </div>
        )}

        {!isLoadingData && (
          <>
            {/* NO RESULTS */}
            {data && data.totalCount === 0 && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                <NoRowsMessage
                  title={"No results found"}
                  description={"Please try refining your search query."}
                />
              </div>
            )}

            {/* RESULTS */}
            {data && data.items?.length > 0 && (
              <div className="overflow-x-auto md:rounded-lg md:shadow-custom">
                {/* DESKTOP */}
                <table className="hidden bg-white md:table md:rounded-lg">
                  <thead className="text-sm">
                    <tr className="!border-gray bg-gray-light text-gray-dark">
                      <th className="w-[35px] !py-6 pr-4">
                        <input
                          type="checkbox"
                          className="checkbox-primary checkbox checkbox-sm rounded border-gray-dark bg-white"
                          checked={selectedRows?.length === data.items?.length}
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
                    {data.items.map((item) => (
                      <tr
                        key={item.id}
                        className="!h-[70px] !border-gray bg-white text-gray-dark"
                      >
                        <td className="w-[35px] pt-4">
                          <input
                            type="checkbox"
                            className="checkbox-primary checkbox checkbox-sm rounded border-gray-dark bg-white"
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
                                  className="btn btn-sm flex-nowrap border-gray bg-white text-gray-dark hover:bg-gray hover:text-white"
                                  onClick={() => {
                                    setBulkActionApprove(null);
                                    setTempSelectedRows([item]);
                                    setModalVerifyVisible(true);
                                  }}
                                >
                                  <IoMdAlert className="mr-2 h-6 w-6 text-yellow" />
                                  Pending
                                </button>
                              )}

                            {/* Status Badges */}
                            {item.verificationStatus &&
                              item.verificationStatus == "Completed" && (
                                <div className="flex flex-row">
                                  <IoMdCheckmark className="mr-2 h-6 w-6 text-green" />
                                  Completed
                                </div>
                              )}
                            {item.verificationStatus &&
                              item.verificationStatus == "Rejected" && (
                                <div className="flex flex-row">
                                  <IoMdClose className="mr-2 h-6 w-6 text-red-400" />
                                  Rejected
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
                  {data.items.map((item) => (
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
                totalItems={data?.totalCount ?? 0}
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OpportunityVerifications;
