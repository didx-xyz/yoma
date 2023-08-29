import { captureException } from "@sentry/nextjs";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import router from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { type FieldValues } from "react-hook-form";
import { toast } from "react-toastify";
import { type OrganizationCreateRequest } from "~/api/models/organisation";
import {
  getOrganisationProviderTypes,
  postOrganisation,
} from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import { OrgAdminsEdit } from "~/components/Organisation/Upsert/OrgAdminsEdit";
import { OrgInfoEdit } from "~/components/Organisation/Upsert/OrgInfoEdit";
import { OrgRolesEdit } from "~/components/Organisation/Upsert/OrgRolesEdit";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import withAuth from "~/context/withAuth";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../_app";
import { FaThumbsUp } from "react-icons/fa";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient();
  if (session) {
    // 👇 prefetch queries (on server)
    await queryClient.prefetchQuery(["organisationProviderTypes"], () =>
      getOrganisationProviderTypes(context),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
    },
  };
}

const RegisterOrganisation: NextPageWithLayout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [organizationCreateRequest, setOrganizationCreateRequest] =
    useState<OrganizationCreateRequest>({
      name: "",
      websiteURL: "",
      primaryContactName: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
      vATIN: "",
      taxNumber: "",
      registrationNumber: "",
      city: "",
      countryId: "",
      streetAddress: "",
      province: "",
      postalCode: "",
      tagline: "",
      biography: "",
      providerTypeIds: [],
      logo: null,
      addCurrentUserAsAdmin: false,
      adminAdditionalEmails: [],
      registrationDocuments: [],
      educationProviderDocuments: [],
      businessDocuments: [],
    });

  const onSubmit = useCallback(
    async (/*data: FieldValues*/) => {
      setIsLoading(true);

      try {
        // update api
        await postOrganisation(organizationCreateRequest);
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "patchUserProfileError",
          autoClose: false,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }

      toast("Your organisation has been updated", {
        type: "success",
        toastId: "patchUserProfile",
      });
      setIsLoading(false);
    },
    [organizationCreateRequest, setIsLoading],
  );

  // form submission handler
  const onSubmitStep = useCallback(
    async (step: number, data: FieldValues) => {
      const model = {
        ...organizationCreateRequest,
        ...(data as OrganizationCreateRequest),
      };

      setOrganizationCreateRequest(model);
      if (step === 4) {
        await onSubmit(/*model*/);
        setStep(step);
        return;
      }
      setStep(step);
    },
    [setStep, organizationCreateRequest, onSubmit],
  );

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container max-w-md">
      {isLoading && <Loading />}

      {step == 1 && (
        <>
          <ul className="steps steps-vertical w-full lg:steps-horizontal">
            <li className="step step-success"></li>
            <li className="step"></li>
            <li className="step"></li>
          </ul>
          <div className="flex flex-col text-center">
            <h2>Organisation details</h2>
            <p className="my-2">General organisation information</p>
          </div>
          <OrgInfoEdit
            organisation={organizationCreateRequest}
            onCancel={handleCancel}
            onSubmit={(data) => onSubmitStep(2, data)}
          />
        </>
      )}

      {step == 2 && (
        <>
          <ul className="steps steps-vertical w-full lg:steps-horizontal">
            <li className="step"></li>
            <li className="step step-success"></li>
            <li className="step"></li>
          </ul>
          <div className="flex flex-col text-center">
            <h2>Organisation roles</h2>
            <p className="my-2">
              What role will your organisation play within Yoma?
            </p>
          </div>

          <OrgRolesEdit
            organisation={organizationCreateRequest}
            onCancel={() => {
              setStep(1);
            }}
            onSubmit={(data) => onSubmitStep(3, data)}
          />
        </>
      )}

      {step == 3 && (
        <>
          <ul className="steps steps-vertical w-full lg:steps-horizontal">
            <li className="step"></li>
            <li className="step"></li>
            <li className="step step-success"></li>
          </ul>
          <div className="flex flex-col text-center">
            <h2>Organisation Admins</h2>
            <p className="my-2">Who can login and manage the organisation?</p>
          </div>

          <OrgAdminsEdit
            organisation={organizationCreateRequest}
            onCancel={(data) => onSubmitStep(2, data)}
            onSubmit={(data) => onSubmitStep(4, data)}
          />
        </>
      )}

      {step == 4 && (
        <div className="flex flex-col place-items-center justify-center rounded-xl bg-white p-4">
          <h4>Success</h4>
          <FaThumbsUp size={100} className="my-10 text-green" />
          <p className="p-4 text-sm">
            Your organisation has been created. Please check your email for more
            details.
          </p>
        </div>
      )}
    </div>
  );
};

RegisterOrganisation.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(RegisterOrganisation);
