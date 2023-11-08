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
import { useCallback, type ReactElement, useState, useMemo } from "react";
import MainLayout from "~/components/Layout/Main";
import withAuth from "~/context/withAuth";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "~/pages/_app";
import { type ParsedUrlQuery } from "querystring";
import Link from "next/link";
import { PageBackground } from "~/components/PageBackground";
import {
  IoMdAlert,
  IoMdClose,
  IoMdPin,
  IoMdThumbsDown,
  IoMdThumbsUp,
  IoMdWarning,
} from "react-icons/io";
import NoRowsMessage from "~/components/NoRowsMessage";
import { DATETIME_FORMAT_HUMAN, PAGE_SIZE } from "~/lib/constants";
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
  type MyOpportunitySearchCriteriaOpportunity,
  type MyOpportunitySearchResults,
  VerificationStatus,
} from "~/api/models/myOpportunity";
import Moment from "react-moment";
import ReactModal from "react-modal";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { toast } from "react-toastify";
import Image from "next/image";
import iconSuccess from "public/images/icon-success.svg";
import iconCertificate from "public/images/icon-certificate.svg";
import iconPicture from "public/images/icon-picture.svg";
import iconVideo from "public/images/icon-video.svg";
import iconLocation from "public/images/icon-location.svg";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { env } from "~/env.mjs";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { query, page } = context.query;

  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient();
  if (session) {
    // 👇 prefetch queries (on server)
    await queryClient.prefetchQuery(
      [`Verifications_${id}_${query?.toString()}_${page?.toString()}`],
      () =>
        searchMyOpportunitiesAdmin(
          {
            //organizations: [id],
            pageNumber: page ? parseInt(page.toString()) : 1,
            pageSize: 10,
            opportunityId: null,
            userId: null,
            valueContains: query?.toString() ?? null,
            action: Action.Verification, //TODO
            verificationStatus: VerificationStatus.Pending,
          },
          context,
        ),
    );

    await queryClient.prefetchQuery(["OpportunitiesForVerification", id], () =>
      getOpportunitiesForVerification([id], undefined, context),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
      id: id ?? null,
      query: query ?? null,
      page: page ?? null,
    },
  };
}

const libraries: any[] = ["places"];

