import { QueryClient, dehydrate } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import type { MyOpportunityResponseVerify } from "~/api/models/myOpportunity";
import {
  type OpportunityInfo,
  type SyncInfoEntity,
} from "~/api/models/opportunity";
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
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { OPPORTUNITY_QUERY_KEYS } from "~/hooks/useOpportunityMutations";
import { config } from "~/lib/react-query-config";
import type { NextPageWithLayout } from "~/pages/_app";
import { type User, authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
}

// const DEV_PARTNER_MANAGED_SYNC_INFO: SyncInfoEntity = {
//   syncType: "Pull",
//   locked: true,
//   partners: [
//     {
//       partner: "Sample Partner",
//       externalId: "test-external-id",
//       url: null,
//     },
//   ],
// };

const DEV_PENDING_VERIFICATION_STATUS: MyOpportunityResponseVerify = {
  status: "Pending",
  comment: null,
};

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
      // authenticated user (user may be an admin, orgDamin or the user has completed the opportunity)
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

    // TODO: remove before commit. Force partner-managed pending state for dev testing.
    // if (
    //   process.env.NODE_ENV !== "production" &&
    //   session &&
    //   dataOpportunityInfo &&
    //   dataOpportunityInfo.verificationEnabled &&
    //   dataOpportunityInfo.verificationMethod == "Manual"
    // ) {
    //   dataOpportunityInfo = {
    //     ...dataOpportunityInfo,
    //     syncedInfo:
    //       dataOpportunityInfo.syncedInfo ?? DEV_PARTNER_MANAGED_SYNC_INFO,
    //   };
    //   dataVerificationStatus = DEV_PENDING_VERIFICATION_STATUS;
    // }

    await queryClient.prefetchQuery({
      queryKey: OPPORTUNITY_QUERY_KEYS.verificationStatus(opportunityId),
      queryFn: () => dataVerificationStatus ?? null,
    });

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
  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <OpportunityMetaTags opportunityInfo={opportunityInfo} />

      <PageBackground />

      <div className="z-10 container mt-16 max-w-7xl overflow-hidden px-2 py-4 md:mt-20">
        {/* BREADCRUMB */}
        <div className="flex flex-row items-center gap-2 py-6 text-xs text-white">
          <Link
            className="hover:text-gray flex max-w-[200px] min-w-0 items-center font-bold"
            href="/opportunities"
          >
            <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4 shrink-0" />
            <span className="truncate">Opportunities</span>
          </Link>

          <div className="font-bold">|</div>
          <span className="max-w-[200px] min-w-0 truncate">
            {opportunityInfo.title}
          </span>
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
