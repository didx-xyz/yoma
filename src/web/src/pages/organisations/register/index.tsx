import { captureException } from "@sentry/nextjs";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import router from "next/router";
import { useCallback, useState, type ReactElement, useEffect } from "react";
import { type FieldValues } from "react-hook-form";
import { toast } from "react-toastify";
import { type OrganizationRequestBase } from "~/api/models/organisation";
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
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

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

const OrganisationCreate: NextPageWithLayout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [OrganizationRequestBase, setOrganizationRequestBase] =
    useState<OrganizationRequestBase>({
      id: "",
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
      providerTypes: [],
      logo: null,
      addCurrentUserAsAdmin: false,
      adminEmails: [],
      registrationDocuments: [],
      educationProviderDocuments: [],
      businessDocuments: [],
      businessDocumentsDelete: [],
      educationProviderDocumentsDelete: [],
      registrationDocumentsDelete: [],
    });

  const onSubmit = useCallback(
    async (model: OrganizationRequestBase) => {
      setIsLoading(true);

      try {
        // update api
        await postOrganisation(model);

        toast("Your organisation has been updated", {
          type: "success",
          toastId: "organisationRegistration",
        });
        setIsLoading(false);

        void router.push("/partner/success");
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "organisationRegistration",
          autoClose: false,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }
    },
    [setIsLoading],
  );

  // form submission handler
  const onSubmitStep = useCallback(
    async (step: number, data: FieldValues) => {
      // set form data
      const model = {
        ...OrganizationRequestBase,
        ...(data as OrganizationRequestBase),
      };

      setOrganizationRequestBase(model);

      if (step === 4) {
        await onSubmit(model);
        return;
      }
      setStep(step);
    },
    [setStep, OrganizationRequestBase, onSubmit],
  );

  const handleCancel = () => {
    router.back();
  };

  // scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  return (
    <div className="w-full bg-purple px-2 py-12">
      {isLoading && <Loading />}

      {/* CONTENT */}
      <div className="flex items-center justify-center">
        <div className="flex w-full max-w-lg flex-col rounded-lg bg-white p-12">
          {step == 1 && (
            <>
              <ul className="steps steps-horizontal mx-auto w-72">
                <li className="step step-success"></li>
                <li className="step"></li>
                <li className="step"></li>
              </ul>
              <div className="my-4 flex flex-col text-center">
                <h2 className="font-semibold tracking-wide">
                  Organisation details
                </h2>
                <p className="my-2 text-gray-dark">
                  General organisation information
                </p>
              </div>

              <OrgInfoEdit
                formData={OrganizationRequestBase}
                onCancel={handleCancel}
                onSubmit={(data) => onSubmitStep(2, data)}
                cancelButtonText="Cancel"
                submitButtonText="Next"
              />
            </>
          )}

          {step == 2 && (
            <>
              <ul className="steps steps-horizontal mx-auto w-72">
                <li className="step step-success"></li>
                <li className="step step-success"></li>
                <li className="step"></li>
              </ul>
              <div className="my-4 flex flex-col text-center">
                <h2 className="font-semibold tracking-wide">
                  Organisation roles
                </h2>
                <p className="my-2 text-gray-dark">
                  Organisation role information
                </p>
              </div>

              <OrgRolesEdit
                formData={OrganizationRequestBase}
                onCancel={() => {
                  setStep(1);
                }}
                onSubmit={(data) => onSubmitStep(3, data)}
                cancelButtonText="Back"
                submitButtonText="Next"
              />
            </>
          )}

          {step == 3 && (
            <>
              <ul className="steps steps-horizontal mx-auto w-72">
                <li className="step step-success"></li>
                <li className="step step-success"></li>
                <li className="step step-success"></li>
              </ul>
              <div className="my-4 flex flex-col text-center">
                <h2 className="font-semibold tracking-wide">
                  Organisation Admins
                </h2>
                <p className="my-2 text-gray-dark">
                  Who can login and manage the organisation?
                </p>
              </div>

              <OrgAdminsEdit
                organisation={OrganizationRequestBase}
                onCancel={(data) => onSubmitStep(2, data)}
                onSubmit={(data) => onSubmitStep(4, data)}
                cancelButtonText="Back"
                submitButtonText="Submit for approval"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

OrganisationCreate.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(OrganisationCreate);
