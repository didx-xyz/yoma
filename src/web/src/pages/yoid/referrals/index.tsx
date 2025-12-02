import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { IoMdClose } from "react-icons/io";
import { IoLink, IoWarningOutline } from "react-icons/io5";
import type {
  ProgramInfo,
  ProgramSearchResultsInfo,
  ReferralLink,
} from "~/api/models/referrals";
import {
  createReferralLink,
  getDefaultReferralProgram,
  searchReferralLinks,
  searchReferralProgramsInfo,
} from "~/api/services/referrals";
import Breadcrumb from "~/components/Breadcrumb";
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import YoIDLayout from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { ReferrerCreateLinkModal } from "~/components/Referrals/ReferrerCreateLinkModal";
import { ReferrerLeaderboard } from "~/components/Referrals/ReferrerLeaderboard";
import { ReferrerLinksList } from "~/components/Referrals/ReferrerLinksList";
import { ReferrerProgramsList } from "~/components/Referrals/ReferrerProgramsList";
import { ReferrerProgramPreview } from "~/components/Referrals/ReferrerProgramPreview";
import { ReferrerLinkDetails } from "~/components/Referrals/ReferrerLinkDetails";
import { ReferrerPerformanceOverview } from "~/components/Referrals/ReferrerPerformanceOverview";
import { ReferrerReferralsList } from "~/components/Referrals/ReferrerReferralsList";
import { ShareButtons } from "~/components/Referrals/ShareButtons";
import { config } from "~/lib/react-query-config";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import { handleUserSignIn } from "~/lib/authUtils";
import { FaPlus } from "react-icons/fa";
import { ReferrerStats } from "~/components/Referrals/ReferrerStats";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  const queryClient = new QueryClient(config);

  // 👇 check multiProgram query parameter (default: false)
  // MULTI-PROGRAM MODE (?multiProgram=true): Shows program selection, multiple links list, modal-based usage view
  // SINGLE PROGRAM MODE (default): Uses default program, shows only first link with inline usage view
  const multiProgram =
    context.query.multiProgram === "true" || context.query.multiProgram === "1";

  if (multiProgram) {
    // MULTI-PROGRAM MODE: prefetch queries on server for multiple programs
    await queryClient.prefetchQuery({
      queryKey: ["ReferralLinks", 1, 3], // pageNumber: 1, pageSize: 3
      queryFn: () =>
        searchReferralLinks(
          {
            pageNumber: 1,
            pageSize: 3,
            programId: null,
            valueContains: null,
            statuses: null,
          },
          context,
        ),
    });

    await queryClient.prefetchQuery({
      queryKey: ["ReferralPrograms", 1, 4], // pageNumber: 1, pageSize: 4
      queryFn: () =>
        searchReferralProgramsInfo(
          {
            pageNumber: 1,
            pageSize: 4,
            valueContains: null,
            includeExpired: false,
          },
          context,
        ),
    });
  } else {
    // SINGLE PROGRAM MODE: fetch default program and user's first link for that program
    try {
      const defaultProgram = await getDefaultReferralProgram(context);

      await queryClient.prefetchQuery({
        queryKey: ["DefaultReferralProgram"],
        queryFn: () => Promise.resolve(defaultProgram),
      });

      await queryClient.prefetchQuery({
        queryKey: ["ReferralLinks", defaultProgram.id, 1, 1], // programId, pageNumber: 1, pageSize: 1
        queryFn: () =>
          searchReferralLinks(
            {
              pageNumber: 1,
              pageSize: 1,
              programId: defaultProgram.id,
              valueContains: null,
              statuses: null,
            },
            context,
          ),
      });
    } catch (error) {
      console.error("Failed to fetch default referral program:", error);
      // If default program fails to load, prefetch with null to indicate unavailable
      await queryClient.prefetchQuery({
        queryKey: ["DefaultReferralProgram"],
        queryFn: () => Promise.resolve(null),
      });
    }
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      multiProgram,
    },
  };
}

