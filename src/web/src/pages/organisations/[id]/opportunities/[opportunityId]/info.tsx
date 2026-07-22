import { QueryClient, dehydrate } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "node:querystring";
import { type ReactElement } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import {
  IoBulbOutline,
  IoLanguageOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoPricetagsOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";
import { getOpportunityInfoByIdAdminOrgAdminOrUser } from "~/api/services/opportunities";
import {
  OPPORTUNITY_QUERY_KEYS,
  useOpportunityInfoQuery,
} from "~/hooks/useOpportunityMutations";
import { AvatarImage } from "~/components/AvatarImage";
import DetailSection from "~/components/Common/DetailSection";
import { OpportunityCustomFieldsSection } from "~/components/Opportunity/OpportunityCustomFieldsSection";
import MainLayout from "~/components/Layout/Main";
import OrgAdminBadges from "~/components/Opportunity/Badges/OrgAdminBadges";
import ZltoRewardBadge from "~/components/Opportunity/Badges/ZltoRewardBadge";
import {
  OpportunityActions,
  OpportunityActionOptions,
  OpportunityActionDisplayStyle,
} from "~/components/Opportunity/OpportunityActions";
import {
  getTypeConfig,
  OpportunityEngagementTypeBadge,
  OpportunityMetaTextRow,
  OpportunityOrgCountriesRow,
  OpportunityTypeBadge,
} from "~/components/Opportunity/opportunityTypeTheme";
import { PageBackground } from "~/components/PageBackground";
import { Editor } from "~/components/RichText/Editor";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { ROLE_ADMIN } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";
import PullSyncBadge from "~/components/Opportunity/Badges/PullSyncBadge";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
  returnUrl?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, opportunityId } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  try {
    // 👇 prefetch queries on server
    const dataOpportunityInfo = await getOpportunityInfoByIdAdminOrgAdminOrUser(
      opportunityId,
      context,
    );

    await queryClient.prefetchQuery({
      queryKey: OPPORTUNITY_QUERY_KEYS.info(opportunityId),
      queryFn: () => dataOpportunityInfo,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
          props: { theme: theme },
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      opportunityId: opportunityId,
      theme: theme,
      error: errorCode,
    },
  };
}

