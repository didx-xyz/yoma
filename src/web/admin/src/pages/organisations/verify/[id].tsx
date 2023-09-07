// import { captureException } from "@sentry/nextjs";
// import {
//   QueryClient,
//   dehydrate,
//   useQuery,
//   useQueryClient,
// } from "@tanstack/react-query";
// import { type GetServerSidePropsContext } from "next";
// import { getServerSession } from "next-auth";
// import Head from "next/head";
// import Link from "next/link";
// import { type ParsedUrlQuery } from "querystring";
// import { useCallback, useState, type ReactElement } from "react";
// import ReactDataGrid, {
//   SelectColumn,
//   type RenderCellProps,
// } from "react-data-grid";
// import {
//   IoMdClose,
//   IoMdImage,
//   IoMdMail,
//   IoMdThumbsDown,
//   IoMdThumbsUp,
//   IoMdWarning,
// } from "react-icons/io";
// import ReactModal from "react-modal";
// import Moment from "react-moment";
// import { toast } from "react-toastify";
// import {
//   type ParticipantCredentialResponseDto,
//   type UpdateCredentialRequestDto,
// } from "~/api/models/credential";
// import { type FullOpportunityResponseDto } from "~/api/models/opportunity";
// import {
//   getOpportunityParticipants,
//   updateCredential,
// } from "~/api/services/credentials";
// import {
//   getOpportunityById,
//   getOpportunityById_Client,
// } from "~/api/services/opportunities";
// import { BackButton } from "~/components/BackButton";
// import MainLayout from "~/components/Layout/Main";
// import { ApiErrors } from "~/components/Status/ApiErrors";
// import { Loading } from "~/components/Status/Loading";
// import withAuth from "~/context/withAuth";
// import { DATE_FORMAT_HUMAN } from "~/lib/constants";
// import { authOptions } from "~/server/auth";
// import { type NextPageWithLayout } from "../../_app";

// // route parameters
// interface IParams extends ParsedUrlQuery {
//   id: string;
// }

// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   const { id } = context.params as IParams;

//   const session = await getServerSession(context.req, context.res, authOptions);

//   const queryClient = new QueryClient();

//   if (session) {
//     // 👇 prefetch queries (on server)
//     await queryClient.prefetchQuery(["opportunity", id], () =>
//       getOpportunityById(context, id),
//     );
//     await queryClient.prefetchQuery(["opportunityParticipants", id], () =>
//       getOpportunityParticipants(id, context, false),
//     );
//   }

//   return {
//     props: {
//       dehydratedState: dehydrate(queryClient),
//       user: session?.user ?? null, // (required for 'withAuth' HOC component)
//       id: id,
//     },
//   };
// }

// const OpportunityVerify: NextPageWithLayout<{ id: string }> = ({ id }) => {
//   const queryClient = useQueryClient();
//   const [isLoading, setIsLoading] = useState(false);
//   const [modalVerifySingleVisible, setModalVerifySingleVisible] =
//     useState(false);
//   const [modalVerifyBulkVisible, setModalVerifyBulkVisible] = useState(false);
//   const [verifyComments, setVerifyComments] = useState("");
//   const [verifyActionApprove, setVerifyActionApprove] = useState(false);
//   const [currentRow, setCurrentRow] =
//     useState<ParticipantCredentialResponseDto>();
//   const [selectedRows, setSelectedRows] = useState(
//     (): ReadonlySet<string> => new Set(),
//   );

//   // 👇 use prefetched queries (from server)
//   const { data: opportunity } = useQuery<FullOpportunityResponseDto>({
//     queryKey: ["opportunity", id],
//     queryFn: () => getOpportunityById_Client(id),
//   });
//   const { data: opportunityParticipants } = useQuery<
//     ParticipantCredentialResponseDto[]
//   >({
//     queryKey: ["opportunityParticipants", id],
//     queryFn: () => getOpportunityParticipants(id, null, false),
//   });

//   //#region Click Handlers
//   const onVerifySingle = useCallback(
//     async (row: ParticipantCredentialResponseDto, approved: boolean) => {
//       setIsLoading(true);

