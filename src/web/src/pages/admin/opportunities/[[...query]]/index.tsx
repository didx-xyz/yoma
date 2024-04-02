import { useQuery } from "@tanstack/react-query";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, {
  type ReactElement,
  useCallback,
  useState,
  useRef,
  useMemo,
  useEffect,
} from "react";
import { OpportunityFilterOptions } from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { SearchInputLarge } from "~/components/SearchInputLarge";
import { PAGE_SIZE, PAGE_SIZE_MAXIMUM, THEME_BLUE } from "~/lib/constants";
import { type NextPageWithLayout } from "~/pages/_app";
import {
  getCommitmentIntervals,
  getOpportunitiesAdmin,
  getOpportunitiesAdminExportToCSV,
  getCategoriesAdmin,
  getLanguagesAdmin,
  getOrganisationsAdmin,
  getCountriesAdmin,
  getOpportunityCategories,
  getOpportunityCountries,
  getOpportunityLanguages,
  getOpportunityOrganizations,
  getOpportunityTypes,
  getZltoRewardRanges,
} from "~/api/services/opportunities";
import type {
  OpportunityCategory,
  OpportunitySearchCriteriaCommitmentInterval,
  OpportunitySearchCriteriaZltoReward,
  OpportunitySearchFilterCombined,
  OpportunitySearchResultsInfo,
  OpportunityType,
} from "~/api/models/opportunity";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { OpportunityFilterHorizontal } from "~/components/Opportunity/OpportunityFilterHorizontal";
import type { Country, Language, SelectOption } from "~/api/models/lookups";
import { Loading } from "~/components/Status/Loading";
import FileSaver from "file-saver";
import { useAtomValue } from "jotai";
import { screenWidthAtom } from "~/lib/store";
import ReactModal from "react-modal";
import { OpportunityFilterVertical } from "~/components/Opportunity/OpportunityFilterVertical";
import iconBell from "public/images/icon-bell.webp";
import { IoMdDownload, IoMdPerson, IoIosLink } from "react-icons/io";
import iconZlto from "public/images/icon-zlto.svg";