// 👇 PAGE COMPONENT: Opportunity Detail
// this page is accessed from the /organisations/[id]/.. pages (OrgAdmin role)
// or from the /admin/opportunities/.. pages (Admin role). the retunUrl query param is used to redirect back to the admin page
const OpportunityDetails: NextPageWithLayout<{
  id: string;
  opportunityId: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ id, opportunityId, user, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );

  // 👇 use prefetched queries from server
  const { data: opportunity } = useOpportunityInfoQuery(opportunityId, {
    enabled: !error,
  });
  const typeConfig = getTypeConfig(opportunity?.type);

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <PageBackground />

      <div className="z-10 container mt-20 max-w-7xl px-2 py-4">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          {/* BREADCRUMB */}
          <div className="inline grow overflow-hidden text-sm text-ellipsis whitespace-nowrap">
            <ul className="inline">
              <li className="inline">
                <Link
                  className="hover:text-gray inline font-bold text-white"
                  href={getSafeUrl(
                    returnUrl?.toString(),
                    `/organisations/${opportunity?.organizationId}/opportunities`,
                  )}
                >
                  <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
                  Opportunities
                </Link>
              </li>
              <li className="mx-2 inline font-semibold text-white"> | </li>
              <li className="inline">
                <div className="inline max-w-125 overflow-hidden text-ellipsis whitespace-nowrap text-white">
                  {opportunity?.title}
                </div>
                <LimitedFunctionalityBadge />
              </li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            {opportunity && (
              <OpportunityActions
                opportunity={opportunity}
                user={user}
                organizationId={id}
                returnUrl={returnUrl?.toString()}
                actionOptions={[
                  OpportunityActionOptions.EDIT_DETAILS,
                  OpportunityActionOptions.DOWNLOAD_COMPLETION_FILES,
                  OpportunityActionOptions.COPY_EXTERNAL_LINK,
                  OpportunityActionOptions.VIEW_ATTENDANCE_LINKS,
                  OpportunityActionOptions.CREATE_ATTENDANCE_LINK,
                  OpportunityActionOptions.MAKE_ACTIVE,
                  OpportunityActionOptions.MAKE_INACTIVE,
                  OpportunityActionOptions.MAKE_VISIBLE,
                  OpportunityActionOptions.MAKE_HIDDEN,
                  OpportunityActionOptions.MARK_FEATURED,
                  OpportunityActionOptions.UNMARK_FEATURED,
                  OpportunityActionOptions.DELETE,
                ]}
                disabled={
                  currentOrganisationInactive ||
                  opportunity?.status == "Deleted"
                }
                displayStyle={OpportunityActionDisplayStyle.BUTTON}
              />
            )}
          </div>
        </div>

        {opportunity && (
          <div className="flex flex-col gap-4">
            <div className="relative flex grow flex-col rounded-lg bg-white p-4 shadow-lg md:p-6">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-family-nunito line-clamp-2 text-xl font-bold text-black md:text-2xl">
                    {opportunity.title}
                  </h4>

                  <div className="mt-1 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <OpportunityOrgCountriesRow data={opportunity} />
                    </div>
                    <PullSyncBadge opportunity={opportunity} />
                  </div>
                </div>

                <div className="shrink-0">
                  <AvatarImage
                    icon={opportunity.organizationLogoURL ?? null}
                    alt="Company Logo"
                    size={60}
                  />
                </div>
              </div>

              <div className="mt-4 mb-2 flex flex-col gap-2 md:my-2">
                <div className="flex flex-row flex-wrap items-center gap-2">
                  <OpportunityTypeBadge
                    data={opportunity}
                    className={typeConfig.badgeClassName}
                  />
                  <OpportunityEngagementTypeBadge
                    data={opportunity}
                    className="bg-gray-light text-gray-dark"
                  />
                  {opportunity.zltoRewardEstimate != null && (
                    <ZltoRewardBadge
                      amount={opportunity.zltoRewardEstimate}
                      showToolTips={true}
                    />
                  )}
                  <OrgAdminBadges
                    opportunity={opportunity}
                    isAdmin={user?.roles.includes(ROLE_ADMIN)}
                  />
                </div>

                <OpportunityMetaTextRow data={opportunity} />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <div className="grow rounded-lg bg-white p-2 shadow-lg md:w-[66%]">
                <Editor value={opportunity.description} readonly={true} />
              </div>
              <div className="flex w-full flex-col gap-2 md:w-[33%]">
                <div className="flex flex-col rounded-lg bg-white p-6">
                  <DetailSection
                    title="Participants"
                    icon={<IoPeopleOutline className="text-gray h-6 w-6" />}
                    className=""
                  >
                    <div className="flex flex-col">
                      <div className="my-2 flex flex-row gap-2 text-sm">
                        {/* Total */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">Total</span>
                          <span
                            className={`badge h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold ${
                              (opportunity?.participantCountTotal ?? 0) > 0
                                ? "bg-green text-white"
                                : "bg-gray-light text-gray-dark"
                            }`}
                          >
                            {opportunity?.participantCountTotal ?? 0}
                          </span>
                        </div>

                        {/* Completed */}
                        {(opportunity?.participantCountCompleted ?? 0) > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">Completed</span>
                            <span
                              className={`badge h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold ${
                                (opportunity?.participantCountCompleted ?? 0) >
                                0
                                  ? "bg-green text-white"
                                  : "bg-gray-light text-gray-dark"
                              }`}
                            >
                              {opportunity?.participantCountCompleted ?? 0}
                            </span>
                          </div>
                        )}

                        {/* Pending verification (clickable when > 0) */}
                        {(opportunity?.participantCountPending ?? 0) > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">Pending</span>
                            <Link
                              href={`/organisations/${id}/verifications?opportunity=${opportunityId}&verificationStatus=Pending${
                                returnUrl
                                  ? `&returnUrl=${encodeURIComponent(
                                      returnUrl.toString(),
                                    )}`
                                  : ""
                              }`}
                              className="badge bg-yellow h-full min-h-6 cursor-pointer rounded-md border-0 py-1 text-xs font-semibold text-white hover:brightness-95"
                            >
                              {opportunity?.participantCountPending}
                            </Link>
                          </div>
                        )}
                      </div>
                      <div>
                        {/* Limit (only when set) */}
                        {opportunity?.participantLimit != null && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Limit</span>
                            <span className="badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white">
                              {opportunity.participantLimit}
                            </span>
                          </div>
                        )}

                        {/* Limit reached (only when reached) */}
                        {opportunity?.participantLimitReached && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Limit reached</span>
                            <span className="badge bg-orange h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white">
                              Yes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </DetailSection>
                </div>
                <div className="divide-gray flex flex-col divide-y rounded-lg bg-white p-6">
                  {(opportunity?.skills?.length ?? 0) > 0 && (
                    <DetailSection
                      title="Skills you will learn"
                      icon={<IoBulbOutline className="text-green h-5 w-5" />}
                      className="pb-4"
                    >
                      <div className="my-2 flex flex-wrap gap-2">
                        {opportunity?.skills?.map((item) => (
                          <div
                            key={item.id}
                            className="badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white"
                          >
                            {item.name}
                          </div>
                        ))}
                      </div>
                    </DetailSection>
                  )}
                  {typeof opportunity?.commitmentIntervalCount === "number" &&
                    opportunity.commitmentIntervalCount > 0 &&
                    !!opportunity?.commitmentInterval && (
                      <DetailSection
                        title="How much time you will need"
                        icon={<IoTimeOutline className="text-green h-5 w-5" />}
                      >
                        <div className="my-2">
                          {`This task should not take you more than ${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}${
                            (opportunity?.commitmentIntervalCount ?? 0) > 1
                              ? "s. "
                              : ". "
                          }`}
                          <br />
                          <p className="mt-2">
                            The estimated times provided are just a guideline.
                            You have as much time as you need to complete the
                            tasks at your own pace. Focus on engaging with the
                            materials and doing your best without feeling rushed
                            by the time estimates.
                          </p>
                        </div>
                      </DetailSection>
                    )}
                  {(opportunity?.categories?.length ?? 0) > 0 && (
                    <DetailSection
                      title="Topics"
                      icon={
                        <IoPricetagsOutline className="text-green h-5 w-5" />
                      }
                    >
                      <div className="my-2 flex flex-wrap gap-2">
                        {opportunity?.categories?.map((item) => (
                          <div
                            key={item.id}
                            className="badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white"
                          >
                            {item.name}
                          </div>
                        ))}
                      </div>
                    </DetailSection>
                  )}
                  {(opportunity?.languages?.length ?? 0) > 0 && (
                    <DetailSection
                      title="Languages"
                      icon={
                        <IoLanguageOutline className="text-green h-5 w-5" />
                      }
                    >
                      <div className="my-2 flex flex-wrap gap-2">
                        {opportunity?.languages?.map((item) => (
                          <div
                            key={item.id}
                            className="badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white"
                          >
                            {item.name}
                          </div>
                        ))}
                      </div>
                    </DetailSection>
                  )}
                  {!!opportunity?.difficulty && (
                    <DetailSection
                      title="Course difficulty"
                      icon={
                        <IoTrendingUpOutline className="text-green h-5 w-5" />
                      }
                    >
                      <div className="badge bg-green my-2 h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white">
                        {opportunity.difficulty}
                      </div>
                    </DetailSection>
                  )}
                  {(opportunity?.countries?.length ?? 0) > 0 && (
                    <DetailSection
                      title="Countries"
                      icon={
                        <IoLocationOutline className="text-green h-5 w-5" />
                      }
                      className="pt-4 first:pt-0"
                    >
                      <div className="my-2 flex flex-wrap gap-2">
                        {opportunity?.countries?.map((country) => (
                          <div
                            key={country.id}
                            className="badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white"
                          >
                            {country.name}
                          </div>
                        ))}
                      </div>
                    </DetailSection>
                  )}
                  {/* CUSTOM FIELDS (definition-driven, read-only). Renders nothing
                      when there are no values. */}
                  <OpportunityCustomFieldsSection
                    type={opportunity?.type}
                    values={opportunity?.customFields}
                    enabled={!error}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

OpportunityDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OpportunityDetails.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  return page.props.theme;
};

export default OpportunityDetails;
