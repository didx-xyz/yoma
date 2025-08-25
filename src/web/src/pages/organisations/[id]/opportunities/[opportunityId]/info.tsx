import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconClock from "public/images/icon-clock.svg";
import iconDifficulty from "public/images/icon-difficulty.svg";
import iconLanguage from "public/images/icon-language.svg";
import iconLocation from "public/images/icon-location.svg";
import iconSkills from "public/images/icon-skills.svg";
import iconTopics from "public/images/icon-topics.svg";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import { IoMdArrowRoundBack, IoMdPerson } from "react-icons/io";
import Moment from "react-moment";
import { type OpportunityInfo } from "~/api/models/opportunity";
import { getOpportunityInfoByIdAdminOrgAdminOrUser } from "~/api/services/opportunities";
import { AvatarImage } from "~/components/AvatarImage";
import MainLayout from "~/components/Layout/Main";
import OrgAdminBadges from "~/components/Opportunity/Badges/OrgAdminBadges";
import {
  OpportunityActions,
  OpportunityActionOptions,
  OpportunityActionDisplayStyle,
} from "~/components/Opportunity/OpportunityActions";
import { PageBackground } from "~/components/PageBackground";
import { Editor } from "~/components/RichText/Editor";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { DATE_FORMAT_HUMAN, ROLE_ADMIN } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";

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
      queryKey: ["opportunityInfo", opportunityId],
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
  const { data: opportunity } = useQuery<OpportunityInfo>({
    queryKey: ["opportunityInfo", opportunityId],
    queryFn: () => getOpportunityInfoByIdAdminOrgAdminOrUser(opportunityId),
    enabled: !error,
  });

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
                <div className="inline max-w-[500px] overflow-hidden text-ellipsis whitespace-nowrap text-white">
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
            <div className="shadow-custom relative flex grow flex-row gap-1 rounded-lg bg-white p-6">
              <div className="flex flex-col gap-2 md:grow">
                <div className="relative">
                  <h4 className="line-clamp-2 max-w-[80%] grow text-xl font-semibold text-black md:text-2xl">
                    {opportunity.title}
                  </h4>
                  <span className="absolute top-0 right-0">
                    {/* COMPANY LOGO */}
                    <AvatarImage
                      icon={opportunity?.organizationLogoURL ?? null}
                      alt="Company Logo"
                      size={60}
                    />
                  </span>
                </div>

                <h6 className="text-gray-dark line-clamp-2 text-sm">
                  By {opportunity.organizationName}
                </h6>

                {/* BADGES */}
                <OrgAdminBadges
                  opportunity={opportunity}
                  isAdmin={user?.roles.includes(ROLE_ADMIN)}
                />

                {/* DATES */}
                <div className="text-gray-dark flex flex-col text-sm">
                  <div>
                    {opportunity?.dateStart && (
                      <>
                        <span className="mr-2 font-bold">Starts:</span>
                        <span className="text-xs tracking-widest text-black">
                          <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                            {opportunity.dateStart}
                          </Moment>
                        </span>
                      </>
                    )}
                  </div>
                  <div>
                    {opportunity?.dateEnd && (
                      <>
                        <span className="mr-2 font-bold">Ends:</span>
                        <span className="text-xs tracking-widest text-black">
                          <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                            {opportunity.dateEnd}
                          </Moment>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <div className="grow rounded-lg bg-white p-2 shadow-lg md:w-[66%]">
                <Editor value={opportunity.description} readonly={true} />
              </div>
              <div className="flex w-full flex-col gap-2 md:w-[33%]">
                <div className="flex flex-col rounded-lg bg-white p-6">
                  <div className="mb-2 flex flex-row items-center gap-1 text-sm font-bold">
                    <IoMdPerson className="text-gray h-6 w-6" />
                    Participants
                  </div>
                  <div className="bg-gray flex flex-row items-center gap-4 rounded-lg p-4">
                    <div className="text-gray-dark text-3xl font-bold">
                      {opportunity?.participantCountTotal ?? 0}
                    </div>

                    {(opportunity?.participantCountPending ?? 0) > 0 && (
                      <Link
                        href={`/organisations/${id}/verifications?opportunity=${opportunityId}&verificationStatus=Pending${
                          returnUrl
                            ? `&returnUrl=${encodeURIComponent(
                                returnUrl.toString(),
                              )}`
                            : ""
                        }`}
                      >
                        <div className="bg-yellow-light flex flex-row items-center gap-2 rounded-lg p-1">
                          <div className="badge badge-warning bg-yellow rounded-lg text-white">
                            {opportunity?.participantCountPending}
                          </div>
                          <div className="text-yellow text-xs font-bold">
                            to be verified
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 rounded-lg bg-white p-6">
                  <div className="mb-2">
                    <div className="flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconSkills}
                        alt="Icon Skills"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">Skills you will learn</span>
                    </div>
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
                  </div>
                  <div className="divider mt-1" />
                  <div>
                    <div className="flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconClock}
                        alt="Icon Clock"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">How much time you will need</span>
                    </div>
                    <div className="my-2">
                      {`This task should not take you more than ${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}${
                        opportunity?.commitmentIntervalCount > 1 ? "s. " : ". "
                      }`}
                      <br />
                      <p className="mt-2">
                        The estimated times provided are just a guideline. You
                        have as much time as you need to complete the tasks at
                        your own pace. Focus on engaging with the materials and
                        doing your best without feeling rushed by the time
                        estimates.
                      </p>
                    </div>
                  </div>
                  <div className="divider mt-1" />
                  <div>
                    <div className="flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconTopics}
                        alt="Icon Topics"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">Topics</span>
                    </div>
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
                  </div>
                  <div className="divider mt-1" />
                  <div className="mb-2">
                    <div className="my-2 flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconLanguage}
                        alt="Icon Language"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">Languages</span>
                    </div>
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
                  </div>
                  <div className="divider mt-1" />
                  <div>
                    <div className="flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconDifficulty}
                        alt="Icon Difficulty"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">Course difficulty</span>
                    </div>
                    <div className="my-2">{opportunity?.difficulty}</div>
                  </div>
                  <div className="divider mt-1" />
                  <div>
                    <div className="flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconLocation}
                        alt="Icon Location"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">Countries</span>
                    </div>
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
                  </div>
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
