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
  DATETIME_FORMAT_HUMAN,
  PAGE_SIZE,
  ROLE_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
  THEME_PURPLE,
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

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  opportunity?: string;
  page?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  // 👇 set theme based on role
  let theme;

  if (session?.user?.adminsOf?.includes(id)) {
    theme = THEME_GREEN;
  } else if (session?.user?.roles.includes(ROLE_ADMIN)) {
    theme = THEME_BLUE;
  } else {
    theme = THEME_PURPLE;
  }

  // 👇 prefetch queries on server
  const { query, opportunity, page } = context.query;
  const queryClient = new QueryClient(config);
  await Promise.all([
    await queryClient.prefetchQuery({
      queryKey: [
        `Verifications_${id}_${query?.toString()}_${opportunity}_${page?.toString()}`,
      ],
      queryFn: () =>
        searchMyOpportunitiesAdmin(
          {
            organizations: [id],
            pageNumber: page ? parseInt(page.toString()) : 1,
            pageSize: PAGE_SIZE,
            opportunity: opportunity?.toString() ?? null,
            userId: null,
            valueContains: query?.toString() ?? null,
            action: Action.Verification,
            verificationStatuses: [
              VerificationStatus.Pending,
              VerificationStatus.Completed,
              VerificationStatus.Rejected,
            ],
          },
          context,
        ),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["OpportunitiesForVerification", id],
      queryFn: async () =>
        (await getOpportunitiesForVerification([id], undefined, context)).map(
          (x) => ({
            value: x.id,
            label: x.title,
          }),
        ),
    }),
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id ?? null,
      query: query ?? null,
      opportunity: opportunity ?? null,
      page: page ?? "1",
      theme: theme,
    },
  };
}

