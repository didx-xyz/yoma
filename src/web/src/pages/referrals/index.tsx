import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import imageAmbassador from "public/images/home/bg-ambassador.png";
import imageStencilPurple from "public/images/home/stencil-purple.png";
import iconZlto from "public/images/icon-zlto.svg";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { FiPaperclip } from "react-icons/fi";
import { type OnSlideProps } from "react-scroll-snap-anime-slider";
import Select from "react-select";
import { Country } from "~/api/models/lookups";
import {
  ReferralParticipationRole as ReferralAnalyticsRole,
  ReferralLinkUsageStatus,
  type ProgramInfo,
  type ReferralLink,
  type ReferralLinkUsage,
} from "~/api/models/referrals";
import { ReferralParticipationRole, type UserProfile } from "~/api/models/user";
import {
  getCountries,
  searchReferralLinks,
  searchReferralLinkUsagesAsReferrer,
  searchReferralProgramsInfo,
} from "~/api/services/referrals";
import { getUserProfile } from "~/api/services/user";
import Suspense from "~/components/Common/Suspense";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ColoredSectionShell } from "~/components/Referrals/ColoredSectionShell";
import { ReferralBlockedView } from "~/components/Referrals/ReferralBlockedView";
import { ReferralFriendSlideCard } from "~/components/Referrals/ReferralFriendSlideCard";
import { ReferralProgramSlideCard } from "~/components/Referrals/ReferralProgramSlideCard";
import { ReferralSlidesCarousel } from "~/components/Referrals/ReferralSlidesCarousel";
import { ReferrerStats } from "~/components/Referrals/ReferrerStats";
import { SignInButton } from "~/components/SignInButton";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import {
  useMyReferralAnalyticsQuery,
  useReferralLinksQuery,
  useReferralLinkUsagesRefereeQuery,
  useReferralLinkUsagesReferrerQuery,
  useReferralProgramsQuery,
} from "~/hooks/useReferralProgramMutations";
import { COUNTRY_ID_WW, PAGE_SIZE, THEME_WHITE } from "~/lib/constants";
import { screenWidthAtom, userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
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

const ReferralWelcomeIntro = ({
  title,
  description,
  subTitle,
  showSignInButton,
}: {
  title: string;
  description: string;
  subTitle?: string;
  showSignInButton: boolean;
}) => (
  <>
    <div className="mx-auto mt-10 mb-16 flex w-full max-w-6xl flex-col items-center justify-center px-4">
      <NoRowsMessage
        title={title}
        description={description}
        subTitle={subTitle}
        icon={"❤️"}
        className="max-w-3xl !bg-transparent"
      />
      {showSignInButton && (
        <SignInButton
          className="!bg-orange btn-sm mt-4 !text-white"
          hideIcon={true}
        />
      )}
    </div>

    <ColoredSectionShell
      backgroundClassName="bg-purple"
      sectionClassName="relative z-10 w-full py-16"
      containerClassName="mx-auto -mt-24 flex w-full max-w-6xl flex-col items-center justify-center px-4"
    >
      <div className="flex w-full justify-center">
        <div className="relative aspect-video w-full max-w-[601px]">
          <iframe
            className="h-full w-full rounded-lg"
            src="https://www.youtube.com/embed/77vgI4VE8HY?rel=0&modestbranding=1"
            title="YouTube Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-2 px-3 text-center text-white md:max-w-xl">
        <p className="font-sans text-sm tracking-normal text-white md:text-base">
          Curious how you can earn Zlto just by helping friends unlock
          opportunities? Watch the video and see how the Yoma Ambassador
          Programme works.
        </p>
      </div>
    </ColoredSectionShell>
  </>
);

const ProgramsSection = ({
  programs: initialPrograms,
  totalCount,
  countries,
  selectedCountryIds,
  isLoading,
  userCountry,
  onCountryChange,
}: {
  programs: ProgramInfo[];
  totalCount: number;
  countries: Country[] | undefined;
  selectedCountryIds: string[];
  isLoading: boolean;
  userCountry?: Country | null;
  onCountryChange: (ids: string[]) => void;
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
    return "Showing all programs world-wide.";
  }, [selectedCountryIds, countries, userCountry]);

  const [visibleSlides, setVisibleSlides] = useState(1);
  const countryFilterKey = useMemo(
    () => [...selectedCountryIds].sort().join(","),
    [selectedCountryIds],
  );

  const totalSlides = useMemo(() => programs.length, [programs]);
  // Use the provided totalCount or default to initial data length
  const effectiveTotalAll = totalCount ?? programs.length;
  const lastSlideRef = useRef(-1);
  const hasMoreToLoadRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const dataVersionRef = useRef(0);
  const nextPageToLoadRef = useRef(2);

  useEffect(() => {
    if (screenWidth < 600) {
      setVisibleSlides(1);
    } else if (screenWidth >= 600 && screenWidth < 768) {
      setVisibleSlides(2);
    } else if (screenWidth >= 768 && screenWidth < 1024) {
      setVisibleSlides(3);
    } else {
      setVisibleSlides(4);
    }
  }, [screenWidth]);

  useEffect(() => {
    setPrograms(initialPrograms);
    lastSlideRef.current = -1;
    hasMoreToLoadRef.current = true;
    loadingMoreRef.current = false;
    dataVersionRef.current += 1;
    nextPageToLoadRef.current = 2;
  }, [initialPrograms, countryFilterKey]);

  const loadPrograms = useCallback(
    async (pageNumber: number) => {
      const queryCountries =
        selectedCountryIds.length > 0 ? selectedCountryIds : null;

      return await searchReferralProgramsInfo({
        pageNumber,
        pageSize: PAGE_SIZE,
        valueContains: null,
        countries: queryCountries,
        includeExpired: false,
      });
    },
    [selectedCountryIds],
  );

  useEffect(() => {
    if (
      totalSlides > 0 &&
      totalSlides <= visibleSlides &&
      totalSlides < effectiveTotalAll &&
      hasMoreToLoadRef.current &&
      !loadingMoreRef.current
    ) {
      loadingMoreRef.current = true;
      const requestVersion = dataVersionRef.current;
      const pageToLoad = nextPageToLoadRef.current;
      loadPrograms(pageToLoad).then((data) => {
        if (requestVersion !== dataVersionRef.current) {
          loadingMoreRef.current = false;
          return;
        }

        nextPageToLoadRef.current = pageToLoad + 1;

        if (data.items.length === 0) {
          hasMoreToLoadRef.current = false;
        }
        setPrograms((prevSlides) => {
          const existingIds = new Set(prevSlides.map((item) => item.id));
          const uniqueNewItems = data.items.filter(
            (item) => !existingIds.has(item.id),
          );

          if (uniqueNewItems.length === 0 && data.items.length < PAGE_SIZE) {
            hasMoreToLoadRef.current = false;
          }

          return [...prevSlides, ...uniqueNewItems];
        });

        if (pageToLoad * PAGE_SIZE >= effectiveTotalAll) {
          hasMoreToLoadRef.current = false;
        }

        loadingMoreRef.current = false;
      });
    }
  }, [visibleSlides, totalSlides, effectiveTotalAll, loadPrograms]);

  const onSlide = useCallback(
    (props: OnSlideProps) => {
      if (lastSlideRef.current === props.currentSlide) return;
      lastSlideRef.current = props.currentSlide;

      // only attempt loading more slides
      if (
        props.currentSlide + 1 + visibleSlides > totalSlides &&
        hasMoreToLoadRef.current &&
        !loadingMoreRef.current
      ) {
        loadingMoreRef.current = true;
        const requestVersion = dataVersionRef.current;
        const pageToLoad = nextPageToLoadRef.current;
        loadPrograms(pageToLoad).then((data) => {
          if (requestVersion !== dataVersionRef.current) {
            loadingMoreRef.current = false;
            return;
          }

          nextPageToLoadRef.current = pageToLoad + 1;

          if (data.items.length === 0) {
            hasMoreToLoadRef.current = false;
          }
          setPrograms((prevSlides) => {
            const existingIds = new Set(prevSlides.map((item) => item.id));
            const uniqueNewItems = data.items.filter(
              (item) => !existingIds.has(item.id),
            );

            if (uniqueNewItems.length === 0 && data.items.length < PAGE_SIZE) {
              hasMoreToLoadRef.current = false;
            }

            return [...prevSlides, ...uniqueNewItems];
          });

          if (pageToLoad * PAGE_SIZE >= effectiveTotalAll) {
            hasMoreToLoadRef.current = false;
          }

          loadingMoreRef.current = false;
        });
      }
    },
    [visibleSlides, totalSlides, loadPrograms, effectiveTotalAll],
  );

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-col gap-8">
        <div className="flex max-w-full flex-row md:max-w-6xl">
          <div className="flex min-w-0 grow flex-col">
            <div className="font-family-nunito text-lg font-semibold text-black md:text-xl">
              Available referral programmes
            </div>
            <div className="text-gray-dark text-xs md:text-sm">{subTitle}</div>
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
              <ReferralSlidesCarousel
                carouselId={`referral-programs-carousel-${countryFilterKey || "all"}`}
                items={programs}
                totalSlides={effectiveTotalAll}
                getSlideKey={(item) => item.id}
                renderSlide={(item) => (
                  <ReferralProgramSlideCard
                    title={item.name}
                    description={item.description}
                    imageURL={item.imageURL}
                    reward={item.zltoRewardReferrer}
                    timeDays={item.completionWindowInDays}
                    href={`/referrals/program/${item.id}`}
                    openInNewTab={true}
                  />
                )}
                onSlide={onSlide}
              />
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
      </div>
    </div>
  );
};

