import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import router from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import Moment from "react-moment";
import { toast } from "react-toastify";
import type {
  SSICredentialInfo,
  SSIWalletSearchResults,
} from "~/api/models/credential";
import {
  getCredentialById,
  searchCredentials,
} from "~/api/services/credentials";
import { AvatarImage } from "~/components/AvatarImage";
import Breadcrumb from "~/components/Breadcrumb";
import CustomModal from "~/components/Common/CustomModal";
import Suspense from "~/components/Common/Suspense";
import YoID from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PaginationButtons } from "~/components/PaginationButtons";
import { PaginationInfoComponent } from "~/components/PaginationInfo";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { DATETIME_FORMAT_SYSTEM, PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

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
  const { page } = context.query;
  const pageNumber = page ? parseInt(page.toString()) : 1;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: [`Credentials_${pageNumber}`],
    queryFn: () =>
      searchCredentials(
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE,
          schemaType: null,
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      pageNumber: pageNumber,
    },
  };
}

const MyPassport: NextPageWithLayout<{
  pageNumber: number;
  error: string;
}> = ({ pageNumber, error }) => {
  const [credentialDialogVisible, setCredentialDialogVisible] = useState(false);
  const [activeCredential, setActiveCredential] =
    useState<SSICredentialInfo | null>(null);

  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<SSIWalletSearchResults>({
    queryKey: [`Credentials_${pageNumber}`],
    queryFn: () =>
      searchCredentials({
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE,
        schemaType: null,
      }),
    enabled: !error,
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback((value: number) => {
    // redirect
    void router.push({
      pathname: `/yoid/passport`,
      query: { ...(value && { page: value }) },
    });
  }, []);

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
      <Head>
        <title>Yoma | 🌐 Passport</title>
      </Head>

      {/* CREDENTIAL DIALOG */}
      <CustomModal
        isOpen={credentialDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setCredentialDialogVisible(false);
        }}
        className={`md:max-h-[650px] md:w-[600px]`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="bg-green flex flex-row p-4 shadow-lg">
              <h1 className="grow"></h1>
              <button
                type="button"
                className="btn btn-circle text-gray-dark hover:bg-gray"
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
                  <AvatarImage
                    icon={activeCredential?.issuerLogoURL}
                    alt={`${activeCredential?.issuer} Logo`}
                    size={60}
                  />
                )}

                <div className="flex grow flex-col gap-4 overflow-y-scroll p-4 pt-0 pb-8 md:max-h-[480px] md:min-h-[350px]">
                  <h4 className="text-center">{activeCredential?.title}</h4>

                  {/* CREDENTIAL DETAILS */}
                  <div className="bg-gray-light rounded border-dotted p-4 shadow">
                    <ul className="divide-y divide-gray-200">
                      <li className="py-4">
                        <div className="flex justify-between text-sm">
                          <p className="font-semibold text-gray-500 md:w-64">
                            Issuer
                          </p>
                          <p className="text-end text-gray-900">
                            {activeCredential?.issuer}
                          </p>
                        </div>
                      </li>
                      <li className="py-4">
                        <div className="flex justify-between text-sm">
                          <p className="font-semibold text-gray-500 md:w-64">
                            Artifact Type
                          </p>
                          <p className="text-end text-gray-900">
                            {activeCredential?.artifactType}
                          </p>
                        </div>
                      </li>
                      <li className="py-4">
                        <div className="flex justify-between text-sm">
                          <p className="font-semibold text-gray-500 md:w-64">
                            Date Issued
                          </p>
                          {activeCredential?.dateIssued && (
                            <p className="text-end text-gray-900">
                              <Moment
                                format={DATETIME_FORMAT_SYSTEM}
                                utc={true}
                              >
                                {activeCredential?.dateIssued}
                              </Moment>
                            </p>
                          )}
                        </div>
                      </li>
                      <li className="py-4">
                        <div className="flex justify-between text-sm">
                          <p className="font-semibold text-gray-500 md:w-64">
                            Schema Type
                          </p>
                          <p className="text-end text-gray-900">
                            {activeCredential?.schemaType}
                          </p>
                        </div>
                      </li>
                      {/* ATTRIBUTES */}
                      {activeCredential?.attributes?.map((attr, index) => (
                        <li key={index} className="py-4">
                          <div className="flex justify-between text-sm">
                            <p className="font-semibold text-gray-500 md:w-64">
                              {attr.nameDisplay}
                            </p>
                            <p className="text-end text-gray-900">
                              {attr.valueDisplay}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex grow items-center justify-center gap-4 pb-14">
                    <button
                      type="button"
                      className="btn btn-outline btn-primary border-purple text-purple w-1/2 rounded-full bg-white normal-case md:w-[300px]"
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
      </CustomModal>

      <div className="w-full lg:max-w-7xl">
        <div className="mb-4 text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "🌐 Passport",
                selected: true,
              },
            ]}
          />
        </div>

        <Suspense isLoading={dataIsLoading} error={dataError}>
          {/* NO ROWS */}
          {!data?.items?.length && (
            <div className="flex justify-center rounded-lg bg-white p-8 text-center">
              <NoRowsMessage
                title={"No credentials found"}
                description={
                  "Credentials that you receive by completing opportunities will be displayed here. Please be aware credentials will take 24 hours to reflect."
                }
              />
            </div>
          )}

          {/* GRID */}
          {!!data?.items?.length && (
            <div className="flex flex-col gap-4">
              {/* PAGINATION INFO */}
              <PaginationInfoComponent
                currentPage={pageNumber}
                itemCount={data?.items ? data.items.length : 0}
                totalItems={data?.totalCount ?? 0}
                pageSize={PAGE_SIZE}
                query={null}
              />

              {/* GRID */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.items.map((item, index) => (
                  <div
                    key={index}
                    className="shadow-custom flex h-[180px] cursor-pointer flex-col rounded-lg bg-white p-4"
                    onClick={() => handleOnClickCredential(item)}
                  >
                    <div className="flex h-full flex-row">
                      <div className="flex grow flex-row items-start justify-start">
                        <div className="flex flex-col items-start justify-start gap-1">
                          <p className="text-gray-dark line-clamp-2 max-h-[35px] max-w-[210px] overflow-hidden pr-2 text-xs font-medium text-ellipsis">
                            {item.issuer}
                          </p>
                          <p className="line-clamp-3 max-h-[80px] max-w-[210px] overflow-hidden pr-2 text-sm font-bold text-ellipsis">
                            {item.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row items-start">
                        <AvatarImage
                          icon={item.issuerLogoURL}
                          alt={`${item.issuer} Logo`}
                          size={50}
                        />
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-center">
                      <div className="text-gray-dark flex grow text-xs tracking-widest">
                        <Moment format={DATETIME_FORMAT_SYSTEM} utc={true}>
                          {item.dateIssued!}
                        </Moment>
                      </div>
                      <div className="badge bg-green-light text-green">
                        <IoMdCheckmark className="mr-1 h-4 w-4" />
                        Verified
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION BUTTONS */}
              <div className="mt-2 grid place-items-center justify-center">
                <PaginationButtons
                  currentPage={pageNumber}
                  totalItems={data?.totalCount ?? 0}
                  pageSize={PAGE_SIZE}
                  onClick={handlePagerChange}
                  showPages={false}
                />
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
};

MyPassport.getLayout = function getLayout(page: ReactElement) {
  return <YoID>{page}</YoID>;
};

export default MyPassport;
