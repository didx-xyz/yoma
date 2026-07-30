import {
  keepPreviousData,
  QueryClient,
  dehydrate,
  useQuery,
} from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useMemo, type ReactElement } from "react";
import { FaCopy } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { toast } from "react-toastify";
import { SkillSearchFilter, SkillSearchResults } from "~/api/models/lookups";
import { getSkills } from "~/api/services/lookups";
import DropdownMenu from "~/components/Common/DropdownMenu";
import {
  ListPagePagination,
  ListPageResults,
} from "~/components/Common/ListPage/ListPageResults";
import ListPageSearchToolbar, {
  LIST_PAGE_TOOLBAR_BUTTON_CLASSES,
} from "~/components/Common/ListPage/ListPageSearchToolbar";
import {
  asString,
  buildListPageQueryString,
  getFilterKeyParts,
  parseListPageFilter,
  type ListPageFilterSpec,
  type ListPageRouterQuery,
} from "~/components/Common/ListPage/listPageFilter";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

/**
 * Skills has no status tabs and nothing to filter on beyond the search term, so the pattern
 * reduces to: search row + Actions, then the shared results treatment. The page size is
 * user-selectable here, so it rides along in the querystring.
 */
const SKILL_FILTER_SPEC: ListPageFilterSpec = {
  params: [
    { param: "query", key: "nameContains", kind: "single" },
    { param: "page", key: "pageNumber", kind: "page" },
  ],
  badgeExcludeKeys: ["pageNumber", "pageSize"],
};

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { returnUrl } = context.query;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  const errorCode = null;

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

  // NB: the filters are driven by the querystring (router.query), not by props
  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Skills: NextPageWithLayout<{
  theme: string;
  error?: number;
}> = ({ error }) => {
  const router = useRouter();

  // 👇 filters are driven by the querystring
  const routerQuery = router.query as ListPageRouterQuery;

  // the pager offers page sizes on this page, so it is part of the filter
  const pageSize = useMemo(() => {
    const raw = asString(routerQuery.pageSize);
    const parsed = raw ? Number.parseInt(raw, 10) : PAGE_SIZE;
    return Number.isNaN(parsed) || parsed < 1 ? PAGE_SIZE : parsed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]);

  const searchFilter = useMemo<SkillSearchFilter>(
    () =>
      parseListPageFilter<SkillSearchFilter>(routerQuery, SKILL_FILTER_SPEC, {
        pageNumber: 1,
        pageSize: pageSize,
        nameContains: null,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query, pageSize],
  );

  const filterKeyParts = useMemo(
    () => `${getFilterKeyParts(routerQuery, SKILL_FILTER_SPEC)}_${pageSize}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query, pageSize],
  );

  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    isPlaceholderData: isShowingPreviousResults,
  } = useQuery<SkillSearchResults>({
    queryKey: ["skills", filterKeyParts],
    queryFn: () => getSkills(searchFilter),
    enabled: !error,
    // the previous page stays visible (dimmed) while the next one loads
    placeholderData: keepPreviousData,
  });

  // 🎈 FUNCTIONS
  const redirectWithSearchFilterParams = useCallback(
    (filter: SkillSearchFilter) => {
      let url = `/admin/skills`;
      const params =
        buildListPageQueryString(filter, SKILL_FILTER_SPEC) ??
        new URLSearchParams();
      // not part of the spec: the page size is a pager preference, not a filter
      if (filter.pageSize && filter.pageSize !== PAGE_SIZE)
        params.append("pageSize", filter.pageSize.toString());

      if (params.size > 0) url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router],
  );

  //#region Event Handlers
  const onSearch = useCallback(
    (query: string) => {
      redirectWithSearchFilterParams({
        ...searchFilter,
        pageNumber: 1,
        nameContains: query.length > 2 ? query : null,
      });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const handlePagerChange = useCallback(
    (pageNumber: number, newPageSize?: number) => {
      redirectWithSearchFilterParams({
        ...searchFilter,
        pageNumber: pageNumber,
        pageSize: newPageSize ?? searchFilter.pageSize,
      });
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

          {/* SEARCH & ACTIONS */}
          {/* NB: no Filters button — there is nothing to filter on beyond the search term */}
          <ListPageSearchToolbar
            defaultValue={searchFilter.nameContains}
            onSearch={onSearch}
          >
            <DropdownMenu
              label="Actions"
              triggerIcon={<IoIosSettings className="h-5 w-5" />}
              // sized & coloured to match the search button next to it
              className="w-full md:w-40"
              buttonClassName={LIST_PAGE_TOOLBAR_BUTTON_CLASSES}
              items={[
                {
                  label: "Copy skills",
                  onClick: onClick_CopyAllSkillsToClipboard,
                  icon: <FaCopy className="h-4 w-4" />,
                },
              ]}
            />
          </ListPageSearchToolbar>
        </div>

        {/* MAIN CONTENT */}
        <ListPageResults
          isLoading={isLoadingSearchResults}
          isShowingPreviousResults={isShowingPreviousResults}
          skeletonRows={4}
          id="results"
        >
          <div className="md:shadow-custom rounded-lg md:bg-white md:p-4">
            {/* NO ROWS */}
            {searchResults && searchResults.items?.length === 0 && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                <NoRowsMessage
                  title={"No skills found"}
                  description={
                    searchFilter.nameContains
                      ? "Please try refining your search query."
                      : "This is where you will find all the awesome skills that are available"
                  }
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

                {/* PAGINATION */}
                <ListPagePagination
                  currentPage={searchFilter.pageNumber ?? 1}
                  totalItems={searchResults?.totalCount ?? 0}
                  pageSize={pageSize}
                  onClick={handlePagerChange}
                  isShowingPreviousResults={isShowingPreviousResults}
                  showPageSizes={true}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </ListPageResults>
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
