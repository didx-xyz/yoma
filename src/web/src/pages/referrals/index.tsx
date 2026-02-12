import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { FaShareAlt } from "react-icons/fa";
import { IoAdd, IoWarningOutline } from "react-icons/io5";
import Select from "react-select";
import {
  type ProgramInfo,
  type ProgramSearchResultsInfo,
  type ReferralLink,
} from "~/api/models/referrals";
import { ReferralParticipationRole, type UserProfile } from "~/api/models/user";
import {
  searchReferralLinks,
  searchReferralProgramsInfo,
} from "~/api/services/referrals";
import { getUserProfile } from "~/api/services/user";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ReferralBlockedView } from "~/components/Referrals/ReferralBlockedView";
import { ReferrerCreateLinkModal } from "~/components/Referrals/ReferrerCreateLinkModal";
import { authOptions } from "~/server/auth";
import { ReferrerLinksList2 } from "~/components/Referrals/ReferrerLinksList2";
import { ReferrerStats } from "~/components/Referrals/ReferrerStats";
import { RefereeUsagesList } from "~/components/Referrals/RefereeUsagesList";
import { screenWidthAtom, userProfileAtom } from "~/lib/store";
import type { NextPageWithLayout } from "../_app";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  let userProfileServer: UserProfile | null = null;
  if (session) {
    try {
      userProfileServer = await getUserProfile(context);
    } catch (e) {
      console.error("Failed to fetch user profile", e);
    }
  }

  return {
    props: {
      userProfileServer,
    },
  };
}
import { RefereeProgressCard2 } from "~/components/Referrals/RefereeProgressCard2";
import {
  Carousel,
  type OnSlideProps,
  Slide,
  Slider,
} from "react-scroll-snap-anime-slider";
import { ProgramRow } from "~/components/Referrals/ProgramRow";
import { NavigationButtons } from "~/components/Carousel/NavigationButtons";
import { SelectedSnapDisplay } from "~/components/Carousel/SelectedSnapDisplay";
import Image from "next/image";
import Link from "next/link";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import Suspense from "~/components/Common/Suspense";
import { COUNTRY_ID_WW } from "~/lib/constants";
import { IoMdCalendar, IoMdPlay, IoMdWarning } from "react-icons/io";
import { getCountries } from "~/api/services/lookups";
import { Country } from "~/api/models/lookups";
import { LoadingInline } from "~/components/Status/LoadingInline";

const AnonymousView = () => (
  <div className="bg-base-100 rounded-lg border p-8 text-center shadow-sm">
    <h2 className="mb-4 text-2xl font-bold">Join our Referral Program</h2>
    <p className="mb-6 text-lg">
      Sign in to start earning rewards by referring friends or claiming offers.
    </p>
    <div className="alert alert-info inline-flex w-auto">
      <span>Preview of available programs will appear here.</span>
    </div>
  </div>
);

// BlockedStateView removed - using ReferralBlockedView component

const WelcomeSection = ({
  hasLinks,
  hasPrograms,
}: {
  hasLinks: boolean;
  hasPrograms: boolean;
}) => (
  <div className="flex items-center justify-center">
    <NoRowsMessage
      title={hasLinks ? "Refer a friend" : "Welcome to the Ambassador Program"}
      description={
        hasLinks
          ? '<div class="space-y-2">' +
            "<p>Your links are ready to share. Send your referral link to friends who haven&#39;t completed onboarding yet.</p>" +
            "<p>When they complete the program requirements, you both earn rewards — and you can track progress on this page.</p>" +
            "</div>"
          : hasPrograms
            ? '<div class="space-y-2">' +
              "<p>Create your first referral link in seconds. Choose a program below to generate a referral link.</p>" +
              "<p>Each program has different requirements and rewards — share only with new users who haven&#39;t completed onboarding.</p>" +
              "</div>"
            : '<div class="space-y-2">' +
              "<p>No referral programs are available right now. Please check back later.</p>" +
              "</div>"
      }
      icon={"❤️"}
      className="max-w-3xl !bg-transparent"
    />
  </div>
);

