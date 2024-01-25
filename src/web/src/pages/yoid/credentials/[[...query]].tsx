import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import router from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import { DATETIME_FORMAT_SYSTEM, PAGE_SIZE } from "~/lib/constants";
import Image from "next/image";
import {
  getCredentialById,
  searchCredentials,
} from "~/api/services/credentials";
import { type ParsedUrlQuery } from "querystring";
import type {
  SSICredentialInfo,
  SSIWalletSearchResults,
} from "~/api/models/credential";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PaginationButtons } from "~/components/PaginationButtons";
import { toBase64, shimmer } from "~/lib/image";
import Moment from "react-moment";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import ReactModal from "react-modal";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import YoIDTabbed from "~/components/Layout/YoIDTabbed";
import { toast } from "react-toastify";
import { config } from "~/lib/react-query-config";

interface IParams extends ParsedUrlQuery {
  query?: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const queryClient = new QueryClient(config);
  const { id } = context.params as IParams;
  const { query, schemaType, page } = context.query;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: [
      `Credentials_${id}_${query?.toString()}_${schemaType}_${page?.toString()}`,
    ],
    queryFn: () =>
      searchCredentials(
        {
          //TODO: PAGING NOT SUPPORTED BY API (ARIES CLOUD)
          pageNumber: null, //page ? parseInt(page.toString()) : 1,
          pageSize: null, //PAGE_SIZE,
          schemaType: null, //schemaType?.toString() ?? null,
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id ?? null,
      query: query ?? null,
      page: page ?? "1",
    },
  };
}

