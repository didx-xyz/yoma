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
  currentOrganisationInactiveAtom,
  userProfileAtom,
} from "~/lib/store";
import { getUserProfile } from "~/api/services/user";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  GA_ACTION_ORGANISATION_UPATE,
  GA_CATEGORY_ORGANISATION,
  ROLE_ADMIN,
} from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getCountries } from "~/api/services/lookups";
import { IoIosWarning, IoMdArrowRoundBack } from "react-icons/io";
import { trackGAEvent } from "~/lib/google-analytics";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { useRouter } from "next/router";

interface IParams extends ParsedUrlQuery {
  id: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  try {
    // 👇 prefetch queries on server
    const dataOrganisationProviderTypes =
      await getOrganisationProviderTypes(context);
    const dataCountries = await getCountries(context);
    const dataOrganisation = await getOrganisationById(id, context);

    await Promise.all([
      await queryClient.prefetchQuery({
        queryKey: ["organisationProviderTypes"],
        queryFn: () => dataOrganisationProviderTypes,
      }),
      await queryClient.prefetchQuery({
        queryKey: ["countries"],
        queryFn: () => dataCountries,
      }),
      await queryClient.prefetchQuery({
        queryKey: ["organisation", id],
        queryFn: () => dataOrganisation,
      }),
    ]);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
          props: { theme: theme },
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      theme: theme,
      error: errorCode,
    },
  };
}