const LinksSection = ({
  linksCount,
  programs,
  //   onCreateLink,
}: {
  linksCount: number;
  programs: ProgramInfo[];
  //   onCreateLink: () => void;
}) => (
  <div className="flex flex-col gap-8">
    <ReferrerStats linksCount={linksCount} />

    {/* ROW - Links */}
    <div className="space-y-2">
      <div className="font-family-nunito font-semibold text-black">
        Link List
      </div>

      <ReferrerLinksList2 programs={programs} initialPageSize={3} />

      {/* {!!programs.length && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onCreateLink}
            className="btn btn-outline border-orange btn-sm group hover:bg-orange text-black normal-case hover:text-white"
          >
            <FaShareAlt className="text-orange h-3 w-3 group-hover:text-white" />
            Create Another Link
          </button>
        </div>
      )} */}
    </div>
  </div>
);

interface ProgramCardProps {
  data: ProgramInfo;
  onClick: () => void;
  action?: React.ReactNode;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ data, onClick }) => {
  const renderContent = () => {
    return (
      <div className="flex h-full flex-col">
        {/* Row 1: Title + ZLTO */}
        <div className="flex w-full flex-row items-start justify-between">
          <div className="line-clamp-2 pr-2 text-sm leading-tight text-black">
            {data.name}
          </div>
          {(data.zltoRewardReferrer ?? 0) > 0 && (
            <div className="badge badge-sm bg-orange-light text-orange flex-shrink-0 whitespace-nowrap">
              🚀 {data.zltoRewardReferrer} ZLTO
            </div>
          )}
        </div>

        {/* Row 2: Description */}
        <div className="mt-2 mb-4">
          <p className="text-[rgba(84, 88, 89, 1)] line-clamp-3 text-xs font-light text-ellipsis">
            {data.description}
          </p>
        </div>

        {/* Row 3: Image (wide aspect) */}
        <div className="bg-base-200 relative h-32 w-full overflow-hidden rounded-sm">
          {data.imageURL ? (
            <Image
              src={data.imageURL}
              alt={data.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-orange h-full w-full opacity-70"></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="flex h-[15rem] w-64 cursor-grab flex-col overflow-hidden rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
    >
      {renderContent()}
    </div>
  );
};

const ProgramsSection = ({
  onProgramClick,
  programs: initialPrograms,
  totalCount,
  countries,
  selectedCountryIds,
  onCountryChange,
  isLoading,
  userCountry,
}: {
  onProgramClick: (program: ProgramInfo) => void;
  programs: ProgramInfo[];
  totalCount: number;
  countries: Country[] | undefined;
  selectedCountryIds: string[];
  onCountryChange: (ids: string[]) => void;
  isLoading: boolean;
  userCountry?: Country | null;
}) => {
  const [programs, setPrograms] = useState(initialPrograms);
  const screenWidth = useAtomValue(screenWidthAtom);

  const subTitle = useMemo(() => {
    if (selectedCountryIds.length > 0 && countries) {
      if (
        userCountry &&
        selectedCountryIds.includes(userCountry.id) &&
        selectedCountryIds.includes(COUNTRY_ID_WW) &&
        selectedCountryIds.length === 2
      ) {
        return `We currently showing programs for your country (${userCountry.name} & worldwide).`;
      }

      return `Showing programs for the chosen countries.`;
    }
    return "Showing programs for all countries.";
  }, [selectedCountryIds, countries, userCountry]);

  const [visibleSlides, setVisibleSlides] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = useMemo(() => programs.length, [programs]);
  // Use the provided totalCount or default to initial data length
  const effectiveTotalAll = totalCount ?? programs.length;

  const slideMargin = useMemo(() => {
    if (screenWidth >= 1440) return "12px";
    if (screenWidth >= 1024) return "8px";
    return "0px";
  }, [screenWidth]);

  const lastSlideRef = useRef(-1);
  const hasMoreToLoadRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const selectedSnap = useMemo(() => {
    return programs.length <= visibleSlides
      ? programs.length - 1
      : currentSlide + visibleSlides - 1;
  }, [programs.length, visibleSlides, currentSlide]);

  useEffect(() => {
    if (screenWidth < 600) {
      setVisibleSlides(1);
    } else if (screenWidth >= 600 && screenWidth < 1024) {
      setVisibleSlides(2);
    } else {
      setVisibleSlides(3);
    }
  }, [screenWidth]);

  useEffect(() => {
    setPrograms(initialPrograms);
    setCurrentSlide(0);
    lastSlideRef.current = -1;
    hasMoreToLoadRef.current = true;
    loadingMoreRef.current = false;
  }, [initialPrograms]);

  const loadPrograms = useCallback(
    async (startRow: number) => {
      const pageSize = 4;
      const pageNumber = Math.ceil(startRow / pageSize);
      const queryCountries =
        selectedCountryIds.length > 0 ? selectedCountryIds : null;

      return await searchReferralProgramsInfo({
        pageNumber,
        pageSize,
        valueContains: null,
        countries: queryCountries,
        includeExpired: false,
      });
    },
    [selectedCountryIds],
  );

  const onSlide = useCallback(
    (props: OnSlideProps) => {
      if (lastSlideRef.current === props.currentSlide) return;
      lastSlideRef.current = props.currentSlide;
      setCurrentSlide(props.currentSlide);

      // only attempt loading more slides
      if (
        props.currentSlide + 1 + visibleSlides > totalSlides &&
        hasMoreToLoadRef.current &&
        !loadingMoreRef.current
      ) {
        loadingMoreRef.current = true;
        loadPrograms(totalSlides + 1).then((data) => {
          if (data.items.length === 0) {
            hasMoreToLoadRef.current = false;
          }
          setPrograms((prevSlides) => [...prevSlides, ...data.items]);
          loadingMoreRef.current = false;
        });
      }
    },
    [visibleSlides, totalSlides, loadPrograms],
  );

  const renderButtons = useCallback(() => {
    const prevDisabled = currentSlide === 0;
    const nextDisabled =
      selectedSnap + 1 >= effectiveTotalAll && !loadingMoreRef.current;

    if (prevDisabled && nextDisabled) {
      return null;
    }

    return (
      <NavigationButtons
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
        colorScheme="orange"
      />
    );
  }, [currentSlide, selectedSnap, effectiveTotalAll]);

  const renderSlide = (program: ProgramInfo, index: number) => (
    <div className="w-[85vw] min-[600px]:w-auto">
      <ProgramCard
        data={program}
        onClick={() => onProgramClick(program)}
        action={
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onProgramClick(program);
            }}
            disabled={program.status !== "Active"}
            className="btn btn-sm bg-orange gap-2 text-white hover:brightness-110 disabled:opacity-50"
          >
            <IoAdd className="h-4 w-4" />
            Create Link
          </button>
        }
      />
    </div>
  );

  return (
    <div className="w-full overflow-hidden">
      <Carousel
        id="referral-programs-carousel"
        totalSlides={effectiveTotalAll}
        visibleSlides={visibleSlides}
        slideMargin={slideMargin}
        onSlide={onSlide}
        currentSlide={currentSlide}
        step={visibleSlides}
      >
        <div className="mb-2 flex flex-col gap-4">
          <div className="flex max-w-full flex-row md:max-w-7xl">
            <div className="flex min-w-0 grow flex-col">
              <div className="font-family-nunito font-semibold text-black">
                Available Programs
              </div>
              <div className="text-gray-dark text-xs md:text-sm">
                {subTitle}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                {/* PAGING (DESKTOP) */}
                {/* <div className="hidden w-full gap-4 md:flex">
                <SelectedSnapDisplay
                  selectedSnap={selectedSnap}
                  snapCount={effectiveTotalAll}
                />
                {renderButtons()}
              </div> */}
              </div>
            </div>
          </div>

          {/* COUNTRY DROPDOWN */}
          {countries && countries.length > 0 && (
            <div className="w-fit">
              <Select
                instanceId="countries"
                isMulti={true}
                options={countries.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                onChange={(val) => {
                  onCountryChange((val ?? []).map((c) => c.value));
                }}
                value={countries
                  .filter((c) => selectedCountryIds?.includes(c.id))
                  .map((c) => ({ value: c.id, label: c.name }))
                  .sort((a, b) => {
                    if (userCountry) {
                      if (a.value === userCountry.id) return -1;
                      if (b.value === userCountry.id) return 1;
                    }
                    if (a.value === COUNTRY_ID_WW) return -1;
                    if (b.value === COUNTRY_ID_WW) return 1;
                    return 0;
                  })}
                placeholder="Choose your country"
                classNames={{
                  control: () => "min-w-[200px] md:min-w-[280px]",
                  valueContainer: () => "flex-nowrap min-w-0 flex-1",
                }}
              />
            </div>
          )}

          <Suspense
            isLoading={isLoading}
            loader={
              <LoadingSkeleton height="h-[120px]" columns={visibleSlides} />
            }
          >
            {programs.length > 0 ? (
              <>
                <Slider>
                  {programs.map((item, index) => {
                    return (
                      <Slide
                        key={`slide_referral-programs_${index}`}
                        className="flex justify-center select-none md:justify-start"
                        id={`referral-programs_${item.id}`}
                      >
                        {renderSlide(item, index)}
                      </Slide>
                    );
                  })}
                </Slider>

                <div className="mt-4 flex w-full flex-col items-center justify-center gap-4 text-center">
                  {renderButtons()}
                  <SelectedSnapDisplay
                    selectedSnap={selectedSnap}
                    snapCount={effectiveTotalAll}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center pb-8">
                <NoRowsMessage
                  title="No programs found"
                  description={
                    selectedCountryIds.length > 0
                      ? "Try changing your country to worldwide to see more results."
                      : null
                  }
                  className="!bg-transparent"
                  classNameIcon={"hidden"}
                />
                {selectedCountryIds.length > 0 && (
                  <button
                    className="btn btn-sm bg-orange mt-4 gap-2 text-white hover:brightness-110 disabled:opacity-50"
                    onClick={() => onCountryChange([])}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </Suspense>

          {/* MOBILE */}
          {/* <div className="flex w-full flex-col items-center justify-center gap-2 text-center md:hidden">
          {renderButtons()}
          <SelectedSnapDisplay
            selectedSnap={selectedSnap}
            snapCount={effectiveTotalAll}
          />
        </div> */}
        </div>
      </Carousel>
    </div>
  );
};

const RefereeSection = () => (
  <div className="space-y-2">
    <div className="flex max-w-full flex-row md:max-w-7xl">
      <div className="flex min-w-0 grow flex-col">
        <div className="font-family-nunito font-semibold text-black">
          My Referrals
        </div>
        <div className="text-gray-dark text-xs md:text-sm">
          You have the following pending referrals:
        </div>
      </div>
    </div>

    <RefereeUsagesList initialPageSize={5} />
  </div>
);

const ReferralsPage: NextPageWithLayout<{
  userProfileServer?: UserProfile | null;
}> = ({ userProfileServer }) => {
  const router = useRouter();
  const { status } = useSession();
  const queryClient = useQueryClient();
  const userProfileClient = useAtomValue(userProfileAtom);
  const userProfile = userProfileServer ?? userProfileClient;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // State
  const [createLinkModalVisible, setCreateLinkModalVisible] = useState(false);
  const [selectedProgramForLink, setSelectedProgramForLink] =
    useState<ProgramInfo | null>(null);
  const [selectedLinkForEdit, setSelectedLinkForEdit] =
    useState<ReferralLink | null>(null);
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([]);
  const countryInitRef = useRef(false);

  // Initialize country selection
  useEffect(() => {
    if (userProfile?.countryId && !countryInitRef.current) {
      setSelectedCountryIds([userProfile.countryId, COUNTRY_ID_WW]);
      countryInitRef.current = true;
    }
  }, [userProfile?.countryId]);

  // Check roles
  const hasReferralRole = (role: ReferralParticipationRole) => {
    if (!userProfile?.referral?.roles) return false;
    return (
      (userProfile.referral.roles as any[]).includes(role) ||
      (userProfile.referral.roles as any[]).includes(
        ReferralParticipationRole[role],
      )
    );
  };

  const isReferrer = hasReferralRole(ReferralParticipationRole.Referrer);
  const isReferee = hasReferralRole(ReferralParticipationRole.Referee);
  const isBlocked = userProfile?.referral?.blocked ?? false;

  // QUERIES
  const { data: lookups_countries } = useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: () => getCountries(),
    //enabled: !error,
  });

  const countriesWithWW = useMemo(() => {
    if (!lookups_countries) return [];
    // Ensure WW is available and is first or last? Alphabetical likely.
    // Assuming we append it for now or check if it exists.
    const hasWW = lookups_countries.some((c) => c.id === COUNTRY_ID_WW);
    if (hasWW) return lookups_countries;
    return [
      ...lookups_countries,
      { id: COUNTRY_ID_WW, name: "Worldwide" } as Country,
    ];
  }, [lookups_countries]);

  const userCountry = useMemo(() => {
    if (!userProfile?.countryId || !lookups_countries) return null;
    return lookups_countries.find((c) => c.id === userProfile.countryId);
  }, [userProfile?.countryId, lookups_countries]);

  const queryCountries = useMemo(() => {
    if (selectedCountryIds.length === 0) return null;
    return selectedCountryIds;
  }, [selectedCountryIds]);

  const shouldFetchPrograms = useMemo(() => {
    // Wait for session loading
    if (status === "loading") return false;

    // If authenticated, wait for user profile to be ready
    if (status === "authenticated") {
      if (!userProfile) return false;
      // If we haven't initialized the country selection yet, don't fetch
      // Note: If user has no countryId, we can proceed with empty selection (WW)
      if (
        userProfile.countryId &&
        selectedCountryIds.length === 0 &&
        !countryInitRef.current
      ) {
        return false;
      }
    }
    // Anonymous users can fetch immediately (default WW)
    return true;
  }, [status, userProfile, selectedCountryIds.length]);

  const { data: programsData, isLoading: programsLoading } =
    useQuery<ProgramSearchResultsInfo>({
      queryKey: ["ReferralPrograms", 1, 4, queryCountries],
      queryFn: () =>
        searchReferralProgramsInfo({
          pageNumber: 1,
          pageSize: 4,
          valueContains: null,
          countries: queryCountries,
          includeExpired: false,
        }),
      enabled: shouldFetchPrograms,
    });

  const { data: linksData, isLoading: linksLoading } = useQuery({
    queryKey: ["ReferralLinks", 1, 3],
    queryFn: () =>
      searchReferralLinks({
        pageNumber: 1,
        pageSize: 3,
        programId: null,
        valueContains: null,
        statuses: null,
      }),
  });
  const hasLinks = (linksData?.items?.length ?? 0) > 0;
  const hasPrograms = (programsData?.items?.length ?? 0) > 0;

  // Referee data is now handled by RefereeUsagesList component
  const programs = programsData?.items || [];

  // HANDLERS
  const handleCreateLink = useCallback(() => {
    setSelectedProgramForLink(null);
    setCreateLinkModalVisible(true);
  }, []);

  const handleCreateLinkForProgram = useCallback((program: ProgramInfo) => {
    setSelectedProgramForLink(program);
    setSelectedLinkForEdit(null);
    setCreateLinkModalVisible(true);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto animate-pulse px-4 py-8">
        <div className="bg-base-300 mb-6 h-10 w-48 rounded"></div>
        <div className="bg-base-200 h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Yoma | Referrals</title>
        <meta name="description" content="Yoma Referral Programs" />
      </Head>

      <div className="mx-auto mt-20 w-full px-4 lg:max-w-4xl">
        {!isAuthenticated ? (
          <AnonymousView />
        ) : (
          <div className="space-y-12">
            {!userProfile ? (
              <LoadingInline
                classNameSpinner="md:h-32 md:w-32 h-16 w-16 border-orange"
                className="h-52 flex-col"
              />
            ) : isBlocked ? (
              <ReferralBlockedView userProfile={userProfile} />
            ) : (
              <div className="flex flex-col gap-8">
                <Suspense
                  isLoading={linksLoading || programsLoading}
                  loader={
                    <LoadingInline
                      classNameSpinner="md:h-32 md:w-32 h-16 w-16 border-orange"
                      className="h-52 flex-col"
                    />
                  }
                >
                  <WelcomeSection
                    hasLinks={hasLinks}
                    hasPrograms={hasPrograms}
                  />
                </Suspense>

                {isReferee && <RefereeSection />}

                {(isReferrer || hasLinks || linksLoading) && (
                  <>
                    <Suspense
                      isLoading={linksLoading}
                      loader={<LoadingSkeleton height="h-64" />}
                    >
                      {hasLinks && (
                        <LinksSection
                          linksCount={linksData?.totalCount || 0}
                          programs={programs}
                          //onCreateLink={handleCreateLink}
                        />
                      )}
                    </Suspense>

                    <ProgramsSection
                      onProgramClick={handleCreateLinkForProgram}
                      programs={programs}
                      totalCount={programsData?.totalCount || 0}
                      countries={countriesWithWW}
                      selectedCountryIds={selectedCountryIds}
                      onCountryChange={setSelectedCountryIds}
                      isLoading={programsLoading}
                      userCountry={userCountry}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ReferrerCreateLinkModal
        programs={programs}
        selectedProgram={selectedProgramForLink || undefined}
        editLink={selectedLinkForEdit || undefined}
        existingLinksCount={0}
        showProgramDetails={true}
        isOpen={createLinkModalVisible}
        onClose={() => {
          setCreateLinkModalVisible(false);
          setSelectedLinkForEdit(null);
          setSelectedProgramForLink(null);
        }}
        onSuccess={async (link) => {
          await queryClient.invalidateQueries({
            queryKey: ["ReferralLinks"],
          });

          router.push(`/referrals/link/${link.id}`);
        }}
      />
    </>
  );
};

ReferralsPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default ReferralsPage;
