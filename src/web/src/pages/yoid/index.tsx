import { settings } from ".eslintrc.cjs";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useState, type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { searchCredentials } from "~/api/services/credentials";
import { searchMyOpportunitiesSummary } from "~/api/services/myOpportunities";
import { getUserSkills } from "~/api/services/user";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import Suspense from "~/components/Common/Suspense";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { CVCard } from "~/components/YoID/CVCard";
import { HeaderWithLink } from "~/components/YoID/HeaderWithLink";
import { LineChart } from "~/components/YoID/LineChart";
import { PassportCard } from "~/components/YoID/PassportCard";
import { SkillsCard } from "~/components/YoID/SkillsCard";
import { WalletCard } from "~/components/YoID/WalletCard";
import { ZltoModal } from "~/components/YoID/ZltoModal";
import { MAXINT32 } from "~/lib/constants";
import { userProfileAtom } from "~/lib/store";
import { getTimeOfDayAndEmoji } from "~/lib/utils";
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
      user: session?.user ?? null,
      error: errorCode,
    },
  };
}

// YoID dashboard page
const YoIDDashboard: NextPageWithLayout<{
  user?: any;
  error?: number;
}> = ({ user, error }) => {
  const [zltoModalVisible, setZltoModalVisible] = useState(false);
  const [timeOfDay, timeOfDayEmoji] = getTimeOfDayAndEmoji();
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
      <Head>
        <title>Yoma | 💳 Yo-ID</title>
      </Head>

      <PageBackground className="h-[15rem] md:h-[16rem]" />

      <ZltoModal
        isOpen={zltoModalVisible}
        onClose={() => setZltoModalVisible(false)}
      />

      <div className="container z-10 mt-[6rem] max-w-7xl overflow-hidden px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* HEADER */}
          <div className="flex flex-col gap-2">
            {/* WELCOME MSG */}
            <div className="truncate text-xl font-semibold text-white md:text-2xl">
              <span>
                {timeOfDayEmoji} Good {timeOfDay}&nbsp;
                <span>{user?.name}!</span>
              </span>
            </div>

            <div className="flex flex-row items-center gap-2 text-white">
              {/* DESCRIPTION */}
              <span className="truncate">Welcome to your Yo-ID</span>

              {/* TOOLTIP */}
              <button type="button" onClick={() => setZltoModalVisible(true)}>
                <IoIosInformationCircleOutline className="h-6 w-6" />
              </button>
            </div>

            {/* BUTTONS */}
            <div className="mt-4 flex flex-row gap-2">
              <Link
                className="md:btn-mdx btn btn-secondary btn-sm w-1/2 md:max-w-[200px]"
                href="/yoid/profile"
              >
                👤 Edit Profile
              </Link>
              <Link
                className="md:btn-mdx btn btn-secondary btn-sm w-1/2 md:max-w-[200px]"
                href="/yoid/settings"
              >
                🔧 Settings
              </Link>
            </div>
          </div>

          {/* DASHBOARD */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 lg:justify-normal">
            {/* OPPORTUNITIES */}
            <div className="flex w-full flex-col gap-2 sm:w-[616px] md:w-[716px] lg:w-[816px]">
              <HeaderWithLink
                title="🏆 Opportunities"
                url="/yoid/opportunities"
              />
              <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                <Suspense
                  isLoading={myOpportunitiesSummaryIsLoading}
                  error={myOpportunitiesSummaryError}
                >
                  <LineChart data={myOpportunitiesSummary!} />
                </Suspense>
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
                <Suspense
                  isLoading={credentialsIsLoading}
                  error={credentialsError}
                >
                  {!credentials?.length && (
                    <FormMessage messageType={FormMessageType.Warning}>
                      No data available
                    </FormMessage>
                  )}

                  {!!credentials?.length && <PassportCard data={credentials} />}
                </Suspense>
              </div>
            </div>

            {/* SKILLS */}
            <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
              <HeaderWithLink title="⚡ Skills" url="/yoid/skills" />
              <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                <div className="flex flex-wrap gap-1 overflow-y-auto">
                  <Suspense isLoading={skillsIsLoading} error={skillsError}>
                    {!skills?.length && (
                      <FormMessage messageType={FormMessageType.Warning}>
                        No data available
                      </FormMessage>
                    )}

                    {!!skills?.length && <SkillsCard data={skills} />}
                  </Suspense>
                </div>
              </div>
            </div>

            {/* CV */}
            <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
              <HeaderWithLink title="🏦 CV" />
              <CVCard />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

YoIDDashboard.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default YoIDDashboard;
