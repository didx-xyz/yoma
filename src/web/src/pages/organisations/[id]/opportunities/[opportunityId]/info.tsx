import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
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
import { useCallback, useState, type ReactElement } from "react";
import {
  FaClock,
  FaExclamation,
  FaEye,
  FaEyeSlash,
  FaPencilAlt,
  FaTrash,
} from "react-icons/fa";
import {
  IoIosSettings,
  IoMdArrowRoundBack,
  IoMdPerson,
  IoMdWarning,
} from "react-icons/io";
import Moment from "react-moment";
import { toast } from "react-toastify";
import { Status, type OpportunityInfo } from "~/api/models/opportunity";
import {
  getOpportunityInfoByIdAdminOrgAdminOrUser,
  updateFeatured,
  updateOpportunityHidden,
  updateOpportunityStatus,
} from "~/api/services/opportunities";
import { AvatarImage } from "~/components/AvatarImage";
import CustomModal from "~/components/Common/CustomModal";
import MainLayout from "~/components/Layout/Main";
import OrgAdminBadges from "~/components/Opportunity/Badges/OrgAdminBadges";
import { PageBackground } from "~/components/PageBackground";
import { Editor } from "~/components/RichText/Editor";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import {
  DATE_FORMAT_HUMAN,
  GA_ACTION_OPPORTUNITY_UPDATE,
  GA_CATEGORY_OPPORTUNITY,
  ROLE_ADMIN,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
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
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );
  const modalContext = useConfirmationModalContext();
  const isAdmin = user?.roles.includes(ROLE_ADMIN);

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
      setManageOpportunityMenuVisible(false);

      // confirm dialog
      const result = await modalContext.showConfirmation(
        "",
        <div
          key="confirm-dialog-content"
          className="flex h-full flex-col space-y-2 text-gray-500"
        >
          <div className="flex flex-row items-center gap-2">
            <IoMdWarning className="text-warning h-6 w-6" />
            <p className="text-lg">Confirm</p>
          </div>

          <div>
            <p className="text-sm leading-6">
              {status === Status.Deleted && (
                <>
                  Are you sure you want to delete this opportunity?
                  <br />
                  This action cannot be undone.
                </>
              )}
              {status === Status.Active && (
                <>Are you sure you want to activate this opportunity?</>
              )}
              {status === Status.Inactive && (
                <>Are you sure you want to inactivate this opportunity?</>
              )}
            </p>
          </div>
        </div>,
      );
      if (!result) return;

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
        //NB: this is the query on the opportunities page
        await queryClient.invalidateQueries({
          queryKey: ["opportunities", id],
        });

        toast.success("Opportunity status updated");
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "opportunity",
          autoClose: false,
          icon: false,
        });
      }
      setIsLoading(false);

      return;
    },
    [
      id,
      opportunityId,
      queryClient,
      setManageOpportunityMenuVisible,
      modalContext,
    ],
  );

  const updateHidden = useCallback(
    async (hidden: boolean) => {
      setManageOpportunityMenuVisible(false);

      // confirm dialog
      const result = await modalContext.showConfirmation(
        "",
        <div
          key="confirm-dialog-content"
          className="flex h-full flex-col space-y-2 text-gray-500"
        >
          <div className="flex flex-row items-center gap-2">
            <IoMdWarning className="text-warning h-6 w-6" />
            <p className="text-lg">Confirm</p>
          </div>

          <div>
            <p className="text-sm leading-6">
              {hidden && <>Are you sure you want to hide this opportunity?</>}
              {!hidden && <>Are you sure you want to show this opportunity?</>}
            </p>
          </div>
        </div>,
      );
      if (!result) return;

      setIsLoading(true);

      try {
        // call api
        await updateOpportunityHidden(opportunityId, hidden);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_OPPORTUNITY,
          GA_ACTION_OPPORTUNITY_UPDATE,
          `Opportunity Hidden Changed to ${hidden} for Opportunity ID: ${opportunityId}`,
        );

        // invalidate cache
        await queryClient.invalidateQueries({
          queryKey: ["opportunityInfo", opportunityId],
        });
        //NB: this is the query on the opportunities page
        await queryClient.invalidateQueries({
          queryKey: ["opportunities", id],
        });

        toast.success("Opportunity updated");
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "opportunity",
          autoClose: false,
          icon: false,
        });
      }
      setIsLoading(false);

      return;
    },
    [
      id,
      opportunityId,
      queryClient,
      setManageOpportunityMenuVisible,
      modalContext,
    ],
  );

  const updateFeaturedFlag = useCallback(
    async (featured: boolean) => {
      setManageOpportunityMenuVisible(false);

      setIsLoading(true);

      try {
        // call api
        await updateFeatured(opportunityId, featured);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_OPPORTUNITY,
          GA_ACTION_OPPORTUNITY_UPDATE,
          `Opportunity Featured Changed to ${featured} for Opportunity ID: ${opportunityId}`,
        );

        // invalidate cache
        await queryClient.invalidateQueries({
          queryKey: ["opportunityInfo", opportunityId],
        });

        toast.success(
          featured
            ? "Opportunity marked Featured"
            : "Opportunity unmarked as Featured",
        );
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "opportunity",
          autoClose: false,
          icon: false,
        });
      }
      setIsLoading(false);

      return;
    },
    [opportunityId, queryClient, setManageOpportunityMenuVisible],
  );

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      {isLoading && <Loading />}

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
          <div className="flex gap-2 sm:justify-end">
            <button
              className="bg-theme hover:bg-theme disabled:bg-gray-dark flex w-40 flex-row items-center justify-center rounded-full p-1 text-xs whitespace-nowrap text-white brightness-105 hover:brightness-110 disabled:cursor-not-allowed"
              onClick={() => {
                setManageOpportunityMenuVisible(true);
              }}
              disabled={
                currentOrganisationInactive || opportunity?.status == "Deleted"
              }
            >
              <IoIosSettings className="mr-1 h-5 w-5" />
              Manage opportunity
            </button>
          </div>

          {/* MANAGE OPPORTUNITY MODAL MENU */}
          <CustomModal
            isOpen={manageOpportunityMenuVisible}
            shouldCloseOnOverlayClick={true}
            onRequestClose={() => {
              setManageOpportunityMenuVisible(false);
            }}
            className={`top-[175px] right-2 !bottom-auto left-2 md:top-[145px] md:right-[5%] md:left-[80%] md:w-44 xl:right-[23%] xl:left-[76.7%]`}
          >
            <div className="flex flex-col gap-4 p-4 text-xs">
              {opportunity?.status != "Deleted" && (
                <Link
                  href={`/organisations/${id}/opportunities/${opportunityId}${
                    returnUrl
                      ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}`
                      : ""
                  }`}
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                >
                  <FaPencilAlt className="mr-2 h-3 w-3" />
                  Edit
                </Link>
              )}
              {/* if active or expired, then org admins can make it inactive
                  if deleted, admins can make it inactive */}
              {(opportunity?.status == "Active" ||
                opportunity?.status == "Expired" ||
                (user?.roles.some((x) => x === "Admin") &&
                  opportunity?.status == "Deleted")) && (
                <button
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() => updateStatus(Status.Inactive)}
                >
                  <FaClock className="mr-2 h-3 w-3" />
                  Make Inactive
                </button>
              )}
              {opportunity?.status == "Inactive" && (
                <button
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() => updateStatus(Status.Active)}
                >
                  <FaClock className="mr-2 h-3 w-3" />
                  Make Active
                </button>
              )}

              {/* hidden status */}
              {opportunity?.hidden && (
                <button
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() => updateHidden(false)}
                >
                  <FaEye className="mr-2 h-3 w-3" />
                  Make Visible
                </button>
              )}
              {!opportunity?.hidden && (
                <button
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() => updateHidden(true)}
                >
                  <FaEyeSlash className="mr-2 h-3 w-3" />
                  Make Hidden
                </button>
              )}

              {/* ADMINS CAN CHANGE THE FEATURED FLAG */}
              {isAdmin && (
                <>
                  {opportunity?.featured && (
                    <button
                      className="text-gray-dark flex flex-row items-center hover:brightness-50"
                      onClick={() => updateFeaturedFlag(false)}
                    >
                      <FaExclamation className="mr-2 h-3 w-3" />
                      Unmark as Featured
                    </button>
                  )}

                  {!opportunity?.featured && (
                    <button
                      className="text-gray-dark flex flex-row items-center hover:brightness-50"
                      onClick={() => updateFeaturedFlag(true)}
                    >
                      <FaExclamation className="mr-2 h-3 w-3" />
                      Mark as Featured
                    </button>
                  )}
                </>
              )}

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
          </CustomModal>
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
                <OrgAdminBadges opportunity={opportunity} isAdmin={isAdmin} />

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
