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
} from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getCountries } from "~/api/services/lookups";
import { getSession, signIn, useSession } from "next-auth/react";
import { fetchClientEnv } from "~/lib/utils";

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
      queryFn: async () => await getCountries(),
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
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const setUserProfile = useSetAtom(userProfileAtom);
  const { data: session, update } = useSession();

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
        // clear all toasts
        toast.dismiss();

        // update api
        await postOrganisation(model);

        setIsLoading(false);

        // refresh the access token to get new roles (OrganisationAdmin is added to the user roles after organisation is registered)
        // trigger a silent refresh by updating the session (see /server/auth.ts)
        // await update(session);

        // refresh user profile for new organisation to reflect on user menu
        const userProfile = await getUserProfile();
        setUserProfile(userProfile);

        void router.push("/organisations/register/success");
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
    [setIsLoading, setUserProfile, update, session],
  );

  //https://github.com/nextauthjs/next-auth/discussions/4229
  // const refreshSession = async () => {
  //   await fetch("/api/auth/session?refresh=true", {
  //     method: "GET",
  //     headers: { "Content-Type": "application/json" },
  //   });
  //    // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //    signIn(
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //     ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
  //       "") as string,  { redirect: false }
  //   );
  // }

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

  if (error) return <Unauthenticated />;

  return (
    <div className="bg-theme w-full px-2 py-12">
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

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OrganisationCreate.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OrganisationCreate;
