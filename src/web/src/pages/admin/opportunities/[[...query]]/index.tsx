import { useQuery } from "@tanstack/react-query";
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
import { FaDownload, FaEdit, FaLink } from "react-icons/fa";
import { IoIosSettings, IoMdPerson } from "react-icons/io";
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
import { downloadVerificationFilesAdmin } from "~/api/services/myOpportunities";
import {
  getCategoriesAdmin,
  getCountriesAdmin,
  getLanguagesAdmin,
  getOpportunitiesAdmin,
  getOpportunityTypes,
  getOrganisationsAdmin,
} from "~/api/services/opportunities";
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import OpportunityExport from "~/components/Opportunity/Admin/OpportunityExport";
import { OpportunityAdminFilterHorizontal } from "~/components/Opportunity/OpportunityAdminFilterHorizontal";
import { OpportunityAdminFilterVertical } from "~/components/Opportunity/OpportunityAdminFilterVertical";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { SearchInputLarge } from "~/components/SearchInputLarge";
import { Loading } from "~/components/Status/Loading";
import { PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
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
  const myRef = useRef<HTMLDivElement>(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const smallDisplay = useAtomValue(screenWidthAtom);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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
  const { data: searchResults, isLoading: isLoadingSearchResults } =
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

  const onClick_CopyToClipboard = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!", { autoClose: 2000 });
  }, []);

  const downloadVerificationFiles = async (
    e: React.MouseEvent<HTMLButtonElement>,
    opportunityId: string,
  ) => {
    e.preventDefault();

    try {
      await downloadVerificationFilesAdmin({
        opportunity: opportunityId,
        verificationTypes: null,
      });
    } catch (error) {
      console.error(error);
      toast.error("Download failed. Please try again later.", {
        autoClose: false,
      });
    }

    toast.success(
      "Your request is scheduled for processing. You will receive an email when the download is ready.",
    );
  };

  const renderOpportunityActionsDropdown = (
    opportunity: OpportunitySearchResultsInfo["items"][number],
  ) => (
    <div className="dropdown dropdown-left">
      <button type="button" title="Actions" className="cursor-pointer">
        <IoIosSettings className="text-green hover:text-blue size-5 hover:scale-125 hover:animate-pulse" />
      </button>
      <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-64 gap-2 p-2 shadow">
        <li>
          <button
            type="button"
            className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
            title="Edit"
            onClick={() => {
              router.push(
                `/organisations/${opportunity.organizationId}/opportunities/${opportunity.id}?returnUrl=${encodeURIComponent(router.asPath)}`,
              );
            }}
          >
            <FaEdit className="text-green size-4" />
            Edit
          </button>
        </li>
        <li>
          <button
            type="button"
            className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
            title="Download completion files"
            onClick={(e) => downloadVerificationFiles(e, opportunity.id)}
          >
            <FaDownload className="text-green size-4" />
            Download completion files
          </button>
        </li>
        {opportunity?.url && (
          <li>
            <button
              type="button"
              className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
              title="Copy URL to clipboard"
              onClick={() => onClick_CopyToClipboard(opportunity.url!)}
            >
              <FaLink className="text-green size-4" />
              Copy Link
            </button>
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <>
      <Head>
        <title>Yoma | 🏆 Opportunities</title>
      </Head>

      <PageBackground className="h-[14.8rem] md:h-[18.4rem]" />

      {isLoadingSearchResults && <Loading />}

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
        className={`md:max-h-[740px] md:w-[600px]`}
      >
        <OpportunityExport
          totalCount={searchResults?.totalCount ?? 0}
          searchFilter={searchFilter} // Pass the current search filter
          onClose={() => setExportDialogOpen(false)}
          onSave={() => setExportDialogOpen(false)}
        />
      </CustomModal>

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-3xl font-semibold tracking-normal text-white md:mt-0 md:mb-9">
            🏆 Opportunities
          </h3>

          <div className="-mt-5 flex w-full grow items-center justify-between gap-4 sm:justify-end">
            <SearchInputLarge
              openFilter={setFilterFullWindowVisible}
              maxWidth={400}
              defaultValue={query ? decodeURIComponent(query.toString()) : null}
              onSearch={onSearchInputSubmit}
            />
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
        </div>

        {/* SEARCH RESULTS */}
        {!isLoadingSearchResults && (
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
                  {/* MOBILE */}
                  <div className="flex flex-col gap-4 md:hidden">
                    {searchResults.items.map((opportunity) => (
                      <div
                        key={`sm_${opportunity.id}`}
                        className="shadow-custom flex flex-col justify-between gap-4 rounded-lg bg-white p-4"
                      >
                        <div className="border-gray-light flex flex-row gap-2 border-b-2">
                          <span title={opportunity.title} className="w-full">
                            <Link
                              href={`/organisations/${opportunity.organizationId}/opportunities/${opportunity.id}/info?returnUrl=${encodeURIComponent(router.asPath)}`}
                              className="line-clamp-1 text-start font-semibold"
                            >
                              {opportunity.title}
                            </Link>
                          </span>
                          {renderOpportunityActionsDropdown(opportunity)}
                        </div>

                        <div className="text-gray-dark flex flex-col gap-2">
                          {/* ZLTO Reward */}
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">ZLTO</p>
                            <div className="flex flex-col gap-2">
                              {opportunity.zltoReward == null && (
                                <span
                                  className={`badge bg-orange-light text-orange px-4`}
                                >
                                  <span className="ml-1 text-xs">Disabled</span>
                                </span>
                              )}
                              {opportunity.zltoReward != null && (
                                <span
                                  className={`badge bg-gray-light text-gray-dark min-w-20 px-4`}
                                >
                                  <Image
                                    src={iconZlto}
                                    alt="Zlto icon"
                                    width={16}
                                    className="h-auto"
                                  />
                                  <span className="ml-1 text-xs">
                                    {opportunity.zltoReward}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ZLTO Reward Cumulative */}
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">
                              ZLTO Cumulative
                            </p>
                            <div className="flex flex-col gap-2">
                              <span
                                className={`badge bg-gray-light text-gray-dark min-w-20 px-4`}
                              >
                                <Image
                                  src={iconZlto}
                                  alt="Zlto icon"
                                  width={16}
                                  className="h-auto"
                                />
                                <span className="ml-1 text-xs">
                                  {opportunity.zltoRewardCumulative ?? 0}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Participants */}
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">
                              Participants
                            </p>
                            <span
                              className={`badge min-w-20 ${opportunity.participantCountTotal > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                            >
                              <IoMdPerson className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {opportunity.participantCountTotal}
                              </span>
                            </span>
                          </div>

                          {/* Status */}
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Status</p>
                            <div className="flex justify-start gap-2">
                              <OpportunityStatus
                                status={opportunity?.status?.toString()}
                              />
                            </div>
                          </div>

                          {/* Visible */}
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Visible</p>
                            <div className="flex justify-start gap-2">
                              {opportunity?.hidden ? (
                                <span className="badge bg-yellow-tint text-yellow w-20">
                                  Hidden
                                </span>
                              ) : (
                                <span className="badge bg-green-light text-green w-20">
                                  Visible
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP */}
                  <table className="border-gray-light hidden border-separate rounded-lg border-x-2 border-t-2 md:table md:table-auto">
                    <thead>
                      <tr className="!border-gray-light text-gray-dark">
                        <th className="border-gray-light border-b-2 !py-4">
                          Title
                        </th>
                        <th className="border-gray-light border-b-2">ZLTO</th>
                        <th className="border-gray-light border-b-2">
                          ZLTO Cumulative
                        </th>
                        <th className="border-gray-light border-b-2">
                          Participants
                        </th>
                        <th className="border-gray-light border-b-2">Status</th>
                        <th className="border-gray-light border-b-2">
                          Visible
                        </th>
                        <th className="border-gray-light border-b-2">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.items.map((opportunity) => (
                        <tr key={`md_${opportunity.id}`}>
                          <td className="border-gray-light border-b-2">
                            <span
                              className="tooltip tooltip-top tooltip-secondary"
                              data-tip={opportunity.title}
                            >
                              <Link
                                href={`/organisations/${opportunity.organizationId}/opportunities/${opportunity.id}/info?returnUrl=${encodeURIComponent(router.asPath)}`}
                                className="line-clamp-1 text-start"
                              >
                                {opportunity.title}
                              </Link>
                            </span>
                          </td>
                          <td className="border-gray-light w-28 border-b-2 text-center">
                            {opportunity.zltoReward == null && (
                              <span
                                className={`badge bg-orange-light text-orange px-4`}
                              >
                                <span className="ml-1 text-xs">Disabled</span>
                              </span>
                            )}
                            {opportunity.zltoReward != null && (
                              <span
                                className={`badge bg-gray-light text-gray-dark px-4`}
                              >
                                <Image
                                  src={iconZlto}
                                  alt="Zlto icon"
                                  width={16}
                                  className="h-auto"
                                />
                                <span className="ml-1 text-xs">
                                  {opportunity.zltoReward}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="border-gray-light w-28 border-b-2 text-center">
                            <span
                              className={`badge bg-gray-light text-gray-dark px-4`}
                            >
                              <Image
                                src={iconZlto}
                                alt="Zlto icon"
                                width={16}
                                className="h-auto"
                              />
                              <span className="ml-1 text-xs">
                                {opportunity.zltoRewardCumulative ?? 0}
                              </span>
                            </span>
                          </td>
                          <td className="border-gray-light border-b-2 text-center">
                            <span
                              className={`badge ${opportunity.participantCountTotal > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                            >
                              {opportunity.participantCountTotal}
                            </span>
                          </td>
                          <td className="border-gray-light flex gap-2 border-b-2 text-center">
                            <OpportunityStatus
                              status={opportunity?.status?.toString()}
                            />
                          </td>
                          <td className="border-gray-light border-b-2 text-center">
                            {opportunity?.hidden ? (
                              <span className="badge bg-yellow-tint text-yellow w-20">
                                Hidden
                              </span>
                            ) : (
                              <span className="badge bg-green-light text-green w-20">
                                Visible
                              </span>
                            )}
                          </td>
                          <td className="border-gray-light border-b-2 whitespace-nowrap">
                            <div className="flex flex-row items-center justify-center gap-2">
                              {/* ACTIONS */}
                              {renderOpportunityActionsDropdown(opportunity)}
                            </div>
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
