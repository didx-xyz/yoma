import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ParsedUrlQuery } from "querystring";
import { useState, type ReactElement, useCallback } from "react";
import { type OpportunityInfo, Status } from "~/api/models/opportunity";
import {
  getOpportunityInfoByIdAdminOrgAdminOrUser,
  updateOpportunityStatus,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { authOptions, type User } from "~/server/auth";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import {
  IoIosSettings,
  IoMdArrowRoundBack,
  IoMdPerson,
  IoMdPause,
  IoMdPlay,
  IoIosBook,
} from "react-icons/io";
import type { NextPageWithLayout } from "~/pages/_app";
import ReactModal from "react-modal";
import { FaClock, FaPencilAlt, FaTrash } from "react-icons/fa";
import Image from "next/image";
import iconClock from "public/images/icon-clock.svg";
import iconDifficulty from "public/images/icon-difficulty.svg";
import iconLanguage from "public/images/icon-language.svg";
import iconTopics from "public/images/icon-topics.svg";
import iconSkills from "public/images/icon-skills.svg";
import iconZlto from "public/images/icon-zlto.svg";
import iconLocation from "public/images/icon-location.svg";
import { toast } from "react-toastify";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { type AxiosError } from "axios";
import { Loading } from "~/components/Status/Loading";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  DATE_FORMAT_HUMAN,
  GA_ACTION_OPPORTUNITY_UPDATE,
  GA_CATEGORY_OPPORTUNITY,
} from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { useAtomValue } from "jotai";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { trackGAEvent } from "~/lib/google-analytics";
import Moment from "react-moment";
import { useRouter } from "next/router";
import { getThemeFromRole } from "~/lib/utils";
import { AvatarImage } from "~/components/AvatarImage";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
  returnUrl?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, opportunityId } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  // 👇 prefetch queries on server
  const queryClient = new QueryClient(config);
  await queryClient.prefetchQuery({
    queryKey: ["opportunityInfo", opportunityId],
    queryFn: () =>
      getOpportunityInfoByIdAdminOrgAdminOrUser(opportunityId, context),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      opportunityId: opportunityId,
      theme: theme,
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
  error: string;
  theme: string;
}> = ({ id, opportunityId, user, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );

  // 👇 use prefetched queries from server
  const { data: opportunity } = useQuery<OpportunityInfo>({
    queryKey: ["opportunityInfo", opportunityId],
    queryFn: () => getOpportunityInfoByIdAdminOrgAdminOrUser(opportunityId),
    enabled: !error,
  });

  const [manageOpportunityMenuVisible, setManageOpportunityMenuVisible] =
    useState(false);

  const updateStatus = useCallback(
    async (status: Status) => {
      setIsLoading(true);

      try {
        // call api
        await updateOpportunityStatus(opportunityId, status);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_OPPORTUNITY,
          GA_ACTION_OPPORTUNITY_UPDATE,
          `Opportunity Status Changed to ${status} for Opportunity ID: ${opportunityId}`,
        );

        // invalidate cache
        await queryClient.invalidateQueries({
          queryKey: ["opportunityInfo", opportunityId],
        });

        toast.success("Opportunity status updated");
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "opportunity",
          autoClose: false,
          icon: false,
        });
        //captureException(error);
      }
      setIsLoading(false);

      return;
    },
    [opportunityId, queryClient],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      {isLoading && <Loading />}

      <PageBackground />

      <div className="container z-10 mt-20 max-w-7xl px-2 py-4">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          {/* BREADCRUMB */}
          <div className="inline flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            <ul className="inline">
              <li className="inline">
                <Link
                  className="inline font-bold text-white hover:text-gray"
                  href={
                    returnUrl?.toString() ??
                    `/organisations/${opportunity?.organizationId}/opportunities`
                  }
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
          <div className="flex gap-2 sm:justify-end">
            <button
              className="bg-theme hover:bg-theme flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-105 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-gray-dark"
              onClick={() => {
                setManageOpportunityMenuVisible(true);
              }}
              disabled={currentOrganisationInactive}
            >
              <IoIosSettings className="mr-1 h-5 w-5" />
              Manage opportunity
            </button>
          </div>

          {/* MANAGE OPPORTUNITY MODAL MENU */}
          <ReactModal
            isOpen={manageOpportunityMenuVisible}
            shouldCloseOnOverlayClick={true}
            onRequestClose={() => {
              setManageOpportunityMenuVisible(false);
            }}
            className={`fixed left-2 right-2 top-[175px] flex-grow rounded-lg bg-gray-light animate-in fade-in md:left-[80%] md:right-[5%] md:top-[140px] md:w-44 xl:left-[67%] xl:right-[23%]`}
            portalClassName={"fixed z-50"}
            overlayClassName="fixed inset-0"
          >
            <div className="flex flex-col gap-4 p-4 text-xs">
              {opportunity?.status != "Deleted" && (
                <Link
                  href={`/organisations/${id}/opportunities/${opportunityId}${
                    returnUrl
                      ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}`
                      : ""
                  }`}
                  className="flex flex-row items-center text-gray-dark hover:brightness-50"
                >
                  <FaPencilAlt className="mr-2 h-3 w-3" />
                  Edit
                </Link>
              )}
              {/* TODO */}
              {/* <Link
                href={`/organisations/${id}/opportunities/${opportunityId}/edit`}
                className="flex flex-row items-center text-gray-dark hover:brightness-50"
              >
                <FaClipboard className="mr-2 h-3 w-3" />
                Duplicate
              </Link> */}
              {/* if active or expired, then org admins can make it inactive
                  if deleted, admins can make it inactive */}
              {(opportunity?.status == "Active" ||
                opportunity?.status == "Expired" ||
                (user?.roles.some((x) => x === "Admin") &&
                  opportunity?.status == "Deleted")) && (
                <button
                  className="flex flex-row items-center text-gray-dark hover:brightness-50"
                  onClick={() => updateStatus(Status.Inactive)}
                >
                  <FaClock className="mr-2 h-3 w-3" />
                  Make Inactive
                </button>
              )}
              {opportunity?.status == "Inactive" && (
                <button
                  className="flex flex-row items-center text-gray-dark hover:brightness-50"
                  onClick={() => updateStatus(Status.Active)}
                >
                  <FaClock className="mr-2 h-3 w-3" />
                  Make Active
                </button>
              )}
              {/* TODO */}
              {/* <Link
                href={`/organisations/${id}/opportunities/${opportunityId}/edit`}
                className="flex flex-row items-center text-gray-dark hover:brightness-50"
              >
                <FaArrowCircleUp className="mr-2 h-3 w-3" />
                Short link
              </Link> */}
              {/* TODO */}
              {/* <Link
                href={`/organisations/${id}/opportunities/${opportunityId}/edit`}
                className="flex flex-row items-center text-gray-dark hover:brightness-50"
              >
                <FaLink className="mr-2 h-3 w-3" />
                Generate magic link
              </Link> */}
              <div className="divider -m-2" />
              {opportunity?.status != "Deleted" && (
                <button
                  className="flex flex-row items-center text-red-500 hover:brightness-50"
                  onClick={() => updateStatus(Status.Deleted)}
                >
                  <FaTrash className="mr-2 h-3 w-3" />
                  Delete
                </button>
              )}
            </div>
          </ReactModal>
        </div>

        {opportunity && (
          <div className="flex flex-col gap-4">
            <div className="relative flex flex-grow flex-row gap-1 rounded-lg bg-white p-6 shadow-lg">
              <div className="flex flex-grow flex-col gap-1">
                <h4 className="text-2xl font-semibold text-black md:max-w-[1125px]">
                  {opportunity.title}
                </h4>

                <h6 className="text-sm text-gray-dark">
                  By {opportunity.organizationName}
                </h6>
                <div className="flex flex-row gap-1 border-none font-bold text-green-dark">
                  <div className="badge h-6 rounded-md border-none bg-green-light text-xs text-green">
                    <Image
                      src={iconClock}
                      alt="Icon Clock"
                      width={20}
                      height={20}
                      sizes="100vw"
                      priority={true}
                      style={{ width: "20px", height: "20px" }}
                    />

                    <span className="ml-1 text-xs">{`${
                      opportunity.commitmentIntervalCount
                    } ${opportunity.commitmentInterval}${
                      opportunity.commitmentIntervalCount > 1 ? "s" : ""
                    }`}</span>
                  </div>

                  <div className="badge h-6 rounded-md border-none bg-blue-light text-xs text-blue">
                    <IoMdPerson className="h-4 w-4" />

                    <span className="ml-1">
                      {opportunity?.participantCountVerificationCompleted}{" "}
                      enrolled
                    </span>
                  </div>

                  {opportunity?.type && (
                    <div className="badge h-6 rounded-md border-none bg-[#E7E8F5] text-[#5F65B9]">
                      <IoIosBook />
                      <span className="ml-1 text-xs">{opportunity.type}</span>
                    </div>
                  )}

                  {(opportunity.zltoReward ?? 0) > 0 && (
                    <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-orange-light text-orange">
                      <Image
                        src={iconZlto}
                        alt="Icon Zlto"
                        width={16}
                        height={16}
                        sizes="100vw"
                        priority={true}
                        style={{ width: "16px", height: "16px" }}
                      />
                      <span className="ml-1 text-xs">
                        {opportunity.zltoReward}
                      </span>
                    </div>
                  )}

                  {/* STATUS BADGES */}
                  {opportunity?.status == "Active" && (
                    <>
                      <div className="badge bg-blue-light text-blue ">
                        Active
                      </div>

                      {new Date(opportunity.dateStart) > new Date() && (
                        <div className="badge bg-yellow-tint text-yellow ">
                          <IoMdPause />
                          <p className="ml-1">Not started</p>
                        </div>
                      )}
                      {new Date(opportunity.dateStart) < new Date() && (
                        <div className="badge bg-purple-tint text-purple ">
                          <IoMdPlay />
                          <span className="ml-1 text-xs">Started</span>
                        </div>
                      )}
                    </>
                  )}
                  {opportunity?.status == "Expired" && (
                    <div className="badge bg-green-light text-yellow ">
                      Expired
                    </div>
                  )}
                  {opportunity?.status == "Inactive" && (
                    <div className="badge bg-yellow-tint text-yellow ">
                      Inactive
                    </div>
                  )}
                  {opportunity?.status == "Deleted" && (
                    <div className="badge bg-green-light  text-red-400">
                      Deleted
                    </div>
                  )}
                </div>

                {/* DATES */}
                <div className="flex flex-col text-sm text-gray-dark">
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

              {/* COMPANY LOGO */}
              <AvatarImage
                icon={opportunity?.organizationLogoURL ?? null}
                alt="Company Logo"
                size={60}
              />
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <div className="w-full flex-grow rounded-lg bg-white p-6 md:w-[66%]">
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {opportunity?.description}
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-[33%]">
                <div className="flex flex-col rounded-lg bg-white p-6">
                  <div className="mb-2 flex flex-row items-center gap-1 text-sm font-bold">
                    <IoMdPerson className="h-6 w-6 text-gray" />
                    Participants
                  </div>
                  <div className="flex flex-row items-center gap-4 rounded-lg bg-gray p-4">
                    <div className="text-3xl font-bold text-gray-dark">
                      {opportunity?.participantCountTotal ?? 0}
                    </div>
                    {opportunity?.participantCountVerificationPending &&
                      opportunity?.participantCountVerificationPending > 0 && (
                        <Link
                          href={`/organisations/${id}/verifications?opportunity=${opportunityId}${
                            returnUrl
                              ? `&returnUrl=${encodeURIComponent(
                                  returnUrl.toString(),
                                )}`
                              : ""
                          }`}
                        >
                          <div className="flex flex-row items-center gap-2 rounded-lg bg-yellow-light p-1">
                            <div className="badge badge-warning rounded-lg bg-yellow text-white">
                              {opportunity?.participantCountVerificationPending}
                            </div>
                            <div className="text-xs font-bold text-yellow">
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
                        height={20}
                        sizes="100vw"
                        priority={true}
                        style={{ width: "20px", height: "20px" }}
                      />

                      <span className="ml-1">Skills you will learn</span>
                    </div>
                    <div className="my-2 flex flex-wrap gap-1">
                      {opportunity?.skills?.map((item) => (
                        <div
                          key={item.id}
                          className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
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
                        height={20}
                        sizes="100vw"
                        priority={true}
                        style={{ width: "20px", height: "20px" }}
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
                        height={20}
                        sizes="100vw"
                        priority={true}
                        style={{ width: "20px", height: "20px" }}
                      />

                      <span className="ml-1">Topics</span>
                    </div>
                    <div className="my-2 flex flex-wrap gap-1">
                      {opportunity?.categories?.map((item) => (
                        <div
                          key={item.id}
                          className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
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
                        height={20}
                        sizes="100vw"
                        priority={true}
                        style={{ width: "20px", height: "20px" }}
                      />

                      <span className="ml-1">Languages</span>
                    </div>
                    <div className="my-2 flex flex-wrap gap-1">
                      {opportunity?.languages?.map((item) => (
                        <div
                          key={item.id}
                          className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
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
                        height={20}
                        sizes="100vw"
                        priority={true}
                        style={{ width: "20px", height: "20px" }}
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
                        height={20}
                        sizes="100vw"
                        priority={true}
                        style={{ width: "20px", height: "20px" }}
                      />

                      <span className="ml-1">Countries</span>
                    </div>
                    <div className="my-2 flex flex-wrap gap-1">
                      {opportunity?.countries?.map((country) => (
                        <div
                          key={country.id}
                          className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
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
OpportunityDetails.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OpportunityDetails;
