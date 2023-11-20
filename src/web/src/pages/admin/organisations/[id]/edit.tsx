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
import { AccessDenied } from "~/components/Status/AccessDenied";
import { THEME_BLUE } from "~/lib/constants";

interface IParams extends ParsedUrlQuery {
  id: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const { id } = context.params as IParams;
  const queryClient = new QueryClient();

  // 👇 prefetch queries (on server)
  await queryClient.prefetchQuery(["organisationProviderTypes"], () =>
    getOrganisationProviderTypes(context),
  );
  await queryClient.prefetchQuery(["organisation", id], () =>
    getOrganisationById(id, context),
  );

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
    },
  };
}

const OrganisationUpdate: NextPageWithLayout<{
  id: string;
  user: User | null;
  error: string;
}> = ({ id, user, error }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);

  const isUserAdminOfCurrentOrg =
    userProfile?.adminsOf?.find((x) => x.id == id) != null;

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

  if (error) return <AccessDenied />;

  return (
    <>
      <Head>
        <title>Yoma Admin | Edit organisation</title>
      </Head>

      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-8">
        {isLoading && <Loading />}

        {/* BREADCRUMB */}
        <div className="flex flex-row text-xs text-white">
          {activeRoleView === RoleView.Admin && (
            <Link
              className="font-bold hover:text-gray"
              href={"/admin/organisations"}
            >
              Organisations
            </Link>
          )}
          {activeRoleView !== RoleView.Admin && (
            <div className="font-bold">Organisations</div>
          )}

          <div className="mx-2">/</div>

          {activeRoleView === RoleView.Admin && (
            <Link
              className="font-bold hover:text-gray"
              href={`/organisations/${id}`}
            >
              {organisation?.name}
            </Link>
          )}
          {activeRoleView !== RoleView.Admin && (
            <div className="font-bold">{organisation?.name}</div>
          )}

          <div className="mx-2">/</div>
          <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap">
            Edit
          </div>
        </div>

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
OrganisationUpdate.theme = THEME_BLUE;

export default OrganisationUpdate;
