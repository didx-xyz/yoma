import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { FaPlus } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { IoWarningOutline } from "react-icons/io5";
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
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import YoIDLayout from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ReferrerCreateLinkModal } from "~/components/Referrals/ReferrerCreateLinkModal";
import { ReferrerLeaderboard } from "~/components/Referrals/ReferrerLeaderboard";
import { ReferrerLinksList } from "~/components/Referrals/ReferrerLinksList";
import { ReferrerPerformanceOverview } from "~/components/Referrals/ReferrerPerformanceOverview";
import { ReferrerReferralsList } from "~/components/Referrals/ReferrerReferralsList";
import { ReferrerStats } from "~/components/Referrals/ReferrerStats";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { handleUserSignIn } from "~/lib/authUtils";
import { config } from "~/lib/react-query-config";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import { ReferrerProgramsList } from "~/components/Referrals/ReferrerProgramsList";

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

  // MULTI-PROGRAM MODE ONLY: prefetch queries on server
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
  error?: number;
}> = ({ error }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userProfile = useAtomValue(userProfileAtom);

  // State for multi-program mode only
  const [createLinkModalVisible, setCreateLinkModalVisible] = useState(false);
  const [selectedProgramForLink, setSelectedProgramForLink] =
    useState<ProgramInfo | null>(null);
  const [selectedLinkForEdit, setSelectedLinkForEdit] =
    useState<ReferralLink | null>(null);
  const [selectedLinkForUsage, setSelectedLinkForUsage] =
    useState<ReferralLink | null>(null);

  const { data: programsData } = useQuery<ProgramSearchResultsInfo>({
    queryKey: ["ReferralPrograms", 1, 4],
    queryFn: () =>
      searchReferralProgramsInfo({
        pageNumber: 1,
        pageSize: 4,
        valueContains: null,
        includeExpired: false,
      }),
    enabled: !error,
  });

  // Fetch links
  const { data: linksData } = useQuery({
    queryKey: ["ReferralLinks", 1, 3],
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

  // Check if user is blocked
  const isBlocked = userProfile?.referral?.blocked ?? false;
  const hasLinks = (linksData?.items?.length ?? 0) > 0;

  const programs = programsData?.items || [];

  // Handle create link (no program pre-selected)
  const handleCreateLink = useCallback(() => {
    setSelectedProgramForLink(null);
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

  // Handle create link with program (program pre-selected)
  const handleCreateLinkForProgram = useCallback((program: ProgramInfo) => {
    setSelectedProgramForLink(program);
    setSelectedLinkForEdit(null);
    setCreateLinkModalVisible(true);
  }, []);

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
                <div>
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

            {/* MULTI-PROGRAM MODE (DEFAULT) */}
            {hasLinks ? (
              <div className="grid gap-4 overflow-hidden md:gap-6 lg:grid-cols-3">
                {/* LEFT COLUMN - Stats & Leaderboard */}
                <div className="min-w-0 space-y-4 md:space-y-6 lg:col-span-1">
                  {/* STATS CARDS */}
                  <div className="space-y-2">
                    <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                      Your Performance
                    </div>
                    <div className="rounded-lg bg-white p-4">
                      <ReferrerStats />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Links */}
                <div className="min-w-0 space-y-4 md:space-y-6 lg:col-span-2">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                        Your Links
                      </div>
                      {!!programsData?.totalCount && (
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
                      initialPageSize={3}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                    Available Programs
                  </div>
                </div>

                <ReferrerProgramsList
                  onProgramClick={handleCreateLinkForProgram}
                  onCreateLink={handleCreateLinkForProgram}
                  initialPageSize={4}
                  showHeader={false} //TODO:
                  showDescription={true}
                  context="list"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <>
        {/* Create/Edit Link Modal */}
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
          onSuccess={async () => {
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
                    Link Performance
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
                        Link stats
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

                    <ReferrerReferralsList linkId={selectedLinkForUsage.id} />
                  </div>
                </div>

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
