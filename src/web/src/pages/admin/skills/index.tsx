import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useMemo, type ReactElement } from "react";
import { FaCopy } from "react-icons/fa";
import { toast } from "react-toastify";
import { SkillSearchFilter, SkillSearchResults } from "~/api/models/lookups";
import { getSkills } from "~/api/services/lookups";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { SearchInput } from "~/components/SearchInput";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query, page, pageSize, returnUrl } = context.query;
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
  const theme = getThemeFromRole(session);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      query: query ?? null,
      page: page ?? null,
      pageSize: pageSize ?? null,
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Skills: NextPageWithLayout<{
  query?: string;
  page?: string;
  pageSize?: string;
  theme: string;
  error?: number;
}> = ({ query, page, pageSize, error }) => {
  const router = useRouter();

  // search filter state
  const searchFilter = useMemo<SkillSearchFilter>(
    () => ({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: pageSize ? parseInt(pageSize.toString()) : PAGE_SIZE,
      nameContains: query?.toString() ?? null,
    }),
    [page, pageSize, query],
  );

  // 👇 use prefetched queries from server
  const { data: searchResults, isLoading: isLoadingSearchResults } =
    useQuery<SkillSearchResults>({
      queryKey: [
        "skills",
        `_${query?.toString()}_${page?.toString()}_${pageSize?.toString()}`,
      ],
      queryFn: () => getSkills(searchFilter),
      enabled: !error,
    });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: SkillSearchFilter) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (
        searchFilter.nameContains !== undefined &&
        searchFilter.nameContains !== null &&
        searchFilter.nameContains.length > 0
      )
        params.append("query", searchFilter.nameContains);

      if (
        searchFilter.pageNumber !== null &&
        searchFilter.pageNumber !== undefined &&
        searchFilter.pageNumber !== 1
      )
        params.append("page", searchFilter.pageNumber.toString());

      if (
        searchFilter.pageSize !== null &&
        searchFilter.pageSize !== undefined &&
        searchFilter.pageSize !== 1
      )
        params.append("pageSize", searchFilter.pageSize.toString());

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: SkillSearchFilter) => {
      let url = `/admin/skills`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
  );

  //#region Event Handlers
  const onSearch = useCallback(
    (query: string) => {
      searchFilter.pageNumber = 1;
      searchFilter.nameContains = query.length > 2 ? query : null;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const handlePagerChange = useCallback(
    (pageNumber: number, pageSize?: number) => {
      searchFilter.pageNumber = pageNumber;
      if (pageSize) searchFilter.pageSize = pageSize;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onClick_CopyToClipboard = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard!", { autoClose: 2000 });
  }, []);

  const onClick_CopyAllSkillsToClipboard = useCallback(() => {
    if (searchResults?.items?.length) {
      const skills = searchResults.items.map((item) => item.name).join("\n"); // Newline-separated for Excel rows
      navigator.clipboard.writeText(skills);
      toast.success("Current results copied to clipboard!", {
        autoClose: 2000,
      });
    } else {
      toast.error("No skills available to copy.", { autoClose: 2000 });
    }
  }, [searchResults]);
  //#endregion Event Handlers

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | ⚡Skills</title>
      </Head>

      <PageBackground className="h-[14.8rem] md:h-[18.4rem]" />

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            ⚡Skills
          </h3>

          {/* FILTERS */}
          <div className="-mt-2 flex w-full grow flex-row items-center justify-between gap-4 sm:justify-end">
            <SearchInput
              className="!bg-gray"
              classNameIcon="!text-gray-dark"
              defaultValue={query}
              onSearch={onSearch}
            />

            {/* BUTTONS */}
            <div className="flex w-full grow items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                onClick={onClick_CopyAllSkillsToClipboard}
                className="btn btn-sm border-green bg-gray tooltip tooltip-top"
                data-tip="Copy these skills to clipboard"
              >
                <FaCopy className="text-gray-dark h-4 w-4" />
                Copy skills
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        {isLoadingSearchResults && (
          <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8 md:pb-16">
            <LoadingSkeleton rows={4} />
          </div>
        )}

        {!isLoadingSearchResults && (
          <div className="md:shadow-custom rounded-lg md:bg-white md:p-4">
            {/* NO ROWS */}
            {searchResults && searchResults.items?.length === 0 && !query && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                <NoRowsMessage
                  title={"No skills found"}
                  description={
                    "This is where you will find all the awesome skills that are available"
                  }
                />
              </div>
            )}
            {searchResults && searchResults.items?.length === 0 && query && (
              <div className="flex flex-col place-items-center py-8">
                <NoRowsMessage
                  title={"No skills found"}
                  description={"Please try refining your search query."}
                />
              </div>
            )}

            {/* RESULTS */}
            {searchResults && searchResults.items?.length > 0 && (
              <div className="md:overflow-x-hidden">
                {/* MOBILE */}
                <div className="flex flex-col gap-4 md:hidden">
                  {searchResults.items.map((item) => (
                    <div
                      key={`sm_${item.id}`}
                      className="shadow-custom flex flex-col justify-between gap-4 rounded-lg bg-white p-4"
                    >
                      <div className="flex flex-row gap-2">
                        <span title={item.name} className="w-full">
                          {item.name}
                        </span>

                        <span title="Copy Skill to clipboard">
                          <button
                            type="button"
                            onClick={() => {
                              onClick_CopyToClipboard(item.name!);
                            }}
                          >
                            <FaCopy className="text-gray-dark hover:text-blue size-4" />
                          </button>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP */}
                <table className="border-gray-light hidden border-separate rounded-lg border-x-2 border-t-2 md:table md:table-auto">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light border-b-2 !py-4">
                        Skill
                      </th>
                      <th className="border-gray-light border-b-2 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((opportunity) => (
                      <tr key={`md_${opportunity.id}`}>
                        <td className="border-gray-light flex h-14 flex-row items-center gap-2 border-b-2">
                          {opportunity.name}
                        </td>
                        <td className="border-gray-light w-28 border-b-2 text-center">
                          <span
                            className="tooltip tooltip-top ml-2"
                            data-tip="Copy to clipboard"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onClick_CopyToClipboard(opportunity.name!);
                              }}
                            >
                              <FaCopy className="text-gray-dark hover:text-blue size-4" />
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-2 grid place-items-center justify-center">
                  {/* PAGINATION */}
                  <PaginationButtons
                    currentPage={page ? parseInt(page) : 1}
                    totalItems={searchResults?.totalCount ?? 0}
                    pageSize={pageSize ? parseInt(pageSize) : PAGE_SIZE}
                    onClick={handlePagerChange}
                    showPages={false}
                    showInfo={true}
                    showPageSizes={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

Skills.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Skills.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default Skills;