const OpportunityVerifications: NextPageWithLayout<{
  id: string;
  query?: string;
  opportunity?: string;
  page?: string;
  error: string;
  theme: string;
}> = ({ id, query, opportunity, page, error }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // 👇 use prefetched queries from server
  const { data: data } = useQuery<MyOpportunitySearchResults>({
    queryKey: [
      `Verifications_${id}_${query?.toString()}_${opportunity?.toString()}_${page?.toString()}`,
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
        verificationStatuses: [
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
  const [selectedOption, setSelectedOption] = useState(null);

  const onSearch = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const queryEncoded = encodeURIComponent(query);

        // redirect to the search page
        void router.push({
          pathname: `/organisations/${id}/verifications`,
          query: { query: queryEncoded, opportunity: opportunity },
        });
      } else {
        void router.push(`/organisations/${id}/verifications`);
      }
    },
    [router, id, opportunity],
  );
  const onFilterOpportunity = useCallback(
    (opportunityId: string) => {
      if (opportunityId) {
        void router.push({
          pathname: `/organisations/${id}/verifications`,
          query: { query: query, opportunity: opportunityId },
        });
      } else {
        void router.push(`/organisations/${id}/verifications`);
      }
    },
    [router, id, query],
  );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/organisations/${id}/verifications`,
        query: { query: query, opportunity: opportunity, page: value },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [router, query, id, opportunity],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [modalVerifySingleVisible, setModalVerifySingleVisible] =
    useState(false);
  const [modalVerifyBulkVisible, setModalVerifyBulkVisible] = useState(false);
  const [verifyComments, setVerifyComments] = useState("");
  const [currentRow, setCurrentRow] = useState<MyOpportunityInfo>();
  const [selectedRows, setSelectedRows] = useState<MyOpportunityInfo[]>();
  const [bulkActionApprove, setBulkActionApprove] = useState(false);

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
  //#endregion Click Handlers

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
  if (error) return <Unauthorized />;

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
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[400px] md:w-[600px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col space-y-2">
          <div className="flex flex-row items-center bg-white p-4">
            <h3 className="flex-grow">Participant</h3>
            <button
              type="button"
              className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
              onClick={() => setModalVerifySingleVisible(false)}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-grow flex-col overflow-x-hidden overflow-y-scroll bg-gray">
            <div className="flex flex-grow flex-col gap-4  bg-gray p-4 ">
              <OpportunityCompletionRead
                data={currentRow!}
                key={currentRow?.id}
              />
            </div>

            <div className="divider m-0" />

            <div className="flex flex-col gap-4 bg-white p-4">
              <div className="form-control">
                <label className="label">
                  <span className="text-lg font-bold text-gray-dark">
                    Enter comments below:
                  </span>
                </label>
                <textarea
                  className="input input-bordered h-[100px] w-full"
                  onChange={(e) => setVerifyComments(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className=" flex flex-row place-items-center justify-center p-2">
            <div className="flex flex-grow">
              <button
                className="btn-default btn btn-sm flex-nowrap rounded-full py-2"
                onClick={() => setModalVerifySingleVisible(false)}
              >
                <IoMdClose className="h-6 w-6" />
                Close
              </button>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-sm flex-nowrap rounded-full border-red-500 bg-white py-2 text-red-500"
                onClick={() => onVerifySingle(currentRow!, false)}
              >
                <IoMdThumbsDown className="h-6 w-6" />
                Reject
              </button>

              <button
                className="btn btn-sm flex-nowrap rounded-full bg-green py-2 text-white"
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
          <div className="flex flex-row items-center bg-white p-4">
            <h3 className="flex-grow">
              {selectedRows?.length} Participant
              {(selectedRows?.length ?? 0) > 1 ? "s" : ""}
            </h3>
            <button
              type="button"
              className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
              onClick={() => setModalVerifyBulkVisible(false)}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>

          <div className="flex flex-grow flex-col overflow-x-hidden overflow-y-scroll bg-gray">
            <div className="flex flex-grow flex-col gap-4 bg-gray p-4 ">
              {/* <div className="flex flex-col gap-4 rounded-lg bg-white p-4"> */}
              {selectedRows?.map((row) => (
                <OpportunityCompletionRead data={row} key={row?.id} />
              ))}
            </div>

            <div className="divider m-0" />

            <div className="flex flex-col gap-4 bg-white p-4">
              <div className="form-control">
                <label className="label">
                  <span className="text-lg font-bold text-gray-dark">
                    Enter comments below:
                  </span>
                </label>
                <textarea
                  className="input input-bordered h-[100px] w-full"
                  onChange={(e) => setVerifyComments(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className=" flex flex-row place-items-center justify-center p-2">
            <div className="flex flex-grow">
              <button
                className="btn-default btn btn-sm flex-nowrap rounded-full py-2"
                onClick={() => setModalVerifyBulkVisible(false)}
              >
                <IoMdClose className="h-6 w-6" />
                Close
              </button>
            </div>
            <div className="flex gap-2">
              {!bulkActionApprove && (
                <button
                  className="btn btn-sm flex-nowrap rounded-full border-red-500 bg-white py-2 text-red-500"
                  onClick={() => onVerifyBulk(false)}
                >
                  <IoMdThumbsDown className="h-6 w-6" />
                  Reject
                </button>
              )}

              {bulkActionApprove && (
                <button
                  className="btn btn-sm flex-nowrap rounded-full bg-green py-2 text-white"
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

      <div className="container z-10 mt-20 max-w-5xl px-2 py-8">
        <h3 className="flex flex-grow items-center py-4 text-white">
          Verifications <LimitedFunctionalityBadge />
        </h3>

        <div className="rounded-lg bg-white p-4">
          <div className="flex flex-row">
            <div className="flex flex-grow gap-2">
              {/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */}
              <Select
                classNames={{
                  control: () => "input input-xs w-[200px]",
                }}
                options={dataOpportunitiesForVerification}
                onChange={(val) => onFilterOpportunity(val?.value!)}
                value={dataOpportunitiesForVerification?.find(
                  (c) => c.value === opportunity,
                )}
                placeholder="Opportunity"
                isClearable={true}
              />
              {/* eslint-enable @typescript-eslint/no-non-null-asserted-optional-chain */}
            </div>
            <div className="flex gap-2 sm:justify-end">
              {/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */}
              <Select
                classNames={{
                  control: () => "input input-xs w-[200px]",
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
          {/* {data && data.items?.length === 0 && !query && (
            <NoRowsMessage
              title={"You will find your active opportunities here"}
              description={
                "This is where you will find all the awesome opportunities you have shared"
              }
            />
          )} */}
          {data && data.totalCount === 0 && (
            <NoRowsMessage
              title={"No results found"}
              description={"Please try refining your search query."}
            />
          )}

          {/* GRID */}
          {data && data.items?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th>
                      <input
                        type="checkbox"
                        className="checkbox-primary checkbox"
                        checked={selectedRows?.length === data.items?.length}
                        onChange={handleAllSelect}
                      />
                    </th>
                    <th>Student</th>
                    <th>Opportunity</th>
                    <th>Date connected</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-gray text-gray-dark">
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox-primary checkbox"
                          checked={selectedRows?.some((x) => x.id == item.id)}
                          onChange={(e) => handleRowSelect(e, item)}
                        />
                      </td>
                      <td>{item.userDisplayName}</td>
                      <td>
                        <Link
                          href={`/organisations/${id}/opportunities/${item.opportunityId}/info`}
                        >
                          {item.opportunityTitle}
                        </Link>
                      </td>
                      <td>
                        {item.dateStart && (
                          <Moment format={DATETIME_FORMAT_HUMAN}>
                            {item.dateStart}
                          </Moment>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-center">
                          {item.verificationStatus &&
                            item.verificationStatus == "Pending" && (
                              <div className="tooltip" data-tip="Pending">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentRow(item);
                                    setVerifyComments("");
                                    setModalVerifySingleVisible(true);
                                  }}
                                >
                                  <IoMdAlert className="h-6 w-6 text-yellow" />
                                </button>
                              </div>
                            )}

                          {/* Status Badges */}
                          {item.verificationStatus &&
                            item.verificationStatus == "Completed" && (
                              <div className="tooltip" data-tip="Approved">
                                <IoMdCheckmark className="h-6 w-6 text-green" />
                              </div>
                            )}
                          {item.verificationStatus &&
                            item.verificationStatus == "Rejected" && (
                              <div className="tooltip" data-tip="Rejected">
                                <IoMdClose className="h-6 w-6 text-red-400" />
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-2 grid place-items-center justify-center">
            {/* PAGINATION */}
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
