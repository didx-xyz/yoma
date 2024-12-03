import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue, useSetAtom } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import { type FieldValues } from "react-hook-form";
import { IoMdArrowRoundBack } from "react-icons/io";
import { toast } from "react-toastify";
import {
  type Organization,
  type OrganizationRequestBase,
} from "~/api/models/organisation";
import { getCountries } from "~/api/services/lookups";
import {
  getOrganisationById,
  getOrganisationProviderTypes,
  patchOrganisation,
  updateOrganisationLogo,
} from "~/api/services/organisations";
import { getUserProfile } from "~/api/services/user";
import FormField from "~/components/Common/FormField";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import MainLayout from "~/components/Layout/Main";
import { LogoTitle } from "~/components/Organisation/LogoTitle";
import { OrgAdminsEdit } from "~/components/Organisation/Upsert/OrgAdminsEdit";
import { OrgContactEdit } from "~/components/Organisation/Upsert/OrgContactEdit";
import { OrgInfoEdit } from "~/components/Organisation/Upsert/OrgInfoEdit";
import { OrgRewardsEdit } from "~/components/Organisation/Upsert/OrgRewardsEdit";
import { OrgRolesEdit } from "~/components/Organisation/Upsert/OrgRolesEdit";
import { OrgSettingsEdit } from "~/components/Organisation/Upsert/OrgSettingsEdit";
import { OrgSSOEdit } from "~/components/Organisation/Upsert/OrgSSOEdit";
import { PageBackground } from "~/components/PageBackground";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  GA_ACTION_ORGANISATION_UPATE,
  GA_CATEGORY_ORGANISATION,
  ROLE_ADMIN,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { config } from "~/lib/react-query-config";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationInactiveAtom,
  userProfileAtom,
} from "~/lib/store";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import type { OrganizationRequestViewModel } from "~/models/organisation";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";

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
  const queryClient = useQueryClient();
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
  const [activeTab, setActiveTab] = useState("orgSettings");

  // 👇 use prefetched queries from server
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
    queryFn: () => getOrganisationById(id),
    enabled: !error,
  });

  const [OrganizationRequestBase, setOrganizationRequestBase] =
    useState<OrganizationRequestViewModel>({
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
      addCurrentUserAsAdmin: isUserAdminOfCurrentOrg,
      admins:
        organisation?.administrators
          ?.map((x) => x.email ?? x.phoneNumber)
          .filter((x): x is string => x !== null) ?? [],
      registrationDocuments: [],
      educationProviderDocuments: [],
      businessDocuments: [],
      registrationDocumentsDelete: [],
      educationProviderDocumentsDelete: [],
      businessDocumentsDelete: [],
      ssoClientIdInbound: organisation?.ssoClientIdInbound ?? "",
      ssoClientIdOutbound: organisation?.ssoClientIdOutbound ?? "",
      zltoRewardPool: organisation?.zltoRewardPool ?? null,
      yomaRewardPool: organisation?.yomaRewardPool ?? null,
    });

  const menuItems = useMemo(() => {
    const items = [
      { step: 1, label: "Details", id: "lnkOrganisationDetails" },
      { step: 2, label: "Contact", id: "lnkOrganisationContact" },
      { step: 3, label: "Roles", id: "lnkOrganisationRoles" },
      { step: 4, label: "Admins", id: "lnkOrganisationAdmins" },
    ];

    if (isAdmin) {
      items.push({
        step: items.length + 1,
        label: "Reward",
        id: "lnkOrganisationReward",
      });
    }

    if (
      (isAdmin || isUserAdminOfCurrentOrg) &&
      organisation?.status === "Active"
    ) {
      items.push({
        step: items.length + 1,
        label: "Settings",
        id: "lnkOrganisationSettings",
      });
    }

    return items;
  }, [isAdmin, isUserAdminOfCurrentOrg, organisation]);
  const currentStep = menuItems.find((item) => item.step === step);

  //#region Event Handlers
  const onSubmit = useCallback(
    async (model: OrganizationRequestViewModel) => {
      setIsLoading(true);

      try {
        // clear all toasts
        toast.dismiss();

        // update api
        const logo = model.logo;
        model.logo = null;
        const updatedModel = await patchOrganisation(model);

        // uplodad logo
        if (logo) {
          await updateOrganisationLogo(updatedModel.id, logo);
        }

        // update query cache (get existing logo url)
        queryClient.invalidateQueries({ queryKey: ["organisation", id] });

        // clear uploaded logo from cache
        setOrganizationRequestBase((prev) => ({
          ...prev,
          logo: null,
        }));

        // update org status (limited functionality badge)
        setCurrentOrganisationInactiveAtom(updatedModel.status !== "Active");

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

        setIsLoading(false);

        return;
      }
    },
    [
      id,
      queryClient,
      setIsLoading,
      setUserProfile,
      isUserAdminOfCurrentOrg,
      setCurrentOrganisationInactiveAtom,
    ],
  );

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

  const onSubmitSSO = useCallback(
    async (data: FieldValues) => {
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
  //#endregion Event Handlers

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
            {menuItems.map((item) => (
              <li
                key={item.step}
                className={`w-full rounded-lg p-1 ${
                  step === item.step
                    ? "bg-green-light font-bold text-green hover:bg-green-light"
                    : "bg-gray-light text-gray-dark hover:bg-gray"
                }`}
              >
                <a onClick={() => setStep(item.step)} id={item.id}>
                  <span className="mr-2 rounded-full bg-green px-1.5 py-0.5 text-xs font-medium text-white">
                    {item.step}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          {/* DROPDOWN MENU */}
          <select
            className="select select-md focus:border-none focus:outline-none md:hidden"
            onChange={(e) => {
              const selectedItem = menuItems.find(
                (item) => item.label === e.target.value,
              );
              setStep(selectedItem ? selectedItem.step : 1);
            }}
            value={
              menuItems.find((item) => item.step === step)?.label || "Details"
            }
          >
            {menuItems.map((item) => (
              <option key={item.step}>{item.label}</option>
            ))}
          </select>

          <div className="flex w-full flex-col rounded-lg bg-white p-4 md:p-8">
            {currentStep?.id === "lnkOrganisationDetails" && (
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
            {currentStep?.id === "lnkOrganisationContact" && (
              <>
                <div className="flex flex-col text-left">
                  <h5 className="mb-6 font-bold tracking-wider">
                    Contact details
                  </h5>
                </div>
                <FormMessage
                  messageType={FormMessageType.Info}
                  className="mb-4"
                >
                  If enabled in Settings, these details will be shared with
                  trusted partners when sharing your opportunities.
                </FormMessage>
                <OrgContactEdit
                  formData={OrganizationRequestBase}
                  organisation={organisation}
                  onSubmit={(data) => onSubmitStep(3, data)}
                />
              </>
            )}
            {currentStep?.id === "lnkOrganisationRoles" && (
              <>
                <div className="flex flex-col text-left">
                  <h5 className="mb-6 font-bold tracking-wider">
                    Organisation roles
                  </h5>
                </div>
                <FormMessage
                  messageType={FormMessageType.Warning}
                  className="mb-4"
                >
                  Kindly note that expanding the roles your organization plays
                  in Yoma will necessitate re-verification of your organization.
                  <br /> During this process, functionalities such as creating
                  opportunities may be limited.
                </FormMessage>
                <OrgRolesEdit
                  formData={OrganizationRequestBase}
                  organisation={organisation}
                  onSubmit={(data) => onSubmitStep(4, data)}
                />
              </>
            )}
            {currentStep?.id === "lnkOrganisationAdmins" && (
              <>
                <div className="flex flex-col text-left">
                  <h5 className="mb-6 font-bold tracking-wider">
                    Organisation admins
                  </h5>
                </div>
                <OrgAdminsEdit
                  organisation={OrganizationRequestBase}
                  onSubmit={(data) => onSubmitStep(5, data)}
                />
              </>
            )}
            {currentStep?.id === "lnkOrganisationSettings" && (
              <>
                {isAdmin ? (
                  <div>
                    <div role="tablist" className="tabs tabs-bordered">
                      <a
                        role="tab"
                        className={`tab-lg tab ${
                          activeTab === "orgSettings"
                            ? "tab-active bg-white text-black"
                            : "text-gray"
                        }`}
                        onClick={() => setActiveTab("orgSettings")}
                      >
                        <div className="font-bold tracking-wider">Settings</div>
                      </a>
                      <a
                        role="tab"
                        className={`tab-lg tab ${
                          activeTab === "ssoSettings"
                            ? "tab-active bg-white text-black"
                            : "text-gray"
                        }`}
                        onClick={() => setActiveTab("ssoSettings")}
                      >
                        <div className="font-bold tracking-wider">SSO</div>
                      </a>
                    </div>
                    <div className="mt-4">
                      {activeTab === "orgSettings" && (
                        <OrgSettingsEdit organisation={organisation!} />
                      )}
                      {activeTab === "ssoSettings" && (
                        <OrgSSOEdit
                          organisation={OrganizationRequestBase}
                          onSubmit={onSubmitSSO}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col text-left">
                      <h5 className="mb-6 font-bold tracking-wider">
                        Organisation settings
                      </h5>
                    </div>
                    <OrgSettingsEdit organisation={organisation!} />
                  </>
                )}
              </>
            )}
            {currentStep?.id === "lnkOrganisationReward" && (
              <>
                <div className="flex flex-col text-left">
                  <h5 className="mb-6 font-bold tracking-wider">Reward pool</h5>
                </div>

                <div className="flex flex-col gap-4">
                  <FormMessage messageType={FormMessageType.Info}>
                    <strong>Organization-Level Pool:</strong> This new pool
                    covers all opportunities within an organization. If
                    depleted, no ZLTO can be awarded for any opportunity under
                    that organization, even if individual opportunity pools
                    still have ZLTO remaining.
                  </FormMessage>

                  {/* show the zltoRewardCumulative & zltoRewardBalance */}
                  <div className="flex flex-row gap-4">
                    <div className="w-full">
                      <FormField
                        label="Zlto Reward Cumulative"
                        tooltip="Represents the total amount of rewards that have already been distributed or allocated to participants. It is a running total that accumulates as rewards are awarded."
                      >
                        <label className="label-text">
                          {organisation?.zltoRewardCumulative ?? "N/A"}
                        </label>
                      </FormField>
                    </div>
                    <div className="w-full">
                      <FormField
                        label="Zlto Reward Balance"
                        tooltip="Represents the remaining amount of rewards available to be distributed. It is calculated as the difference between the Pool and Cumulative values. If no pool is defined, the balance will be null."
                      >
                        <label className="label-text">
                          {organisation?.zltoRewardBalance ?? "N/A"}
                        </label>
                      </FormField>
                    </div>
                  </div>

                  <OrgRewardsEdit
                    organisation={OrganizationRequestBase}
                    onSubmit={(data) => onSubmitStep(7, data)}
                  />
                </div>
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
OrganisationUpdate.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  return page.props.theme;
};

export default OrganisationUpdate;
