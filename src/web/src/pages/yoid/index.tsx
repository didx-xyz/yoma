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
import { HeaderWithLink } from "~/components/YoID/HeaderWithLink";
import { LineChart } from "~/components/YoID/LineChart";
import { PassportCard } from "~/components/YoID/PassportCard";
import { SkillsCard } from "~/components/YoID/SkillsCard";
import { WalletCard } from "~/components/YoID/WalletCard";
import { ZltoModal } from "~/components/YoID/ZltoModal";
import { MAXINT32 } from "~/lib/constants";
import { userProfileAtom } from "~/lib/store";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

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
  const errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  return {
    props: {
      error: errorCode,
    },
  };
}

// YoID dashboard page
const YoIDDashboard: NextPageWithLayout<{
  error?: number;
}> = ({ error }) => {
  const [zltoModalVisible, setZltoModalVisible] = useState(false);
  const [userProfile] = useAtom(userProfileAtom);

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
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {/* OPPORTUNITIES */}
        <div className="flex w-full flex-col gap-2 sm:w-[616px] md:w-[716px] lg:w-[816px]">
          <HeaderWithLink
            title="🏆 Opportunities"
            url="/yoid/opportunities/completed"
          />
          <div className="flex h-[300px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
            <Suspense
              isLoading={myOpportunitiesSummaryIsLoading}
              error={myOpportunitiesSummaryError}
            >
              <LineChart data={myOpportunitiesSummary!} />
            </Suspense>
          </div>
        </div>

        {/* SKILLS */}
        <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
          <HeaderWithLink title="⚡ Skills" url="/yoid/skills" />
          <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow xl:h-[300px]">
            <div className="flex flex-grow flex-wrap gap-1 overflow-y-auto">
              <Suspense isLoading={skillsIsLoading} error={skillsError}>
                {!skills?.length && (
                  <NoRowsMessage
                    title={"No skills."}
                    description={
                      "Skills that you receive by completing opportunities will be diplayed here."
                    }
                  />
                )}

                {!!skills?.length && <SkillsCard data={skills} />}
              </Suspense>
            </div>
          </div>
        </div>

        {/* WALLET */}
        <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
          <HeaderWithLink title="💸 Wallet" />
          <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
            <Suspense isLoading={!userProfile}>
              <WalletCard userProfile={userProfile!} />
            </Suspense>
          </div>
        </div>

        {/* PASSPORT */}
        <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
          <HeaderWithLink title="🌐 Passport" url="/yoid/passport" />
          <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
            <Suspense isLoading={credentialsIsLoading} error={credentialsError}>
              {!credentials?.length && (
                <NoRowsMessage
                  icon="💳"
                  title={"No credentials."}
                  description={
                    "Complete opportunities to receive your credentials."
                  }
                />
              )}

              {!!credentials?.length && <PassportCard data={credentials} />}
            </Suspense>
          </div>
        </div>

        {/* CV */}
        <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
          <HeaderWithLink title="🏦 CV" />
          <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
            <NoRowsMessage
              icon="🚧"
              title={"Coming soon..."}
              description={
                "Watch this space! Exciting updates are on the way ;)"
              }
            />
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
