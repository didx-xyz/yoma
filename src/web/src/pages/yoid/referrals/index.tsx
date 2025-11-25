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
import { useCallback, useState, type ReactElement } from "react";
import { FaPlus } from "react-icons/fa";
import { IoGift, IoWarning } from "react-icons/io5";
import type {
  ProgramInfo,
  ProgramSearchResultsInfo,
  ReferralLink,
} from "~/api/models/referrals";
import {
  searchReferralLinks,
  searchReferralProgramsInfo,
} from "~/api/services/referrals";
import Breadcrumb from "~/components/Breadcrumb";
import YoIDLayout from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import { ReferrerCreateLinkModal } from "~/components/Referrals/ReferrerCreateLinkModal";
import { ReferrerLinkUsageModal } from "~/components/Referrals/ReferrerLinkUsageModal";
import { ReferrerLinksList } from "~/components/Referrals/ReferrerLinksList";
import { ReferrerProgramsList } from "~/components/Referrals/ReferrerProgramsList";
import { HelpReferrer } from "~/components/Referrals/HelpReferrer";
import { ReferrerStats } from "~/components/Referrals/ReferrerStats";
import { ReferrerLeaderboard } from "~/components/Referrals/ReferrerLeaderboard";

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

  // 👇 prefetch queries on server (match component query keys for cache reuse)
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

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
    },
  };
}

const ReferralsDashboard: NextPageWithLayout<{
  error?: string;
}> = ({ error }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userProfile] = useAtom(userProfileAtom);
  const [createLinkModalVisible, setCreateLinkModalVisible] = useState(false);
  const [selectedProgramForLink, setSelectedProgramForLink] =
    useState<ProgramInfo | null>(null);
  const [selectedLinkForEdit, setSelectedLinkForEdit] =
    useState<ReferralLink | null>(null);
  const [selectedLinkForUsage, setSelectedLinkForUsage] =
    useState<ReferralLink | null>(null);

  // Fetch links to check if user has any (use same query key as ReferrerLinksList for caching)
  const { data: linksData } = useQuery({
    queryKey: ["ReferralLinks", 1, 3], // pageNumber: 1, pageSize: 3
    queryFn: () =>
      searchReferralLinks({
        pageNumber: 1,
        pageSize: 3,
        programId: null,
        valueContains: null,
        statuses: null,
      }),
    enabled: !error,
  });

  // 👇 use prefetched queries from server (match ReferrerProgramsList query key)
  const { data: programsData } = useQuery<ProgramSearchResultsInfo>({
    queryKey: ["ReferralPrograms", 1, 4], // pageNumber: 1, pageSize: 4
    queryFn: () =>
      searchReferralProgramsInfo({
        pageNumber: 1,
        pageSize: 4,
        valueContains: null,
        includeExpired: false,
      }),
    enabled: !error,
  });

  // Check if user is blocked
  const isBlocked = userProfile?.referral?.blocked ?? false;
  const hasLinks = (linksData?.items?.length ?? 0) > 0;

  // Handle create link (no program pre-selected)
  const handleCreateLink = useCallback(() => {
    setSelectedProgramForLink(null);
    setCreateLinkModalVisible(true);
  }, []);

  // Handle create link with program (program pre-selected)
  const handleCreateLinkForProgram = useCallback((program: ProgramInfo) => {
    setSelectedProgramForLink(program);
    setSelectedLinkForEdit(null);
    setCreateLinkModalVisible(true);
  }, []);

  // Handle view usage
  const handleViewUsage = useCallback((link: ReferralLink) => {
    setSelectedLinkForUsage(link);
  }, []);

  // Handle edit link
  const handleEditLink = useCallback((link: ReferralLink) => {
    setSelectedLinkForEdit(link);
    setSelectedProgramForLink(null);
    setCreateLinkModalVisible(true);
  }, []);

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

            {/* WELCOME SECTION */}
            <div className="shadow-custom rounded-lgx bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h1 className="text-lg font-bold text-gray-900 md:text-xl">
                    <IoGift className="text-green mb-1 inline h-6 w-6" /> Share
                    & Earn Together
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
            </div>

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
          </div>
        )}
      </div>

      {/* Create/Edit Link Modal */}
      <ReferrerCreateLinkModal
        programs={programsData?.items || []}
        selectedProgram={selectedProgramForLink || undefined}
        editLink={selectedLinkForEdit || undefined}
        existingLinksCount={0}
        isOpen={createLinkModalVisible}
        onClose={() => {
          setCreateLinkModalVisible(false);
          setSelectedLinkForEdit(null);
          setSelectedProgramForLink(null);
        }}
        onSuccess={async () => {
          // Invalidate the query to trigger a refetch
          await queryClient.invalidateQueries({ queryKey: ["ReferralLinks"] });
        }}
      />

      {/* Link Usage Modal */}
      <ReferrerLinkUsageModal
        link={selectedLinkForUsage}
        isOpen={!!selectedLinkForUsage}
        onClose={() => setSelectedLinkForUsage(null)}
      />
    </>
  );
};

ReferralsDashboard.getLayout = function getLayout(page: ReactElement) {
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default ReferralsDashboard;
