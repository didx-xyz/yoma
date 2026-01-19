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
import MainLayout from "~/components/Layout/Main";
import YoIDLayout from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ReferrerCreateLinkModal } from "~/components/Referrals/ReferrerCreateLinkModal";
import { ReferrerLinksList } from "~/components/Referrals/ReferrerLinksList";
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
  const hasPrograms = (programsData?.items?.length ?? 0) > 0;

  const programs = programsData?.items || [];

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

      <div className="w-full lg:max-w-4xl">
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

            {/* MULTI-PROGRAM MODE (DEFAULT) */}
            {hasLinks ? (
              <div className="flex flex-col gap-8">
                {/* LEFT COLUMN - Stats & Leaderboard */}
                <div className="min-w-0 space-y-4 md:space-y-6 lg:col-span-1">
                  {/* STATS CARDS */}
                  <div className="space-y-2">
                    <div className="font-family-nunito text-sm font-semibold text-black md:text-base">
                      Your Performance
                    </div>

                    <ReferrerStats />
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