//       try {
//         const model: UpdateCredentialRequestDto = {
//           approved: approved,
//           approvalMessage: verifyComments,
//         };

//         // update api
//         await updateCredential(row.credentialId, model);

//         // invalidate query
//         await queryClient.invalidateQueries(["opportunityParticipants", id]);
//       } catch (error) {
//         toast(<ApiErrors error={error} />, {
//           type: "error",
//           toastId: "verifyCredentialError",
//           autoClose: false,
//           icon: false,
//         });

//         captureException(error);
//         setIsLoading(false);

//         return;
//       }

//       toast(
//         `'${row.firstName} ${row.lastName}' has been ${
//           approved ? "approved" : "rejected"
//         }`,
//         {
//           type: "success",
//         },
//       );
//       setIsLoading(false);
//       setModalVerifySingleVisible(false);
//     },
//     [
//       id,
//       queryClient,
//       verifyComments,
//       setIsLoading,
//       setModalVerifySingleVisible,
//     ],
//   );

//   const onVerifyBulkValidate = useCallback(() => {
//     const arr = Array.from(selectedRows);

//     if (arr.length === 0) {
//       toast("Please select at least one row to continue", {
//         type: "error",
//         toastId: "verifyCredentialError",
//         icon: true,
//       });
//       return;
//     }

//     setModalVerifyBulkVisible(true);
//   }, [selectedRows, setModalVerifyBulkVisible]);

//   const onVerifyBulk = useCallback(
//     async (approved: boolean) => {
//       const arr = Array.from(selectedRows);
//       setIsLoading(true);

//       try {
//         for (const item of arr) {
//           const model: UpdateCredentialRequestDto = {
//             approved: approved,
//             approvalMessage: verifyComments,
//           };

//           // update api
//           await updateCredential(item, model);
//         }

//         // invalidate query
//         await queryClient.invalidateQueries(["opportunityParticipants", id]);
//       } catch (error) {
//         toast(<ApiErrors error={error} />, {
//           type: "error",
//           toastId: "verifyCredentialError",
//           autoClose: false,
//           icon: false,
//         });

//         captureException(error);
//         setIsLoading(false);

//         return;
//       }

//       toast(
//         `${arr.length} participant(s) has been ${
//           approved ? "approved" : "rejected"
//         }`,
//         {
//           type: "success",
//         },
//       );
//       setIsLoading(false);
//       setModalVerifyBulkVisible(false);
//     },
//     [
//       id,
//       queryClient,
//       verifyComments,
//       selectedRows,
//       setIsLoading,
//       setModalVerifyBulkVisible,
//     ],
//   );
//   //#endregion Click Handlers

//   //#region Cell Formatters
//   const StudentNameFormatter = useCallback(
//     (row: RenderCellProps<ParticipantCredentialResponseDto>) => {
//       return `${row.row.firstName} ${row.row.lastName}`;
//     },
//     [],
//   );

//   const DateRequestedFormatter = useCallback(
//     (row: RenderCellProps<ParticipantCredentialResponseDto>) => {
//       return <Moment format={DATE_FORMAT_HUMAN}>{row.row.createdAt}</Moment>;
//     },
//     [],
//   );

//   const EmailFormatter = useCallback(
//     (row: RenderCellProps<ParticipantCredentialResponseDto>) => {
//       return row.row.email ? (
//         <Link
//           href={`mailto:${row.row.email}`}
//           className="btn btn-primary btn-xs flex flex-row"
//         >
//           <IoMdMail className="mr-2 h-4 w-4" />
//           Email
//         </Link>
//       ) : (
//         "n/a"
//       );
//     },
//     [],
//   );

//   const CertificateFormatter = useCallback(
//     (row: RenderCellProps<ParticipantCredentialResponseDto>) => {
//       return row.row.email ? (
//         <Link
//           href={`${row.row.fileURL}`}
//           className="btn btn-primary btn-xs flex flex-row"
//           target="_new"
//         >
//           <IoMdImage className="mr-2 h-4 w-4" />
//           Open
//         </Link>
//       ) : (
//         "n/a"
//       );
//     },
//     [],
//   );

