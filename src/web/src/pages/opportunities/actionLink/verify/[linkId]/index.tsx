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
import { config } from "~/lib/react-query-config";
import { IoMdFlame } from "react-icons/io";
import Image from "next/image";
import IconRingBuoy from "/public/images/icon-ring-buoy.svg";
import IconSuccess from "/public/images/icon-success.png";
import Link from "next/link";
import { getPublishedOrExpiredByLinkInstantVerify } from "~/api/services/opportunities";
import type { OpportunityInfo } from "~/api/models/opportunity";
import SocialPreview from "~/components/Opportunity/SocialPreview";
import OpportunityMetaTags from "~/components/Opportunity/OpportunityMetaTags";
import { SignInButton } from "~/components/SignInButton";

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
  let opportunityInfo = null;

  if (!linkId) {
    return {
      notFound: true,
    };
  }

  try {
    // lookup the opportunity details by linkId
    opportunityInfo = await getPublishedOrExpiredByLinkInstantVerify(
      String(linkId),
      context,
    );

    if (!session) {
      action = OpportunityAction.Login;
    } else {
      // authenticated user may perform verification
      await performActionInstantVerificationManual(String(linkId), context);

      action = OpportunityAction.Success;
    }
  } catch (err) {
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

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      action: action,
      opportunityInfo: opportunityInfo,
      errors: errors,
    },
  };
}

const OpportunityActionLinkVerify: NextPageWithLayout<{
  action: OpportunityAction;
  opportunityInfo: OpportunityInfo;
  errors: ErrorResponseItem[] | null;
}> = ({ action, opportunityInfo, errors }) => {
  return (
    <>
      <OpportunityMetaTags opportunityInfo={opportunityInfo} />

      <div className="container flex flex-col items-center justify-start gap-12 md:mt-44 md:px-4">
        <div className="bg-theme absolute top-0 z-2 h-[256px] w-full"></div>

        {action === OpportunityAction.Login && (
          <div className="z-10 flex h-full w-full max-w-md flex-col place-items-center justify-center gap-8 rounded-xl bg-white p-4 md:h-fit md:max-w-2xl md:p-16">
            <Image
              src={IconRingBuoy}
              alt="Icon Ring Buoy"
              width={100}
              sizes="100vw"
              priority={true}
              className="shadow-custom mt-2 h-auto rounded-full p-4"
            />
            <h2 className="-mb-6 font-bold">Almost there...</h2>

            <p className="text-gray-dark text-center">
              Please log in to complete the opportunity and earn your rewards.
            </p>

            <SocialPreview
              name={opportunityInfo?.title}
              description={opportunityInfo?.description}
              logoURL={opportunityInfo?.organizationLogoURL}
              organizationName={opportunityInfo?.organizationName}
            />

            <SignInButton className="btn bg-purple hover:bg-purple-light disabled:bg-purple-light rounded-full text-white normal-case disabled:border-0 md:w-[150px]" />
          </div>
        )}

        {action === OpportunityAction.Error && (
          <div className="z-10 flex h-full w-full max-w-md flex-col place-items-center justify-center gap-8 rounded-xl bg-white p-4 md:h-fit md:max-w-2xl md:p-16">
            <Image
              src={IconRingBuoy}
              alt="Icon Ring Bouy"
              width={100}
              sizes="100vw"
              priority={true}
              className="shadow-custom mt-2 h-auto rounded-full p-4"
            />
            <h2 className="-mb-6 font-bold">Error</h2>

            <p className="text-gray-dark text-center">
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
        )}

        {action === OpportunityAction.Success && (
          <div className="z-10 flex h-full w-full max-w-md flex-col place-items-center justify-center gap-8 rounded-xl bg-white p-4 md:h-fit md:max-w-2xl md:p-16">
            <Image
              src={IconSuccess}
              alt="Icon Success"
              width={80}
              sizes="100vw"
              priority={true}
              className="shadow-custom mt-2 h-auto rounded-full p-4"
            />
            <h2 className="-mb-6 font-bold">Congratulations!</h2>

            <p className="text-gray-dark text-center">
              You have successfully completed the following opportunity.
            </p>

            <SocialPreview
              name={opportunityInfo?.title}
              description={opportunityInfo?.description}
              logoURL={opportunityInfo?.organizationLogoURL}
              organizationName={opportunityInfo?.organizationName}
            />

            <p className="text-gray-dark text-center">
              View your completed opportunity & rewards in the YoID section.
            </p>

            <Link
              href="/yoid/opportunities/completed"
              className="btn btn-primary w-64"
            >
              YoID
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

OpportunityActionLinkVerify.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default OpportunityActionLinkVerify;