const ReferralsDashboard: NextPageWithLayout<{
  error?: number;
  multiProgram?: boolean;
}> = ({ error, multiProgram = false }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userProfile] = useAtom(userProfileAtom);

  // State for multi-program mode only
  const [createLinkModalVisible, setCreateLinkModalVisible] = useState(false);
  const [selectedProgramForLink, setSelectedProgramForLink] =
    useState<ProgramInfo | null>(null);
  const [selectedLinkForEdit, setSelectedLinkForEdit] =
    useState<ReferralLink | null>(null);
  const [selectedLinkForUsage, setSelectedLinkForUsage] =
    useState<ReferralLink | null>(null);

  // Fetch default program for single program mode
  const { data: defaultProgram } = useQuery<ProgramInfo>({
    queryKey: ["DefaultReferralProgram"],
    queryFn: () => getDefaultReferralProgram(),
    enabled: !error && !multiProgram,
  });

  // Fetch links - different query keys for single vs multi mode
  const { data: linksData, isLoading: linksLoading } = useQuery({
    queryKey: multiProgram
      ? ["ReferralLinks", 1, 3]
      : ["ReferralLinks", defaultProgram?.id, 1, 1],
    queryFn: () =>
      searchReferralLinks({
        pageNumber: 1,
        pageSize: multiProgram ? 3 : 1,
        programId: multiProgram ? null : (defaultProgram?.id ?? null),
        valueContains: null,
        statuses: null,
      }),
    enabled: !error && (multiProgram || !!defaultProgram),
  });

  // Only fetch programs list in multi-program mode
  const { data: programsData } = useQuery<ProgramSearchResultsInfo>({
    queryKey: ["ReferralPrograms", 1, 4],
    queryFn: () =>
      searchReferralProgramsInfo({
        pageNumber: 1,
        pageSize: 4,
        valueContains: null,
        includeExpired: false,
      }),
    enabled: !error && multiProgram,
  });

  // Check if user is blocked
  const isBlocked = userProfile?.referral?.blocked ?? false;
  const hasLinks = (linksData?.items?.length ?? 0) > 0;
  const firstLink = linksData?.items?.[0] ?? null;

  // Auto-create link in single program mode if no link exists
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  useEffect(() => {
    const autoCreateLink = async () => {
      // Only auto-create in single program mode, when not blocked, no links exist, and we have a default program
      if (
        !multiProgram &&
        !isBlocked &&
        !hasLinks &&
        defaultProgram &&
        !isAutoCreating
      ) {
        setIsAutoCreating(true);
        try {
          // Generate a simple title based on the program name
          const linkName = `${defaultProgram.name} Referral Link`;

          await createReferralLink({
            programId: defaultProgram.id,
            name: linkName,
            description: null,
            includeQRCode: false,
          });

          // Refetch links after creation
          await queryClient.invalidateQueries({ queryKey: ["ReferralLinks"] });
        } catch (error) {
          console.error("Failed to auto-create link:", error);
        } finally {
          setIsAutoCreating(false);
        }
      }
    };

    autoCreateLink();
  }, [
    multiProgram,
    isBlocked,
    hasLinks,
    defaultProgram,
    isAutoCreating,
    queryClient,
  ]);

  // Determine programs array based on mode
  const programs = multiProgram
    ? programsData?.items || []
    : defaultProgram
      ? [defaultProgram]
      : [];

  // Handle create link (no program pre-selected) - multi-program mode only
  const handleCreateLink = useCallback(() => {
    if (!multiProgram) return;
    setSelectedProgramForLink(null);
    setCreateLinkModalVisible(true);
  }, [multiProgram]);

  // Handle create link with program (program pre-selected) - multi-program mode only
  const handleCreateLinkForProgram = useCallback(
    (program: ProgramInfo) => {
      if (!multiProgram) return;
      setSelectedProgramForLink(program);
      setSelectedLinkForEdit(null);
      setCreateLinkModalVisible(true);
    },
    [multiProgram],
  );

  // Handle view usage - multi-program mode only
  const handleViewUsage = useCallback(
    (link: ReferralLink) => {
      if (!multiProgram) return;
      setSelectedLinkForUsage(link);
    },
    [multiProgram],
  );

  // Handle edit link - multi-program mode only
  const handleEditLink = useCallback(
    (link: ReferralLink) => {
      if (!multiProgram) return;
      setSelectedLinkForEdit(link);
      setSelectedProgramForLink(null);
      setCreateLinkModalVisible(true);
    },
    [multiProgram],
  );

  const currentLanguage = useAtomValue(currentLanguageAtom);

  useEffect(() => {
    if (error === 401) {
      void handleUserSignIn(currentLanguage);
    }
  }, [error, currentLanguage]);

  if (error === 401) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingInline
          classNameSpinner="h-8 w-8 border-t-2 border-b-2 border-orange md:h-16 md:w-16 md:border-t-4 md:border-b-4"
          classNameLabel={"text-sm font-semibold md:text-lg"}
          label="Redirecting to login..."
        />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Yoma | Referrals</title>
      </Head>

      <div className="w-full lg:max-w-7xl">
        {/* BREADCRUMB */}
        <div className="mb-4 text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "Refer a friend",
                selected: true,
              },
            ]}
          />
        </div>

        {/* BLOCKED STATE */}
        {isBlocked && (
          <div className="shadow-custom mb-6 rounded-lg bg-white p-6">
            {(() => {
              const blockedDate = userProfile?.referral?.blockedDate
                ? new Date(userProfile.referral.blockedDate).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )
                : null;

              const blockedDescription = `
                <div class="text-center mt-10">
                  <p>Your access to the referral program has been temporarily suspended. If you believe this is an error, please contact support.</p>
                  ${
                    blockedDate
                      ? `<p class="text-sm text-gray-600">Suspended on: ${blockedDate}</p>`
                      : ""
                  }
                </div>
              `;

              return (
                <div className="container mx-auto mt-20 flex max-w-5xl flex-col gap-8 px-4 py-8">
                  <div className="flex flex-col items-center justify-center">
                    <NoRowsMessage
                      title="Referral Access Suspended"
                      description={blockedDescription}
                      icon={
                        <IoWarningOutline className="h-6 w-6 text-red-500" />
                      }
                      className="max-w-3xl !bg-transparent"
                    />
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => router.push("/support")}
                        className="btn btn-warning btn-sm"
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* MAIN CONTENT - Only show if not blocked */}
        {!isBlocked && (
          <div className="flex flex-col gap-4">
            {/* Welcome: Refer a friend */}
            <div className="flex items-center justify-center">
              <NoRowsMessage
                title="Refer a friend"
                subTitle="Good things are better when shared. Invite your friends to Yoma and help them start their journey."
                description="Earn the power to refer by completing your own Yoma
                  opportunities. Share your link, and when your friend signs up
                  and completes their first onboarding opportunity, you both win
                  rewards!"
                icon={"❤️"}
                className="max-w-3xl !bg-transparent"
              />
            </div>

            {/* SINGLE PROGRAM MODE */}
            {!multiProgram && (
              <div className="flex flex-col gap-4">
                {linksLoading && (
                  <LoadingInline classNameSpinner="h-12 border-orange w-12" />
                )}

                {!linksLoading && (
                  <div className="flex flex-col items-start justify-start gap-4 md:gap-6">
                    {isAutoCreating && (
                      <div className="rounded-lg bg-white p-6">
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                          <LoadingInline
                            classNameSpinner="h-8 w-8 border-t-2 border-b-2 border-orange md:h-16 md:w-16 md:border-t-4 md:border-b-4"
                            classNameLabel={"text-sm font-semibold md:text-lg"}
                            label="Creating your referral link..."
                          />
                        </div>
                      </div>
                    )}

                    {!isAutoCreating && firstLink && (
                      <div className="flex w-full flex-col gap-4 md:flex-row">
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                            Your Link
                          </div>

                          <div className="flex-1 rounded-lg bg-white p-4">
                            <ReferrerLinkDetails
                              link={firstLink}
                              mode="large"
                              showQRCode={false}
                              className=""
                              hideLabels={true}
                            />
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-2">
                          <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                            Share Your Link
                          </div>

                          <div className="flex-1 rounded-lg bg-white p-4">
                            <p className="text-gray-dark mt-1 mb-3 text-xs md:text-sm">
                              Choose your preferred platform
                            </p>

                            <ShareButtons
                              url={firstLink.shortURL ?? firstLink.url}
                              size={30}
                            />
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-2">
                          <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                            Your stats
                          </div>

                          <div className="flex-1 rounded-lg bg-white p-4">
                            <ReferrerPerformanceOverview
                              link={firstLink}
                              mode="large"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {!isAutoCreating && !firstLink && !defaultProgram && (
                      <div className="rounded-lg bg-white p-6">
                        <NoRowsMessage
                          title="My Referral Links"
                          description="Link currently unavailable. Please check back later."
                          icon={"🔗"}
                        />
                      </div>
                    )}
                  </div>
                )}

                {!linksLoading && firstLink && (
                  <div className="space-y-2">
                    <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                      Referral List
                    </div>

                    <ReferrerReferralsList linkId={firstLink.id} />
                  </div>
                )}
              </div>
            )}

            {/* MULTI-PROGRAM MODE */}
            {multiProgram && (
              <>
                {/* WELCOME SECTION */}
                {/* <div className="shadow-custom rounded-lgx bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h1 className="text-lg font-bold text-gray-900 md:text-xl">
                        <IoGift className="text-green mb-1 inline h-6 w-6" />{" "}
                        Share & Earn Together
                      </h1>
                      <p className="text-gray-dark mt-2 text-sm md:text-base">
                        Manage your referral links and track your rewards
                      </p>
                    </div>
                    {!hasLinks && (
                      <button
                        onClick={handleCreateLink}
                        className="btn btn-success gap-2"
                      >
                        <FaPlus className="h-4 w-4" />
                        Create Your First Link
                      </button>
                    )}
                  </div>
                </div> */}

                {/* HOW IT WORKS */}
                {/* <HelpReferrer isExpanded={!hasLinks} /> */}

                {/* CONTENT AREA */}
                <div className="grid gap-4 overflow-hidden md:gap-6 lg:grid-cols-3">
                  {/* LEFT COLUMN - Stats & Leaderboard */}
                  <div className="min-w-0 space-y-4 md:space-y-6 lg:col-span-1">
                    {/* STATS CARDS */}
                    <div className="space-y-2">
                      <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                        Your Stats
                      </div>
                      <div className="rounded-lg bg-white p-4 md:p-6">
                        <ReferrerStats />
                      </div>
                    </div>

                    {/* LEADERBOARD */}
                    <div className="space-y-2">
                      <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                        Top Referrers
                      </div>
                      <div className="rounded-lg bg-white p-4 md:p-6">
                        <ReferrerLeaderboard pageSize={10} />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN - Links & Programs */}
                  <div className="min-w-0 space-y-4 md:space-y-6 lg:col-span-2">
                    {/* MY LINKS */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                          Your Referral Links
                        </div>
                        {programsData?.totalCount && (
                          <button
                            onClick={handleCreateLink}
                            className="btn btn-xs gap-2 border-blue-600 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:bg-blue-700"
                          >
                            <FaPlus className="h-3 w-3" />
                            Create Link
                          </button>
                        )}
                      </div>

                      <ReferrerLinksList
                        programs={programsData?.items || []}
                        onViewUsage={handleViewUsage}
                        onEdit={handleEditLink}
                        onCreateLink={handleCreateLink}
                        initialPageSize={3}
                      />
                    </div>

                    {/* ACTIVE PROGRAMS */}
                    {/* <div className="space-y-2">
                      <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                        Available Programs
                      </div>
                      <div className="rounded-lg bg-white p-4 md:p-6">
                        <ReferrerProgramsList
                          onProgramClick={handleCreateLinkForProgram}
                          onCreateLink={handleCreateLinkForProgram}
                          initialPageSize={4}
                          showHeader={true}
                          showDescription={true}
                          context="list"
                        />
                      </div>
                    </div> */}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals - Only in multi-program mode */}
      {multiProgram && (
        <>
          {/* Create/Edit Link Modal */}
          <ReferrerCreateLinkModal
            programs={programs}
            selectedProgram={selectedProgramForLink || undefined}
            editLink={selectedLinkForEdit || undefined}
            existingLinksCount={0}
            showProgramDetails={multiProgram}
            isOpen={createLinkModalVisible}
            onClose={() => {
              setCreateLinkModalVisible(false);
              setSelectedLinkForEdit(null);
              setSelectedProgramForLink(null);
            }}
            onSuccess={async () => {
              // Invalidate the query to trigger a refetch
              await queryClient.invalidateQueries({
                queryKey: ["ReferralLinks"],
              });
            }}
          />

          {/* Link Usage Modal */}
          <CustomModal
            isOpen={!!selectedLinkForUsage}
            onRequestClose={() => setSelectedLinkForUsage(null)}
            className="md:max-h-[90vh] md:w-[900px]"
          >
            {selectedLinkForUsage && (
              <div className="flex flex-col">
                {/* Header */}
                <div className="bg-theme flex flex-row p-4 shadow-lg">
                  <div className="flex-1">
                    <h1 className="text-lg font-semibold text-white">
                      Link Usage
                    </h1>
                  </div>
                  <button
                    type="button"
                    className="btn btn-circle text-gray-dark hover:bg-gray btn-sm"
                    onClick={() => setSelectedLinkForUsage(null)}
                  >
                    <IoMdClose className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-4 p-4 md:p-6">
                  <NoRowsMessage
                    icon="📊"
                    title="Link Performance"
                    description="Track how your link is performing and see who has signed up."
                    className="!bg-transparent"
                  />

                  <div className="flex flex-col gap-4">
                    <div className="flex w-full flex-col gap-4 md:flex-row">
                      <div className="grow space-y-2">
                        <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                          Your stats
                        </div>
                        <div className="border-gray md:p-6x rounded-lg border p-4">
                          <ReferrerPerformanceOverview
                            link={selectedLinkForUsage}
                            mode="large"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                        Referral List
                      </div>
                      <div className="border-gray rounded-lg border">
                        <ReferrerReferralsList
                          linkId={selectedLinkForUsage.id}
                        />
                      </div>
                    </div>
                  </div>

                  {/* <ReferrerProgramPreview
                    programId={selectedLinkForUsage.programId}
                  /> */}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="btn btn-outline flex-1 border-blue-600 text-blue-600 normal-case hover:bg-blue-600 hover:text-white"
                      onClick={() => setSelectedLinkForUsage(null)}
                    >
                      Back to List
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CustomModal>
        </>
      )}
    </>
  );
};

ReferralsDashboard.getLayout = function getLayout(page: ReactElement) {
  if ((page.props as any).error === 401) {
    return <MainLayout>{page}</MainLayout>;
  }
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default ReferralsDashboard;