//   const VerifyFormatter = useCallback(
//     (row: RenderCellProps<ParticipantCredentialResponseDto>) => {
//       return (
//         <div className="flex items-center justify-center gap-2">
//           <button
//             type="button"
//             className="btn btn-warning btn-xs flex-nowrap"
//             onClick={() => {
//               setVerifyActionApprove(false);
//               setCurrentRow(row.row);
//               setModalVerifySingleVisible(true);
//             }}
//           >
//             <IoMdThumbsDown className="h-6 w-6" />
//             Reject
//           </button>
//           <button
//             type="button"
//             className="btn btn-success btn-xs flex-nowrap"
//             onClick={() => {
//               setVerifyActionApprove(true);
//               setCurrentRow(row.row);
//               setModalVerifySingleVisible(true);
//             }}
//           >
//             <IoMdThumbsUp className="h-6 w-6" />
//             Approve
//           </button>
//         </div>
//       );
//     },
//     [],
//   );
//   //#endregion Cell Formatters

//   function rowKeyGetter(row: ParticipantCredentialResponseDto) {
//     return row.credentialId;
//   }

//   return (
//     <>
//       <Head>
//         <title>Yoma Partner | Verify Opportunity Participants</title>
//       </Head>
//       <div className="container">
//         {isLoading && <Loading />}

//         <div className="flex flex-row py-4">
//           <h3 className="flex flex-grow items-center">
//             <BackButton />
//             Opportunities
//           </h3>
//           <div className="flex justify-end">
//             <button
//               type="button"
//               className="btn btn-primary btn-sm flex-nowrap"
//               onClick={onVerifyBulkValidate}
//             >
//               Bulk Verify
//             </button>
//           </div>
//         </div>
//         <h1 className="mb-4 text-sm">{opportunity?.title}</h1>

//         <div className="rounded-lg bg-white p-4">
//           {/* NO ROWS */}
//           {opportunityParticipants && opportunityParticipants.length === 0 && (
//             <div
//               style={{
//                 textAlign: "center",
//                 padding: "100px",
//               }}
//             >
//               <h3>No data to show</h3>
//             </div>
//           )}
//           {/* GRID */}
//           {opportunityParticipants && opportunityParticipants.length > 0 && (
//             <ReactDataGrid
//               columns={[
//                 SelectColumn,
//                 {
//                   key: "studentName",
//                   name: "Student Name",
//                   renderCell: StudentNameFormatter,
//                 },
//                 // { key: "zlto", name: "zlto" },
//                 //{ key: "skills", name: "Skills", renderCell: SkillsFormatter },
//                 {
//                   key: "createdAt",
//                   name: "Date Requested",
//                   renderCell: DateRequestedFormatter,
//                 },
//                 {
//                   key: "email",
//                   name: "Email Student",
//                   renderCell: EmailFormatter,
//                   cellClass: "flex items-center",
//                 },
//                 {
//                   key: "fileURL",
//                   name: "Certificate",
//                   renderCell: CertificateFormatter,
//                   cellClass: "flex items-center",
//                 },
//                 {
//                   key: "verify",
//                   name: "Verify",
//                   renderCell: VerifyFormatter,
//                   cellClass: "flex justify-center items-center",
//                 },
//               ]}
//               rows={opportunityParticipants}
//               rowKeyGetter={rowKeyGetter}
//               selectedRows={selectedRows}
//               onSelectedRowsChange={setSelectedRows}
//             />
//           )}
//         </div>

//         {/* MODAL DIALOG FOR VERIFY (SINGLE) */}
//         <ReactModal
//           isOpen={modalVerifySingleVisible}
//           shouldCloseOnOverlayClick={true}
//           onRequestClose={() => {
//             setModalVerifySingleVisible(false);
//           }}
//           className={`text-gray-700 fixed inset-0 m-auto h-[230px] w-[380px] rounded-lg bg-white p-4 font-openSans duration-100 animate-in fade-in zoom-in`}
//           overlayClassName="fixed inset-0 bg-black modal-overlay"
//           portalClassName={"fixed"}
//         >
//           <div className="flex h-full flex-col space-y-2">
//             <div className="flex flex-row space-x-2">
//               <IoMdWarning className="gl-icon-yellow h-6 w-6" />
//               <p className="text-lg">Confirm</p>
//             </div>

