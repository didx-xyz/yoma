import { QueryClient, dehydrate } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import type { MyOpportunityResponseVerify } from "~/api/models/myOpportunity";
import { type OpportunityInfo } from "~/api/models/opportunity";
import {
  getVerificationStatus,
  performActionViewed,
} from "~/api/services/myOpportunities";
import {
  getOpportunityInfoById,
  getOpportunityInfoByIdAdminOrgAdminOrUser,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import OpportunityMetaTags from "~/components/Opportunity/OpportunityMetaTags";
import OpportunityPublicDetails from "~/components/Opportunity/OpportunityPublicDetails";
import { PageBackground } from "~/components/PageBackground";
import { config } from "~/lib/react-query-config";
import type { NextPageWithLayout } from "~/pages/_app";
import { type User, authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { opportunityId } = context.params as IParams;
  const queryClient = new QueryClient(config);
  const session = await getServerSession(context.req, context.res, authOptions);
  let errorCode = null;
  let dataOpportunityInfo: OpportunityInfo | null = null;

  try {
    // 👇 prefetch queries on server
    let dataVerificationStatus: MyOpportunityResponseVerify | null = null;

    if (session) {
      // authenticated user (user may be an admin, orgDamin or the user has completed the opportunitiy)
      dataOpportunityInfo = await getOpportunityInfoByIdAdminOrgAdminOrUser(
        opportunityId,
        context,
      );
    } else {
      // anonymous user (can see published and active opportunities only)
      dataOpportunityInfo = await getOpportunityInfoById(
        opportunityId,
        false,
        context,
      );
    }

    if (session)
      dataVerificationStatus = await getVerificationStatus(
        opportunityId,
        context,
      );

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["verificationStatus", opportunityId],
        queryFn: () => dataVerificationStatus ?? null,
      }),
    ]);

    // 👇 perform viewed action (authenticated users only)
    if (session && dataOpportunityInfo.published)
      await performActionViewed(opportunityId, context);
  } catch (error) {
    console.error("Error fetching data in getServerSideProps", error);
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      opportunityInfo: dataOpportunityInfo,
      error: errorCode,
    },
  };
}

const OpportunityDetails: NextPageWithLayout<{
  user: User;
  opportunityInfo: OpportunityInfo;
  error?: number;
}> = ({ user, opportunityInfo, error }) => {
  const router = useRouter();

  return (
    <>
      <OpportunityMetaTags opportunityInfo={opportunityInfo} />

      <PageBackground />

      <div className="container z-10 mt-16 max-w-7xl overflow-hidden px-2 py-4 md:mt-20">
        {/* BREADCRUMB */}
        <div className="flex flex-col gap-2 py-6 sm:flex-row">
          <div className="flex-grow overflow-hidden text-ellipsis px-2 text-sm md:whitespace-nowrap">
            <ul>
              <li className="inline">
                <button
                  className="inline text-white hover:text-gray "
                  onClick={() => router.back()}
                >
                  <IoMdArrowRoundBack className="mb-[2px] mr-1 inline h-4 w-4" />
                  Opportunities
                </button>
              </li>
              <li className="inline">
                <p className="mx-2 inline font-semibold text-white">|</p>
              </li>
              <li className="inline">
                <div className="inline max-w-[600px] text-white">
                  {opportunityInfo.title}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <OpportunityPublicDetails
          opportunityInfo={opportunityInfo}
          user={user}
          error={error}
          preview={false}
        />
      </div>
    </>
  );
};

OpportunityDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default OpportunityDetails;
