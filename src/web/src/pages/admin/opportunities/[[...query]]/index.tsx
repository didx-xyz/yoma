import { useQuery } from "@tanstack/react-query";
import FileSaver from "file-saver";
import { useAtomValue } from "jotai";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconZlto from "public/images/icon-zlto.svg";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  IoIosLink,
  IoMdClose,
  IoMdDownload,
  IoMdEye,
  IoMdEyeOff,
  IoMdPerson,
} from "react-icons/io";
import { toast } from "react-toastify";
import type { Country, Language, SelectOption } from "~/api/models/lookups";
import type {
  OpportunityCategory,
  OpportunitySearchFilterAdmin,
  OpportunitySearchResultsInfo,
  OpportunityType,
} from "~/api/models/opportunity";
import { OpportunityFilterOptions } from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";
import {
  getCategoriesAdmin,
  getCountriesAdmin,
  getLanguagesAdmin,
  getOpportunitiesAdmin,
  getOpportunitiesAdminExportToCSV,
  getOpportunityTypes,
  getOrganisationsAdmin,
} from "~/api/services/opportunities";
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { OpportunityAdminFilterHorizontal } from "~/components/Opportunity/OpportunityAdminFilterHorizontal";
import { OpportunityAdminFilterVertical } from "~/components/Opportunity/OpportunityAdminFilterVertical";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { SearchInputLarge } from "~/components/SearchInputLarge";
import { Loading } from "~/components/Status/Loading";
import { PAGE_SIZE, PAGE_SIZE_MAXIMUM, THEME_BLUE } from "~/lib/constants";
import { screenWidthAtom } from "~/lib/store";
import { type NextPageWithLayout } from "~/pages/_app";

