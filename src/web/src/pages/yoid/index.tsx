import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useState, type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { searchCredentials } from "~/api/services/credentials";
import { searchMyOpportunitiesSummary } from "~/api/services/myOpportunities";
import { getUserSkills } from "~/api/services/user";
import Suspense from "~/components/Common/Suspense";
import YoIDLayout from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { Header } from "~/components/Common/Header";
import { LineChart } from "~/components/YoID/LineChart";
import { OpportunitiesSummary } from "~/components/YoID/OpportunitiesSummary";
import { PassportCard } from "~/components/YoID/PassportCard";
import { SkillsCard } from "~/components/YoID/SkillsCard";
import { WalletCard } from "~/components/YoID/WalletCard";
import { ZltoModal } from "~/components/YoID/ZltoModal";
import { MAXINT32 } from "~/lib/constants";
import { userProfileAtom } from "~/lib/store";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { env } from "process";

export interface OrganizationSearchFilterSummaryViewModel {
  organization: string;
  opportunities: string[] | null;
  categories: string[] | null;
  startDate: string | null;
  endDate: string | null;
  pageSelectedOpportunities: number;
  pageCompletedYouth: number;
  countries: string[] | null;
}

// ⚠️ SSR
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

  // check if passport is enabled
  const passport_enabled =
    env.NEXT_PUBLIC_PASSPORT_ENABLED?.toLowerCase() == "true" ? true : false;

  return {
    props: {
      passport_enabled,
    },
  };
}

// YoID dashboard page
const YoIDDashboard: NextPageWithLayout<{
  error?: number;
  passport_enabled: boolean;
}> = ({ error, passport_enabled }) => {
  const [zltoModalVisible, setZltoModalVisible] = useState(false);
  const [userProfile] = useAtom(userProfileAtom);
  const [graphView, setGraphView] = useState(false);

  const {
    data: skills,
    error: skillsError,
    isLoading: skillsIsLoading,
  } = useQuery({
    queryKey: ["User", "Skills"],
    queryFn: () => getUserSkills(),
    enabled: !error,
  });

  const {
    data: myOpportunitiesSummary,
    error: myOpportunitiesSummaryError,
    isLoading: myOpportunitiesSummaryIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Summary"],
    queryFn: () => searchMyOpportunitiesSummary(),
    enabled: !error,
  });

  const {
    data: credentials,
    error: credentialsError,
    isLoading: credentialsIsLoading,
  } = useQuery<{ schemaType: string; totalCount: number | null }[]>({
    queryKey: ["Credentials", "TotalCounts"],
    queryFn: (): Promise<{ schemaType: string; totalCount: number | null }[]> =>
      Promise.all([
        searchCredentials({
          pageNumber: MAXINT32,
          pageSize: 1,
          schemaType: "Opportunity",
        }),
        searchCredentials({
          pageNumber: MAXINT32,
          pageSize: 1,
          schemaType: "YoID",
        }),
      ]).then(([opportunityResult, yoidResult]) => {
        const combinedResults = [
          {
            schemaType: "Opportunity",
            totalCount: opportunityResult.totalCount,
          },
          { schemaType: "YoID", totalCount: yoidResult.totalCount },
        ];

        return combinedResults;
      }),
    enabled: !error,
  });

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <ZltoModal
        isOpen={zltoModalVisible}
        onClose={() => setZltoModalVisible(false)}
      />

      {/* DASHBOARD */}
      <div className="mt-2 flex h-full w-full flex-wrap items-center justify-center gap-4 lg:max-w-7xl">
        {/* WALLET */}
        <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
          <Header title="💸 Wallet" url="/yoid/wallet" />
          <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
            <Suspense
              isLoading={!userProfile}
              loader={
                <LoadingInline
                  className="h-[185px] flex-col p-0"
                  classNameSpinner="h-12 w-12"
                />
              }
            >
              <WalletCard userProfile={userProfile!} />
            </Suspense>
          </div>
        </div>

        {/* PASSPORT */}
        <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
          <Header title="🌐 Passport" url="/yoid/passport" />
          <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
            {passport_enabled ? (
              <Suspense
                isLoading={credentialsIsLoading}
                error={credentialsError}
                loader={
                  <LoadingInline
                    className="h-[185px] flex-col p-0"
                    classNameSpinner="h-12 w-12"
                  />
                }
              >
                <PassportCard data={credentials!} />
              </Suspense>
            ) : (
              <NoRowsMessage
                title={"Update in Progress"}
                description={
                  "Credentials will begin displaying again soon. Thanks for your patience."
                }
              />
            )}
          </div>
        </div>

        {/* SKILLS */}
        <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
          <Header title="⚡ Skills" url="/yoid/skills" />
          <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
            <div className="flex flex-wrap gap-1 overflow-y-auto">
              <Suspense isLoading={skillsIsLoading} error={skillsError}>
                <SkillsCard data={skills!} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* CV */}
        <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
          <Header title="🏦 CV" />
          <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow xl:h-[300px]">
            <NoRowsMessage
              icon="🚧"
              title={"Coming soon..."}
              description={
                "Watch this space! Exciting updates are on the way ;)"
              }
            />
          </div>
        </div>

        {/* OPPORTUNITIES */}
        <div className="relative flex h-full w-full flex-col gap-2 sm:w-[616px] md:w-[716px] lg:w-[816px]">
          <Header
            title="🏆 Opportunities"
            url="/yoid/opportunities/completed"
          />
          <button
            onClick={() => setGraphView(!graphView)}
            className="absolute left-[9rem] flex sm:left-[8.5rem] lg:left-[9rem]"
          >
            {graphView ? "📋" : "📈"}&nbsp;
            <span className="text-gray-dark my-auto text-xs underline">
              {graphView ? "View Summary" : "View Graph"}
            </span>
          </button>

          <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg bg-white p-4 shadow md:h-[300px]">
            <Suspense
              isLoading={myOpportunitiesSummaryIsLoading}
              error={myOpportunitiesSummaryError}
            >
              {graphView ? (
                <LineChart data={myOpportunitiesSummary!} />
              ) : (
                <OpportunitiesSummary
                  data={myOpportunitiesSummary}
                  showSaved={true}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
};

YoIDDashboard.getLayout = function getLayout(page: ReactElement) {
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default YoIDDashboard;
