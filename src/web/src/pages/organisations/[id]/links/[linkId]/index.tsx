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
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useState, type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { IoMdArrowRoundBack, IoMdClose } from "react-icons/io";
import { IoShareSocialOutline } from "react-icons/io5";
import Moment from "react-moment";
import { toast } from "react-toastify";
import {
  LinkInfo,
  LinkSearchFilterUsage,
  LinkSearchResultsUsage,
  LinkUsageStatus,
} from "~/api/models/actionLinks";
import { getLinkById, searchLinkUsage } from "~/api/services/actionLinks";
import CustomSlider from "~/components/Carousel/CustomSlider";
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { SearchInput } from "~/components/SearchInput";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { DATE_FORMAT_HUMAN, PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";
import { LinkActions, LinkActionOptions } from "~/components/Links/LinkActions";

interface IParams extends ParsedUrlQuery {
  id: string;
  linkId: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, linkId } = context.params as IParams;
  const { valueContains, usage, page } = context.query;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
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
    // 👇 prefetch link details
    const linkData = await searchLinkUsage(
      {
        id: linkId,
        usage: usage?.toString() ?? LinkUsageStatus.All,
        valueContains: valueContains?.toString() ?? null,
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
      },
      context,
    );
    await queryClient.prefetchQuery({
      queryKey: ["Link", linkId, usage ?? "", valueContains ?? "", page ?? ""],
      queryFn: () => linkData,
    });
  } catch (error) {
    console.log("Error fetching link data:", error);
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
      linkId: linkId ?? null,
      valueContains: valueContains ?? null,
      usage: usage ?? null,
      page: page ?? null,
      theme,
      error: errorCode,
    },
  };
}

