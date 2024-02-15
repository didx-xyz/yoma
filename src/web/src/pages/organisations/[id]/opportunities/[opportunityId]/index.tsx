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
  getOpportunityInfoByIdAdmin,
  updateOpportunityStatus,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { authOptions, type User } from "~/server/auth";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import { IoIosSettings, IoMdArrowRoundBack, IoMdPerson } from "react-icons/io";
import type { NextPageWithLayout } from "~/pages/_app";
import ReactModal from "react-modal";
import { FaClock, FaPencilAlt, FaTrash } from "react-icons/fa";
import Image from "next/image";
import iconClock from "public/images/icon-clock.svg";
import iconDifficulty from "public/images/icon-difficulty.svg";
import iconLanguage from "public/images/icon-language.svg";
import iconTopics from "public/images/icon-topics.svg";
import iconSkills from "public/images/icon-skills.svg";
import iconUser from "public/images/icon-user.svg";
import iconSuccess from "public/images/icon-success.webp";
import { toast } from "react-toastify";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { type AxiosError } from "axios";
import { Loading } from "~/components/Status/Loading";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  DATE_FORMAT_HUMAN,
  GA_ACTION_OPPORTUNITY_UPDATE,
  GA_CATEGORY_OPPORTUNITY,
  ROLE_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
  THEME_PURPLE,
} from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { useAtomValue } from "jotai";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { trackGAEvent } from "~/lib/google-analytics";
import { RoundedImage } from "~/components/RoundedImage";
import Moment from "react-moment";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
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
  let theme;

  if (session?.user?.adminsOf?.includes(id)) {
    theme = THEME_GREEN;
  } else if (session?.user?.roles.includes(ROLE_ADMIN)) {
    theme = THEME_BLUE;
  } else {
    theme = THEME_PURPLE;
  }

  // 👇 prefetch queries on server
  const queryClient = new QueryClient(config);
  await queryClient.prefetchQuery({
    queryKey: ["opportunityInfo", opportunityId],
    queryFn: () => getOpportunityInfoByIdAdmin(opportunityId, context),
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

const OpportunityDetails: NextPageWithLayout<{
  id: string;
  opportunityId: string;
  user: User;
  error: string;
  theme: string;
}> = ({ id, opportunityId, user, error }) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );

  // 👇 use prefetched queries from server
  const { data: opportunity } = useQuery<OpportunityInfo>({
    queryKey: ["opportunityInfo", opportunityId],
    queryFn: () => getOpportunityInfoByIdAdmin(opportunityId),
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

      <div className="container z-10 mt-20 max-w-5xl px-2 py-4">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          {/* BREADCRUMB */}
          <div className="inline flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            <ul className="inline">
              <li className="inline">
                <Link
                  className="inline font-bold text-white hover:text-gray"
                  href={`/organisations/${id}/opportunities`}
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
              className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white disabled:cursor-not-allowed disabled:bg-gray-dark"
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
                  href={`/organisations/${id}/opportunities/${opportunityId}/edit`}
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

              {/* if active, then org admins can make it inactive
                  if deleted, admins can make it inactive */}
              {(opportunity?.status == "Active" ||
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
                <h4 className="text-2xl font-semibold text-black">
                  {opportunity.title}
                </h4>

                <h6 className="text-sm text-gray-dark">
                  By {opportunity.organizationName}
                </h6>
                <div className="flex flex-row gap-1 text-xs font-bold text-green-dark">
                  <div className="badge h-6 rounded-md bg-green-light text-green">
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

                  <div className="badge h-6 rounded-md bg-green-light text-green">
                    <Image
                      src={iconUser}
                      alt="Icon User"
                      width={20}
                      height={20}
                      sizes="100vw"
                      priority={true}
                      style={{ width: "20px", height: "20px" }}
                    />

                    <span className="ml-1">
                      {opportunity?.participantCountVerificationCompleted}{" "}
                      enrolled
                    </span>
                  </div>

                  {/* STATUS BADGES */}
                  {opportunity?.status == "Active" && (
                    <div className="badge h-6 rounded-md bg-green-light text-blue">
                      Active
                    </div>
                  )}
                  {opportunity?.status == "Expired" && (
                    <div className="badge h-6 rounded-md bg-green-light text-yellow">
                      Expired
                    </div>
                  )}
                  {opportunity?.status == "Inactive" && (
                    <div className="badge h-6 rounded-md bg-green-light text-red-400">
                      Inactive
                    </div>
                  )}
                  {opportunity?.status == "Deleted" && (
                    <div className="badge h-6 rounded-md bg-green-light text-red-400">
                      Deleted
                    </div>
                  )}
                  {/* {opportunity?.published && (
                    <div className="badge h-6 rounded-md bg-green-light text-blue">
                      Published
                    </div>
                  )}
                  {!opportunity?.published && (
                    <div className="badge h-6 rounded-md bg-green-light text-red-400">
                      Not published
                    </div>
                  )} */}
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
              <RoundedImage
                icon={opportunity?.organizationLogoURL ?? iconSuccess}
                alt="Company Logo"
                imageWidth={60}
                imageHeight={60}
              />
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <div className="w-full flex-grow rounded-lg bg-white p-6 md:w-[66%]">
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {opportunity?.description}
                </div>
              </div>
              <div className="flex w-full  flex-col gap-2 md:w-[33%]">
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
                          href={`/organisations/${id}/verifications?opportunity=${opportunityId}`}
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
                <div className="flex flex-col gap-1 rounded-lg bg-white p-6">
                  <div>
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
                    <div className="my-2">
                      {opportunity?.skills?.map((item) => (
                        <div
                          key={item.id}
                          className="min-h-6 badge mr-2 h-full rounded-md border-0 bg-green text-white"
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
                    <div className="my-2">{`${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}`}</div>
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
                    <div className="my-2">
                      {opportunity?.categories?.map((item) => (
                        <div
                          key={item.id}
                          className="min-h-6 badge mr-2 h-full rounded-md bg-green text-white"
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
                    <div className="my-2">
                      {opportunity?.languages?.map((item) => (
                        <div
                          key={item.id}
                          className="min-h-6 badge mr-2 h-full rounded-md bg-green text-white"
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
