import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";
import { type User, authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import Image from "next/image";
import { type ParsedUrlQuery } from "querystring";
import NoRowsMessage from "~/components/NoRowsMessage";
import { toBase64, shimmer } from "~/lib/image";
import { Unauthorized } from "~/components/Status/Unauthorized";
import YoIDTabbed from "~/components/Layout/YoIDTabbed";
import { userProfileAtom } from "~/lib/store";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { config } from "~/lib/react-query-config";
import { RoundedImage } from "~/components/RoundedImage";
import iconRocket from "public/images/icon-rocket.webp";

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
  // await queryClient.prefetchQuery({
  //   queryKey: [
  //     `Credentials_${id}_${query?.toString()}_${schemaType}_${page?.toString()}`,
  //   ],
  //   queryFn: () =>
  //     searchCredentials(
  //       {
  //         //TODO: PAGING NOT SUPPORTED BY API (ARIES CLOUD)
  //         pageNumber: null, //page ? parseInt(page.toString()) : 1,
  //         pageSize: null, //PAGE_SIZE,
  //         schemaType: null, //schemaType?.toString() ?? null,
  //       },
  //       context,
  //     ),
  // });

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
  user: User;
  query?: string;
  page?: string;
  error: string;
}> = ({ /*user, query, page,*/ error }) => {
  // const [credentialDialogVisible, setCredentialDialogVisible] = useState(false);
  // const [activeCredential, setActiveCredential] =
  //   useState<SSICredentialInfo | null>(null);

  const userProfile = useAtomValue(userProfileAtom);

  // const handleOnClickCredential = useCallback(
  //   (item: SSICredentialInfo) => {
  //     getCredentialById(item.id)
  //       .then((res) => {
  //         setActiveCredential(res);
  //         setCredentialDialogVisible(true);
  //       })
  //       .catch((err) => {
  //         toast.error("Unable to retrieve your credential");
  //         console.error(err);
  //       });
  //   },
  //   [setActiveCredential, setCredentialDialogVisible],
  // );

  if (error) return <Unauthorized />;

  return (
    <>
      {/* CREDENTIAL DIALOG */}
      {/* <ReactModal
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

                   * CREDENTIAL DETAILS
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
                              <Moment format={DATETIME_FORMAT_SYSTEM}
                                      utc={true}>
                                { activeCredential?.dateIssued }
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
                       * ATTRIBUTES
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
      </ReactModal> */}

      <div className="flex w-full flex-col gap-4">
        {/* ERRROR */}
        {/* {dataError && <ApiErrors error={dataError} />} */}

        {/* LOADING */}
        {/* {dataIsLoading && (
          <div className="flex justify-center rounded-lg bg-white p-8">
            <LoadingSkeleton />
          </div>
        )} */}

        {/* NO ROWS */}
        {(userProfile?.skills === null ||
          userProfile?.skills === undefined ||
          userProfile?.skills.length === 0) && (
          <div className="flex justify-center rounded-lg bg-white p-8">
            <NoRowsMessage
              title={"No results found"}
              description={
                "Skills that you receive by completing opportunities will be diplayed here."
              }
            />
          </div>
        )}

        {userProfile?.skills !== null &&
          userProfile?.skills !== undefined &&
          userProfile?.skills.length > 0 && (
            <div className="flex flex-col items-center gap-4">
              {/* GRID */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {userProfile?.skills.map((item, index) => (
                  <div
                    key={`${item.id}_${index}`}
                    className="flex h-[180px] flex-col rounded-lg bg-white p-2"
                    // onClick={() => handleOnClickCredential(item)}
                  >
                    <div className="flex h-full flex-col gap-2">
                      <div className="flex flex-grow flex-row items-start justify-start">
                        <div className="flex flex-col items-start justify-start gap-2">
                          <p className="max-h-[45px] overflow-hidden text-ellipsis text-base font-semibold text-black">
                            {item.name}
                          </p>
                          {/* <p className="max-h-[80px] overflow-hidden text-ellipsis text-sm font-bold">
                            Updated: ?
                          </p> */}
                          {item.infoURL && (
                            <Link
                              href={item.infoURL}
                              className="max-h-[80px] overflow-hidden text-ellipsis text-sm font-bold"
                            >
                              {item.infoURL}
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row text-gray-dark">
                        Across {item.organizations.length} partner
                        {item.organizations.length > 1 ? "s" : ""}
                      </div>

                      <div className="flex flex-row items-start overflow-hidden">
                        {item.organizations.map((org, index) => (
                          <div
                            className="relative -mr-4 overflow-hidden rounded-full shadow"
                            style={{
                              zIndex: item.organizations.length - index,
                            }}
                            key={`${item.id}_${index}`}
                          >
                            <>
                              {!org.logoURL && (
                                <RoundedImage
                                  icon={iconRocket}
                                  alt={""}
                                  imageWidth={20}
                                  imageHeight={20}
                                  containerWidth={40}
                                  containerHeight={40}
                                />
                              )}
                              {org.logoURL && (
                                <Image
                                  src={org.logoURL}
                                  alt={`${org.name} Logo`}
                                  width={40}
                                  height={40}
                                  sizes="(max-width: 40px) 30vw, 50vw"
                                  priority={true}
                                  placeholder="blur"
                                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                                    shimmer(40, 40),
                                  )}`}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    maxWidth: "40px",
                                    maxHeight: "40px",
                                  }}
                                />
                              )}
                            </>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* <div className="flex flex-row items-center justify-center">
                        <div className="flex flex-grow text-xs tracking-widest">
                          <Moment format={DATETIME_FORMAT_SYSTEM}
                                      utc={true}>
                            { item.dateIssued! }
                          </Moment>
                        </div>
                        <div className="badge h-6 rounded-md bg-green-light text-xs font-bold text-green">
                          <IoMdCheckmark className="mr-1 h-4 w-4" />
                          Verified
                        </div>
                      </div> */}
                  </div>
                ))}
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