const LinkOverview: NextPageWithLayout<{
  id: string;
  linkId: string;
  valueContains?: string;
  usage?: string;
  page?: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ id, linkId, valueContains, usage, page, error }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { returnUrl } = router.query;
  const [isLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeImageData, setQRCodeImageData] = useState<
    string | null | undefined
  >(null);

  // 👇 fetch link details
  const { data: link } = useQuery<LinkSearchResultsUsage>({
    queryKey: [
      "Link",
      linkId,
      usage ?? LinkUsageStatus.All,
      valueContains ?? "",
      page ?? "",
    ],
    queryFn: () =>
      searchLinkUsage({
        id: linkId,
        usage: usage ?? LinkUsageStatus.All,
        valueContains: valueContains?.toString() ?? null,
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error,
  });

  // search filter state
  const [searchFilter] = useState<LinkSearchFilterUsage>({
    id: linkId,
    usage: usage ?? null,
    valueContains: valueContains ?? null,
    pageNumber: page ? parseInt(page) : 1,
    pageSize: PAGE_SIZE,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: LinkSearchFilterUsage) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (searchFilter?.valueContains)
        params.append("valueContains", searchFilter.valueContains);

      if (searchFilter?.usage)
        params.append("usage", searchFilter.usage.toString());

      if (
        searchFilter.pageNumber !== null &&
        searchFilter.pageNumber !== undefined &&
        searchFilter.pageNumber !== 1
      )
        params.append("page", searchFilter.pageNumber.toString());

      // Ensure returnUrl is included if present in router.query
      if (router.query.returnUrl) {
        params.append("returnUrl", router.query.returnUrl as string);
      }

      if (params.size === 0) return null;
      return params;
    },
    [router.query.returnUrl],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: LinkSearchFilterUsage) => {
      let url = `/organisations/${id}/links/${linkId}`;

      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0) url = `${url}?${params}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, linkId, router, getSearchFilterAsQueryString],
  );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      searchFilter.pageNumber = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  // 🔔 tab change event
  const handleTabChange = useCallback(
    (value: string | null) => {
      searchFilter.usage = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onClick_CopyToClipboard = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!", { autoClose: 2000 });
  }, []);

  const onClick_GenerateQRCode = useCallback(
    (item: LinkInfo) => {
      // fetch the QR code
      queryClient
        .fetchQuery({
          queryKey: ["OpportunityLink", item.id],
          queryFn: () => getLinkById(item.id, true),
        })
        .then(() => {
          // get the QR code from the cache
          const qrCode = queryClient.getQueryData<LinkInfo | null>([
            "OpportunityLink",
            item.id,
          ]);

          // show the QR code
          setQRCodeImageData(qrCode?.qrCodeBase64);
          setShowQRCode(true);
        });
    },
    [queryClient],
  );

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>{`Yoma | ${link?.link?.name || "Link Details"}`}</title>
      </Head>

      <PageBackground />

      {isLoading && <Loading />}

      {/* QR CODE DIALOG */}
      <CustomModal
        isOpen={showQRCode}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setShowQRCode(false);
          setQRCodeImageData(null);
        }}
        className={`md:max-h-[650px] md:w-[600px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          {/* HEADER WITH CLOSE BUTTON */}
          <div className="bg-green flex flex-row p-4 shadow-lg">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={() => {
                setShowQRCode(false);
                setQRCodeImageData(null);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex flex-col items-center justify-center gap-4 p-8">
            <div className="border-green-dark -mt-16 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <IoShareSocialOutline className="h-7 w-7" />
            </div>

            {/* QR CODE */}
            {showQRCode && qrCodeImageData && (
              <>
                <h5>Scan the QR Code with your device&apos;s camera</h5>
                <Image
                  src={qrCodeImageData}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="h-auto"
                />
              </>
            )}

            <button
              type="button"
              className="btn border-purple text-purple mt-10 rounded-full bg-white normal-case md:w-[150px]"
              onClick={() => {
                setShowQRCode(false);
                setQRCodeImageData(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </CustomModal>

      <div className="z-10 container mt-20 max-w-5xl px-2 py-8">
        {/* BREADCRUMB */}
        <div className="flex flex-row text-xs text-white">
          <Link
            className="hover:text-gray flex items-center justify-center font-bold"
            href={getSafeUrl(
              returnUrl?.toString(),
              `/organisations/${id}/links`,
            )}
          >
            <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4" />
            Links
          </Link>
          <div className="mx-2 font-bold">|</div>
          <span className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap">
            {link?.link?.name}
          </span>
        </div>

        {/* LINK DETAILS */}
        <div className="animate-fade-in mx-auto mt-5 space-y-6 rounded-2xl bg-white p-6 shadow-md">
          {/* TITLE */}
          <div className="flex flex-row items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">
                {link?.link?.name ?? "N/A"}
              </h1>
              <p className="text-gray-500">
                {link?.link?.description ?? "N/A"}
              </p>
            </div>

            {link?.link && (
              <LinkActions
                link={link?.link}
                onCopyToClipboard={onClick_CopyToClipboard}
                onGenerateQRCode={onClick_GenerateQRCode}
                returnUrl={returnUrl?.toString()}
                organizationId={id}
                actionOptions={[
                  LinkActionOptions.ACTIVATE,
                  LinkActionOptions.REMIND_PARTICIPANTS,
                  LinkActionOptions.COPY_LINK,
                  LinkActionOptions.GENERATE_QR_CODE,
                  LinkActionOptions.DELETE,
                ]}
              />
            )}
          </div>

          {/* LINK INFORMATION */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              📄 Link Information
            </h2>
            <div className="overflow-x-auto">
              <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                {/* Status */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Status
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.status ? (
                      link?.link?.status === "Active" ? (
                        <span className="text-green-600">✅ Active</span>
                      ) : (
                        <span className="text-red-600">
                          ❌ {link?.link?.status?.toString()}
                        </span>
                      )
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                {/* Action */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Action
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.action
                      ? link?.link?.action === "Share"
                        ? "Share"
                        : "Verify"
                      : "N/A"}
                  </div>
                </div>
                {/* Entity Type / Opportunity */}
                {link?.link?.entityType === "Opportunity" ? (
                  <div className="flex">
                    <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                      Opportunity
                    </div>
                    <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                      {link?.link?.entityTitle ?? "N/A"}
                    </div>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                      Entity Type
                    </div>
                    <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                      {link?.link?.entityType ?? "N/A"}
                    </div>
                  </div>
                )}
                {/* Organisation */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Organisation
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                    {link?.link?.entityOrganizationName ?? "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* LINK ACCESS */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              🔗 Link Access
            </h2>
            <div className="overflow-x-auto">
              <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                {/* URL */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    URL
                  </div>
                  <div className="min-w-0 flex-1 truncate overflow-hidden border border-gray-200 px-4 py-2 align-middle whitespace-nowrap">
                    {link?.link?.url ? (
                      <a
                        className="text-blue-600 underline"
                        href={link?.link?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link?.link?.url}
                      >
                        {link?.link?.url}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                {/* Short URL */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Short URL
                  </div>
                  <div className="min-w-0 flex-1 truncate overflow-hidden border border-gray-200 px-4 py-2 align-middle whitespace-nowrap">
                    {link?.link?.shortURL ? (
                      <a
                        className="text-blue-600 underline"
                        href={link?.link?.shortURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link?.link?.shortURL}
                      >
                        {link?.link?.shortURL}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                {/* Distribution List */}
                {link?.link?.distributionList && (
                  <div className="flex md:col-span-2">
                    <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                      Distribution List
                    </div>
                    <div
                      className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100"
                      title={link?.link?.distributionList?.join(", ")}
                    >
                      {link?.link?.distributionList?.length > 0
                        ? link?.link?.distributionList.join(", ")
                        : "N/A"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* USAGE OVERVIEW */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              📊 Usage Overview
            </h2>
            <div className="overflow-x-auto">
              <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                {/* USED */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Used
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.usagesLimit
                      ? `${link?.link?.usagesTotal ?? "0"} / ${link?.link?.usagesLimit}`
                      : (link?.link?.usagesTotal ?? "0")}
                  </div>
                </div>
                {/* AVAILABLE */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Available
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.usagesAvailable ?? "No limit"}
                  </div>
                </div>
                {/* EXPIRES */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Expires
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.dateEnd ? (
                      <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                        {link.link.dateEnd}
                      </Moment>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                {/* CREATED */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Created
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.dateCreated ? (
                      <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                        {link?.link?.dateCreated}
                      </Moment>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* USAGE DETAILS */}
          <section className="flex flex-col justify-center gap-2">
            <div className="items-centerx flex flex-col justify-between md:flex-row">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                🧾 Usage Details
              </h2>

              <SearchInput
                defaultValue={searchFilter.valueContains ?? ""}
                onSearch={(query: string) => {
                  searchFilter.valueContains = query;
                  redirectWithSearchFilterParams(searchFilter);
                }}
                placeholder="Search"
              />
            </div>

            {/* TABBED NAVIGATION */}
            <CustomSlider sliderClassName="!gap-6">
              <div
                onClick={() => handleTabChange(null)}
                role="tab"
                className={`cursor-pointer border-b-4 py-2 whitespace-nowrap text-black ${
                  !usage
                    ? "border-orange"
                    : "hover:border-orange hover:text-gray text-gray"
                }`}
              >
                All
              </div>
              <button
                onClick={() => handleTabChange("claimed")}
                role="tab"
                className={`cursor-pointer border-b-4 py-2 whitespace-nowrap text-black ${
                  usage === "claimed"
                    ? "border-orange"
                    : "hover:border-orange hover:text-gray text-gray"
                }`}
              >
                Claimed
              </button>
              <div
                onClick={() => handleTabChange("unclaimed")}
                role="tab"
                className={`cursor-pointer border-b-4 py-2 whitespace-nowrap text-black ${
                  usage === "unclaimed"
                    ? "border-orange"
                    : "hover:border-orange hover:text-gray text-gray"
                }`}
              >
                Unclaimed
              </div>
            </CustomSlider>

            {link?.items && link.items.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="rounded-lg border border-gray-200">
                  <table className="min-w-full table-fixed border-collapse text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          "User",
                          "Email",
                          "Phone",
                          "Country",
                          "Age",
                          "Claimed",
                          "Date",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {link.items.map((item, idx) => (
                        <tr
                          key={item.userId ?? idx}
                          className="hover:bg-gray-100"
                        >
                          <td className="border border-gray-200 px-4 py-2">
                            {item.displayName ?? item.username ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.email ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.phoneNumber ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.country ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.age ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.claimed !== undefined ? (
                              item.claimed ? (
                                <span className="text-green-600">✅ Yes</span>
                              ) : (
                                <span className="text-red-500">❌ No</span>
                              )
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.dateClaimed ? (
                              <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                {item.dateClaimed}
                              </Moment>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                <div className="mt-2 grid place-items-center justify-center">
                  <PaginationButtons
                    currentPage={page ? parseInt(page) : 1}
                    totalItems={link?.totalCount ?? 0}
                    pageSize={PAGE_SIZE}
                    onClick={handlePagerChange}
                    showPages={false}
                    showInfo={true}
                  />
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No usage data available.</div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

LinkOverview.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

LinkOverview.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default LinkOverview;