const ReferralHeroSection = ({
  totalActiveLinks,
  programmeCompletions,
  totalUsages,
  totalZltoEarned,
  isLoading,
}: {
  totalActiveLinks: number;
  programmeCompletions: number;
  totalUsages: number;
  totalZltoEarned: number;
  isLoading: boolean;
}) => {
  const programmeSummary = useMemo(() => {
    if (programmeCompletions > 0) {
      return `Congratulations! ${programmeCompletions} ${programmeCompletions === 1 ? "person has" : "people have"} completed your programme!`;
    }

    if (totalUsages > 0) {
      return `Congratulations! ${totalUsages} ${totalUsages === 1 ? "person has" : "people have"} joined your programme!`;
    }

    return null;
  }, [programmeCompletions, totalUsages]);

  return (
    <div className="bg-beige w-full lg:pb-0">
      <div className="relative z-10 flex flex-col items-center justify-center px-4">
        <div className="flex w-full justify-center">
          <div className="flex max-w-5xl flex-row gap-4">
            {/* LEFT: WELCOME IMAGE & STATS */}
            <div className="relative z-20 mt-14 hidden lg:mb-[-80px] lg:flex">
              {/* FLOATING STATS */}
              {(isLoading || totalActiveLinks > 0) && (
                <div className="bg-beige/60 absolute top-36 right-6 z-30 inline-flex w-fit flex-col items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-2xl">
                    <FiPaperclip className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-gray-dark text-sm">
                      Total active links
                    </span>
                    <span className="mt-1 text-center text-2xl font-bold text-black">
                      {isLoading ? "..." : totalActiveLinks}
                    </span>
                  </div>
                </div>
              )}

              {programmeSummary && (
                <div className="bg-beige/60 w-fitx absolute bottom-16 left-6 z-30 inline-flex w-[250px] flex-col items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-lg">
                  <div className="flex flex-col gap-2 text-left leading-tight">
                    <p className="font-family-nunito text-lg font-bold text-black">
                      My Programmes
                    </p>
                    <p className="text-gray-dark -mt-1 text-sm">
                      {programmeSummary}
                    </p>

                    {/* BADGES */}
                    {totalZltoEarned > 0 && (
                      <div className="flex gap-2">
                        <span className="badge badge-sm bg-orange whitespace-nowrap text-white">
                          <Image
                            src={iconZlto}
                            alt="Icon Zlto"
                            width={16}
                            className="h-auto"
                            sizes="100vw"
                            priority={true}
                          />
                          <span className="ml-1">
                            {totalZltoEarned.toLocaleString("en-US")}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AMBASSADOR IMAGE  */}
              <Image
                src={imageAmbassador}
                alt="Ambassador smiling"
                sizes="100vw"
                priority={true}
                style={{
                  objectFit: "cover",
                  zIndex: 20,
                }}
              />
            </div>

            {/* RIGHT: HEADERS AND TEXT */}
            <div className="relative flex max-w-md flex-col gap-3 py-6 pt-24 text-center md:mt-20 md:py-14 md:text-start">
              {/* PURPLE STENCIL */}
              <div className="absolute top-8 right-0 z-10 hidden lg:block">
                <Image
                  src={imageStencilPurple}
                  alt="Stencil Purple"
                  sizes="100vw"
                  priority={true}
                  style={{
                    objectFit: "cover",
                  }}
                />
              </div>

              <h1 className="font-nunito text-3xl font-bold tracking-normal text-black">
                Welcome to the{" "}
                <span className="text-green">
                  Ambassador
                  <br /> Programme
                </span>
              </h1>
              <p className="text-gray-dark flex flex-col gap-2 text-sm tracking-normal md:text-base">
                <span>
                  Refer a friend and help them to discover learning courses,
                  events, or impact actions.
                </span>
                <span>
                  Share your invite link via WhatsApp, Facebook or SMS and
                  onboard your friends within a certain time period to earn cash
                  rewards.
                </span>
                <span className="font-bold">Invite, Complete, Earn.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReferralsPage: NextPageWithLayout<{
  userProfileServer?: UserProfile | null;
}> = ({ userProfileServer }) => {
  const { status } = useSession();
  const screenWidth = useAtomValue(screenWidthAtom);
  const userProfileClient = useAtomValue(userProfileAtom);
  const userProfile = userProfileServer ?? userProfileClient;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // State
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

  const isReferee = hasReferralRole(ReferralParticipationRole.Referee);
  const isBlocked = userProfile?.referral?.blocked ?? false;

  // QUERIES
  const { data: lookups_countries } = useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: () => getCountries(),
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
    useReferralProgramsQuery(1, PAGE_SIZE, queryCountries, {
      enabled: shouldFetchPrograms,
    });

  const { data: linksData } = useReferralLinksQuery(1, PAGE_SIZE, {
    enabled: isAuthenticated && !isBlocked,
  });
  const hasLinks = (linksData?.items?.length ?? 0) > 0;

  const { data: refereeUsagesData } = useReferralLinkUsagesRefereeQuery(1, 5, {
    statuses: [
      ReferralLinkUsageStatus.Pending,
      ReferralLinkUsageStatus.Expired,
    ],
    enabled: isAuthenticated && !isBlocked && isReferee,
  });
  const hasRefereeUsages = (refereeUsagesData?.totalCount ?? 0) > 0;
  const showReferrerSections = hasLinks;
  const showRefereeSection = isReferee && hasRefereeUsages;

  const [myProgrammeLinks, setMyProgrammeLinks] = useState<ReferralLink[]>([]);
  const [myReferralUsages, setMyReferralUsages] = useState<ReferralLinkUsage[]>(
    [],
  );

  const myProgrammesLastSlideRef = useRef(-1);
  const myProgrammesHasMoreToLoadRef = useRef(true);
  const myProgrammesLoadingMoreRef = useRef(false);
  const myProgrammesDataVersionRef = useRef(0);
  const myProgrammesNextPageToLoadRef = useRef(2);

  const myReferredFriendsLastSlideRef = useRef(-1);
  const myReferredFriendsHasMoreToLoadRef = useRef(true);
  const myReferredFriendsLoadingMoreRef = useRef(false);
  const myReferredFriendsDataVersionRef = useRef(0);
  const myReferredFriendsNextPageToLoadRef = useRef(2);

  const carouselVisibleSlides = useMemo(() => {
    if (screenWidth < 600) return 1;
    if (screenWidth >= 600 && screenWidth < 768) return 2;
    if (screenWidth >= 768 && screenWidth < 1024) return 3;
    return 4;
  }, [screenWidth]);

  const { data: referrerUsagesData, isLoading: referrerUsagesLoading } =
    useReferralLinkUsagesReferrerQuery(1, PAGE_SIZE, {
      enabled: isAuthenticated && !isBlocked && hasLinks,
    });

  const myProgrammesTotalCount =
    linksData?.totalCount ?? myProgrammeLinks.length;
  const myReferredFriendsTotalCount =
    referrerUsagesData?.totalCount ?? myReferralUsages.length;

  useEffect(() => {
    setMyProgrammeLinks((linksData?.items ?? []) as ReferralLink[]);
    myProgrammesLastSlideRef.current = -1;
    myProgrammesHasMoreToLoadRef.current =
      (linksData?.items?.length ?? 0) < (linksData?.totalCount ?? 0);
    myProgrammesLoadingMoreRef.current = false;
    myProgrammesDataVersionRef.current += 1;
    myProgrammesNextPageToLoadRef.current = 2;
  }, [linksData?.items, linksData?.totalCount]);

  useEffect(() => {
    setMyReferralUsages(
      (referrerUsagesData?.items ?? []) as ReferralLinkUsage[],
    );
    myReferredFriendsLastSlideRef.current = -1;
    myReferredFriendsHasMoreToLoadRef.current =
      (referrerUsagesData?.items?.length ?? 0) <
      (referrerUsagesData?.totalCount ?? 0);
    myReferredFriendsLoadingMoreRef.current = false;
    myReferredFriendsDataVersionRef.current += 1;
    myReferredFriendsNextPageToLoadRef.current = 2;
  }, [referrerUsagesData?.items, referrerUsagesData?.totalCount]);

  const loadMoreMyProgrammes = useCallback(async (pageNumber: number) => {
    return await searchReferralLinks({
      pageNumber,
      pageSize: PAGE_SIZE,
      programId: null,
      valueContains: null,
      statuses: null,
    });
  }, []);

  const loadMoreMyReferredFriends = useCallback(async (pageNumber: number) => {
    return await searchReferralLinkUsagesAsReferrer({
      pageNumber,
      pageSize: PAGE_SIZE,
      programId: null,
      linkId: null,
      statuses: null,
      dateStart: null,
      dateEnd: null,
    });
  }, []);

  const onMyProgrammesSlide = useCallback(
    (props: OnSlideProps) => {
      if (myProgrammesLastSlideRef.current === props.currentSlide) return;
      myProgrammesLastSlideRef.current = props.currentSlide;

      if (
        props.currentSlide + 1 + carouselVisibleSlides >
          myProgrammeLinks.length &&
        myProgrammesHasMoreToLoadRef.current &&
        !myProgrammesLoadingMoreRef.current
      ) {
        myProgrammesLoadingMoreRef.current = true;
        const requestVersion = myProgrammesDataVersionRef.current;
        const pageToLoad = myProgrammesNextPageToLoadRef.current;

        loadMoreMyProgrammes(pageToLoad).then((data) => {
          if (requestVersion !== myProgrammesDataVersionRef.current) {
            myProgrammesLoadingMoreRef.current = false;
            return;
          }

          myProgrammesNextPageToLoadRef.current = pageToLoad + 1;

          if (data.items.length === 0) {
            myProgrammesHasMoreToLoadRef.current = false;
          }

          setMyProgrammeLinks((prevSlides) => {
            const existingIds = new Set(prevSlides.map((item) => item.id));
            const uniqueNewItems = data.items.filter(
              (item) => !existingIds.has(item.id),
            );

            if (uniqueNewItems.length === 0 && data.items.length < PAGE_SIZE) {
              myProgrammesHasMoreToLoadRef.current = false;
            }

            return [...prevSlides, ...uniqueNewItems];
          });

          if (pageToLoad * PAGE_SIZE >= myProgrammesTotalCount) {
            myProgrammesHasMoreToLoadRef.current = false;
          }

          myProgrammesLoadingMoreRef.current = false;
        });
      }
    },
    [
      carouselVisibleSlides,
      myProgrammeLinks.length,
      loadMoreMyProgrammes,

      myProgrammesTotalCount,
    ],
  );

  const onMyReferredFriendsSlide = useCallback(
    (props: OnSlideProps) => {
      if (myReferredFriendsLastSlideRef.current === props.currentSlide) return;
      myReferredFriendsLastSlideRef.current = props.currentSlide;

      if (
        props.currentSlide + 1 + carouselVisibleSlides >
          myReferralUsages.length &&
        myReferredFriendsHasMoreToLoadRef.current &&
        !myReferredFriendsLoadingMoreRef.current
      ) {
        myReferredFriendsLoadingMoreRef.current = true;
        const requestVersion = myReferredFriendsDataVersionRef.current;
        const pageToLoad = myReferredFriendsNextPageToLoadRef.current;

        loadMoreMyReferredFriends(pageToLoad).then((data) => {
          if (requestVersion !== myReferredFriendsDataVersionRef.current) {
            myReferredFriendsLoadingMoreRef.current = false;
            return;
          }

          myReferredFriendsNextPageToLoadRef.current = pageToLoad + 1;

          if (data.items.length === 0) {
            myReferredFriendsHasMoreToLoadRef.current = false;
          }

          setMyReferralUsages((prevSlides) => {
            const existingIds = new Set(prevSlides.map((item) => item.id));
            const uniqueNewItems = data.items.filter(
              (item) => !existingIds.has(item.id),
            );

            if (uniqueNewItems.length === 0 && data.items.length < PAGE_SIZE) {
              myReferredFriendsHasMoreToLoadRef.current = false;
            }

            return [...prevSlides, ...uniqueNewItems];
          });

          if (pageToLoad * PAGE_SIZE >= myReferredFriendsTotalCount) {
            myReferredFriendsHasMoreToLoadRef.current = false;
          }

          myReferredFriendsLoadingMoreRef.current = false;
        });
      }
    },
    [
      carouselVisibleSlides,
      myReferralUsages.length,
      loadMoreMyReferredFriends,
      myReferredFriendsTotalCount,
    ],
  );

  const {
    data: referrerAnalytics,
    isLoading: referrerAnalyticsLoading,
    error: referrerAnalyticsError,
  } = useMyReferralAnalyticsQuery(ReferralAnalyticsRole.Referrer, {
    enabled: isAuthenticated && !isBlocked,
  });

  const myReferralSlides = useMemo(() => {
    const usageItems = myReferralUsages;

    return usageItems.map((usage) => ({
      id: usage.id,
      linkId: usage.linkId,
      programId: usage.programId,
      friendName:
        usage.userDisplayName && usage.userDisplayName.trim().length > 0
          ? usage.userDisplayName
          : "Friend Name Surname",
      programmeName: usage.programName || "Programme name",
      referredOn: usage.dateCreated,
      status: usage.status,
      timeDays: usage.timeRemainingInDays,
    }));
  }, [myReferralUsages]);

  // Hero and stats values from centralized analytics query
  const isAuthStatusLoading = status === "loading";
  const showHeroDemoValues = !isAuthenticated && !isAuthStatusLoading;
  const heroTotalActiveLinks = isAuthenticated
    ? (referrerAnalytics?.linkCountActive ?? 0)
    : showHeroDemoValues
      ? 19
      : 0;
  const heroProgrammeCompletions = isAuthenticated
    ? (referrerAnalytics?.usageCountCompleted ?? 0)
    : showHeroDemoValues
      ? 20
      : 0;
  const heroTotalUsages = isAuthenticated
    ? (referrerAnalytics?.usageCountTotal ?? 0)
    : showHeroDemoValues
      ? 7
      : 0;
  const heroTotalZltoEarned = isAuthenticated
    ? (referrerAnalytics?.zltoRewardTotal ?? 0)
    : showHeroDemoValues
      ? 500
      : 0;
  const heroStatsLoading =
    isAuthStatusLoading ||
    (isAuthenticated && !isBlocked && referrerAnalyticsLoading);

  return (
    <>
      <Head>
        <title>Yoma | Refer a friend ❤️</title>
        <meta name="description" content="Yoma Referral Programs" />
      </Head>

      <div className="relative right-0 left-0 flex w-screen flex-col overflow-x-hidden">
        <ReferralHeroSection
          totalActiveLinks={heroTotalActiveLinks}
          programmeCompletions={heroProgrammeCompletions}
          totalUsages={heroTotalUsages}
          totalZltoEarned={heroTotalZltoEarned}
          isLoading={heroStatsLoading}
        />

        <Suspense
          isLoading={isLoading}
          loader={
            <LoadingInline
              classNameSpinner="md:h-32 md:w-32 h-16 w-16 border-orange"
              className="h-52 flex-col"
            />
          }
        >
          {!isAuthenticated ? (
            <div className="w-full">
              <>
                <div className="mx-auto mt-4 mb-16 flex w-full max-w-6xl flex-col items-center justify-center px-4">
                  <NoRowsMessage
                    title="Join our Ambassador Referral Programme!"
                    description="Sign in to start earning rewards by referring friends or claiming offers."
                    icon={"❤️"}
                    className="max-w-3xl !bg-transparent"
                  />
                  <SignInButton
                    className="!bg-orange btn-sm mt-4 !text-white"
                    hideIcon={true}
                  />
                </div>

                <ColoredSectionShell
                  backgroundClassName="bg-purple"
                  sectionClassName="relative z-10 w-full py-8"
                  containerClassName="mx-auto -mt-18 flex w-full max-w-6xl flex-col items-center justify-center px-4"
                >
                  <div className="flex w-full justify-center">
                    <div className="relative aspect-video w-full max-w-[601px]">
                      <iframe
                        className="h-full w-full rounded-lg"
                        src="https://www.youtube.com/embed/77vgI4VE8HY?rel=0&modestbranding=1"
                        title="YouTube Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col items-center gap-2 px-3 text-center text-white md:max-w-xl">
                    <p className="font-sans text-sm tracking-normal text-white md:text-base">
                      Curious how you can earn Zlto just by helping friends
                      unlock opportunities? Watch the video and see how the Yoma
                      Ambassador Programme works.
                    </p>
                  </div>
                </ColoredSectionShell>
              </>

              {/* BEIGE SECTION - PROGRAMS */}
              <ColoredSectionShell
                backgroundClassName="bg-beige-light"
                sectionClassName="relative z-10 w-full pt-8 pb-8"
              >
                <ProgramsSection
                  programs={programsData?.items ?? []}
                  totalCount={programsData?.totalCount || 0}
                  countries={countriesWithWW}
                  selectedCountryIds={selectedCountryIds}
                  onCountryChange={setSelectedCountryIds}
                  isLoading={programsLoading}
                  userCountry={userCountry}
                />
              </ColoredSectionShell>
            </div>
          ) : (
            <div className="w-full">
              {!userProfile ? (
                <LoadingInline
                  classNameSpinner="md:h-32 md:w-32 h-16 w-16 border-orange"
                  className="h-52 flex-col"
                />
              ) : isBlocked ? (
                <div className="mx-auto my-14 flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
                  <ReferralBlockedView userProfile={userProfile} />
                </div>
              ) : (
                <div className="w-full">
                  {!hasLinks && (
                    <ReferralWelcomeIntro
                      title="Welcome to the Ambassador Programme 🚀"
                      subTitle="Create your first referral link in seconds. Choose a programme below to generate a referral link."
                      description="Each programme has different requirements and rewards. Your referral link is valid for new Yoma users only."
                      showSignInButton={false}
                    />
                  )}

                  {(showReferrerSections || showRefereeSection) && (
                    <div className="w-full">
                      {showReferrerSections && (
                        <>
                          <ColoredSectionShell
                            backgroundClassName="bg-beige-light"
                            sectionClassName="relative z-10 w-full pt-14 pb-4"
                          >
                            <div className="mb-4 flex min-w-0 grow flex-col">
                              <div className="font-family-nunito text-lg font-semibold text-black md:text-xl">
                                Your performance as a Yoma Ambassador
                              </div>
                            </div>

                            <ReferrerStats
                              analytics={referrerAnalytics}
                              isLoading={referrerAnalyticsLoading}
                              error={referrerAnalyticsError}
                            />
                          </ColoredSectionShell>

                          <ColoredSectionShell backgroundClassName="bg-purple">
                            <div className="space-y-4">
                              <div className="flex min-w-0 grow flex-col">
                                <h3 className="font-family-nunito text-lg font-semibold text-white md:text-xl">
                                  My referred friends
                                </h3>
                                <p className="text-sm text-white/80">
                                  {myReferralSlides.length > 0 ? (
                                    <>
                                      These friends haven&apos;t completed
                                      onboarding yet.
                                    </>
                                  ) : (
                                    <>
                                      No referrals yet. When someone uses your
                                      referral link, they will appear here. 😉
                                    </>
                                  )}
                                </p>
                              </div>

                              <Suspense
                                isLoading={referrerUsagesLoading}
                                loader={
                                  <LoadingInline
                                    classNameSpinner="h-12 w-12 border-orange"
                                    className="h-40 flex-col"
                                  />
                                }
                              >
                                <ReferralSlidesCarousel
                                  carouselId="my-referrals-carousel"
                                  items={myReferralSlides}
                                  totalSlides={myReferredFriendsTotalCount}
                                  onSlide={onMyReferredFriendsSlide}
                                  controlsClassName="text-white md:text-white"
                                  getSlideKey={(item) => item.id}
                                  renderSlide={(item) => (
                                    <ReferralFriendSlideCard
                                      friendName={item.friendName}
                                      programmeName={item.programmeName}
                                      referredOn={item.referredOn}
                                      status={item.status}
                                      daysLeft={item.timeDays}
                                      href={`/referrals/link/${item.linkId}`}
                                      openInNewTab={true}
                                    />
                                  )}
                                />
                              </Suspense>
                            </div>
                          </ColoredSectionShell>

                          <ColoredSectionShell
                            backgroundClassName="bg-beige"
                            sectionClassName="relative z-10 w-full pt-10 pb-8"
                          >
                            <div className="mb-4 flex min-w-0 grow flex-col">
                              <div className="font-family-nunito text-lg font-semibold text-black md:text-xl">
                                My programmes
                              </div>
                              <div className="text-gray-dark text-sm">
                                These are the Ambassador Programmes you&apos;re
                                currently participating in
                              </div>
                            </div>

                            <ReferralSlidesCarousel
                              carouselId="my-programmes-carousel"
                              items={myProgrammeLinks}
                              totalSlides={myProgrammesTotalCount}
                              onSlide={onMyProgrammesSlide}
                              getSlideKey={(item) => item.id}
                              renderSlide={(item) => (
                                <ReferralProgramSlideCard
                                  title={item.programName}
                                  description={item.programSummary}
                                  imageURL={item.programImageURL}
                                  reward={item.zltoRewardReferrerTotal}
                                  href={`/referrals/link/${item.id}`}
                                  openInNewTab={true}
                                  showRewardBadge={false}
                                  showTimeBadge={false}
                                />
                              )}
                              emptyState={
                                <NoRowsMessage
                                  title="No programmes yet"
                                  description="Create or activate links to see your programmes here."
                                  className="!bg-transparent"
                                  icon="📚"
                                />
                              }
                            />
                          </ColoredSectionShell>
                        </>
                      )}
                    </div>
                  )}

                  <ColoredSectionShell
                    backgroundClassName="bg-white"
                    sectionClassName="relative z-10 w-full pt-10 pb-8"
                  >
                    {/* TODO: may have trouble tapping/clicking the scrollable carousel slide (programs).   */}
                    <ProgramsSection
                      programs={programsData?.items ?? []}
                      totalCount={programsData?.totalCount || 0}
                      countries={countriesWithWW}
                      selectedCountryIds={selectedCountryIds}
                      onCountryChange={setSelectedCountryIds}
                      isLoading={programsLoading}
                      userCountry={userCountry}
                    />
                  </ColoredSectionShell>
                </div>
              )}
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
};

ReferralsPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralsPage.theme = function getTheme() {
  return THEME_WHITE;
};

export default ReferralsPage;
