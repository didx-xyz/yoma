import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useState, type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import {
  IoIosCheckmark,
  IoMdArrowRoundBack,
  IoMdClose,
  IoMdThumbsDown,
  IoMdThumbsUp,
  IoMdWarning,
} from "react-icons/io";
import { toast } from "react-toastify";
import {
  OrganizationStatus,
  type Organization,
} from "~/api/models/organisation";
import {
  getOrganisationAdminsById,
  getOrganisationById,
  patchOrganisationStatus,
} from "~/api/services/organisations";
import CustomModal from "~/components/Common/CustomModal";
import FormTextArea from "~/components/Common/FormTextArea";
import MainLayout from "~/components/Layout/Main";
import { OrgOverview } from "~/components/Organisation/Detail/OrgOverview";
import { LogoTitle } from "~/components/Organisation/LogoTitle";
import { PageBackground } from "~/components/PageBackground";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  GA_ACTION_ORGANISATION_VERIFY,
  GA_CATEGORY_ORGANISATION,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { config } from "~/lib/react-query-config";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

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

  try {
    // 👇 prefetch queries on server
    const dataOrganisation = await getOrganisationById(id, context);
    const dataAdmins = await getOrganisationAdminsById(id, context);

    await Promise.all([
      await queryClient.prefetchQuery({
        queryKey: ["organisation", id],
        queryFn: () => dataOrganisation,
      }),
      await queryClient.prefetchQuery({
        queryKey: ["organisationAdmins", id],
        queryFn: () => dataAdmins,
      }),
    ]);
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
      theme: theme,
      error: errorCode,
    },
  };
}