const MyCredentials: NextPageWithLayout<{
  query?: string;
  page?: string;
  error: string;
}> = ({ query, page, error }) => {
  const [credentialDialogVisible, setCredentialDialogVisible] = useState(false);
  const [activeCredential, setActiveCredential] =
    useState<SSICredentialInfo | null>(null);

  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<SSIWalletSearchResults>({
    queryKey: [`Credentials_${query?.toString()}_${page?.toString()}`],
    queryFn: () =>
      searchCredentials({
        //TODO: PAGING NOT SUPPORTED BY API (ARIES CLOUD)
        pageNumber: null, //page ? parseInt(page.toString()) : 1,
        pageSize: null, //PAGE_SIZE,
        schemaType: null, //schemaType?.toString() ?? null,
      }),
    enabled: !error,
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/yoid/credentials`,
        query: { query: query, page: value },
      });
    },
    [query],
  );

  const handleOnClickCredential = useCallback(
    (item: SSICredentialInfo) => {
      getCredentialById(item.id)
        .then((res) => {
          setActiveCredential(res);
          setCredentialDialogVisible(true);
        })
        .catch((err) => {
          toast.error("Unable to retrieve your credential");
          console.error(err);
        });
    },
    [setActiveCredential, setCredentialDialogVisible],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      {/* CREDENTIAL DIALOG */}
      <ReactModal
        isOpen={credentialDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setCredentialDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-y-scroll bg-white animate-in fade-in md:m-auto md:max-h-[600px] md:w-[600px] md:overflow-y-clip md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row bg-green p-4 shadow-lg">
              <h1 className="flex-grow"></h1>
              <button
                type="button"
                className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
                onClick={() => {
                  setCredentialDialogVisible(false);
                }}
              >
                <IoMdClose className="h-6 w-6"></IoMdClose>
              </button>
            </div>
            {activeCredential && (
              <div className="flex flex-col items-center justify-center gap-4">
                {activeCredential?.issuerLogoURL && (
                  <div className="relative -mt-8 overflow-hidden rounded-full bg-white shadow">
                    <Image
                      src={activeCredential?.issuerLogoURL}
                      alt={`${activeCredential?.issuer} Logo`}
                      width={60}
                      height={60}
                      sizes="(max-width: 60px) 30vw, 50vw"
                      priority={true}
                      placeholder="blur"
                      blurDataURL={`data:image/svg+xml;base64,${toBase64(
                        shimmer(44, 44),
                      )}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        maxWidth: "60px",
                        maxHeight: "60px",
                      }}
                    />
                  </div>
                )}

                <div className="overflow-y-scrollx flex flex-grow flex-col gap-4 overflow-x-hidden p-4 pt-0 md:max-h-[480px] md:min-h-[350px]">
                  <h4 className="text-center">{activeCredential?.title}</h4>

                  {/* CREDENTIAL DETAILS */}
                  <div className="rounded border-dotted bg-gray-light p-4 shadow">
                    <ul className="divide-gray-200 divide-y">
                      <li className="py-4">
                        <div className="flex justify-between text-sm">
                          <p className="text-gray-500 w-64 font-semibold">
                            Issuer
                          </p>
                          <p className="text-gray-900 text-end">
                            {activeCredential?.issuer}
                          </p>
                        </div>
                      </li>
                      <li className="py-4">
                        <div className="flex justify-between text-sm">
                          <p className="text-gray-500 w-64 font-semibold">
                            Artifact Type
                          </p>
                          <p className="text-gray-900 text-end">
                            {activeCredential?.artifactType}
                          </p>
                        </div>
                      </li>
                      <li className="py-4">
                        <div className="flex justify-between text-sm">
                          <p className="text-gray-500 w-64 font-semibold">
                            Date Issued
                          </p>
                          {activeCredential?.dateIssued && (
                            <p className="text-gray-900 text-end">
                              <Moment format={DATETIME_FORMAT_SYSTEM}>
                                {new Date(activeCredential?.dateIssued)}
                              </Moment>
                            </p>
                          )}
                        </div>
                      </li>
                      <li className="py-4">
                        <div className="flex justify-between text-sm">
                          <p className="text-gray-500 w-64 font-semibold">
                            Schema Type
                          </p>
                          <p className="text-gray-900 text-end">
                            {activeCredential?.schemaType}
                          </p>
                        </div>
                      </li>
                      {/* ATTRIBUTES */}
                      {activeCredential?.attributes?.map((attr, index) => (
                        <li key={index} className="py-4">
                          <div className="flex justify-between text-sm">
                            <p className="text-gray-500 w-64 font-semibold">
                              {attr.nameDisplay}
                            </p>
                            <p className="text-gray-900 text-end">
                              {attr.valueDisplay}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex flex-grow items-center justify-center gap-4 pb-14">
                    <button
                      type="button"
                      className="btn w-1/2 rounded-full border-purple bg-white normal-case text-purple md:w-[300px]"
                      onClick={() => {
                        setCredentialDialogVisible(false);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ReactModal>

      <div className="flex w-full flex-col gap-4">
        {/* ERRROR */}
        {dataError && <ApiErrors error={dataError} />}
        {/* LOADING */}
        {dataIsLoading && (
          <div className="flex justify-center rounded-lg bg-white p-8">
            <LoadingSkeleton />
          </div>
        )}

        {/* NO ROWS */}
        {/* TODO:data.totalCount not populated by API */}
        {/* {data && (data.totalCount === null || data.totalCount === 0) && ( */}
        {data && data.items.length === 0 && (
          <div className="flex justify-center rounded-lg bg-white p-8">
            <NoRowsMessage
              title={"No results found"}
              description={
                "Credentials that you receive by completing opportunities will be diplayed here."
              }
            />
          </div>
        )}

        {data && data.items?.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            {/* GRID */}
            {data && data.items?.length > 0 && (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex h-[180px] cursor-pointer flex-col rounded-lg bg-white p-2"
                    onClick={() => handleOnClickCredential(item)}
                  >
                    <div className="flex h-full flex-row">
                      <div className="flex flex-grow flex-row items-start justify-start">
                        <div className="flex flex-col items-start justify-start gap-2">
                          <p className="max-h-[35px] overflow-hidden text-ellipsis text-sm font-semibold text-gray-dark">
                            {item.issuer}
                          </p>
                          <p className="max-h-[80px] overflow-hidden text-ellipsis text-sm font-bold">
                            {item.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row items-start">
                        <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-full shadow">
                          <Image
                            src={item.issuerLogoURL}
                            alt={`${item.issuer} Logo`}
                            width={60}
                            height={60}
                            sizes="(max-width: 60px) 30vw, 50vw"
                            priority={true}
                            placeholder="blur"
                            blurDataURL={`data:image/svg+xml;base64,${toBase64(
                              shimmer(44, 44),
                            )}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              maxWidth: "60px",
                              maxHeight: "60px",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-center">
                      <div className="flex flex-grow text-xs tracking-widest">
                        <Moment format={DATETIME_FORMAT_SYSTEM}>
                          {new Date(item.dateIssued!)}
                        </Moment>
                      </div>
                      <div className="badge h-6 rounded-md bg-green-light text-xs font-bold text-green">
                        <IoMdCheckmark className="mr-1 h-4 w-4" />
                        Verified
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 grid place-items-center justify-center">
              {/* PAGINATION BUTTONS */}
              <PaginationButtons
                currentPage={page ? parseInt(page) : 1}
                totalItems={data?.totalCount ?? 0}
                pageSize={PAGE_SIZE}
                onClick={handlePagerChange}
                showPages={false}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

MyCredentials.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbed>{page}</YoIDTabbed>;
};

export default MyCredentials;