//             <p className="text-sm leading-6">
//               Are you sure you want to{" "}
//               <strong>{verifyActionApprove ? "approve" : "reject"}</strong> this
//               participant?
//             </p>

//             <div className="form-control">
//               <label className="label">
//                 <span className="text-gray-700 label-text">
//                   Enter comments below:
//                 </span>
//               </label>
//               <textarea
//                 className="input input-bordered w-full"
//                 onChange={(e) => setVerifyComments(e.target.value)}
//               />
//             </div>

//             {/* BUTTONS */}
//             <div className="mt-10 flex h-full flex-row place-items-center justify-center space-x-2">
//               <button
//                 className="btn-default btn btn-sm flex-nowrap"
//                 onClick={() => setModalVerifySingleVisible(false)}
//               >
//                 <IoMdClose className="h-6 w-6" />
//                 Cancel
//               </button>
//               {verifyActionApprove && (
//                 <button
//                   className="btn btn-success btn-sm flex-nowrap"
//                   onClick={() =>
//                     onVerifySingle(currentRow!, verifyActionApprove)
//                   }
//                 >
//                   <IoMdThumbsUp className="h-6 w-6" />
//                   Approve
//                 </button>
//               )}
//               {!verifyActionApprove && (
//                 <button
//                   className="btn btn-warning btn-sm flex-nowrap"
//                   onClick={() =>
//                     onVerifySingle(currentRow!, verifyActionApprove)
//                   }
//                 >
//                   <IoMdThumbsDown className="h-6 w-6" />
//                   Reject
//                 </button>
//               )}
//             </div>
//           </div>
//         </ReactModal>

//         {/* MODAL DIALOG FOR VERIFY (BULK) */}
//         <ReactModal
//           isOpen={modalVerifyBulkVisible}
//           shouldCloseOnOverlayClick={true}
//           onRequestClose={() => {
//             setModalVerifyBulkVisible(false);
//           }}
//           className={`text-gray-700 fixed inset-0 m-auto h-[250px] w-[380px] rounded-lg bg-white p-4 font-openSans duration-100 animate-in fade-in zoom-in`}
//           overlayClassName="fixed inset-0 bg-black modal-overlay"
//           portalClassName={"fixed"}
//         >
//           <div className="flex h-full flex-col space-y-2">
//             <div className="flex flex-row space-x-2">
//               <IoMdWarning className="gl-icon-yellow h-6 w-6" />
//               <p className="text-lg">Confirm</p>
//             </div>

//             <p className="text-sm leading-6">
//               Are you sure you want to verify the selected{" "}
//               <strong>{Array.from(selectedRows).length}</strong> participants?
//             </p>

//             <div className="form-control">
//               <label className="label">
//                 <span className="text-gray-700 label-text">
//                   Enter comments below:
//                 </span>
//               </label>
//               <textarea
//                 className="input input-bordered w-full"
//                 onChange={(e) => setVerifyComments(e.target.value)}
//               />
//             </div>

//             {/* BUTTONS */}
//             <div className="mt-10 flex h-full flex-row place-items-center justify-center space-x-2">
//               <button
//                 className="btn-default btn btn-sm flex-nowrap"
//                 onClick={() => setModalVerifyBulkVisible(false)}
//               >
//                 <IoMdClose className="h-6 w-6" />
//                 Cancel
//               </button>

//               <button
//                 className="btn btn-warning btn-sm flex-nowrap"
//                 onClick={() => onVerifyBulk(false)}
//               >
//                 <IoMdThumbsDown className="h-6 w-6" />
//                 Reject
//               </button>

//               <button
//                 className="btn btn-success btn-sm flex-nowrap"
//                 onClick={() => onVerifyBulk(true)}
//               >
//                 <IoMdThumbsUp className="h-6 w-6" />
//                 Approve
//               </button>
//             </div>
//           </div>
//         </ReactModal>
//       </div>
//     </>
//   );
// };

// OpportunityVerify.getLayout = function getLayout(page: ReactElement) {
//   return <MainLayout>{page}</MainLayout>;
// };

// export default withAuth(OpportunityVerify);