const OrganisationUpdate: NextPageWithLayout<{
  id: string;
  user: User | null;
  theme: string;
  error?: number;
}> = ({ id, user, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const setCurrentOrganisationInactiveAtom = useSetAtom(
    currentOrganisationInactiveAtom,
  );
  const isAdmin = user?.roles?.includes(ROLE_ADMIN);
  const isUserAdminOfCurrentOrg =
    userProfile?.adminsOf?.find((x) => x.id == id) != null;

  // 👇 use prefetched queries from server
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
    queryFn: () => getOrganisationById(id),
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
      ssoClientIdInbound: organisation?.ssoClientIdInbound ?? "",
      ssoClientIdOutbound: organisation?.ssoClientIdOutbound ?? "",
    });

  const onSubmit = useCallback(
    async (model: OrganizationRequestBase) => {
      setIsLoading(true);

      try {
        // clear all toasts
        toast.dismiss();

        // update api
        const updatedOrg = await patchOrganisation(model);

        // update org status (limited functionality badge)
        setCurrentOrganisationInactiveAtom(updatedOrg.status !== "Active");

        // refresh user profile for updated organisation to reflect on user menu
        if (isUserAdminOfCurrentOrg) {
          const userProfile = await getUserProfile();
          setUserProfile(userProfile);
        }

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_ORGANISATION,
          GA_ACTION_ORGANISATION_UPATE,
          `Organisation updated: ${model.name}`,
        );

        toast("Your organisation has been updated", {
          type: "success",
          toastId: "patchOrganisation",
        });
        setIsLoading(false);

        console.log("Your organisation has been updated"); // 👈 for e2e tests
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
    [
      setIsLoading,
      setUserProfile,
      isUserAdminOfCurrentOrg,
      setCurrentOrganisationInactiveAtom,
    ],
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

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma Admin | Edit organisation</title>
      </Head>

      <PageBackground />

      <div className="container z-10 mt-16 max-w-7xl px-2 py-8">
        {isLoading && <Loading />}

        {/* BREADCRUMB */}
        {activeRoleView !== RoleView.User && (
          <div className="flex flex-row text-xs text-white">
            <Link
              className="flex items-center justify-center font-bold hover:text-gray"
              href={getSafeUrl(returnUrl?.toString(), `/organisations`)}
            >
              <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4" />
              Organisations
            </Link>

            <div className="mx-2 font-bold">|</div>

            <Link
              className="flex max-w-[300px] items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap font-bold hover:text-gray md:max-w-[400px] lg:max-w-[800px]"
              href={`/organisations/${id}${
                returnUrl
                  ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}`
                  : ""
              }`}
            >
              {organisation?.name}
            </Link>

            <div className="mx-2 font-bold">|</div>
            <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap">
              Edit
            </div>
          </div>
        )}

        {/* LOGO/TITLE */}
        <LogoTitle logoUrl={organisation?.logoURL} title={organisation?.name} />

        {/* CONTENT */}
        <div className="flex flex-col justify-center gap-4 md:flex-row">
          {/* MENU */}
          <ul className="menu-horizontal hidden h-max w-full items-center justify-center gap-4 rounded-lg bg-white p-4 font-semibold shadow-custom md:menu md:menu-vertical md:max-w-[265px]">
            <li
              className={`w-full rounded-lg p-1 ${
                step === 1
                  ? "bg-green-light font-bold text-green"
                  : "bg-gray-light text-gray-dark"
              }`}
            >
              <a onClick={() => setStep(1)} id="lnkOrganisationDetails">
                <span className="mr-2 rounded-full bg-green px-1.5 py-0.5 text-xs font-medium text-white">
                  1
                </span>
                Organisation details
              </a>
            </li>
            <li
              className={`w-full rounded-lg p-1 ${
                step === 2
                  ? "bg-green-light font-bold text-green"
                  : "bg-gray-light text-gray-dark"
              }`}
            >
              <a onClick={() => setStep(2)} id="lnkOrganisationRoles">
                <span className="mr-2 rounded-full bg-green px-1.5 py-0.5 text-xs font-medium text-white">
                  2
                </span>
                Organisation roles
              </a>
            </li>
            <li
              className={`w-full rounded-lg p-1 ${
                step === 3
                  ? "bg-green-light font-bold text-green"
                  : "bg-gray-light text-gray-dark"
              }`}
            >
              <a onClick={() => setStep(3)} id="lnkOrganisationAdmins">
                <span className="mr-2 rounded-full bg-green px-1.5 py-0.5 text-xs font-medium text-white">
                  3
                </span>
                Organisation admins
              </a>
            </li>
          </ul>

          {/* DROPDOWN MENU */}
          <select
            className="select select-md focus:border-none focus:outline-none md:hidden"
            onChange={(e) => {
              switch (e.target.value) {
                case "Organisation detail":
                  setStep(1);
                  break;
                case "Organisation roles":
                  setStep(2);
                  break;
                case "Organisation admins":
                  setStep(3);
                  break;
                default:
                  setStep(1);
                  break;
              }
            }}
          >
            <option>Organisation details</option>
            <option>Organisation roles</option>
            <option>Organisation admins</option>
          </select>

          <div className="flex w-full flex-col rounded-lg bg-white p-4 md:p-8">
            {step == 1 && (
              <>
                <div className="flex flex-col text-left">
                  <h5 className="mb-6 font-bold tracking-wider">
                    Organisation details
                  </h5>
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
                <div className="flex flex-col text-left">
                  <h5 className="mb-6 font-bold tracking-wider">
                    Organisation roles
                  </h5>
                </div>

                <p className="my-2 flex flex-row items-center gap-4 rounded-xl bg-green px-4 py-2 text-sm text-white">
                  <IoIosWarning className="inline-block h-6 w-6" />
                  Kindly note that expanding the roles your organization plays
                  in Yoma will necessitate re-verification of your organization.
                  <br /> During this process, functionalities such as creating
                  opportunities may be limited.
                </p>

                <OrgRolesEdit
                  formData={OrganizationRequestBase}
                  organisation={organisation}
                  onSubmit={(data) => onSubmitStep(3, data)}
                />
              </>
            )}
            {step == 3 && (
              <>
                <div className="flex flex-col text-left">
                  <h5 className="mb-6 font-bold tracking-wider">
                    Organisation admins
                  </h5>
                </div>

                <OrgAdminsEdit
                  organisation={OrganizationRequestBase}
                  onSubmit={(data) => onSubmitStep(4, data)}
                  isAdmin={isAdmin}
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
