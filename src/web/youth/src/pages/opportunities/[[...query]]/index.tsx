import { useAtomValue } from "jotai";
import type { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React, {
  type ReactElement,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { IoMdOptions } from "react-icons/io";
import ReactModal from "react-modal";
import type { Country, Language } from "~/api/models/lookups";
import type {
  OpportunityCategory,
  OpportunitySearchCriteriaCommitmentInterval,
  OpportunitySearchCriteriaZltoReward,
  OpportunitySearchFilter,
  OpportunitySearchResultsInfo,
  OpportunityType,
} from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";
import {
  getCommitmentIntervals,
  getOpportunityCategories,
  getOpportunityCountries,
  getOpportunityLanguages,
  getOpportunityOrganizations,
  getOpportunityTypes,
  getZltoRewardRanges,
  searchOpportunities,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { OpportunityCategoryHorizontalCard } from "~/components/Opportunity/OpportunityCategoryHorizontalCard";
import { OpportunityRow } from "~/components/Opportunity/OpportunityRow";
import { PageBackground } from "~/components/PageBackground";
import { SearchInputLarge } from "~/components/SearchInputLarge";
import { smallDisplayAtom } from "~/lib/store";
import { type NextPageWithLayout } from "~/pages/_app";
import { OpportunityFilter } from "~/components/Opportunity/OpportunityFilter";

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps: GetStaticProps = async () => {
  const opportunities_popular = await searchOpportunities({
    pageNumber: 1,
    pageSize: 4,
    categories: null,
    includeExpired: false,
    countries: null,
    languages: null,
    types: null,
    valueContains: null,
    commitmentIntervals: null,
    mostViewed: true,
    organizations: null,
    zltoRewardRanges: null,
  });
  const opportunities_latestCourses = await searchOpportunities({
    pageNumber: 1,
    pageSize: 4,
    categories: null,
    includeExpired: false,
    countries: null,
    languages: null,
    types: null,
    valueContains: null,
    commitmentIntervals: null,
    mostViewed: null,
    organizations: null,
    zltoRewardRanges: null,
  });
  const opportunities_allCourses = await searchOpportunities({
    pageNumber: 1,
    pageSize: 4,
    categories: null,
    includeExpired: false,
    countries: null,
    languages: null,
    types: null,
    valueContains: null,
    commitmentIntervals: null,
    mostViewed: null,
    organizations: null,
    zltoRewardRanges: null,
  });

  const lookups_categories = await getOpportunityCategories();
  const lookups_countries = await getOpportunityCountries();
  const lookups_languages = await getOpportunityLanguages();
  const lookups_organisations = await getOpportunityOrganizations();
  const lookups_types = await getOpportunityTypes();
  const lookups_commitmentIntervals = await getCommitmentIntervals();
  const lookups_zltoRewardRanges = await getZltoRewardRanges();

  return {
    props: {
      opportunities_popular,
      opportunities_latestCourses,
      opportunities_allCourses,
      lookups_categories,
      lookups_countries,
      lookups_languages,
      lookups_organisations,
      lookups_types,
      lookups_commitmentIntervals,
      lookups_zltoRewardRanges,
      // Next.js will attempt to re-generate the page:
      // - When a request comes in
      // - At most once every 300 seconds
      revalidate: 300,
    },
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

// ⚠️ SSR
// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   const { query, page } = context.query;
//   const session = await getServerSession(context.req, context.res, authOptions);

//   const queryClient = new QueryClient();
//   if (session) {
//     // 👇 prefetch queries (on server)
//     await queryClient.prefetchQuery(
//       [`OrganisationsActive_${query?.toString()}_${page?.toString()}`],
//       () =>
//         getOrganisations(
//           {
//             pageNumber: page ? parseInt(page.toString()) : 1,
//             pageSize: 20,
//             valueContains: query?.toString() ?? null,
//             statuses: [Status.Active],
//           },
//           context,
//         ),
//     );
//     await queryClient.prefetchQuery(
//       [`OrganisationsInactive_${query?.toString()}_${page?.toString()}`],
//       () =>
//         getOrganisations(
//           {
//             pageNumber: page ? parseInt(page.toString()) : 1,
//             pageSize: 20,
//             valueContains: query?.toString() ?? null,
//             statuses: [Status.Inactive],
//           },
//           context,
//         ),
//     );
//   }

//   return {
//     props: {
//       dehydratedState: dehydrate(queryClient),
//       user: session?.user ?? null, // (required for 'withAuth' HOC component)
//     },
//   };
// }

interface InputProps {
  opportunities_popular: OpportunitySearchResultsInfo;
  opportunities_latestCourses: OpportunitySearchResultsInfo;
  opportunities_allCourses: OpportunitySearchResultsInfo;
  lookups_categories: OpportunityCategory[];
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_organisations: OrganizationInfo[];
  lookups_types: OpportunityType[];
  lookups_commitmentIntervals: OpportunitySearchCriteriaCommitmentInterval[];
  lookups_zltoRewardRanges: OpportunitySearchCriteriaZltoReward[];
}

const Opportunities: NextPageWithLayout<InputProps> = ({
  opportunities_popular,
  opportunities_latestCourses,
  opportunities_allCourses,
  lookups_categories,
  lookups_countries,
  lookups_languages,
  lookups_organisations,
  lookups_types,
  lookups_commitmentIntervals,
  lookups_zltoRewardRanges,
}) => {
  const router = useRouter();

  // // get query parameter from route
  // const { query, page } = router.query;

  // // 👇 use prefetched queries (from server)
  // const { data: organisationsActive } = useQuery<OrganizationSearchResults>({
  //   queryKey: [`OrganisationsActive_${query?.toString()}_${page?.toString()}`],
  //   queryFn: () =>
  //     getOrganisations({
  //       pageNumber: page ? parseInt(page.toString()) : 1,
  //       pageSize: 20,
  //       valueContains: query?.toString() ?? "",
  //       statuses: [Status.Active],
  //     }),
  // });
  // const { data: organisationsInactive } = useQuery<OrganizationSearchResults>({
  //   queryKey: [
  //     `OrganisationsInactive_${query?.toString()}_${page?.toString()}`,
  //   ],
  //   queryFn: () =>
  //     getOrganisations({
  //       pageNumber: page ? parseInt(page.toString()) : 1,
  //       pageSize: 20,
  //       valueContains: query?.toString() ?? "",
  //       statuses: [Status.Inactive],
  //     }),
  // });

  const onSearch = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);

        // redirect to the search page
        void router.push(`/organisations?query=${searchValueEncoded}`);
      } else {
        // redirect to the search page
        void router.push("/organisations");
      }
    },
    [router],
  );

  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const smallDisplay = useAtomValue(smallDisplayAtom);

  // disable full-size search filters when resizing to larger screens
  useEffect(() => {
    if (!smallDisplay) setFilterFullWindowVisible(false);
  }, [smallDisplay]);

  // const renderCategory = (category: OpportunityCategory) => {
  //   return (
  //     <div key={`filter_${category.id}_${category.name}`}>
  //       <p className="pb-0 pt-4 text-xs font-bold text-slate-600">
  //         {category.name}
  //       </p>
  //       <div className="grid grid-cols-4 gap-0 sm:grid-cols-4">
  //         <button className="m-0 p-1">{category.name}</button>
  //       </div>
  //     </div>
  //   );
  // };

  // const opportunitySearchFilter = useMemo<OpportunitySearchFilter>(() => {
  //   return {
  //     pageNumber: 1,
  //     pageSize: 20,
  //     categories: null,
  //     includeExpired: false,
  //     countries: null,
  //     languages: null,
  //     types: null,
  //     valueContains: null,
  //     commitmentIntervals: null,
  //     mostViewed: null,
  //     organizations: null,
  //     zltoRewardRanges: null,
  //   };
  // }, []);

  const [opportunitySearchFilter, setOpportunitySearchFilter] =
    useState<OpportunitySearchFilter>({
      pageNumber: 1,
      pageSize: 20,
      categories: null,
      includeExpired: false,
      countries: null,
      languages: null,
      types: null,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      organizations: null,
      zltoRewardRanges: null,
    });

  // FULLSCREEN FILTER HANDLERS
  const onCloseFullscreenFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, [setFilterFullWindowVisible]);

  const onSubmitFullscreenFilter = useCallback(
    (val: OpportunitySearchFilter) => {
      console.log(`SUBMITTED: ${JSON.stringify(val)}`);
      setFilterFullWindowVisible(false);
      setOpportunitySearchFilter(val);
    },
    [setFilterFullWindowVisible, setOpportunitySearchFilter],
  );

  const myRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Head>
        <title>Yoma | Opportunities</title>
      </Head>

      <PageBackground />

      <div ref={myRef} />

      {/* MODAL USER MENU */}
      <ReactModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setFilterFullWindowVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-scroll rounded-lg bg-white animate-in fade-in md:left-auto md:right-2 md:top-[66px] md:w-64`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0"
      >
        <OpportunityFilter
          htmlRef={myRef.current!}
          opportunitySearchFilter={opportunitySearchFilter}
          lookups_categories={lookups_categories}
          lookups_countries={lookups_countries}
          lookups_languages={lookups_languages}
          lookups_types={lookups_types}
          lookups_organisations={lookups_organisations}
          lookups_commitmentIntervals={lookups_commitmentIntervals}
          lookups_zltoRewardRanges={lookups_zltoRewardRanges}
          cancelButtonText="Close"
          submitButtonText="Done"
          onCancel={onCloseFullscreenFilter}
          onSubmit={onSubmitFullscreenFilter}
        />
      </ReactModal>

      <div className="container z-10 max-w-5xl px-2 py-1 md:py-4">
        <div className="flex flex-col gap-2 pb-2 pt-8 text-white">
          <h3 className="flex flex-grow flex-wrap items-center justify-center">
            Find <span className="mx-2 text-orange">opportunities</span> to
            <span className="mx-2 text-orange">unlock</span> your future.
          </h3>
          <h5 className="text-center">
            A learning opportunity is a self-paced online course that you can
            finish at your convenience.
          </h5>
          <div className="my-4 md:items-center md:justify-center">
            <div className="flex flex-row items-center justify-center gap-2">
              <SearchInputLarge
                onSearch={onSearch}
                placeholder="What are you looking for today?"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setFilterFullWindowVisible(!filterFullWindowVisible);
                }}
              >
                <IoMdOptions className="h-6 w-6 md:hidden" />
              </button>
            </div>
          </div>
        </div>

        {/* CATEGORIES */}
        {lookups_categories && lookups_categories.length > 0 && (
          <div className="hidden flex-col items-center justify-center gap-2 pb-8 md:flex">
            <div className="flex flex-wrap gap-2">
              {lookups_categories.map((item) => (
                <OpportunityCategoryHorizontalCard key={item.id} data={item} />
              ))}
            </div>
          </div>
        )}

        {/* POPULAR */}
        {(opportunities_popular?.totalCount ?? 0) > 0 && (
          <>
            <OpportunityRow
              id="opportunities_popular"
              title="Popular 🔥"
              data={opportunities_popular}
            />

            <div className="divider-gray divider-thick divider w-full pt-8" />
          </>
        )}

        {/* LATEST COURCES */}
        {(opportunities_latestCourses?.totalCount ?? 0) > 0 && (
          <>
            <OpportunityRow
              id="opportunities_latestCourses"
              title="Latest courses 📚"
              data={opportunities_latestCourses}
            />

            <div className="divider-gray divider-thick divider w-full pt-8" />
          </>
        )}

        {/* ALL COURSES */}
        {(opportunities_allCourses?.totalCount ?? 0) > 0 && (
          <>
            <OpportunityRow
              id="opportunities_allCourses"
              title="All courses"
              data={opportunities_allCourses}
            />

            <div className="divider-gray divider-thick divider w-full pt-8" />
          </>
        )}

        {/* RECENTLY VIEWED */}

        {/* <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <h3 className="flex flex-grow text-white">Opportunities</h3>

          <div className="flex gap-2 sm:justify-end">
            <SearchInput defaultValue={query as string} onSearch={onSearch} />

            <Link
              href="/organisations/register"
              className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white"
            >
              <IoMdAdd className="h-5 w-5" />
              Add organisation
            </Link>
          </div>
        </div> */}

        <div className="items-centerx flex flex-col rounded-lg bg-white p-4">
          <div className="flex w-full flex-col gap-2  lg:w-[1000px]">
            <h4>Organisations for approval</h4>

            {/* NO ROWS */}
            {/* {!organisationsInactive ||
              (organisationsInactive.items.length === 0 && !query && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={
                    "Organisations awaiting approval will be displayed here."
                  }
                />
              ))} */}

            {/* {!organisationsInactive ||
              (organisationsInactive.items.length === 0 && query && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={"Please try refining your search query."}
                />
              ))} */}

            {/* GRID */}
            {/* {organisationsInactive &&
              organisationsInactive.items.length > 0 && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                    {organisationsInactive.items.map((item) => (
                      <OrganisationCardComponent key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )} */}

            <h4>Approved Organisations</h4>

            {/* NO ROWS */}
            {/* {!organisationsActive ||
              (organisationsActive.items.length === 0 && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={
                    "Opportunities that you add will be displayed here."
                  }
                />
              ))} */}

            {/* {organisationsActive && organisationsActive.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                  {organisationsActive.items.map((item) => (
                    <OrganisationCardComponent key={item.id} item={item} />
                  ))}
                </div>
              </>
            )} */}
          </div>
        </div>
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Opportunities;
