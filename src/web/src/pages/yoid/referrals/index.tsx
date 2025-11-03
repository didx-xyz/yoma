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
import {
  IoGift,
  IoInformationCircleOutline,
  IoStatsChart,
  IoTrophy,
  IoWarning,
} from "react-icons/io5";
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
import { PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import { CreateLinkModal } from "~/components/Referrals/CreateLinkModal";
import { LinkUsageModal } from "~/components/Referrals/LinkUsageModal";
import { PathwayPreview } from "~/components/Referrals/PathwayPreview";
import { LinksList } from "~/components/Referrals/LinksList";
import { ProgramsList } from "~/components/Referrals/ProgramsList";
import {
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoCreateOutline,
  IoShareSocialOutline,
  IoWalletOutline,
} from "react-icons/io5";

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

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["ReferralLinks"],
    queryFn: () =>
      searchReferralLinks(
        {
          pageNumber: 1,
          pageSize: PAGE_SIZE,
          programId: null,
          valueContains: null,
          statuses: null,
        },
        context,
      ),
  });

  await queryClient.prefetchQuery({
    queryKey: ["ReferralPrograms"],
    queryFn: () =>
      searchReferralProgramsInfo(
        {
          pageNumber: 1,
          pageSize: 10,
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

  // 👇 use prefetched queries from server
  const {
    data: programsData,
    error: programsError,
    isLoading: programsIsLoading,
  } = useQuery<ProgramSearchResultsInfo>({
    queryKey: ["ReferralPrograms"],
    queryFn: () =>
      searchReferralProgramsInfo({
        pageNumber: 1,
        pageSize: 10,
        valueContains: null,
        includeExpired: false,
      }),
    enabled: !error,
  });

  // Check if user is blocked
  const isBlocked = userProfile?.referral?.blocked ?? false;
  const hasPrograms = (programsData?.items?.length ?? 0) > 0;

  // Expand main "How It Works" for first-time users, but collapse details
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(false);
  const [howItWorksDetailsExpanded, setHowItWorksDetailsExpanded] =
    useState(false);

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
          <>
            {/* Welcome: Refer a friend */}
            <div className="mb-4 flex items-center justify-center">
              <NoRowsMessage
                title="Refer a friend"
                subTitle="Good things are better when shared. Invite your friends to
                    Yoma and help them start their journey."
                description="Earn the power to refer by completing your own Yoma
                  opportunities. Share your link, and when your friend signs up
                  and completes their first onboarding opportunity, you both win
                  rewards!"
                icon={"💝"}
                className="max-w-2xl !bg-transparent"
              />
            </div>

            {/* WELCOME SECTION */}
            <div className="shadow-custom rounded-lgx mb-6 bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
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
                {hasPrograms && (
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
            <div className="shadow-custom mb-6 rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6">
              {/* Header with Toggle */}
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="mb-2 flex items-center gap-3 text-xl font-bold text-gray-900">
                    <IoInformationCircleOutline className="text-green h-8 w-8" />
                    How It Works
                  </h2>
                  <p className="text-gray-dark text-sm">
                    Learn how to share Yoma, earn rewards, and understand
                    program requirements
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHowItWorksExpanded(!howItWorksExpanded)}
                  className="btn btn-sm text-green gap-1 border-green-300 bg-transparent hover:bg-green-100"
                >
                  {howItWorksExpanded ? (
                    <>
                      <IoChevronUp className="h-4 w-4" />
                      <span className="text-xs">Hide</span>
                    </>
                  ) : (
                    <>
                      <IoChevronDown className="h-4 w-4" />
                      <span className="text-xs">Show</span>
                    </>
                  )}
                </button>
              </div>

              {/* Collapsible Content */}
              {howItWorksExpanded && (
                <div className="animate-fade-in space-y-6">
                  {/* Quick Overview - Centered Timeline */}
                  <div className="flex justify-center md:pt-32">
                    <ul className="timeline timeline-vertical timeline-snap-icon max-md:timeline-compact lg:timeline-horizontal [&_li]:md:gap-8">
                      {/* Step 1 */}
                      <li>
                        <div className="timeline-middle">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 shadow-lg ring-4 ring-blue-100">
                            <IoCreateOutline className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="timeline-start mb-10 md:mb-0">
                          <div className="timeline-box group min-h-[120px] border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md transition-all hover:shadow-lg">
                            <div className="mb-1 flex items-center gap-2 text-sm font-bold text-blue-600">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                                1
                              </span>
                              Step 1
                            </div>
                            <h3 className="font-bold text-gray-900">
                              Create Your Link
                            </h3>
                            <p className="text-xs text-gray-600">
                              Get a personalized referral link
                            </p>
                          </div>
                        </div>
                        <hr className="bg-blue-600" />
                      </li>

                      {/* Step 2 */}
                      <li>
                        <hr className="bg-green" />
                        <div className="timeline-middle">
                          <div className="bg-green flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ring-green-100">
                            <IoShareSocialOutline className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="timeline-end mb-10 md:mb-0">
                          <div className="timeline-box border-green group min-h-[120px] border-2 bg-gradient-to-br from-green-50 to-white shadow-md transition-all hover:shadow-lg">
                            <div className="text-green mb-1 flex items-center gap-2 text-sm font-bold">
                              <span className="bg-green flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
                                2
                              </span>
                              Step 2
                            </div>
                            <h3 className="font-bold text-gray-900">
                              Share With Friends
                            </h3>
                            <p className="text-xs text-gray-600">
                              Spread the word and track progress
                            </p>
                          </div>
                        </div>
                        <hr className="bg-green" />
                      </li>

                      {/* Step 3 */}
                      <li>
                        <hr className="bg-yellow-600" />
                        <div className="timeline-middle">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-600 shadow-lg ring-4 ring-yellow-100">
                            <IoWalletOutline className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="timeline-start mb-10 md:mb-0">
                          <div className="timeline-box group min-h-[120px] border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white shadow-md transition-all hover:shadow-lg">
                            <div className="mb-1 flex items-center gap-2 text-sm font-bold text-yellow-600">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-600 text-xs text-white">
                                3
                              </span>
                              Step 3
                            </div>
                            <h3 className="font-bold text-gray-900">
                              Earn Together
                            </h3>
                            <p className="text-xs text-gray-600">
                              Both of you receive ZLTO rewards
                            </p>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Toggle Details Button */}
                  <div className="flex justify-center border-t-2 border-green-200 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setHowItWorksDetailsExpanded(!howItWorksDetailsExpanded)
                      }
                      className="btn btn-sm text-green gap-1 border-green-300 bg-transparent hover:bg-green-100"
                    >
                      {howItWorksDetailsExpanded ? (
                        <>
                          <IoChevronUp className="h-4 w-4" />
                          <span className="text-xs">Hide</span>
                        </>
                      ) : (
                        <>
                          <IoChevronDown className="h-4 w-4" />
                          <span className="text-xs">Details</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Nested Expanded Details */}
                  {howItWorksDetailsExpanded && (
                    <div className="animate-fade-in space-y-6">
                      {/* Detailed Step Cards */}
                      <div className="grid gap-6 md:grid-cols-3">
                        {/* Step 1 Detailed */}
                        <div className="group rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 transition-all hover:shadow-lg">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-md">
                            1
                          </div>
                          <h3 className="mb-2 text-lg font-bold text-gray-900">
                            Create Your Link
                          </h3>
                          <p className="text-gray-dark mb-3 text-sm leading-relaxed">
                            Choose from available programs and get a
                            personalized referral link. You can create multiple
                            links for different programs and customize each one
                            with your own name and description.
                          </p>
                          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                            <IoCheckmarkCircle className="h-4 w-4" />
                            <span>Quick & Easy</span>
                          </div>
                        </div>

                        {/* Step 2 Detailed */}
                        <div className="group rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 transition-all hover:shadow-lg">
                          <div className="bg-green mb-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white shadow-md">
                            2
                          </div>
                          <h3 className="mb-2 text-lg font-bold text-gray-900">
                            Share With Friends
                          </h3>
                          <p className="text-gray-dark mb-3 text-sm leading-relaxed">
                            Spread the word through social media, messaging
                            apps, or email. Each person who signs up using your
                            link becomes your referee, and you can track their
                            progress in real-time.
                          </p>
                          <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                            <IoCheckmarkCircle className="h-4 w-4" />
                            <span>Track Progress</span>
                          </div>
                        </div>

                        {/* Step 3 Detailed */}
                        <div className="group rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-6 transition-all hover:shadow-lg">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-600 text-2xl text-white shadow-md">
                            3
                          </div>
                          <h3 className="mb-2 text-lg font-bold text-gray-900">
                            Earn Together
                          </h3>
                          <p className="text-gray-dark mb-3 text-sm leading-relaxed">
                            When your friend completes the program requirements,
                            you'll both receive ZLTO rewards! The more friends
                            you refer successfully, the more you earn together.
                          </p>
                          <div className="flex items-center gap-2 text-xs font-semibold text-yellow-700">
                            <IoCheckmarkCircle className="h-4 w-4" />
                            <span>Mutual Benefits</span>
                          </div>
                        </div>
                      </div>

                      {/* Program Requirements Section */}
                      <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-6">
                        <div className="mb-4">
                          <h3 className="flex items-center gap-2 text-lg font-bold text-purple-900">
                            <IoCheckmarkCircle className="h-6 w-6" />
                            Understanding Program Requirements
                          </h3>
                          <p className="text-gray-dark mt-1 text-sm">
                            Learn what your friends need to complete
                          </p>
                        </div>

                        {/* Requirements Explanation */}
                        <div className="space-y-4">
                          {/* Explanation */}
                          <div className="rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50 p-6 shadow-lg">
                            <div className="mb-4 flex items-center gap-3">
                              <span className="text-3xl">⚠️</span>
                              <h4 className="text-lg font-bold text-orange-900">
                                What Your Friends Need To Do
                              </h4>
                            </div>
                            <div className="space-y-3 text-sm text-gray-800">
                              <p className="font-medium">
                                Each program has its own set of requirements.
                                These can include:
                              </p>
                              <ul className="ml-6 list-disc space-y-3">
                                <li>
                                  <span className="font-bold text-orange-900">
                                    Proof of Person:
                                  </span>{" "}
                                  Identity verification to ensure they're a real
                                  person (helps prevent fraud)
                                </li>
                                <li>
                                  <span className="font-bold text-orange-900">
                                    Pathway Completion:
                                  </span>{" "}
                                  A series of steps and tasks they need to
                                  complete, like learning modules, workshops, or
                                  community projects
                                </li>
                                <li>
                                  <span className="font-bold text-orange-900">
                                    ZLTO Rewards:
                                  </span>{" "}
                                  Some programs offer rewards for both you and
                                  your friend, while others may not have rewards
                                </li>
                              </ul>
                              <div className="mt-4 rounded-md border-2 border-orange-400 bg-white p-4">
                                <p className="flex items-center gap-2 font-semibold text-orange-900">
                                  <span className="text-2xl">💡</span>
                                  <span>
                                    <strong>Important:</strong> Different
                                    programs have different requirements and
                                    rewards. Always check the program details
                                    before sharing!
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Example Journey */}
                          <div>
                            <PathwayPreview />
                          </div>

                          {/* Key Points */}
                          <div className="rounded-lg bg-white p-4">
                            <h4 className="mb-3 font-semibold text-gray-900">
                              Key Things To Know
                            </h4>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="flex gap-3 rounded-lg bg-blue-50 p-3">
                                <span className="text-xl">⏱️</span>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Time Requirements
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Pathways can range from minutes to hours
                                    depending on complexity
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-3 rounded-lg bg-green-50 p-3">
                                <span className="text-xl">🎯</span>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Completion Tracking
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    You can monitor your referee's progress in
                                    real-time
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-3 rounded-lg bg-yellow-50 p-3">
                                <span className="text-xl">💰</span>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Rewards Vary
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Each program sets its own reward amounts for
                                    referrers and referees
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-3 rounded-lg bg-purple-50 p-3">
                                <span className="text-xl">✓</span>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Verification Methods
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Tasks may be verified automatically or
                                    manually by admins
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* System Abuse Warning */}
                      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
                        <div className="mb-4">
                          <h3 className="flex items-center gap-2 text-lg font-bold text-red-900">
                            <span className="text-2xl">🚫</span>
                            Important: Prevent Account Suspension
                          </h3>
                          <p className="text-gray-dark mt-1 text-sm">
                            Fair use policy for the referral program
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-lg border-2 border-red-300 bg-white p-6 shadow-lg">
                            <div className="mb-4 flex items-center gap-3">
                              <span className="text-3xl">⚠️</span>
                              <h4 className="text-lg font-bold text-red-900">
                                You Can Be Blocked If You Abuse The System
                              </h4>
                            </div>
                            <div className="space-y-3 text-sm text-gray-800">
                              <p className="font-medium">
                                To maintain a fair and trustworthy referral
                                program, please follow these guidelines:
                              </p>
                              <ul className="ml-6 list-disc space-y-3">
                                <li>
                                  <span className="font-bold text-red-900">
                                    Don't Create Too Many Links:
                                  </span>{" "}
                                  Creating excessive referral links may be
                                  flagged as suspicious activity and result in
                                  account suspension
                                </li>
                                <li>
                                  <span className="font-bold text-red-900">
                                    Share With Real People:
                                  </span>{" "}
                                  Only share your links with genuine contacts
                                  who are interested in Yoma. Fake referrals or
                                  spam will lead to permanent blocking
                                </li>
                                <li>
                                  <span className="font-bold text-red-900">
                                    One Person, One Reward:
                                  </span>{" "}
                                  If someone has already completed the
                                  onboarding through another link, they cannot
                                  be referred again
                                </li>
                                <li>
                                  <span className="font-bold text-red-900">
                                    Quality Over Quantity:
                                  </span>{" "}
                                  Focus on sharing with people who will
                                  genuinely benefit from Yoma, rather than
                                  trying to maximize numbers
                                </li>
                              </ul>
                              <div className="mt-4 rounded-md border-2 border-red-400 bg-red-50 p-4">
                                <p className="flex items-center gap-2 font-semibold text-red-900">
                                  <span className="text-2xl">🛑</span>
                                  <span>
                                    <strong>Warning:</strong> Violations of
                                    these policies may result in immediate
                                    suspension of your referral privileges and
                                    potential account termination. See our{" "}
                                    <a
                                      href="/help"
                                      target="_blank"
                                      className="underline hover:text-red-700"
                                    >
                                      Help
                                    </a>{" "}
                                    or{" "}
                                    <a
                                      href="/terms"
                                      target="_blank"
                                      className="underline hover:text-red-700"
                                    >
                                      Terms
                                    </a>{" "}
                                    section for complete policies.
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Terms & Conditions */}
                      <div className="border-gray-light border-t pt-4">
                        <button className="text-green hover:text-green-dark text-sm font-semibold underline transition-all hover:scale-105">
                          View Full Terms & Conditions
                        </button>
                      </div>

                      {/* Bottom Toggle Button */}
                      <div className="flex justify-center border-t-2 border-green-200 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setHowItWorksDetailsExpanded(
                              !howItWorksDetailsExpanded,
                            )
                          }
                          className="btn btn-sm text-green gap-1 border-green-300 bg-transparent hover:bg-green-100"
                        >
                          <IoChevronUp className="h-4 w-4" />
                          <span className="text-xs">Hide</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CONTENT AREA */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* LEFT COLUMN - Stats & Leaderboard */}
              <div className="space-y-6 lg:col-span-1">
                {/* STATS CARDS - TODO: Implement actual stats */}
                <div className="shadow-custom rounded-lg bg-white p-6">
                  <h2 className="mb-4 flex items-center gap-4 text-lg font-bold text-gray-900">
                    <IoStatsChart className="text-green inlinex h-6 w-6" /> Your
                    Stats
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                      <span className="text-sm text-gray-700">
                        Total Referrals
                      </span>
                      <span className="badge bg-blue-600 text-white">0</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                      <span className="text-sm text-gray-700">ZLTO Earned</span>
                      <span className="badge bg-yellow-600 text-white">0</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                      <span className="text-sm text-gray-700">Completed</span>
                      <span className="badge bg-green-600 text-white">0</span>
                    </div>
                  </div>
                </div>

                {/* LEADERBOARD - Mocked */}
                <div className="shadow-custom rounded-lg bg-white p-6">
                  <h2 className="mb-4 flex items-center gap-4 text-lg font-bold text-gray-900">
                    <IoTrophy className="text-green inline h-8 w-8" /> Top
                    Referrers
                  </h2>

                  <div className="space-y-2">
                    {[
                      { name: "Sarah M.", referrals: 45, zlto: 900 },
                      { name: "John D.", referrals: 38, zlto: 760 },
                      { name: "Emily R.", referrals: 32, zlto: 640 },
                      { name: "You", referrals: 0, zlto: 0 },
                    ].map((user, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between rounded-lg p-3 ${
                          user.name === "You"
                            ? "bg-green-light border-green border-2"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-gray-700">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {user.referrals} referrals
                            </p>
                          </div>
                        </div>
                        <span className="badge bg-yellow-600 text-white">
                          {user.zlto} ZLTO
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-dark mt-4 text-center text-xs italic">
                    *Leaderboard preview - coming soon!
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN - Links & Programs */}
              <div className="space-y-6 lg:col-span-2">
                {/* MY LINKS */}
                <LinksList
                  programs={programsData?.items || []}
                  onViewUsage={handleViewUsage}
                  onEdit={handleEditLink}
                  onCreateLink={handleCreateLink}
                  initialPageSize={3}
                />

                {/* ACTIVE PROGRAMS */}
                <ProgramsList
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

      {/* Create/Edit Link Modal */}
      <CreateLinkModal
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
        onSuccess={async (link) => {
          // Invalidate the query to trigger a refetch
          await queryClient.invalidateQueries({ queryKey: ["ReferralLinks"] });
        }}
      />

      {/* Link Usage Modal */}
      <LinkUsageModal
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
