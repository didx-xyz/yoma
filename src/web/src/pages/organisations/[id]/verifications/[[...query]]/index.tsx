import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, type ReactElement, useState } from "react";
import MainLayout from "~/components/Layout/Main";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "~/pages/_app";
import { type ParsedUrlQuery } from "querystring";
import Link from "next/link";
import { PageBackground } from "~/components/PageBackground";
import {
  IoMdAlert,
  IoMdCheckmark,
  IoMdClose,
  IoMdThumbsDown,
  IoMdThumbsUp,
} from "react-icons/io";
import NoRowsMessage from "~/components/NoRowsMessage";
import {
  DATE_FORMAT_HUMAN,
  GA_ACTION_ORGANISATION_VERIFY,
  GA_CATEGORY_ORGANISATION,
  PAGE_SIZE,
} from "~/lib/constants";
import { PaginationButtons } from "~/components/PaginationButtons";
import {
  getOpportunitiesForVerification,
  performActionVerifyBulk,
  performActionVerifyManual,
  searchMyOpportunitiesAdmin,
} from "~/api/services/myOpportunities";
import {
  Action,
  type MyOpportunityInfo,
  type MyOpportunityRequestVerifyFinalize,
  type MyOpportunityRequestVerifyFinalizeBatch,
  type MyOpportunitySearchResults,
  VerificationStatus,
} from "~/api/models/myOpportunity";
import ReactModal from "react-modal";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { toast } from "react-toastify";
import { SearchInput } from "~/components/SearchInput";
import Select from "react-select";
import { type SelectOption } from "~/api/models/lookups";
import { Loading } from "~/components/Status/Loading";
import { OpportunityCompletionRead } from "~/components/Opportunity/OpportunityCompletionRead";
import Moment from "react-moment";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { IoIosCheckmark } from "react-icons/io";
import { trackGAEvent } from "~/lib/google-analytics";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import MobileCard from "~/components/Organisation/Verifications/MobileCard";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";

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
    // 👇 prefetch queries on server
    const dataVerifications = await searchMyOpportunitiesAdmin(
      {
        organizations: [id],
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        opportunity: opportunity?.toString() ?? null,
        userId: null,
        valueContains: query?.toString() ?? null,
        action: Action.Verification,
        verificationStatuses: verificationStatus
          ? [parseInt(verificationStatus.toString())]
          : [
              VerificationStatus.Pending,
              VerificationStatus.Completed,
              VerificationStatus.Rejected,
            ],
      },
      context,
    );
    const dataOpportunitiesForVerification = (
      await getOpportunitiesForVerification([id], undefined, context)
    ).map((x) => ({
      value: x.id,
      label: x.title,
    }));

    await Promise.all([
      await queryClient.prefetchQuery({
        queryKey: [
          `Verifications_${id}_${query?.toString()}_${opportunity}_${page?.toString()}`,
        ],
        queryFn: () => dataVerifications,
      }),
      await queryClient.prefetchQuery({
        queryKey: ["OpportunitiesForVerification", id],
        queryFn: () => dataOpportunitiesForVerification,
      }),
    ]);
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
      user: session?.user ?? null,
      id: id ?? null,
      query: query ?? null,
      opportunity: opportunity ?? null,
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
  page?: string;
  theme: string;
  error?: number;
}> = ({ id, query, opportunity, page, error }) => {
  const router = useRouter();
  const { returnUrl, verificationStatus } = router.query;
  const queryClient = useQueryClient();

  // 👇 use prefetched queries from server
  const { data: data } = useQuery<MyOpportunitySearchResults>({
    queryKey: [
      `Verifications_${id}_${query?.toString()}_${opportunity?.toString()}_${verificationStatus}_${page?.toString()}`,
    ],
    queryFn: () =>
      searchMyOpportunitiesAdmin({
        organizations: [id],
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        opportunity: opportunity?.toString() ?? null,
        userId: null,
        valueContains: query?.toString() ?? null,
        action: Action.Verification,
        verificationStatuses: verificationStatus
          ? [parseInt(verificationStatus.toString())]
          : [
              VerificationStatus.Pending,
              VerificationStatus.Completed,
              VerificationStatus.Rejected,
            ],
      }),
    enabled: !error,
  });
  const { data: dataOpportunitiesForVerification } = useQuery<SelectOption[]>({
    queryKey: [`OpportunitiesForVerification_${id}`],
    queryFn: async () =>
      (await getOpportunitiesForVerification([id])).map((x) => ({
        value: x.id,
        label: x.title,
      })),
    enabled: !error,
  });
  const dataBulkActions: SelectOption[] = [
    { value: "Approve", label: "Approve" },
    { value: "Reject", label: "Reject" },
  ];
  const lookups_verificationStatuses: SelectOption[] = [
    { value: "1", label: "Pending" },
    { value: "2", label: "Rejected" },
    { value: "3", label: "Completed" },
  ];

  const [selectedOption, setSelectedOption] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [modalVerifySingleVisible, setModalVerifySingleVisible] =
    useState(false);
  const [modalVerifyBulkVisible, setModalVerifyBulkVisible] = useState(false);
  const [verifyComments, setVerifyComments] = useState("");
  const [currentRow, setCurrentRow] = useState<MyOpportunityInfo>();
  const [selectedRows, setSelectedRows] = useState<MyOpportunityInfo[]>();
  const [bulkActionApprove, setBulkActionApprove] = useState(false);
  const [modalSingleSuccessVisible, setModalSingleSuccessVisible] =
    useState(false);
  const [modalBulkSuccessVisible, setModalBulkSuccessVisible] = useState(false);
  const [approved, setApproved] = useState(false);

  //#region Click Handlers
  const onVerifySingle = useCallback(
    async (row: MyOpportunityInfo, approved: boolean) => {
      setIsLoading(true);

      try {
        const model: MyOpportunityRequestVerifyFinalize = {
          opportunityId: row.opportunityId,
          userId: row.userId,
          status: approved
            ? VerificationStatus.Completed
            : VerificationStatus.Rejected,
          comment: verifyComments,
        };

        // update api
        await performActionVerifyManual(model);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_ORGANISATION,
          GA_ACTION_ORGANISATION_VERIFY,
          `Organisation ${approved ? "approved" : "rejected"}`,
        );

        // invalidate query
        await queryClient.invalidateQueries({
          queryKey: ["opportunityParticipants", id],
        });
        await queryClient.invalidateQueries({
          queryKey: [
            `Verifications_${id}_${query?.toString()}_${opportunity?.toString()}_${page?.toString()}`,
          ],
        });
      } catch (error) {
        toast(<ApiErrors error={error} />, {
          type: "error",
          toastId: "verifyCredential",
          autoClose: 2000,
          icon: false,
        });

        //captureException(error);
        setIsLoading(false);

        return;
      }

      toast(
        `'${row.userDisplayName}' has been ${
          approved ? "approved" : "rejected"
        }`,
        {
          type: "success",
          toastId: "verifyCredential",
          autoClose: 2000,
        },
      );
      setIsLoading(false);
      setModalVerifySingleVisible(false);
      if (approved) {
        setApproved(true);
      }
      setModalSingleSuccessVisible(true);
    },
    [
      id,
      queryClient,
      verifyComments,
      setIsLoading,
      setModalVerifySingleVisible,
      query,
      opportunity,
      page,
    ],
  );

  const onVerifyBulkValidate = useCallback(
    (approve: boolean) => {
      setSelectedOption(null);
      setVerifyComments("");

      if (selectedRows == null || selectedRows.length === 0) {
        toast("Please select at least one row to continue", {
          type: "error",
          toastId: "verifyCredentialError",
          icon: true,
        });
        return;
      }

      setBulkActionApprove(approve);
      setModalVerifyBulkVisible(true);
    },
    [
      selectedRows,
      setModalVerifyBulkVisible,
      setSelectedOption,
      setBulkActionApprove,
      setVerifyComments,
    ],
  );

  const onVerifyBulk = useCallback(
    async (approved: boolean) => {
      setIsLoading(true);

      try {
        const model: MyOpportunityRequestVerifyFinalizeBatch = {
          status: approved
            ? VerificationStatus.Completed
            : VerificationStatus.Rejected,
          comment: verifyComments,
          items:
            selectedRows?.map((item) => ({
              opportunityId: item.opportunityId,
              userId: item.userId,
            })) ?? [],
        };

        // update api
        await performActionVerifyBulk(model);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_ORGANISATION,
          GA_ACTION_ORGANISATION_VERIFY,
          `${selectedRows?.length ?? 0} Organisations ${
            approved ? "approved" : "rejected"
          }`,
        );

        // invalidate query
        await queryClient.invalidateQueries({
          queryKey: ["opportunityParticipants", id],
        });
        await queryClient.invalidateQueries({
          queryKey: [
            `Verifications_${id}_${query?.toString()}_${opportunity?.toString()}_${page?.toString()}`,
          ],
        });
      } catch (error) {
        toast(<ApiErrors error={error} />, {
          type: "error",
          toastId: "verifyCredential",
          autoClose: 2000,
          icon: false,
        });

        //captureException(error);
        setIsLoading(false);

        return;
      }

      toast(
        `${selectedRows?.length} participant(s) has been ${
          approved ? "approved" : "rejected"
        }`,
        {
          type: "success",
          toastId: "verifyCredential",
          autoClose: 2000,
        },
      );
      setIsLoading(false);
      setModalVerifyBulkVisible(false);
      if (approved) {
        setApproved(true);
      }
      setModalBulkSuccessVisible(true);
    },
    [
      id,
      opportunity,
      page,
      query,
      queryClient,
      verifyComments,
      selectedRows,
      setIsLoading,
      setModalVerifyBulkVisible,
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
        setSelectedRows(
          (prev: MyOpportunityInfo[] | undefined) =>
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

  const handleCloseSingleSuccessModal = () => {
    setModalSingleSuccessVisible(false);
    setApproved(false);
  };

  const handleCloseBulkSuccessModal = () => {
    setModalBulkSuccessVisible(false);
    setApproved(false);
  };
  //#endregion Click Handlers

  //#region Filter Handlers
  const onSearch = useCallback(
    (query: string) => {
      void router.push({
        pathname: `/organisations/${id}/verifications`,
        query: {
          ...(query && query.length > 2 && { query }),
          ...(opportunity && { opportunity }),
          ...(verificationStatus && { verificationStatus }),
          ...(returnUrl && { returnUrl }),
        },
      });
    },
    [router, id, opportunity, returnUrl, verificationStatus],
  );
  const onFilterOpportunity = useCallback(
    (opportunityId: string) => {
      void router.push({
        pathname: `/organisations/${id}/verifications`,
        query: {
          ...(query && { query }),
          ...(opportunityId && { opportunity: opportunityId }),
          ...(verificationStatus && { verificationStatus }),
          ...(returnUrl && { returnUrl }),
        },
      });
    },
    [router, id, query, returnUrl, verificationStatus],
  );
  const onFilterVerificationStatus = useCallback(
    (verificationStatus: string) => {
      void router.push({
        pathname: `/organisations/${id}/verifications`,
        query: {
          ...(query && { query }),
          ...(opportunity && { opportunity }),
          ...(verificationStatus && { verificationStatus }),
          ...(returnUrl && { returnUrl }),
        },
      });
    },
    [router, id, query, returnUrl, opportunity],
  );

  const handlePagerChange = useCallback(
    (value: number) => {
      void router.push({
        pathname: `/organisations/${id}/verifications`,
        query: {
          ...(query && { query }),
          ...(opportunity && { opportunity }),
          ...(verificationStatus && { verificationStatus }),
          ...(value && { page: value }),
          ...(returnUrl && { returnUrl }),
        },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [router, query, id, opportunity, verificationStatus, returnUrl],
  );
  //#endregion Filter Handlers

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(modalVerifySingleVisible);
  useDisableBodyScroll(modalVerifyBulkVisible);
  useDisableBodyScroll(modalSingleSuccessVisible);
  useDisableBodyScroll(modalBulkSuccessVisible);

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
      <PageBackground />

      {/* MODAL DIALOG FOR VERIFY (SINGLE) */}
      <ReactModal
        isOpen={modalVerifySingleVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setModalVerifySingleVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[400px] md:w-[600px] md:rounded-lg`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col space-y-2">
          <div className="flex flex-row items-center bg-white px-4 pt-2">
            <h4 className="flex-grow pl-2 font-semibold">Participant</h4>
            <button
              type="button"
              className="btn scale-[0.55] rounded-full border-green-dark bg-green-dark p-[7px] text-white hover:text-green"
              onClick={() => setModalVerifySingleVisible(false)}
            >
              <IoMdClose className="h-8 w-8"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-grow flex-col overflow-x-hidden overflow-y-scroll bg-gray">
            <div className="flex flex-grow flex-col gap-4 bg-gray-light p-6 pt-8">
              <OpportunityCompletionRead
                data={currentRow!}
                key={currentRow?.id}
              />
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
          <div className=" flex place-items-center justify-center px-6 py-4 pt-2 md:flex-row">
            <div className="hidden flex-grow md:flex">
              <button
                className="btn-default btn btn-sm flex-nowrap rounded-full py-5"
                onClick={() => setModalVerifySingleVisible(false)}
              >
                <IoMdClose className="h-6 w-6" />
                Close
              </button>
            </div>
            <div className="flex gap-4">
              <button
                className="btn btn-sm flex-nowrap rounded-full border-red-500 bg-white py-5 text-red-500"
                onClick={() => onVerifySingle(currentRow!, false)}
              >
                <IoMdThumbsDown className="h-6 w-6" />
                Reject
              </button>

              <button
                className="btn btn-sm flex-nowrap rounded-full bg-green py-5 text-white hover:text-green"
                onClick={() => onVerifySingle(currentRow!, true)}
              >
                <IoMdThumbsUp className="h-6 w-6" />
                Approve
              </button>
            </div>
          </div>
        </div>
      </ReactModal>

      {/* MODAL DIALOG FOR VERIFY (BULK) */}
      <ReactModal
        isOpen={modalVerifyBulkVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setModalVerifyBulkVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[400px] md:w-[600px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col space-y-2">
          <div className="flex flex-row items-center bg-white px-4 pt-2">
            <h4 className="flex-grow pl-2 font-semibold">
              {selectedRows?.length} Participant
              {(selectedRows?.length ?? 0) > 1 ? "s" : ""}
            </h4>
            <button
              type="button"
              className="btn scale-[0.55] rounded-full border-green-dark bg-green-dark p-[7px] text-white hover:text-green"
              onClick={() => setModalVerifyBulkVisible(false)}
            >
              <IoMdClose className="h-8 w-8"></IoMdClose>
            </button>
          </div>

          <div className="flex flex-grow flex-col overflow-x-hidden overflow-y-scroll bg-gray">
            <div className="flex flex-grow flex-col gap-4 bg-gray-light p-6 pt-8">
              {selectedRows?.map((row) => (
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
          <div className=" flex flex-row place-items-center justify-center px-6 py-4 pt-2">
            <div className="flex flex-grow">
              <button
                className="btn-default btn btn-sm flex-nowrap rounded-full py-5"
                onClick={() => setModalVerifyBulkVisible(false)}
              >
                <IoMdClose className="h-6 w-6" />
                Close
              </button>
            </div>
            <div className="flex gap-4">
              {!bulkActionApprove && (
                <button
                  className="btn btn-sm flex-nowrap rounded-full border-red-500 bg-white py-5 text-red-500"
                  onClick={() => onVerifyBulk(false)}
                >
                  <IoMdThumbsDown className="h-6 w-6" />
                  Reject
                </button>
              )}

              {bulkActionApprove && (
                <button
                  className="btn btn-sm flex-nowrap rounded-full bg-green py-5 text-white hover:text-green"
                  onClick={() => onVerifyBulk(true)}
                >
                  <IoMdThumbsUp className="h-6 w-6" />
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      </ReactModal>

      {/* MODAL DIALOG FOR VERIFICATION SUCCESS (SINGLE) */}
      <ReactModal
        isOpen={modalSingleSuccessVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          handleCloseSingleSuccessModal();
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[450px] md:w-[600px] md:rounded-lg`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col space-y-2 overflow-y-auto">
          <div className="flex flex-row items-center bg-white px-4 pt-2">
            <h4 className="flex-grow pl-2 font-semibold">Participant</h4>
            <button
              type="button"
              className="btn scale-[0.55] rounded-full border-green-dark bg-green-dark p-[7px] text-white hover:text-green"
              onClick={() => handleCloseSingleSuccessModal()}
            >
              <IoMdClose className="h-8 w-8"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-grow flex-col overflow-x-hidden overflow-y-scroll bg-gray">
            <div className="flex flex-grow flex-col place-items-center justify-center bg-gray-light px-6 py-8">
              <div className="flex h-full w-full flex-col place-items-center justify-center rounded-lg bg-white py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-green-dark bg-green-light">
                  <IoIosCheckmark className="h-16 w-16 text-green" />
                </div>
                {approved ? (
                  <>
                    {currentRow && (
                      <h4 className="font-bold">
                        {currentRow.userDisplayName}&apos;s credential has been
                        approved.
                      </h4>
                    )}
                    <p>We&apos;ve sent them an email to share the good news.</p>
                  </>
                ) : (
                  <>
                    {currentRow && (
                      <h4 className="font-bold">
                        {currentRow.userDisplayName}&apos;s credential has been
                        rejected.
                      </h4>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* BUTTON */}
          <div className=" flex flex-row place-items-center justify-end px-6 py-4 pt-2">
            <button
              className="btn btn-outline btn-sm flex-nowrap rounded-full px-10 py-5 text-green hover:border-green hover:bg-green hover:text-white"
              onClick={() => handleCloseSingleSuccessModal()}
            >
              Close
            </button>
          </div>
        </div>
      </ReactModal>

      {/* MODAL DIALOG FOR VERIFICATION APPROVED SUCCESS (BULK) */}
      <ReactModal
        isOpen={modalBulkSuccessVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          handleCloseBulkSuccessModal();
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[450px] md:w-[600px] md:rounded-lg`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col space-y-2 overflow-y-auto">
          <div className="flex flex-row items-center bg-white px-4 pt-2">
            <h4 className="flex-grow pl-2 font-semibold">Participant</h4>
            <button
              type="button"
              className="btn scale-[0.55] rounded-full border-green-dark bg-green-dark p-[7px] text-white hover:text-green"
              onClick={() => handleCloseBulkSuccessModal()}
            >
              <IoMdClose className="h-8 w-8"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-grow flex-col overflow-x-hidden overflow-y-scroll bg-gray">
            <div className="flex flex-grow flex-col place-items-center justify-center bg-gray-light px-6 py-8">
              <div className="flex h-full w-full flex-col place-items-center justify-center rounded-lg bg-white py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-green-dark bg-green-light">
                  <IoIosCheckmark className="h-16 w-16 text-green" />
                </div>
                {approved ? (
                  <>
                    <h4 className="font-bold">
                      Bulk credentials has been approved.
                    </h4>
                    <p>We&apos;ve sent them an email to share the good news.</p>
                  </>
                ) : (
                  <>
                    <h4 className="font-bold">
                      Bulk credentials has been rejected.
                    </h4>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* BUTTON */}
          <div className=" flex flex-row place-items-center justify-end px-6 py-4 pt-2">
            <button
              className="btn btn-outline btn-sm flex-nowrap rounded-full px-10 py-5 text-green hover:border-green hover:bg-green hover:text-white"
              onClick={() => handleCloseBulkSuccessModal()}
            >
              Close
            </button>
          </div>
        </div>
      </ReactModal>

      {/* PAGE */}
      <div className="container z-10 mt-14 max-w-7xl px-2 py-8 md:mt-[8rem]">
        <div className="px-2 md:px-0">
          <h3 className="mb-6 mt-3 flex items-center text-3xl font-semibold tracking-normal text-white md:mt-0">
            Verifications <LimitedFunctionalityBadge />
          </h3>

          <div className="mt-4 flex flex-row items-center">
            <div className="mb-4 flex flex-grow flex-col flex-wrap justify-end gap-4 md:flex-row">
              {/* STATUS FILTER */}
              <Select
                classNames={{
                  control: () =>
                    "input input-xs md:w-[160px] !border-0 !rounded-lg",
                }}
                options={lookups_verificationStatuses}
                onChange={(val) => onFilterVerificationStatus(val?.value ?? "")}
                value={lookups_verificationStatuses?.find(
                  (c) => c.value === verificationStatus,
                )}
                placeholder="Status"
                isClearable={true}
              />

              {/* OPPORTUNITIES FILTER */}
              {/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */}
              <Select
                classNames={{
                  control: () =>
                    "input input-xs md:w-[330px] !border-0 !rounded-lg",
                }}
                options={dataOpportunitiesForVerification}
                onChange={(val) => onFilterOpportunity(val?.value!)}
                value={dataOpportunitiesForVerification?.find(
                  (c) => c.value === opportunity,
                )}
                placeholder="Opportunities"
                isClearable={true}
              />

              {/* BULK ACTIONS */}
              {/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */}
              <Select
                classNames={{
                  control: () =>
                    "input input-xs md:w-[160px] !border-0 !rounded-lg",
                }}
                options={dataBulkActions}
                onChange={(val) => {
                  onVerifyBulkValidate(val?.value == "Approve");
                }}
                value={selectedOption}
                placeholder="Bulk Actions"
              />
              {/* eslint-enable @typescript-eslint/no-non-null-asserted-optional-chain */}

              <SearchInput defaultValue={query} onSearch={onSearch} />
            </div>
          </div>

          {/* NO ROWS */}
          {data && data.totalCount === 0 && (
            <NoRowsMessage
              title={"No results found"}
              description={"Please try refining your search query."}
            />
          )}

          {/* GRID */}
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
                      <td className="w-[200px] pl-0">{item.userDisplayName}</td>
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
                        {item.dateStart && (
                          <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                            {item.dateStart}
                          </Moment>
                        )}
                      </td>
                      <td className="w-[120px]">
                        <div className="flex justify-start">
                          {item.verificationStatus &&
                            item.verificationStatus == "Pending" && (
                              <button
                                type="button"
                                className="flex flex-row"
                                onClick={() => {
                                  setCurrentRow(item);
                                  setVerifyComments("");
                                  setModalVerifySingleVisible(true);
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
                                <IoMdCheckmark className="mr-2 h-6 w-6  text-green" />
                                Completed
                              </div>
                            )}
                          {item.verificationStatus &&
                            item.verificationStatus == "Rejected" && (
                              <div className="flex flex-row">
                                <IoMdClose className="mr-2 h-6 w-6  text-red-400" />
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
                    key={item.id}
                    item={item}
                    handleRowSelect={handleRowSelect}
                    selectedRows={selectedRows}
                    returnUrl={returnUrl}
                    id={id}
                    setCurrentRow={setCurrentRow}
                    setVerifyComments={setVerifyComments}
                    setModalVerifySingleVisible={setModalVerifySingleVisible}
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
            />
          </div>
        </div>
      </div>
    </>
  );
};

OpportunityVerifications.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OpportunityVerifications.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OpportunityVerifications;