const OrganisationDetails: NextPageWithLayout<{
  id: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ id, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [modalVerifySingleVisible, setModalVerifySingleVisible] =
    useState(false);
  const [verifyComments, setVerifyComments] = useState("");
  const [verifyActionApprove, setVerifyActionApprove] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);

  // 👇 use prefetched queries from server
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
    enabled: !error,
  });

  const onSubmit = useCallback(async () => {
    setIsLoading(true);

    try {
      // update api
      await patchOrganisationStatus(id, {
        status: verifyActionApprove
          ? OrganizationStatus.Active
          : OrganizationStatus.Declined,
        comment: verifyComments,
      });
      const message = `Organisation ${
        verifyActionApprove ? "approved" : "declined"
      }`;
      if (verifyActionApprove) {
        setApproved(true);
      } else {
        setRejected(true);
      }
      setModalVerifySingleVisible(false);
      console.log(message);

      // 📊 GOOGLE ANALYTICS: track event
      trackGAEvent(
        GA_CATEGORY_ORGANISATION,
        GA_ACTION_ORGANISATION_VERIFY,
        message,
      );

      // invalidate queries
      await queryClient.invalidateQueries({
        queryKey: ["Organisations"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["Organisations_TotalCount"],
        exact: false,
      });
      await queryClient.invalidateQueries({ queryKey: ["organisation", id] });
    } catch (error) {
      toast(<ApiErrors error={error as AxiosError} />, {
        type: "error",
        toastId: "verifyOrganisation",
        autoClose: false,
        icon: false,
      });

      setIsLoading(false);

      return;
    }

    setIsLoading(false);
  }, [setIsLoading, id, queryClient, verifyActionApprove, verifyComments]);

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  let content = <></>;

  if (!approved && !rejected) {
    content = (
      <div>
        <OrgOverview organisation={organisation} />

        {/* BUTTONS */}
        <div className="my-4 flex justify-center gap-4 md:justify-end">
          <button
            type="button"
            className="btn btn-warning grow md:w-1/4 md:grow-0"
            onClick={() => {
              setVerifyActionApprove(false);
              setModalVerifySingleVisible(true);
            }}
            id="btnReject"
          >
            <IoMdThumbsDown className="h-6 w-6" />
            Decline
          </button>
          <button
            className="btn btn-success grow md:w-1/4 md:grow-0"
            onClick={() => {
              setVerifyActionApprove(true);
              setModalVerifySingleVisible(true);
            }}
            id="btnApprove"
          >
            <IoMdThumbsUp className="h-6 w-6" />
            Approve
          </button>
        </div>
      </div>
    );
  }

  if (approved) {
    content = (
      <div className="py-8">
        <div className="flex h-full w-full flex-col place-items-center justify-center rounded-lg bg-white py-8">
          <div className="border-green-dark bg-green-light mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <IoIosCheckmark className="text-green h-16 w-16" />
          </div>
          <h4 className="mb-2 font-bold">Application approved!</h4>
          <p>{organisation?.name} has been added to your organisations.</p>
        </div>

        <div className="mb-4 flex flex-row place-items-center justify-center px-6 py-4 pt-2">
          <button
            className="btn btn-outline btn-sm text-green hover:border-green hover:bg-green flex-nowrap rounded-full px-10 py-5 hover:text-white"
            onClick={() => router.push("/organisations")}
          >
            View all organisations
          </button>
        </div>
      </div>
    );
  }

  if (rejected) {
    content = (
      <div className="py-8">
        <div className="flex h-full w-full flex-col place-items-center justify-center rounded-lg bg-white py-8">
          <div className="border-green-dark bg-green-light mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <IoIosCheckmark className="text-green h-16 w-16" />
          </div>
          <h4 className="mb-2 font-bold">Application declined!</h4>
          <p>{organisation?.name} has been declined.</p>
        </div>

        <div className="mb-4 flex flex-row place-items-center justify-center px-6 py-4 pt-2">
          <button
            className="btn btn-outline btn-sm text-green hover:border-green hover:bg-green flex-nowrap rounded-full px-10 py-5 hover:text-white"
            onClick={() => router.push("/organisations")}
          >
            View all organisations
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Yoma Admin | Verify Organisation</title>
      </Head>

      <PageBackground />

      {/* MODAL DIALOG FOR VERIFY (SINGLE) */}
      <CustomModal
        isOpen={modalVerifySingleVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setModalVerifySingleVisible(false);
        }}
        className={`md:h-[300px] md:w-[500px]`}
      >
        <div className="flex h-full flex-col space-y-2 p-4">
          <div className="flex flex-row space-x-2">
            <IoMdWarning className="gl-icon-yellow h-6 w-6" />
            <p className="text-lg">Confirm</p>
          </div>

          <p className="text-sm leading-6">
            Are you sure you want to{" "}
            <strong>{verifyActionApprove ? "approve" : "decline"}</strong> this
            organisation?
          </p>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Comments:</legend>

            <FormTextArea
              inputProps={{
                id: "txtVerifyComments",
                placeholder: "Enter comments here...",
                maxLength: 480,
                onBlur: (e) => setVerifyComments(e.target.value),
              }}
            />
          </fieldset>

          {/* BUTTONS */}
          <div className="mt-4 flex grow flex-row justify-center space-x-2">
            <button
              className="btn-default btn btn-sm flex-nowrap"
              onClick={() => setModalVerifySingleVisible(false)}
            >
              <IoMdClose className="h-6 w-6" />
              Cancel
            </button>
            {verifyActionApprove && (
              <button
                className="btn btn-success btn-sm flex-nowrap"
                onClick={() => onSubmit()}
                id="btnApproveModal"
              >
                <IoMdThumbsUp className="h-6 w-6" />
                Approve
              </button>
            )}
            {!verifyActionApprove && (
              <button
                className="btn btn-warning btn-sm flex-nowrap"
                onClick={() => onSubmit()}
                id="btnRejectModal"
              >
                <IoMdThumbsDown className="h-6 w-6" />
                Decline
              </button>
            )}
          </div>
        </div>
      </CustomModal>

      <div className="z-10 container mt-20 max-w-5xl px-2 py-8">
        {isLoading && <Loading />}

        {/* BREADCRUMB */}
        <div className="flex flex-row text-xs text-white">
          <Link
            className="hover:text-gray flex items-center justify-center font-bold"
            href={getSafeUrl(returnUrl?.toString(), `/organisations`)}
          >
            <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4" />
            Organisations
          </Link>
          <div className="mx-2 font-bold">|</div>

          <span>Verify</span>
        </div>

        {/* LOGO/TITLE */}
        <LogoTitle logoUrl={organisation?.logoURL} title={organisation?.name} />

        {/* CONTENT */}
        <div className="flex flex-col items-center">
          <div className="flex w-full flex-col gap-2 rounded-lg bg-white p-8 shadow-lg lg:w-[600px]">
            {content}
          </div>
        </div>
      </div>
    </>
  );
};

OrganisationDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OrganisationDetails.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  return page.props.theme;
};

export default OrganisationDetails;
