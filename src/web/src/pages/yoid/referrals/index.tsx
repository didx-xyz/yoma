import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAtom } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { IoWarning } from "react-icons/io5";
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
import YoIDLayout from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import { HelpReferrer } from "~/components/Referrals/HelpReferrer";
import { ReferrerCreateLinkModal } from "~/components/Referrals/ReferrerCreateLinkModal";
import { ReferrerLeaderboard } from "~/components/Referrals/ReferrerLeaderboard";
import { ReferrerLinkUsageInline } from "~/components/Referrals/ReferrerLinkUsageInline";
import { ReferrerLinkUsageModal } from "~/components/Referrals/ReferrerLinkUsageModal";
import { ReferrerLinksList } from "~/components/Referrals/ReferrerLinksList";
import { ReferrerProgramsList } from "~/components/Referrals/ReferrerProgramsList";
import { ReferrerStats } from "~/components/Referrals/ReferrerStats";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
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
  error?: string;
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
  const { data: linksData } = useQuery({
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

  if (error === "Unauthorized") return <Unauthorized />;

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
                title: "🎁 Referrals",
                selected: true,
              },
            ]}
          />
        </div>

        {/* BLOCKED STATE */}
        {isBlocked && (
          <div className="shadow-custom mb-6 rounded-lg bg-white p-6">
            <div className="flex items-start gap-4">
              <IoWarning className="text-orange h-8 w-8 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-orange text-xl font-bold">
                  Referral Access Suspended
                </h2>
                <p className="text-gray-dark mt-2">
                  Your access to the referral program has been temporarily
                  suspended. If you believe this is an error, please contact
                  support.
                </p>
                {userProfile?.referral?.blockedDate && (
                  <p className="text-gray-dark mt-2 text-sm">
                    Suspended on:{" "}
                    {new Date(
                      userProfile.referral.blockedDate,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                <button
                  onClick={() => router.push("/support")}
                  className="btn btn-warning btn-sm mt-4"
                >
                  Contact Support
                </button>
              </div>
            </div>
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
                icon={"💝"}
                className="max-w-3xl !bg-transparent"
              />
            </div>

            {/* SINGLE PROGRAM MODE */}
            {!multiProgram && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* LEFT COLUMN - Stats & Leaderboard */}
                <div className="space-y-6 lg:col-span-1">
                  {/* STATS CARDS */}
                  <ReferrerStats />

                  {/* LEADERBOARD */}
                  <ReferrerLeaderboard pageSize={10} />
                </div>

                {/* RIGHT COLUMN - Link Details & Usage */}
                <div className="space-y-6 lg:col-span-2">
                  {isAutoCreating && (
                    <div className="shadow-custom rounded-lg bg-white p-6">
                      <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <span className="loading loading-spinner loading-lg text-blue-600"></span>
                        <p className="text-gray-600">
                          Creating your referral link...
                        </p>
                      </div>
                    </div>
                  )}

                  {!isAutoCreating && hasLinks && firstLink && (
                    <ReferrerLinkUsageInline link={firstLink} />
                  )}

                  {!isAutoCreating && !hasLinks && !defaultProgram && (
                    <div className="shadow-custom rounded-lg bg-white p-6">
                      <NoRowsMessage
                        title="No Program Available"
                        description="No default referral program is available at this time."
                        icon={"⚠️"}
                      />
                    </div>
                  )}
                </div>
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
                <HelpReferrer isExpanded={!hasLinks} />

                {/* CONTENT AREA */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* LEFT COLUMN - Stats & Leaderboard */}
                  <div className="space-y-6 lg:col-span-1">
                    {/* STATS CARDS */}
                    <ReferrerStats />

                    {/* LEADERBOARD */}
                    <ReferrerLeaderboard pageSize={10} />
                  </div>

                  {/* RIGHT COLUMN - Links & Programs */}
                  <div className="space-y-6 lg:col-span-2">
                    {/* MY LINKS */}
                    <ReferrerLinksList
                      programs={programsData?.items || []}
                      onViewUsage={handleViewUsage}
                      onEdit={handleEditLink}
                      onCreateLink={handleCreateLink}
                      initialPageSize={3}
                    />

                    {/* ACTIVE PROGRAMS */}
                    <ReferrerProgramsList
                      onProgramClick={handleCreateLinkForProgram}
                      onCreateLink={handleCreateLinkForProgram}
                      initialPageSize={4}
                      showHeader={true}
                      showDescription={true}
                      context="list"
                    />
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
          <ReferrerLinkUsageModal
            link={selectedLinkForUsage}
            isOpen={!!selectedLinkForUsage}
            onClose={() => setSelectedLinkForUsage(null)}
          />
        </>
      )}
    </>
  );
};

ReferralsDashboard.getLayout = function getLayout(page: ReactElement) {
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default ReferralsDashboard;
