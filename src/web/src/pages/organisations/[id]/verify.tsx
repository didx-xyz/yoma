import { captureException } from "@sentry/nextjs";
import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useState, type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import {
  IoMdClose,
  IoMdThumbsDown,
  IoMdThumbsUp,
  IoMdWarning,
} from "react-icons/io";
import ReactModal from "react-modal";
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
import MainLayout from "~/components/Layout/Main";
import { Overview } from "~/components/Organisation/Detail/Overview";
import { LogoTitle } from "~/components/Organisation/LogoTitle";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { authOptions, type User } from "~/server/auth";
import { PageBackground } from "~/components/PageBackground";
import { AccessDenied } from "~/components/Status/AccessDenied";
import {
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
} from "~/lib/constants";
import type { NextPageWithLayout } from "~/pages/_app";

interface IParams extends ParsedUrlQuery {
  id: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
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

  if (session?.user?.roles.includes(ROLE_ADMIN)) {
    theme = THEME_BLUE;
  } else if (session?.user?.roles.includes(ROLE_ORG_ADMIN)) {
    theme = THEME_GREEN;
  } else {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const { id } = context.params as IParams;
  const queryClient = new QueryClient();

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["organisation", id],
    queryFn: () => getOrganisationById(id, context),
  });
  await queryClient.prefetchQuery({
    queryKey: ["organisationAdmins", id],
    queryFn: () => getOrganisationAdminsById(id, context),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      theme: theme,
    },
  };
}

const OrganisationDetails: NextPageWithLayout<{
  id: string;
  user: User;
  error: string;
  theme: string;
}> = ({ id, error }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [modalVerifySingleVisible, setModalVerifySingleVisible] =
    useState(false);
  const [verifyComments, setVerifyComments] = useState("");
  const [verifyActionApprove, setVerifyActionApprove] = useState(false);

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
      toast(`Organisation ${verifyActionApprove ? "approved" : "declined"}`, {
        type: "success",
        toastId: "verifyOrganisation",
      });

      // invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["organisations"] });
      await queryClient.invalidateQueries({ queryKey: [id, "organisation"] });
    } catch (error) {
      toast(<ApiErrors error={error as AxiosError} />, {
        type: "error",
        toastId: "verifyOrganisation",
        autoClose: false,
        icon: false,
      });

      captureException(error);
      setIsLoading(false);

      return;
    }

    setIsLoading(false);

    void router.push("/organisations");
  }, [
    setIsLoading,
    router,
    id,
    queryClient,
    verifyActionApprove,
    verifyComments,
  ]);

  if (error) return <AccessDenied />;

  return (
    <>
      <Head>
        <title>Yoma Admin | Verify Organisation</title>
      </Head>

      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-8">
        {isLoading && <Loading />}
        {/* BREADCRUMB */}
        <div className="flex flex-row text-xs text-gray">
          <Link
            className="font-bold text-white hover:text-gray"
            href={"/organisations"}
          >
            Organisations
          </Link>
          <div className="mx-2">/</div>
          <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap text-white">
            {organisation?.name}
          </div>
        </div>

        {/* LOGO/TITLE */}
        <LogoTitle logoUrl={organisation?.logoURL} title={organisation?.name} />

        {/* CONTENT */}
        <div className="flex flex-col items-center pt-4">
          <div className="flex w-full flex-col gap-2 rounded-lg bg-white p-8 shadow-lg lg:w-[600px]">
            <Overview organisation={organisation}></Overview>

            {/* BUTTONS */}
            <div className="my-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn btn-warning btn-sm flex-grow"
                onClick={() => {
                  setVerifyActionApprove(false);
                  setModalVerifySingleVisible(true);
                }}
              >
                <IoMdThumbsDown className="h-6 w-6" />
                Reject
              </button>
              <button
                className="btn btn-success btn-sm flex-grow"
                onClick={() => {
                  setVerifyActionApprove(true);
                  setModalVerifySingleVisible(true);
                }}
              >
                <IoMdThumbsUp className="h-6 w-6" />
                Approve
              </button>
            </div>

            {/* MODAL DIALOG FOR VERIFY (SINGLE) */}
            <ReactModal
              isOpen={modalVerifySingleVisible}
              shouldCloseOnOverlayClick={true}
              onRequestClose={() => {
                setModalVerifySingleVisible(false);
              }}
              className={`text-gray-700 fixed inset-0 m-auto h-[230px] w-[380px] rounded-lg bg-white p-4 font-openSans duration-100 animate-in fade-in zoom-in`}
              overlayClassName="fixed inset-0 bg-black modal-overlay"
              portalClassName={"fixed z-20"}
            >
              <div className="flex h-full flex-col space-y-2">
                <div className="flex flex-row space-x-2">
                  <IoMdWarning className="gl-icon-yellow h-6 w-6" />
                  <p className="text-lg">Confirm</p>
                </div>

                <p className="text-sm leading-6">
                  Are you sure you want to{" "}
                  <strong>{verifyActionApprove ? "approve" : "reject"}</strong>{" "}
                  this organisation?
                </p>

                <div className="form-control">
                  <label className="label">
                    <span className="text-gray-700 label-text">
                      Enter comments below:
                    </span>
                  </label>
                  <textarea
                    className="input input-bordered w-full"
                    onChange={(e) => setVerifyComments(e.target.value)}
                  />
                </div>

                {/* BUTTONS */}
                <div className="mt-10 flex h-full flex-row place-items-center justify-center space-x-2">
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
                    >
                      <IoMdThumbsUp className="h-6 w-6" />
                      Approve
                    </button>
                  )}
                  {!verifyActionApprove && (
                    <button
                      className="btn btn-warning btn-sm flex-nowrap"
                      onClick={() => onSubmit()}
                    >
                      <IoMdThumbsDown className="h-6 w-6" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </ReactModal>
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
OrganisationDetails.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OrganisationDetails;