const OpportunityVerifications: NextPageWithLayout<{
  id: string;
  query?: string;
  page?: string;
}> = ({ id, query, page }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // 👇 use prefetched queries (from server)
  const { data: data, error } = useQuery<MyOpportunitySearchResults>({
    queryKey: [`Verifications_${id}_${query?.toString()}_${page?.toString()}`],
    queryFn: () =>
      searchMyOpportunitiesAdmin({
        // organizations: [id],
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: 10,
        opportunityId: null,
        userId: null,
        valueContains: query?.toString() ?? null,
        action: Action.Verification, //TODO
        verificationStatus: VerificationStatus.Pending,
      }),
  });
  const { data: dataOpportunitiesForVerification } = useQuery<
    MyOpportunitySearchCriteriaOpportunity[]
  >({
    queryKey: [`OpportunitiesForVerification_${id}`],
    queryFn: () => getOpportunitiesForVerification([id]),
  });

  const onSearch = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const queryEncoded = encodeURIComponent(query);

        // redirect to the search page
        void router.push(
          `/organisations/${id}/opportunities?query=${queryEncoded}`,
        );
      } else {
        void router.push(`/organisations/${id}/opportunities`);
      }
    },
    [router, id],
  );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/organisations/${id}/verifications`,
        query: { query: query, page: value },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [query, id, router],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [modalVerifySingleVisible, setModalVerifySingleVisible] =
    useState(false);
  const [modalVerifyBulkVisible, setModalVerifyBulkVisible] = useState(false);
  const [verifyComments, setVerifyComments] = useState("");
  const [currentRow, setCurrentRow] = useState<MyOpportunityInfo>();
  const [selectedRows, setSelectedRows] = useState(
    (): ReadonlySet<string> => new Set(),
  );
  const [showLocation, setShowLocation] = useState(false);

  //#region Click Handlers
  const onVerifySingle = useCallback(
    async (row: MyOpportunityInfo, approved: boolean) => {
      setIsLoading(true);

      try {
        debugger;
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
        await queryClient.invalidateQueries(["opportunityParticipants", id]);
      } catch (error) {
        toast(<ApiErrors error={error} />, {
          type: "error",
          toastId: "verifyCredentialError",
          autoClose: false,
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
    ],
  );

  const onVerifyBulkValidate = useCallback(() => {
    const arr = Array.from(selectedRows);

    if (arr.length === 0) {
      toast("Please select at least one row to continue", {
        type: "error",
        toastId: "verifyCredentialError",
        icon: true,
      });
      return;
    }

    setModalVerifyBulkVisible(true);
  }, [selectedRows, setModalVerifyBulkVisible]);

  const onVerifyBulk = useCallback(
    async (approved: boolean) => {
      const arr = Array.from(selectedRows);
      setIsLoading(true);
      debugger;
      try {
        const model: MyOpportunityRequestVerifyFinalizeBatch = {
          status: approved
            ? VerificationStatus.Completed
            : VerificationStatus.Rejected,
          comment: verifyComments,
          items: [],
          // items: arr.map((item) => ({
          //   opportunityId: row.opportunityId,
          //   userId: row.userId,
          // })),
        };

        // update api
        await performActionVerifyBulk(model);

        // for (const item of arr) {
        //   const model: MyOpportunityRequestVerifyFinalizeBatch = {
        //     approved: approved,
        //     approvalMessage: verifyComments,
        //   };

        //   // update api
        //   await updateCredential(item, model);
        // }

        // invalidate query
        await queryClient.invalidateQueries(["opportunityParticipants", id]);
      } catch (error) {
        toast(<ApiErrors error={error} />, {
          type: "error",
          toastId: "verifyCredentialError",
          autoClose: false,
          icon: false,
        });

        //captureException(error);
        setIsLoading(false);

        return;
      }

      toast(
        `${arr.length} participant(s) has been ${
          approved ? "approved" : "rejected"
        }`,
        {
          type: "success",
        },
      );
      setIsLoading(false);
      setModalVerifyBulkVisible(false);
    },
    [
      id,
      queryClient,
      verifyComments,
      selectedRows,
      setIsLoading,
      setModalVerifyBulkVisible,
    ],
  );
  //#endregion Click Handlers

  //* Google Maps
  const { isLoaded, loadError } = useLoadScript({
    id: "google-map-script",
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // memo for geo location based on currentRow
  const markerPosition = useMemo(() => {
    if (currentRow == null || currentRow == undefined) return null;

    const verification = currentRow?.verifications?.find(
      (item) => item.verificationType == "Location",
    );

    const coords = verification?.geometry?.coordinates as number[][];
    if (coords == null || coords == undefined || coords.length == 0)
      return null;
    const first = coords[0];
    if (!first || first.length < 2) return null;

    return {
      lng: first[0],
      lat: first[1],
    };
  }, [currentRow]);

  const iconPath =
    "M 12 2 C 8.1 2 5 5.1 5 9 c 0 5.3 7 13 7 13 s 7 -7.8 7 -13 c 0 -3.9 -3.1 -7 -7 -7 z M 7 9 c 0 -2.8 2.2 -5 5 -5 s 5 2.2 5 5 c 0 2.9 -2.9 7.2 -5 9.9 C 9.9 16.2 7 11.8 7 9 z M 10 9 C 10 8 11 7 12 7 C 13 7 14 8 14 9 C 14 10 13 11 12 11 C 11 11 10 10 10 9 M 12 7";

  return (
    <>
      <Head>
        <title>Yoma Partner | Verifications</title>
      </Head>

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
        //className={`text-gray-700 fixed inset-0 m-auto h-[230px] w-[380px] rounded-lg bg-white p-4 font-openSans duration-100 animate-in fade-in zoom-in`}
        // overlayClassName="fixed inset-0 bg-black modal-overlay"
        // portalClassName={"fixed"}
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
              <div className="flex flex-col gap-4 rounded-lg bg-white p-4">
                <div className="flex flex-row">
                  <div className="flex flex-grow flex-col gap-1">
                    <p className="text-lg font-bold text-black">
                      {currentRow?.userDisplayName}
                    </p>
                    <p className="text--dark text-sm">
                      User Experience Designer
                    </p>
                    <p className="flex flex-row items-center text-sm text-gray-dark">
                      <IoMdPin className="mr-2 h-4 w-4 text-gray-dark" />
                      Cape Town
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="-mt-8 flex h-24 w-24 items-center justify-center rounded-full border-green-dark bg-white p-4 shadow-lg">
                      <Image
                        src={currentRow?.userPhotoURL ?? iconSuccess}
                        alt="Icon User"
                        width={60}
                        height={60}
                        sizes="100vw"
                        priority={true}
                        style={{
                          width: "60px",
                          height: "60px",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="divider m-0" />
                {currentRow?.verifications?.map((item) => (
                  <div key={item.fileId}>
                    {item.verificationType == "FileUpload" &&
                      renderVerificationFile(
                        iconCertificate,
                        "Certificate",
                        item.fileURL,
                      )}
                    {item.verificationType == "Picture" &&
                      renderVerificationFile(
                        iconPicture,
                        "Picture",
                        item.fileURL,
                      )}
                    {item.verificationType == "VoiceNote" &&
                      renderVerificationFile(
                        iconVideo,
                        "Voice Note",
                        item.fileURL,
                      )}
                    {item.verificationType == "Location" && (
                      <>
                        <button
                          className="flex w-full items-center rounded-full bg-gray text-sm text-green"
                          onClick={() => {
                            setShowLocation(!showLocation);
                          }}
                        >
                          <div className="flex w-full flex-row">
                            <div className="flex items-center px-4 py-2">
                              <Image
                                src={iconLocation}
                                alt={`Icon Location`}
                                width={28}
                                height={28}
                                sizes="100vw"
                                priority={true}
                                style={{ width: "28px", height: "28px" }}
                              />
                            </div>
                            <div className="flex items-center">
                              {showLocation ? "Hide" : "View"} Location
                            </div>
                          </div>
                        </button>

                        {showLocation && (
                          <div className="mt-2">
                            {!isLoaded && <div>Loading...</div>}
                            {loadError && <div>Error loading maps</div>}
                            {isLoaded && markerPosition != null && (
                              <>
                                <div className="flex flex-row gap-2 text-gray-dark">
                                  <div>Pin location: </div>
                                  <div className="font-bold">
                                    Lat: {markerPosition.lat} Lng:{" "}
                                    {markerPosition.lng}
                                  </div>
                                </div>

                                <GoogleMap
                                  id="map"
                                  mapContainerStyle={{
                                    width: "100%",
                                    height: "350px",
                                  }}
                                  center={markerPosition as any}
                                  zoom={16}
                                >
                                  <MarkerF
                                    position={markerPosition as any}
                                    draggable={false}
                                    icon={{
                                      strokeColor: "transparent",
                                      fillColor: "#41204B",
                                      path: iconPath,
                                      fillOpacity: 1,
                                      scale: 2,
                                    }}
                                  />
                                </GoogleMap>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {currentRow?.dateStart && (
                  <div className="flex flex-row gap-2 text-gray-dark">
                    <div>Started opportunity at: </div>
                    <div className="font-bold">
                      <Moment format={DATETIME_FORMAT_HUMAN}>
                        {currentRow.dateStart}
                      </Moment>
                    </div>
                  </div>
                )}
                {currentRow?.dateEnd && (
                  <div className="flex flex-row gap-2 text-gray-dark">
                    <div>Finished opportunity at: </div>
                    <div className="font-bold">
                      <Moment format={DATETIME_FORMAT_HUMAN}>
                        {currentRow.dateEnd}
                      </Moment>
                    </div>
                  </div>
                )}
                <div className="divider m-0" />
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
        // className={`text-gray-700 fixed inset-0 m-auto h-[250px] w-[380px] rounded-lg bg-white p-4 font-openSans duration-100 animate-in fade-in zoom-in`}
        // overlayClassName="fixed inset-0 bg-black modal-overlay"
        // portalClassName={"fixed"}
      >
        <div className="flex h-full flex-col space-y-2">
          <div className="flex flex-row space-x-2">
            <IoMdWarning className="gl-icon-yellow h-6 w-6" />
            <p className="text-lg">Confirm</p>
          </div>

          <p className="text-sm leading-6">
            Are you sure you want to verify the selected{" "}
            <strong>{Array.from(selectedRows).length}</strong> participants?
          </p>

          <div className="form-control">
            <label className="label">
              <span className="text-gray-700 label-text">
                Enter comments below:
              </span>
            </label>
            <textarea
              className="input input-bordered w-full"
              onChange={(e) => setVerifyComments(e.target.value)}
            />
          </div>

          {/* BUTTONS */}
          <div className="mt-10 flex h-full flex-row place-items-center justify-center space-x-2">
            <button
              className="btn-default btn btn-sm flex-nowrap"
              onClick={() => setModalVerifyBulkVisible(false)}
            >
              <IoMdClose className="h-6 w-6" />
              Cancel
            </button>

            <button
              className="btn btn-warning btn-sm flex-nowrap"
              onClick={() => onVerifyBulk(false)}
            >
              <IoMdThumbsDown className="h-6 w-6" />
              Reject
            </button>

            <button
              className="btn btn-success btn-sm flex-nowrap"
              onClick={() => onVerifyBulk(true)}
            >
              <IoMdThumbsUp className="h-6 w-6" />
              Approve
            </button>
          </div>
        </div>
      </ReactModal>

      <div className="container z-10 max-w-5xl px-2 py-8">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <h3 className="flex flex-grow text-white">Verifications</h3>

          {/* <div className="flex gap-2 sm:justify-end">
            <SearchInput defaultValue={query} onSearch={onSearch} />

            <Link
              href={`/organisations/${id}/opportunities/create`}
              className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white"
            >
              <IoIosAdd className="mr-1 h-5 w-5" />
              Add opportunity
            </Link>
          </div> */}
        </div>

        <div className="rounded-lg bg-white p-4">
          {/* NO ROWS */}
          {/* {data && data.items?.length === 0 && !query && (
            <NoRowsMessage
              title={"You will find your active opportunities here"}
              description={
                "This is where you will find all the awesome opportunities you have shared"
              }
            />
          )} */}
          {data && data.items?.length === 0 && query && (
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
                  <tr>
                    <th>Student</th>
                    <th>Opportunity</th>
                    <th>Date connected</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
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
                        {item.verificationStatus &&
                          item.verificationStatus == "Pending" && (
                            <button
                              type="button"
                              className="btn-green btn btn-xs flex-nowrap"
                              onClick={() => {
                                setCurrentRow(item);
                                setModalVerifySingleVisible(true);
                              }}
                            >
                              <IoMdAlert className="h-6 w-6" />
                              Verify
                            </button>
                            // <div className="flex items-center justify-center gap-2">
                            //   <button
                            //     type="button"
                            //     className="btn btn-warning btn-xs flex-nowrap"
                            //     onClick={() => {
                            //       setVerifyActionApprove(false);
                            //       setCurrentRow(item);
                            //       setModalVerifySingleVisible(true);
                            //     }}
                            //   >
                            //     <IoMdThumbsDown className="h-6 w-6" />
                            //     Reject
                            //   </button>
                            //   <button
                            //     type="button"
                            //     className="btn btn-success btn-xs flex-nowrap"
                            //     onClick={() => {
                            //       setVerifyActionApprove(true);
                            //       setCurrentRow(item);
                            //       setModalVerifySingleVisible(true);
                            //     }}
                            //   >
                            //     <IoMdThumbsUp className="h-6 w-6" />
                            //     Approve
                            //   </button>
                            // </div>
                          )}
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

  function renderVerificationFile(
    icon: any,
    label: string,
    fileUrl: string | null,
  ) {
    return (
      <Link
        href={fileUrl ?? "/"}
        target="_blank"
        className="flex items-center rounded-full bg-gray text-sm text-green"
      >
        <div className="flex w-full flex-row">
          <div className="flex items-center px-4 py-2">
            <Image
              src={icon}
              alt={`Icon ${label}`}
              width={28}
              height={28}
              sizes="100vw"
              priority={true}
              style={{ width: "28px", height: "28px" }}
            />
          </div>
          <div className="flex items-center">View {label}</div>
        </div>
      </Link>
    );
  }
};

OpportunityVerifications.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(OpportunityVerifications);
