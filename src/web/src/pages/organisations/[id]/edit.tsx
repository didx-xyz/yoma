import { captureException } from "@sentry/nextjs";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useState, type ReactElement } from "react";
import { type FieldValues } from "react-hook-form";
import { toast } from "react-toastify";
import {
  type Organization,
  type OrganizationRequestBase,
} from "~/api/models/organisation";
import {
  getOrganisationById,
  getOrganisationProviderTypes,
  patchOrganisation,
} from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import { LogoTitle } from "~/components/Organisation/LogoTitle";
import { OrgAdminsEdit } from "~/components/Organisation/Upsert/OrgAdminsEdit";
import { OrgInfoEdit } from "~/components/Organisation/Upsert/OrgInfoEdit";
import { OrgRolesEdit } from "~/components/Organisation/Upsert/OrgRolesEdit";
import { PageBackground } from "~/components/PageBackground";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { type NextPageWithLayout } from "~/pages/_app";
import { type User, authOptions } from "~/server/auth";
import { useAtomValue, useSetAtom } from "jotai";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  userProfileAtom,
} from "~/lib/store";
import { getUserProfile } from "~/api/services/user";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  ROLE_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
  THEME_PURPLE,
} from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getCountries } from "~/api/services/lookups";

interface IParams extends ParsedUrlQuery {
  id: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
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

  if (session?.user?.adminsOf?.includes(id)) {
    theme = THEME_GREEN;
  } else if (session?.user?.roles.includes(ROLE_ADMIN)) {
    theme = THEME_BLUE;
  } else {
    theme = THEME_PURPLE;
  }

  // 👇 prefetch queries on server
  const queryClient = new QueryClient(config);
  await Promise.all([
    await queryClient.prefetchQuery({
      queryKey: ["organisationProviderTypes"],
      queryFn: () => getOrganisationProviderTypes(context),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["countries"],
      queryFn: async () => await getCountries(),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["organisation", id],
      queryFn: () => getOrganisationById(id, context),
    }),
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      theme: theme,
    },
  };
}

const OrganisationUpdate: NextPageWithLayout<{
  id: string;
  user: User | null;
  error: string;
  theme: string;
}> = ({ id, user, error }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);

  const isUserAdminOfCurrentOrg =
    userProfile?.adminsOf?.find((x) => x.id == id) != null;

  // 👇 use prefetched queries from server
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
    enabled: !error,
  });

  const [OrganizationRequestBase, setOrganizationRequestBase] =
    useState<OrganizationRequestBase>({
      id: organisation?.id ?? "",
      name: organisation?.name ?? "",
      websiteURL: organisation?.websiteURL ?? "",
      primaryContactName: organisation?.primaryContactName ?? "",
      primaryContactEmail: organisation?.primaryContactEmail ?? "",
      primaryContactPhone: organisation?.primaryContactPhone ?? "",
      vATIN: organisation?.vATIN ?? "",
      taxNumber: organisation?.taxNumber ?? "",
      registrationNumber: organisation?.registrationNumber ?? "",
      city: organisation?.city ?? "",
      countryId: organisation?.countryId ?? "",
      streetAddress: organisation?.streetAddress ?? "",
      province: organisation?.province ?? "",
      postalCode: organisation?.postalCode ?? "",
      tagline: organisation?.tagline ?? "",
      biography: organisation?.biography ?? "",
      providerTypes: organisation?.providerTypes?.map((x) => x.id) ?? [],
      logo: null,
      addCurrentUserAsAdmin:
        organisation?.administrators?.find((x) => x.email == user?.email) !=
          null ?? false,
      adminEmails: organisation?.administrators?.map((x) => x.email) ?? [],
      registrationDocuments: [],
      educationProviderDocuments: [],
      businessDocuments: [],
      registrationDocumentsDelete: [],
      educationProviderDocumentsDelete: [],
      businessDocumentsDelete: [],
    });

  const onSubmit = useCallback(
    async (model: OrganizationRequestBase) => {
      setIsLoading(true);

      try {
        // clear all toasts
        toast.dismiss();

        // update api
        await patchOrganisation(model);

        // refresh user profile for updated organisation to reflect on user menu
        if (isUserAdminOfCurrentOrg) {
          const userProfile = await getUserProfile();
          setUserProfile(userProfile);
        }

        toast("Your organisation has been updated", {
          type: "success",
          toastId: "patchOrganisation",
        });
        setIsLoading(false);
      } catch (error) {
        toast(<ApiErrors error={error} />, {
          type: "error",
          toastId: "patchOrganisation",
          autoClose: false,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }
    },
    [setIsLoading, setUserProfile, isUserAdminOfCurrentOrg],
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

      await onSubmit(model);
      return;
    },
    [OrganizationRequestBase, onSubmit],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma Admin | Edit organisation</title>
      </Head>

      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-8">
        {isLoading && <Loading />}

        {/* BREADCRUMB */}
        {activeRoleView !== RoleView.User && (
          <div className="flex flex-row text-xs text-white">
            <Link className="font-bold hover:text-gray" href={"/organisations"}>
              Organisations
            </Link>

            <div className="mx-2">/</div>

            <Link
              className="font-bold hover:text-gray"
              href={`/organisations/${id}`}
            >
              {organisation?.name}
            </Link>

            <div className="mx-2">/</div>
            <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap">
              Edit
            </div>
          </div>
        )}

        {/* LOGO/TITLE */}
        <LogoTitle logoUrl={organisation?.logoURL} title={organisation?.name} />

        {/* CONTENT */}
        <div className="flex flex-col justify-center gap-2 md:flex-row">
          <ul className="menu menu-horizontal h-40 w-full gap-2 rounded-lg bg-white p-4 md:menu-vertical md:max-w-[300px]">
            <li
              className={`w-full rounded ${
                step === 1
                  ? "bg-emerald-100 font-bold text-green"
                  : "bg-gray-light"
              }`}
            >
              <a onClick={() => setStep(1)}>Organisation details</a>
            </li>
            <li
              className={`w-full rounded ${
                step === 2
                  ? "bg-emerald-100 font-bold text-green"
                  : "bg-gray-light"
              }`}
            >
              <a onClick={() => setStep(2)}>Organisation roles</a>
            </li>
            <li
              className={`w-full rounded ${
                step === 3
                  ? "bg-emerald-100 font-bold text-green"
                  : "bg-gray-light"
              }`}
            >
              <a onClick={() => setStep(3)}>Organisation admins</a>
            </li>
          </ul>
          <div className="flex w-full flex-col rounded-lg bg-white p-8">
            {step == 1 && (
              <>
                <div className="flex flex-col text-center">
                  <h2>Organisation details</h2>
                </div>
                <OrgInfoEdit
                  formData={OrganizationRequestBase}
                  organisation={organisation}
                  onSubmit={(data) => onSubmitStep(2, data)}
                />
              </>
            )}
            {step == 2 && (
              <>
                <div className="flex flex-col text-center">
                  <h2>Organisation roles</h2>
                </div>

                <OrgRolesEdit
                  formData={OrganizationRequestBase}
                  organisation={organisation}
                  onSubmit={(data) => onSubmitStep(3, data)}
                />
              </>
            )}
            {step == 3 && (
              <>
                <div className="flex flex-col text-center">
                  <h2>Organisation admins</h2>
                </div>

                <OrgAdminsEdit
                  organisation={OrganizationRequestBase}
                  onSubmit={(data) => onSubmitStep(4, data)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

OrganisationUpdate.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OrganisationUpdate.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OrganisationUpdate;
