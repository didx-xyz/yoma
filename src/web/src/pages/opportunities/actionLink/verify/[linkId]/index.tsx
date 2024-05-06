import { QueryClient, dehydrate } from "@tanstack/react-query";
import axios from "axios";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import type { ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import { performActionInstantVerificationManual } from "~/api/services/myOpportunities";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";
import { type ErrorResponseItem } from "~/api/models/common";
import { Loading } from "~/components/Status/Loading";
import { config } from "~/lib/react-query-config";
import { IoMdFlame } from "react-icons/io";
import { SignInButon } from "~/components/SigninButton";
import Image from "next/image";
import IconRingBuoy from "/public/images/icon-ring-buoy.svg";
import IconSuccess from "/public/images/icon-success.png";
import Link from "next/link";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
}

enum OpportunityAction {
  Login = "Login",
  Error = "Error",
  Success = "Success",
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { linkId } = context.params as IParams;
  const queryClient = new QueryClient(config);
  const session = await getServerSession(context.req, context.res, authOptions);
  let errors = null;
  let action = OpportunityAction.Login;

  if (!linkId) {
    return {
      notFound: true,
    };
  }

  if (!session) {
    action = OpportunityAction.Login;
  } else {
    try {
      // authenticated user may perform verification
      await performActionInstantVerificationManual(String(linkId), context);

      action = OpportunityAction.Success;
    } catch (err) {
      console.error("Error fetching data in getServerSideProps", err);

      action = OpportunityAction.Error;

      if (axios.isAxiosError(err) && err.response?.status) {
        errors = err.response?.data as ErrorResponseItem[];

        if (err.response.status === 404) {
          return {
            notFound: true,
          };
        }
      }
    }
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      action: action,
      errors: errors,
    },
  };
}

const OpportunityActionLinkVerify: NextPageWithLayout<{
  action: OpportunityAction;
  errors: ErrorResponseItem[] | null;
}> = ({ action, errors }) => {
  if (action === OpportunityAction.Login) {
    return (
      <div className="container flex flex-col items-center justify-start gap-12 md:mt-44 md:px-4">
        <div className="bg-theme z-2 absolute top-0 h-[256px] w-full"></div>
        <div className="z-10 flex h-full w-full max-w-md flex-col place-items-center justify-center gap-8 rounded-xl bg-white p-4 md:h-fit md:max-w-2xl md:p-16">
          <Image
            src={IconRingBuoy}
            alt="Icon Ring Buoy"
            width={100}
            height={100}
            sizes="100vw"
            priority={true}
            style={{ width: "100px", height: "100px" }}
            className="mt-2 rounded-full p-4 shadow-custom"
          />
          <h2 className="-mb-6 font-bold">Almost there...</h2>

          <p className="text-center text-gray-dark">
            Please sign in to complete the opportunity and earn your rewards.
          </p>

          <SignInButon />
        </div>
      </div>
    );
  }
  if (action === OpportunityAction.Error) {
    return (
      <div className="container flex flex-col items-center justify-start gap-12 md:mt-44 md:px-4">
        <div className="bg-theme z-2 absolute top-0 h-[256px] w-full"></div>
        <div className="z-10 flex h-full w-full max-w-md flex-col place-items-center justify-center gap-8 rounded-xl bg-white p-4 md:h-fit md:max-w-2xl md:p-16">
          <Image
            src={IconRingBuoy}
            alt="Icon Ring Bouy"
            width={100}
            height={100}
            sizes="100vw"
            priority={true}
            style={{ width: "100px", height: "100px" }}
            className="mt-2 rounded-full p-4 shadow-custom"
          />
          <h2 className="-mb-6 font-bold">Error</h2>

          <p className="text-center text-gray-dark">
            There was a problem completing the opportunity:
          </p>

          {errors && (
            <>
              {errors.length === 0 && (
                <>
                  <div className="mb-4 flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="mr-2 h-10 w-10 text-xl text-white" />{" "}
                    Error
                  </div>
                  <p className="text-sm">
                    An unknown error has occurred. Please contact us or try
                    again later. ☹️
                  </p>
                </>
              )}

              {errors.length === 1 && (
                <div className="mb-4 flex flex-row items-center text-sm font-bold">
                  <IoMdFlame className="mr-2 h-10 w-10 text-xl text-white" />
                  {errors[0]?.message}
                </div>
              )}

              {errors.length > 1 && (
                <>
                  <div className="mb-4 flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="mr-2 h-10 w-10 text-xl text-white" />{" "}
                    The following errors occurred:
                  </div>
                  <ul className="list-disc">
                    {errors?.map((error) => (
                      <li key={error.message} className="text-sm">
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  if (action === OpportunityAction.Success) {
    return (
      <div className="container flex flex-col items-center justify-start gap-12 md:mt-44 md:px-4">
        <div className="bg-theme z-2 absolute top-0 h-[256px] w-full"></div>
        <div className="z-10 flex h-full w-full max-w-md flex-col place-items-center justify-center gap-8 rounded-xl bg-white p-4 md:h-fit md:max-w-2xl md:p-16">
          <Image
            src={IconSuccess}
            alt="Icon Success"
            width={80}
            height={80}
            sizes="100vw"
            priority={true}
            style={{ width: "80px", height: "80px" }}
            className="mt-2 rounded-full p-4 shadow-custom"
          />
          <h2 className="-mb-6 font-bold">Congratulations!</h2>

          <p className="text-center text-gray-dark">
            You have successfully completed the opportunity.
          </p>

          <p className="text-center text-gray-dark">
            View your completed opportunity & rewards in the YoID section.
          </p>

          <Link
            href="/yoid/opportunities/completed"
            className="btn btn-primary w-64"
          >
            YoID
          </Link>
        </div>
      </div>
    );
  }

  return <Loading />;
};

OpportunityActionLinkVerify.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default OpportunityActionLinkVerify;