// 👇 SSG
// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps: GetStaticProps = async (context) => {
  const lookups_types = await getOpportunityTypes(context);

  return {
    props: {
      lookups_types,
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
}> = ({ lookups_types }) => {
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
    queryFn: () => getCountriesAdmin(null),
  });

  const { data: lookups_languages } = useQuery<Language[]>({
    queryKey: ["AdminOpportunitiesLanguages"],
    queryFn: () => getLanguagesAdmin(null),
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
          featured: null,
          types:
            types != undefined
              ? types
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = lookups_types.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          engagementTypes: null,
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split("|")
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
                  .split("|")
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
                  .split("|") // use | delimiter as some languages contain ',' e.g (Catalan, Valencian)
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
                  .split("|")
                  .map((x) => {
                    const item = lookups_organisations?.find(
                      (y) => y.name === x,
                    );
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          startDate: startDate != undefined ? startDate.toString() : null,
          endDate: endDate != undefined ? endDate.toString() : null,
          statuses:
            statuses != undefined
              ? statuses
                  ?.toString()
                  .split("|")
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
  const [searchFilter, setOpportunitySearchFilter] =
    useState<OpportunitySearchFilterAdmin>({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      categories: null,
      countries: null,
      languages: null,
      types: null,
      engagementTypes: null,
      valueContains: null,
      featured: null,
      organizations: null,
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
        featured: null,
        types: types != undefined ? types?.toString().split("|") : null,
        engagementTypes: null,
        categories:
          categories != undefined ? categories?.toString().split("|") : null,
        countries:
          countries != undefined && countries != null
            ? countries?.toString().split("|")
            : null,
        languages:
          languages != undefined ? languages?.toString().split("|") : null, // use | delimiter as some languages contain ',' e.g (Catalan, Valencian)
        organizations:
          organizations != undefined
            ? organizations?.toString().split("|")
            : null,
        startDate: startDate != undefined ? startDate.toString() : null,
        endDate: endDate != undefined ? endDate.toString() : null,
        statuses:
          statuses != undefined ? statuses?.toString().split("|") : null,
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

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: OpportunitySearchFilterAdmin) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();
      if (
        searchFilter.valueContains !== undefined &&
        searchFilter.valueContains !== null &&
        searchFilter.valueContains.length > 0
      )
        params.append("query", searchFilter.valueContains);

      if (
        searchFilter?.categories?.length !== undefined &&
        searchFilter.categories.length > 0
      )
        params.append("categories", searchFilter.categories.join("|"));

      if (
        searchFilter?.countries?.length !== undefined &&
        searchFilter.countries.length > 0
      )
        params.append("countries", searchFilter.countries.join("|"));

      if (
        searchFilter?.languages?.length !== undefined &&
        searchFilter.languages.length > 0
      )
        params.append("languages", searchFilter.languages.join("|"));

      if (
        searchFilter?.types?.length !== undefined &&
        searchFilter.types.length > 0
      )
        params.append("types", searchFilter.types.join("|"));

      if (
        searchFilter?.organizations?.length !== undefined &&
        searchFilter.organizations.length > 0
      )
        params.append("organizations", searchFilter.organizations.join("|"));

      if (
        searchFilter?.statuses !== undefined &&
        searchFilter?.statuses !== null &&
        searchFilter?.statuses.length > 0
      )
        params.append("statuses", searchFilter?.statuses.join("|"));

      if (
        searchFilter.startDate !== undefined &&
        searchFilter.startDate !== null
      )
        params.append("startDate", searchFilter.startDate);

      if (searchFilter.endDate !== undefined && searchFilter.endDate !== null)
        params.append("endDate", searchFilter.endDate);

      if (
        searchFilter.pageNumber !== null &&
        searchFilter.pageNumber !== undefined &&
        searchFilter.pageNumber !== 1
      )
        params.append("page", searchFilter.pageNumber.toString());

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: OpportunitySearchFilterAdmin) => {
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
      searchFilter.pageNumber = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);
        query = searchValueEncoded;
      }

      searchFilter.valueContains = query;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  // filter popup handlers
  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, [setFilterFullWindowVisible]);

  const onSubmitFilter = useCallback(
    (val: OpportunitySearchFilterAdmin) => {
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
      searchFilter.pageSize = PAGE_SIZE_MAXIMUM;
      const data = await getOpportunitiesAdminExportToCSV(searchFilter);
      if (!data) return;

      FileSaver.saveAs(data);

      setExportDialogOpen(false);
    } finally {
      setIsExportButtonLoading(false);
    }
  }, [searchFilter, setIsExportButtonLoading, setExportDialogOpen]);

  const onClick_CopyToClipboard = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!", { autoClose: 2000 });
  }, []);

  return (
    <>
      <Head>
        <title>Yoma | Admin Opportunities</title>
      </Head>

      <PageBackground className="h-[14.5rem] md:h-[18rem]" />

      {isLoading && <Loading />}

      {/* POPUP FILTER */}
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setFilterFullWindowVisible(false);
        }}
        className={`md:max-h-[600px] md:w-[800px]`}
      >
        {lookups_categories &&
          lookups_countries &&
          lookups_languages &&
          lookups_organisations && (
            <div className="flex h-full flex-col gap-2 overflow-y-auto">
              <OpportunityAdminFilterVertical
                htmlRef={myRef.current!}
                searchFilter={searchFilter}
                lookups_categories={lookups_categories}
                lookups_countries={lookups_countries}
                lookups_languages={lookups_languages}
                lookups_types={lookups_types}
                lookups_organisations={lookups_organisations}
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
                  OpportunityFilterOptions.ORGANIZATIONS,
                ]}
              />
            </div>
          )}
      </CustomModal>

      {/* EXPORT DIALOG */}
      <CustomModal
        isOpen={exportDialogOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setExportDialogOpen(false);
        }}
        className={`md:max-h-[480px] md:w-[600px]`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-row bg-blue p-4 shadow-lg">
            <h1 className="flex-grow"></h1>
            <button
              type="button"
              className="btn rounded-full border-0 bg-white p-3 text-gray-dark hover:bg-gray"
              onClick={() => {
                setExportDialogOpen(false);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
              <FaExclamationTriangle className="h-7 w-7 text-yellow" />
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
      </CustomModal>

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      <div className="container z-10 mt-14 w-full overflow-hidden px-2 py-1 md:mt-20 md:max-w-7xl md:py-4">
        {/* TITLE & SEARCH INPUT */}
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <h2 className="mb-4 flex flex-grow items-center font-semibold text-white">
            Opportunities
          </h2>

          <div className="my-4 flex h-fit justify-center gap-2 md:justify-end">
            <SearchInputLarge
              openFilter={setFilterFullWindowVisible}
              maxWidth={400}
              defaultValue={query ? decodeURIComponent(query.toString()) : null}
              onSearch={onSearchInputSubmit}
            />
          </div>
        </div>

        {/* FILTER ROW: CATEGORIES DROPDOWN FILTERS (SELECT) FOR COUNTRIES, LANGUAGES, TYPE, ORGANISATIONS ETC  */}
        {lookups_categories &&
          lookups_countries &&
          lookups_languages &&
          lookups_organisations && (
            <OpportunityAdminFilterHorizontal
              htmlRef={myRef.current!}
              searchFilter={searchFilter}
              lookups_categories={lookups_categories}
              lookups_countries={lookups_countries}
              lookups_languages={lookups_languages}
              lookups_types={lookups_types}
              lookups_organisations={lookups_organisations}
              lookups_publishedStates={lookups_publishedStates}
              lookups_statuses={lookups_statuses}
              clearButtonText="Clear"
              onClear={onClearFilter}
              onSubmit={onSubmitFilter}
              onOpenFilterFullWindow={() => {
                setFilterFullWindowVisible(!filterFullWindowVisible);
              }}
              filterOptions={[
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

        {/* SEARCH RESULTS */}
        {!isLoading && (
          <div id="results">
            <div className="rounded-lg bg-transparent md:bg-white md:p-4">
              {/* NO ROWS */}
              {(!searchResults || searchResults.items?.length === 0) &&
                !isSearchPerformed && (
                  <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                    <NoRowsMessage
                      title={"You will find your opportunities here"}
                      description={
                        "This is where you will find all the awesome opportunities that have been created."
                      }
                    />
                  </div>
                )}
              {(!searchResults || searchResults.items?.length === 0) &&
                isSearchPerformed && (
                  <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                    <NoRowsMessage
                      title={"No opportunities found"}
                      description={"Please try refining your search query."}
                    />
                  </div>
                )}

              {/* RESULTS */}
              {searchResults && searchResults.items?.length > 0 && (
                <div className="overflow-x-auto">
                  {/* MOBIlE */}
                  <div className="flex flex-col gap-4 md:hidden">
                    {searchResults.items.map((opportunity) => (
                      <Link
                        key={`sm_${opportunity.id}`}
                        href={`/organisations/${
                          opportunity.organizationId
                        }/opportunities/${
                          opportunity.id
                        }/info?returnUrl=${encodeURIComponent(router.asPath)}`}
                        className="flex flex-col justify-between gap-4 rounded-lg bg-white p-4 shadow-custom"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="line-clamp-2 font-semibold text-gray-dark">
                            {opportunity.title}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 text-gray-dark">
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">URL</p>
                            {opportunity.url && (
                              <button
                                onClick={() =>
                                  onClick_CopyToClipboard(opportunity.url!)
                                }
                                className="badge bg-green-light text-green"
                              >
                                <IoIosLink className="h-4 w-4" />
                              </button>
                            )}
                            {opportunity.yomaReward && (
                              <span className="badge bg-orange-light text-orange">
                                <span className="ml-1 text-xs">
                                  {opportunity.yomaReward} Yoma
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">ZLTO</p>
                            {opportunity.zltoReward && (
                              <span className="badge bg-orange-light text-orange">
                                <Image
                                  src={iconZlto}
                                  alt="Zlto icon"
                                  width={16}
                                  className="h-auto"
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
                          </div>

                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">
                              Participants
                            </p>
                            <span className="badge bg-green-light text-green">
                              <IoMdPerson className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {opportunity.participantCountTotal}
                              </span>
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Status</p>
                            <div className="flex justify-start gap-2">
                              <OpportunityStatus
                                status={opportunity?.status?.toString()}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Visible</p>
                            <div className="flex justify-start gap-2">
                              {opportunity?.hidden && (
                                <span className="badge bg-blue-light text-gray-dark">
                                  <IoMdEyeOff className="mr-1 text-sm" />
                                  Hidden
                                </span>
                              )}
                              {!opportunity?.hidden && (
                                <span className="badge bg-blue-light text-black">
                                  <IoMdEye className="mr-1 text-sm" />
                                  Visible
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* DESKTOP */}
                  <table className="hidden border-separate rounded-lg border-x-2 border-t-2 border-gray-light md:table md:table-auto">
                    <thead>
                      <tr className="!border-gray-light text-gray-dark">
                        <th className="border-b-2 border-gray-light !py-4">
                          Title
                        </th>
                        <th className="border-b-2 border-gray-light text-center">
                          Url
                        </th>
                        <th className="border-b-2 border-gray-light text-center">
                          ZLTO
                        </th>
                        <th className="border-b-2 border-gray-light text-center">
                          Participants
                        </th>
                        <th className="border-b-2 border-gray-light text-start">
                          Status
                        </th>
                        <th className="border-b-2 border-gray-light text-center">
                          Visible
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.items.map((opportunity) => (
                        <tr key={`md_${opportunity.id}`}>
                          <td className="truncate border-b-2 border-gray-light md:max-w-[220px] lg:max-w-[525px]">
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
                          <td className="border-b-2 border-gray-light text-center">
                            {opportunity?.url && (
                              <button
                                onClick={() =>
                                  onClick_CopyToClipboard(opportunity.url!)
                                }
                                className="badge bg-green-light text-green"
                              >
                                <IoIosLink className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                          <td className="w-28 border-b-2 border-gray-light text-center">
                            <div className="flex flex-col">
                              {opportunity.zltoReward && (
                                <span className="badge bg-orange-light px-4 text-orange">
                                  <Image
                                    src={iconZlto}
                                    alt="Zlto icon"
                                    width={16}
                                    className="h-auto"
                                  />
                                  <span className="ml-1 text-xs">
                                    {opportunity?.zltoReward}
                                  </span>
                                </span>
                              )}
                              {opportunity.yomaReward && (
                                <span className="badge bg-orange-light px-4 text-orange">
                                  <span className="ml-1 text-xs">
                                    {opportunity.yomaReward} Yoma
                                  </span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border-b-2 border-gray-light text-center">
                            <span className="badge bg-green-light text-green">
                              <span className="text-xs">
                                {opportunity.participantCountTotal}
                              </span>
                            </span>
                          </td>
                          <td className="flex gap-2 border-b-2 border-gray-light text-center">
                            <OpportunityStatus
                              status={opportunity?.status?.toString()}
                            />
                          </td>
                          <td className="border-b-2 border-gray-light text-center">
                            {opportunity?.hidden && (
                              <span
                                className="tooltip tooltip-left tooltip-secondary"
                                data-tip="Hidden"
                              >
                                <IoMdEyeOff className="size-5 text-gray-dark" />
                              </span>
                            )}
                            {!opportunity?.hidden && (
                              <span
                                className="tooltip tooltip-left tooltip-secondary"
                                data-tip="Visible"
                              >
                                <IoMdEye className="size-5 text-black" />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* PAGINATION */}
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
                </div>
              )}
            </div>
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
