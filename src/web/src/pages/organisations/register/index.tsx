import { captureException } from "@sentry/nextjs";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useCallback, useState, type ReactElement, useEffect } from "react";
import { type FieldValues } from "react-hook-form";
import { toast } from "react-toastify";
import { type OrganizationRequestBase } from "~/api/models/organisation";
import {
  getOrganisationProviderTypes,
  postOrganisation,
  updateOrganisationLogo,
} from "~/api/services/organisations";
import { getUserProfile } from "~/api/services/user";
import MainLayout from "~/components/Layout/Main";
import { OrgAdminsEdit } from "~/components/Organisation/Upsert/OrgAdminsEdit";
import { OrgInfoEdit } from "~/components/Organisation/Upsert/OrgInfoEdit";
import { OrgRolesEdit } from "~/components/Organisation/Upsert/OrgRolesEdit";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { userProfileAtom } from "~/lib/store";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";
import { useSetAtom } from "jotai";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import {
  ROLE_ADMIN,
  THEME_BLUE,
  ROLE_ORG_ADMIN,
  THEME_GREEN,
  THEME_PURPLE,
  GA_CATEGORY_ORGANISATION,
  GA_ACTION_ORGANISATION_REGISTER,
} from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getCountries } from "~/api/services/lookups";
import { useSession } from "next-auth/react";
import { trackGAEvent } from "~/lib/google-analytics";
import { OrganizationRequestViewModel } from "~/models/organisation";
import { OrgContactEdit } from "~/components/Organisation/Upsert/OrgContactEdit";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";

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
    theme = THEME_PURPLE;
  }

  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server
  await Promise.all([
    await queryClient.prefetchQuery({
      queryKey: ["organisationProviderTypes"],
      queryFn: () => getOrganisationProviderTypes(context),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["countries"],
      queryFn: async () => await getCountries(context),
    }),
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      theme: theme,
    },
  };
}

const OrganisationCreate: NextPageWithLayout<{
  error: string;
  theme: string;
}> = ({ error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const setUserProfile = useSetAtom(userProfileAtom);
  const { data: session, update } = useSession();
  const isAdmin = session?.user?.roles.includes(ROLE_ADMIN);

  const [OrganizationRequestBase, setOrganizationRequestBase] =
    useState<OrganizationRequestViewModel>({
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
      addCurrentUserAsAdmin: true,
      adminEmails: [],
      registrationDocuments: [],
      educationProviderDocuments: [],
      businessDocuments: [],
      businessDocumentsDelete: [],
      educationProviderDocumentsDelete: [],
      registrationDocumentsDelete: [],
      ssoClientIdInbound: "",
      ssoClientIdOutbound: "",
    });

  const onSubmit = useCallback(
    async (model: OrganizationRequestViewModel) => {
      setIsLoading(true);

      try {
        // clear all toasts
        toast.dismiss();

        // update api
        const logo = model.logo;
        model.logo = null;
        const updatedModel = await postOrganisation(model);

        // uplodad logo
        await updateOrganisationLogo(updatedModel.id, logo);

        console.log("Organisation registered");

        setIsLoading(false);

        // refresh the access token to get new roles (OrganisationAdmin is added to the user roles after organisation is registered)
        // trigger a silent refresh by updating the session (see /server/auth.ts)
        // this updates the client-side token, but NOT the server. workaround is to reload the page below
        await update(session);

        // refresh user profile for new organisation to reflect on user menu
        const userProfile = await getUserProfile();
        setUserProfile(userProfile);

        void router.push("/organisations/register/success").then(() => {
          // 👈 NB: force a reload of the page to update the session on the server
          // get new roles if the user is not yet an organisation admin
          if (!session?.user.roles.includes(ROLE_ORG_ADMIN)) router.reload();
        });
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "organisationRegistration",
          autoClose: 4000,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }
    },
    [setIsLoading, setUserProfile, update, session, router],
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

      if (step < 5)
        // next step
        setStep(step);
      else {
        // last step
        await onSubmit(model);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_ORGANISATION,
          GA_ACTION_ORGANISATION_REGISTER,
          `Organisation registered: ${model.name}`,
        );
        return;
      }
    },
    [setStep, OrganizationRequestBase, onSubmit],
  );

  const handleCancel = useCallback(() => {
    router.push(returnUrl?.toString() ?? "/");
  }, [router, returnUrl]);

  // scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  if (error) return <Unauthenticated />;

  return (
    <div className="bg-theme w-full px-2 py-12">
      {isLoading && <Loading />}

      {/* CONTENT */}
      <div className="flex items-center justify-center">
        <div className="mt-20 flex w-full max-w-lg flex-col rounded-lg bg-white p-4 md:p-12">
          {step == 1 && (
            <>
              <ul className="steps steps-horizontal mx-auto w-72">
                <li className="step step-success"></li>
                <li className="step before:!bg-gray after:!bg-gray"></li>
                <li className="step before:!bg-gray after:!bg-gray"></li>
                <li className="step before:!bg-gray after:!bg-gray"></li>
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
                <li className="step before:!bg-gray after:!bg-gray"></li>
                <li className="step before:!bg-gray after:!bg-gray"></li>
              </ul>
              <div className="my-4 flex flex-col text-center">
                <h2 className="font-semibold tracking-wide">Contact details</h2>
                <p className="my-2 text-gray-dark">
                  Organisation contact information
                </p>
              </div>

              <FormMessage messageType={FormMessageType.Info} className="mb-4">
                These details will be shared to partners and Youth to enhance
                discovery and contractibility if settings are enabled.
              </FormMessage>

              <OrgContactEdit
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
                <li className="step before:!bg-gray after:!bg-gray"></li>
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
                  setStep(2);
                }}
                onSubmit={(data) => onSubmitStep(4, data)}
                cancelButtonText="Back"
                submitButtonText="Next"
              />
            </>
          )}

          {step == 4 && (
            <>
              <ul className="steps steps-horizontal mx-auto w-full md:w-96">
                <li className="step step-success"></li>
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
                onCancel={(data) => onSubmitStep(3, data)}
                onSubmit={(data) => onSubmitStep(5, data)}
                cancelButtonText="Back"
                submitButtonText="Submit for approval"
                isAdmin={isAdmin}
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

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OrganisationCreate.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OrganisationCreate;