// 👇 SSG
// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps: GetStaticProps = async (context) => {
  const lookups_categories = await getOpportunityCategories(context);
  const lookups_countries = await getOpportunityCountries(context);
  const lookups_languages = await getOpportunityLanguages(context);
  const lookups_organisations = await getOpportunityOrganizations(context);
  const lookups_types = await getOpportunityTypes(context);
  const lookups_commitmentIntervals = await getCommitmentIntervals(context);
  const lookups_zltoRewardRanges = await getZltoRewardRanges(context);

  return {
    props: {
      lookups_categories,
      lookups_countries,
      lookups_languages,
      lookups_organisations,
      lookups_types,
      lookups_commitmentIntervals,
      lookups_zltoRewardRanges,
    },

    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 300 seconds
    revalidate: 300,
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

const OpportunitiesAdmin: NextPageWithLayout<{
  lookups_types: OpportunityType[];
  lookups_commitmentIntervals: OpportunitySearchCriteriaCommitmentInterval[];
  lookups_zltoRewardRanges: OpportunitySearchCriteriaZltoReward[];
}> = ({
  lookups_types,
  lookups_commitmentIntervals,
  lookups_zltoRewardRanges,
}) => {
  const router = useRouter();
  const [isExportButtonLoading, setIsExportButtonLoading] = useState(false);
  const myRef = useRef<HTMLDivElement>(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const smallDisplay = useAtomValue(screenWidthAtom);

  const lookups_publishedStates: SelectOption[] = [
    { value: "0", label: "Not started" },
    { value: "1", label: "Active" },
    { value: "2", label: "Expired" },
  ];

  const lookups_statuses: SelectOption[] = [
    { value: "0", label: "Active" },
    { value: "1", label: "Deleted" },
    { value: "2", label: "Expired" },
    { value: "3", label: "Inactive" },
  ];

  // get filter parameters from route
  const {
    query,
    page,
    categories,
    countries,
    languages,
    types,
    commitmentIntervals,
    organizations,
    zltoRewardRanges,
    startDate,
    endDate,
    statuses,
  } = router.query;

  const { data: lookups_categories } = useQuery<OpportunityCategory[]>({
    queryKey: ["AdminOpportunitiesCategories"],
    queryFn: () => getCategoriesAdmin(null),
  });

  const { data: lookups_countries } = useQuery<Country[]>({
    queryKey: ["AdminOpportunitiesCountries"],
    queryFn: () => getCountriesAdmin(),
  });

  const { data: lookups_languages } = useQuery<Language[]>({
    queryKey: ["AdminOpportunitiesLanguages"],
    queryFn: () => getLanguagesAdmin(),
  });

  const { data: lookups_organisations } = useQuery<OrganizationInfo[]>({
    queryKey: ["AdminOpportunitiesOrganisations"],
    queryFn: () => getOrganisationsAdmin(),
  });

  // memo for isSearchPerformed based on filter parameters
  const isSearchPerformed = useMemo<boolean>(() => {
    return (
      query != undefined ||
      categories != undefined ||
      countries != undefined ||
      languages != undefined ||
      types != undefined ||
      commitmentIntervals != undefined ||
      organizations != undefined ||
      zltoRewardRanges != undefined ||
      startDate != undefined ||
      endDate != undefined ||
      statuses != undefined
    );
  }, [
    query,
    categories,
    countries,
    languages,
    types,
    commitmentIntervals,
    organizations,
    zltoRewardRanges,
    startDate,
    endDate,
    statuses,
  ]);

  // QUERY: SEARCH RESULTS
  // the filter values from the querystring are mapped to it's corresponding id
  const { data: searchResults, isLoading } =
    useQuery<OpportunitySearchResultsInfo>({
      queryKey: [
        "OpportunitiesSearch",
        query,
        page,
        categories,
        countries,
        languages,
        types,
        commitmentIntervals,
        organizations,
        zltoRewardRanges,
        startDate,
        endDate,
        statuses,
      ],
      queryFn: async () =>
        await getOpportunitiesAdmin({
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          valueContains: query ? decodeURIComponent(query.toString()) : null,

          types:
            types != undefined
              ? types
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_types.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_categories?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          countries:
            countries != undefined
              ? countries
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_countries?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          languages:
            languages != undefined
              ? languages
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_languages?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          organizations:
            organizations != undefined
              ? organizations
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_organisations?.find(
                      (y) => y.name === x,
                    );
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          commitmentIntervals:
            commitmentIntervals != undefined
              ? commitmentIntervals?.toString().split(",")
              : null,
          zltoRewardRanges:
            zltoRewardRanges != undefined
              ? zltoRewardRanges?.toString().split(",")
              : null,
          startDate: startDate != undefined ? startDate.toString() : null,
          endDate: endDate != undefined ? endDate.toString() : null,
          statuses:
            statuses != undefined
              ? statuses
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_statuses.find((y) => y.label === x);
                    return item ? item?.value : "";
                  })
                  .filter((x) => x != "")
              : null,
        }),
      //enabled: isSearchPerformed, // only run query if search is executed
    });

  // search filter state
  const [opportunitySearchFilter, setOpportunitySearchFilter] =
    useState<OpportunitySearchFilterCombined>({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      categories: null,
      countries: null,
      languages: null,
      types: null,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: null,
      startDate: null,
      endDate: null,
      statuses: null,
    });

  // sets the filter values from the querystring to the filter state
  useEffect(() => {
    if (isSearchPerformed)
      setOpportunitySearchFilter({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        valueContains: query ? decodeURIComponent(query.toString()) : null,
        mostViewed: null,
        types: types != undefined ? types?.toString().split(",") : null,
        categories:
          categories != undefined ? categories?.toString().split(",") : null,
        countries:
          countries != undefined && countries != null
            ? countries?.toString().split(",")
            : null,
        languages:
          languages != undefined ? languages?.toString().split(",") : null,
        organizations:
          organizations != undefined
            ? organizations?.toString().split(",")
            : null,
        commitmentIntervals:
          commitmentIntervals != undefined
            ? commitmentIntervals?.toString().split(",")
            : null,
        zltoRewardRanges:
          zltoRewardRanges != undefined
            ? zltoRewardRanges?.toString().split(",")
            : null,
        publishedStates: null,
        startDate: startDate != undefined ? startDate.toString() : null,
        endDate: endDate != undefined ? endDate.toString() : null,
        statuses:
          statuses != undefined ? statuses?.toString().split(",") : null,
      });
  }, [
    setOpportunitySearchFilter,
    isSearchPerformed,
    query,
    page,
    categories,
    countries,
    languages,
    types,
    commitmentIntervals,
    organizations,
    zltoRewardRanges,
    startDate,
    endDate,
    statuses,
  ]);

  // disable full-size search filters when resizing to larger screens
  useEffect(() => {
    if (!smallDisplay) setFilterFullWindowVisible(false);
  }, [smallDisplay]);

  // 📜 scroll to results when search is executed
  // useEffect(() => {
  //   if (searchResults && !isLoading) {
  //     setTimeout(() => {
  //       const element = document.getElementById("results");

  //       if (element) {
  //         window.scrollTo({
  //           top: element.offsetTop - 55,
  //           behavior: "smooth",
  //         });
  //       }
  //     }, 500);
  //   }
  // }, [searchResults, isLoading]);

  // 🧮 CALCULATED FIELDS
  // results info text based on filter parameters
  // const searchFilterText = useMemo(() => {
  //   if (!searchResults) {
  //     return "0 results";
  //   }

  //   const { totalCount } = searchResults;
  //   const resultText = totalCount === 1 ? "result" : "results";
  //   const countText = `${totalCount?.toLocaleString()} ${resultText}`;

  //   const filterText = [
  //     opportunitySearchFilter.valueContains &&
  //       `'${opportunitySearchFilter.valueContains}'`,
  //     opportunitySearchFilter.categories?.map((c) => `'${c}'`)?.join(", "),
  //     opportunitySearchFilter.countries?.map((c) => `'${c}'`)?.join(", "),
  //     opportunitySearchFilter.languages?.map((c) => `'${c}'`).join(", "),
  //     opportunitySearchFilter.types?.map((c) => `'${c}'`).join(", "),
  //     opportunitySearchFilter.organizations?.map((c) => `'${c}'`).join(", "),
  //     opportunitySearchFilter.statuses?.map((c) => `'${c}'`).join(", "),
  //     opportunitySearchFilter.commitmentIntervals
  //       ? `'${
  //           opportunitySearchFilter.commitmentIntervals.length
  //         } commitment interval${
  //           opportunitySearchFilter.commitmentIntervals.length > 1 ? "s" : ""
  //         }'`
  //       : undefined,
  //     opportunitySearchFilter.zltoRewardRanges
  //       ? `'${opportunitySearchFilter.zltoRewardRanges.length} reward${
  //           opportunitySearchFilter.zltoRewardRanges.length > 1 ? "s" : ""
  //         }'`
  //       : undefined,
  //     opportunitySearchFilter.startDate
  //       ? `'${moment(new Date(opportunitySearchFilter.startDate)).format(
  //           DATE_FORMAT_HUMAN,
  //         )}'`
  //       : undefined,
  //     opportunitySearchFilter.endDate
  //       ? `'${moment(new Date(opportunitySearchFilter.endDate)).format(
  //           DATE_FORMAT_HUMAN,
  //         )}'`
  //       : undefined,
  //   ]
  //     .filter(Boolean)
  //     .join(", ");

  //   return `${countText} ${filterText ? ` for ${filterText}` : ""}`;
  // }, [opportunitySearchFilter, searchResults]);

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (opportunitySearchFilter: OpportunitySearchFilterCombined) => {
      if (!opportunitySearchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();
      if (
        opportunitySearchFilter.valueContains !== undefined &&
        opportunitySearchFilter.valueContains !== null &&
        opportunitySearchFilter.valueContains.length > 0
      )
        params.append("query", opportunitySearchFilter.valueContains);
      if (
        opportunitySearchFilter?.categories?.length !== undefined &&
        opportunitySearchFilter.categories.length > 0
      )
        params.append(
          "categories",
          opportunitySearchFilter.categories.join(","),
        );
      if (
        opportunitySearchFilter?.countries?.length !== undefined &&
        opportunitySearchFilter.countries.length > 0
      )
        params.append("countries", opportunitySearchFilter.countries.join(","));
      if (
        opportunitySearchFilter?.languages?.length !== undefined &&
        opportunitySearchFilter.languages.length > 0
      )
        params.append("languages", opportunitySearchFilter.languages.join(","));
      if (
        opportunitySearchFilter?.types?.length !== undefined &&
        opportunitySearchFilter.types.length > 0
      )
        params.append("types", opportunitySearchFilter.types.join(","));
      if (
        opportunitySearchFilter?.commitmentIntervals?.length !== undefined &&
        opportunitySearchFilter.commitmentIntervals.length > 0
      )
        params.append(
          "commitmentIntervals",
          opportunitySearchFilter.commitmentIntervals.join(","),
        );
      if (
        opportunitySearchFilter?.organizations?.length !== undefined &&
        opportunitySearchFilter.organizations.length > 0
      )
        params.append(
          "organizations",
          opportunitySearchFilter.organizations.join(","),
        );
      if (
        opportunitySearchFilter?.zltoRewardRanges?.length !== undefined &&
        opportunitySearchFilter.zltoRewardRanges.length > 0
      )
        params.append(
          "zltoRewardRanges",
          opportunitySearchFilter.zltoRewardRanges.join(","),
        );

      if (
        opportunitySearchFilter?.statuses !== undefined &&
        opportunitySearchFilter?.statuses !== null &&
        opportunitySearchFilter?.statuses.length > 0
      )
        params.append("statuses", opportunitySearchFilter?.statuses.join(","));

      if (
        opportunitySearchFilter.startDate !== undefined &&
        opportunitySearchFilter.startDate !== null
      )
        params.append("startDate", opportunitySearchFilter.startDate);

      if (
        opportunitySearchFilter.endDate !== undefined &&
        opportunitySearchFilter.endDate !== null
      )
        params.append("endDate", opportunitySearchFilter.endDate);

      if (
        opportunitySearchFilter.pageNumber !== null &&
        opportunitySearchFilter.pageNumber !== undefined &&
        opportunitySearchFilter.pageNumber !== 1
      )
        params.append("page", opportunitySearchFilter.pageNumber.toString());

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: OpportunitySearchFilterCombined) => {
      let url = "/admin/opportunities";
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `/admin/opportunities?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
  );

  // 🔔 CHANGE EVENTS
  const handlePagerChange = useCallback(
    (value: number) => {
      opportunitySearchFilter.pageNumber = value;
      redirectWithSearchFilterParams(opportunitySearchFilter);
    },
    [opportunitySearchFilter, redirectWithSearchFilterParams],
  );

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);
        query = searchValueEncoded;
      }

      opportunitySearchFilter.valueContains = query;
      redirectWithSearchFilterParams(opportunitySearchFilter);
    },
    [opportunitySearchFilter, redirectWithSearchFilterParams],
  );

  // filter popup handlers
  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, [setFilterFullWindowVisible]);

  const onSubmitFilter = useCallback(
    (val: OpportunitySearchFilterCombined) => {
      redirectWithSearchFilterParams(val);
    },
    [redirectWithSearchFilterParams],
  );

  const onClearFilter = useCallback(() => {
    void router.push("/admin/opportunities", undefined, { scroll: true });
  }, [router]);

  const handleExportToCSV = useCallback(async () => {
    setIsExportButtonLoading(true);

    try {
      opportunitySearchFilter.pageSize = PAGE_SIZE_MAXIMUM;
      const data = await getOpportunitiesAdminExportToCSV(
        opportunitySearchFilter,
      );
      if (!data) return;

      FileSaver.saveAs(data);

      setExportDialogOpen(false);
    } finally {
      setIsExportButtonLoading(false);
    }
  }, [opportunitySearchFilter, setIsExportButtonLoading, setExportDialogOpen]);

  return (
    <>
      <Head>
        <title>Yoma | Admin Opportunities</title>
      </Head>

      <PageBackground />

      {isLoading && <Loading />}

      {/* POPUP FILTER */}
      <ReactModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setFilterFullWindowVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-y-scroll rounded-lg bg-white animate-in fade-in md:m-auto md:max-h-[600px] md:w-[800px]`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        {lookups_categories &&
          lookups_countries &&
          lookups_languages &&
          lookups_organisations && (
            <OpportunityFilterVertical
              htmlRef={myRef.current!}
              opportunitySearchFilter={opportunitySearchFilter}
              lookups_categories={lookups_categories}
              lookups_countries={lookups_countries}
              lookups_languages={lookups_languages}
              lookups_types={lookups_types}
              lookups_organisations={lookups_organisations}
              lookups_commitmentIntervals={lookups_commitmentIntervals}
              lookups_zltoRewardRanges={lookups_zltoRewardRanges}
              lookups_publishedStates={lookups_publishedStates}
              lookups_statuses={[]}
              submitButtonText="Apply Filters"
              onCancel={onCloseFilter}
              onSubmit={(e) => onSubmitFilter(e)}
              onClear={onClearFilter}
              clearButtonText="Clear All Filters"
              filterOptions={[
                OpportunityFilterOptions.CATEGORIES,
                OpportunityFilterOptions.TYPES,
                OpportunityFilterOptions.COUNTRIES,
                OpportunityFilterOptions.LANGUAGES,
                OpportunityFilterOptions.COMMITMENTINTERVALS,
                OpportunityFilterOptions.ZLTOREWARDRANGES,
                OpportunityFilterOptions.ORGANIZATIONS,
                OpportunityFilterOptions.PUBLISHEDSTATES,
              ]}
            />
          )}
      </ReactModal>

      {/* EXPORT DIALOG */}
      <ReactModal
        isOpen={exportDialogOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setExportDialogOpen(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[480px] md:w-[600px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex flex-col gap-2">
          <div className="flex h-20 flex-row bg-blue p-4 shadow-lg"></div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
              <Image
                src={iconBell}
                alt="Icon Bell"
                width={28}
                height={28}
                sizes="100vw"
                priority={true}
                style={{ width: "28px", height: "28px" }}
              />
            </div>

            <div className="flex w-96 flex-col gap-4">
              <h4>
                Just a heads up, the result set is quite large and we can only
                return a maximum of {PAGE_SIZE_MAXIMUM.toLocaleString()} rows
                for each export.
              </h4>
              <h5>
                To help manage this, consider applying search filters like start
                date or end date. This will narrow down the size of your results
                and make your data more manageable.
              </h5>
              <h5>When you&apos;re ready, click the button to continue.</h5>
            </div>

            <div className="mt-4 flex flex-grow gap-4">
              <button
                type="button"
                className="btn bg-green normal-case text-white hover:bg-green hover:brightness-110 disabled:border-0 disabled:bg-green disabled:brightness-90 md:w-[250px]"
                onClick={handleExportToCSV}
                disabled={isExportButtonLoading}
              >
                {isExportButtonLoading && (
                  <p className="text-white">Exporting...</p>
                )}
                {!isExportButtonLoading && (
                  <>
                    <IoMdDownload className="h-5 w-5 text-white" />
                    <p className="text-white">Export to CSV</p>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </ReactModal>

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* TITLE & SEARCH INPUT */}
      <div className="container z-10 mt-16 max-w-7xl px-2 py-8">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <h2 className="mb-4 flex flex-grow items-center font-semibold text-white">
            Opportunities
          </h2>

          <div className="flex gap-2 md:justify-end">
            <SearchInputLarge
              // className={
              //   "bg-theme hover:bg-theme brightness-105 hover:brightness-110"
              // }
              openFilter={setFilterFullWindowVisible}
              maxWidth={400}
              defaultValue={query ? decodeURIComponent(query.toString()) : null}
              onSearch={onSearchInputSubmit}
            />

            {/* {currentOrganisationInactive ? (
              <span className="flex w-56 cursor-not-allowed flex-row items-center justify-center whitespace-nowrap rounded-full bg-gray-dark p-1 text-xs text-white">
                Add opportunity (disabled)
              </span>
            ) : (
              <Link
                href={`/organisations/${id}/opportunities/create`}
                className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white"
                id="btnCreateOpportunity" // e2e
              >
                <IoIosAdd className="mr-1 h-5 w-5" />
                Add opportunity
              </Link>
            )} */}
          </div>
        </div>

        {/* FILTER ROW: CATEGORIES DROPDOWN FILTERS (SELECT) FOR COUNTRIES, LANGUAGES, TYPE, ORGANISATIONS ETC  */}
        <div className="mb-4 mt-10 hidden md:flex">
          {lookups_categories &&
            lookups_countries &&
            lookups_languages &&
            lookups_organisations && (
              <OpportunityFilterHorizontal
                htmlRef={myRef.current!}
                opportunitySearchFilter={opportunitySearchFilter}
                lookups_categories={lookups_categories}
                lookups_countries={lookups_countries}
                lookups_languages={lookups_languages}
                lookups_types={lookups_types}
                lookups_organisations={lookups_organisations}
                lookups_commitmentIntervals={lookups_commitmentIntervals}
                lookups_zltoRewardRanges={lookups_zltoRewardRanges}
                lookups_publishedStates={lookups_publishedStates}
                lookups_statuses={lookups_statuses}
                clearButtonText="Clear"
                onClear={onClearFilter}
                onSubmit={onSubmitFilter}
                onOpenFilterFullWindow={() => {
                  setFilterFullWindowVisible(!filterFullWindowVisible);
                }}
                filterOptions={[
                  OpportunityFilterOptions.CATEGORIES,
                  OpportunityFilterOptions.TYPES,
                  OpportunityFilterOptions.COUNTRIES,
                  OpportunityFilterOptions.LANGUAGES,
                  OpportunityFilterOptions.ORGANIZATIONS,
                  OpportunityFilterOptions.DATE_START,
                  OpportunityFilterOptions.DATE_END,
                  OpportunityFilterOptions.STATUSES,
                  OpportunityFilterOptions.VIEWALLFILTERSBUTTON,
                ]}
                totalCount={searchResults?.totalCount ?? 0}
                exportToCsv={setExportDialogOpen}
              />
            )}
        </div>

        {/* SEARCH RESULTS */}
        {!isLoading && (
          <div id="results">
            {/* <div className="mb-6 flex flex-row items-center justify-end"></div> */}
            <div className="rounded-lg bg-transparent md:bg-white md:p-4">
              {/* NO ROWS */}
              {(!searchResults || searchResults.items?.length === 0) &&
                !isSearchPerformed && (
                  <div className="mb-auto flex flex-col md:place-items-center md:py-52">
                    <NoRowsMessage
                      title={"You will find your opportunities here"}
                      description={
                        "This is where you will find all the awesome opportunities that have been created"
                      }
                    />
                    {/* <Link href={`/organisations/${id}/opportunities/create`}>
                <button className="btn btn-primary btn-sm mt-10 rounded-3xl px-16">
                  Add opportunity
                </button>
              </Link> */}
                  </div>
                )}
              {(!searchResults || searchResults.items?.length === 0) &&
                isSearchPerformed && (
                  <div className="flex flex-col place-items-center py-52">
                    <NoRowsMessage
                      title={"No opportunities found"}
                      description={"Please try refining your search query."}
                    />
                  </div>
                )}

              {/* GRID */}
              {searchResults && searchResults.items?.length > 0 && (
                <div className="overflow-x-auto">
                  {/* MOBIlE */}
                  <div className="flex flex-col gap-4 md:hidden">
                    {searchResults.items.map((opportunity) => (
                      <Link
                        href={`/organisations/${
                          opportunity.organizationId
                        }/opportunities/${
                          opportunity.id
                        }/info?returnUrl=${encodeURIComponent(router.asPath)}`}
                        className="rounded-lg bg-white p-2 shadow-custom"
                        key={opportunity.id}
                      >
                        <div className="flex flex-col p-2">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-gray-dark">
                                Opportunity title
                              </span>
                              <span className="line-clamp-2 text-gray-dark">
                                {opportunity.title}
                              </span>
                            </div>

                            {/* BADGES */}
                            <div className="flex flex-wrap gap-2">
                              {opportunity.zltoReward && (
                                <span className="badge bg-orange-light text-orange">
                                  <Image
                                    src={iconZlto}
                                    alt="Zlto icon"
                                    width={16}
                                    height={16}
                                  />
                                  <span className="ml-1 text-xs">
                                    {opportunity?.zltoReward}
                                  </span>
                                </span>
                              )}
                              {opportunity.yomaReward && (
                                <span className="badge bg-orange-light text-orange">
                                  <span className="ml-1 text-xs">
                                    {opportunity.yomaReward} Yoma
                                  </span>
                                </span>
                              )}

                              <span className="badge bg-blue-light text-blue">
                                <IoMdPerson className="h-4 w-4" />
                                <span className="ml-1 text-xs">
                                  {opportunity.participantCountTotal}
                                </span>
                              </span>
                              {opportunity.status == "Active" && (
                                <>
                                  <span className="badge bg-blue-light text-blue">
                                    Active
                                  </span>
                                </>
                              )}
                              {opportunity?.status == "Expired" && (
                                <span className="badge bg-green-light text-yellow ">
                                  Expired
                                </span>
                              )}
                              {opportunity?.status == "Inactive" && (
                                <span className="badge bg-yellow-tint text-yellow ">
                                  Inactive
                                </span>
                              )}
                              {opportunity?.status == "Deleted" && (
                                <span className="badge bg-green-light  text-red-400">
                                  Deleted
                                </span>
                              )}

                              <span
                                // href={opportunity?.url ?? ""}
                                className="badge bg-green-light text-green"
                              >
                                <IoIosLink className="h-4 w-4" />
                                <span className="ml-1 text-xs">
                                  {opportunity?.url}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {/* DESKTOP */}
                  <table className="hidden md:table">
                    <thead>
                      <tr className="border-gray text-gray-dark">
                        <th>Opportunity title</th>
                        <th>Reward</th>
                        <th>Url</th>
                        <th>Participants</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.items.map((opportunity) => (
                        <tr key={opportunity.id} className="border-gray">
                          <td>
                            <Link
                              href={`/organisations/${
                                opportunity.organizationId
                              }/opportunities/${
                                opportunity.id
                              }/info?returnUrl=${encodeURIComponent(
                                router.asPath,
                              )}`}
                            >
                              {opportunity.title}
                            </Link>
                          </td>
                          <td className="w-28">
                            <div className="flex flex-col">
                              {opportunity.zltoReward && (
                                <span className="text-xs">
                                  {opportunity.zltoReward} Zlto
                                </span>
                              )}
                              {opportunity.yomaReward && (
                                <span className="text-xs">
                                  {opportunity.yomaReward} Yoma
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{opportunity.url}</td>
                          <td className="text-center">
                            {opportunity.participantCountTotal}
                          </td>
                          <td className="text-center">{opportunity.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* PAGINATION */}
            {searchResults && (searchResults.totalCount as number) > 0 && (
              <div className="mt-4 grid place-items-center justify-center">
                <PaginationButtons
                  currentPage={page ? parseInt(page.toString()) : 1}
                  totalItems={searchResults.totalCount as number}
                  pageSize={PAGE_SIZE}
                  showPages={false}
                  showInfo={true}
                  onClick={handlePagerChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

OpportunitiesAdmin.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

OpportunitiesAdmin.theme = function getTheme() {
  return THEME_BLUE;
};

export default OpportunitiesAdmin;
