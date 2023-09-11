import { captureException } from "@sentry/nextjs";
import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
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
import { Organization, OrganizationStatus } from "~/api/models/organisation";
import {
  getOrganisationById,
  putOrganisationStatus,
} from "~/api/services/organisations";
import LeftNavLayout from "~/components/Layout/LeftNav";
import MainLayout from "~/components/Layout/Main";
import { Overview } from "~/components/Organisation/Detail/Overview";
import { ApiErrors } from "~/components/Status/ApiErrors";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import OrganisationLayout from "~/components/Layout/Organisation";

interface IParams extends ParsedUrlQuery {
  id: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const queryClient = new QueryClient();
  const session = await getServerSession(context.req, context.res, authOptions);

  if (id !== "create") {
    await queryClient.prefetchQuery(["organisation", id], () =>
      getOrganisationById(id, context),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
    },
  };
}

const OrganisationDetails: NextPageWithLayout<{
  id: string;
  user: User;
}> = ({ id }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [modalVerifySingleVisible, setModalVerifySingleVisible] =
    useState(false);
  const [verifyComments, setVerifyComments] = useState("");
  const [verifyActionApprove, setVerifyActionApprove] = useState(false);

  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
    enabled: id !== "create",
  });

  const onSubmit = useCallback(async () => {
    setIsLoading(true);

    try {
      // update api
      await putOrganisationStatus(id, {
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
      await queryClient.invalidateQueries(["organisations"]);
      await queryClient.invalidateQueries([id, "organisation"]);
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

    void router.push("/organisations/search");
  }, [
    setIsLoading,
    id,
    organisation,
    queryClient,
    verifyActionApprove,
    verifyComments,
  ]);

  return (
    <>
      {" "}
      <div className="flex flex-col items-center justify-center pt-6">
        <Head>
          <title>Yoma Admin | Verify Organisation</title>
        </Head>
        <div className="container max-w-md">
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
            portalClassName={"fixed"}
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
    </>
  );
};

OrganisationDetails.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout>
      <LeftNavLayout>{page}</LeftNavLayout>
    </MainLayout>
  );
};

export default withAuth(OrganisationDetails);
