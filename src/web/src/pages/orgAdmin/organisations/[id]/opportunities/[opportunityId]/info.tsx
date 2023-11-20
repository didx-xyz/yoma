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
import {
  FaArrowCircleUp,
  FaClipboard,
  FaClock,
  FaLink,
  FaPencilAlt,
  FaTrash,
} from "react-icons/fa";
import Image from "next/image";
import iconClock from "public/images/icon-clock.svg";
import iconDifficulty from "public/images/icon-difficulty.svg";
import iconLanguage from "public/images/icon-language.svg";
import iconTopics from "public/images/icon-topics.svg";
import iconSkills from "public/images/icon-skills.svg";
import iconUser from "public/images/icon-user.svg";
import iconSuccess from "public/images/icon-success.svg";
import { toast } from "react-toastify";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { type AxiosError } from "axios";
import { Loading } from "~/components/Status/Loading";
import { AccessDenied } from "~/components/Status/AccessDenied";
import { THEME_GREEN } from "~/lib/constants";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const { id, opportunityId } = context.params as IParams;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(["opportunityInfo", opportunityId], () =>
    getOpportunityInfoByIdAdmin(opportunityId, context),
  );

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      opportunityId: opportunityId,
    },
  };
}

const OpportunityDetails: NextPageWithLayout<{
  id: string;
  opportunityId: string;
  user: User;
  error: string;
}> = ({ id, opportunityId, user, error }) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

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

        // invalidate cache
        await queryClient.invalidateQueries(["opportunityInfo", opportunityId]);

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

  if (error) return <AccessDenied />;

  return (
    <>
      {isLoading && <Loading />}
      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-4">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          {/* BREADCRUMB */}
          <div className="breadcrumbs flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            <ul>
              <li>
                <Link
                  className="font-bold text-white hover:text-gray"
                  href={`/orgAdmin/organisations/${id}/opportunities`}
                >
                  <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
                  Opportunities
                </Link>
              </li>
              <li>
                <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap text-white">
                  {opportunity?.title}
                </div>
              </li>
            </ul>
          </div>

          <div className="flex gap-2 sm:justify-end">
            <button
              className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white"
              onClick={() => {
                setManageOpportunityMenuVisible(true);
              }}
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
              <Link
                href={`/orgAdmin/organisations/${id}/opportunities/${opportunityId}`}
                className="flex flex-row items-center text-gray-dark hover:brightness-50"
              >
                <FaPencilAlt className="mr-2 h-3 w-3" />
                Edit
              </Link>
              {/* TODO */}
              <Link
                href={`/orgAdmin/organisations/${id}/opportunities/${opportunityId}/edit`}
                className="flex flex-row items-center text-gray-dark hover:brightness-50"
              >
                <FaClipboard className="mr-2 h-3 w-3" />
                Duplicate
              </Link>

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
              <Link
                href={`/orgAdmin/organisations/${id}/opportunities/${opportunityId}/edit`}
                className="flex flex-row items-center text-gray-dark hover:brightness-50"
              >
                <FaArrowCircleUp className="mr-2 h-3 w-3" />
                Short link
              </Link>

              {/* TODO */}
              <Link
                href={`/orgAdmin/organisations/${id}/opportunities/${opportunityId}/edit`}
                className="flex flex-row items-center text-gray-dark hover:brightness-50"
              >
                <FaLink className="mr-2 h-3 w-3" />
                Generate magic link
              </Link>

              <div className="divider -m-2" />

              <button
                className="flex flex-row items-center text-red-500 hover:brightness-50"
                onClick={() => updateStatus(Status.Deleted)}
              >
                <FaTrash className="mr-2 h-3 w-3" />
                Delete
              </button>
            </div>
          </ReactModal>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-grow flex-row gap-1 rounded-lg bg-white p-6">
            <div className="flex flex-grow flex-col gap-1">
              <h4 className="text-black">{opportunity?.title}</h4>
              <h6 className="text-gray-dark">
                by {opportunity?.organizationName}
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

                  <span className="ml-1">{`${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}`}</span>
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

                {/* Status Badges */}
                {opportunity?.status == "Active" && (
                  <div className="badge h-6 rounded-md bg-green-light text-green">
                    Ongoing / Active
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
                {opportunity?.published && (
                  <div className="badge h-6 rounded-md bg-green-light text-blue">
                    Published
                  </div>
                )}
                {!opportunity?.published && (
                  <div className="badge h-6 rounded-md bg-green-light text-red-400">
                    Not published
                  </div>
                )}
              </div>
            </div>
            {/* company logo */}
            <div className="flex h-24 w-28 items-center justify-center rounded-full border-green-dark bg-white p-4 shadow-lg">
              <Image
                src={opportunity?.organizationLogoURL ?? iconSuccess}
                alt="Icon Success"
                width={80}
                height={80}
                sizes="100vw"
                priority={true}
                style={{
                  width: "80px",
                  height: "80px",
                }}
              />
            </div>
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
                        className="badge min-h-6 mr-2 h-full rounded-md border-0 bg-green text-white"
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
                        className="badge min-h-6 mr-2 h-full rounded-md bg-green text-white"
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
                        className="badge min-h-6 mr-2 h-full rounded-md bg-green text-white"
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
      </div>
    </>
  );
};

OpportunityDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

OpportunityDetails.theme = THEME_GREEN;

export default OpportunityDetails;
