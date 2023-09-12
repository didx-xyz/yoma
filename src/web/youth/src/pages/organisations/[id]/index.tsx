import { captureException } from "@sentry/nextjs";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import router from "next/router";
import { ParsedUrlQuery } from "querystring";
import { useCallback, useState, type ReactElement } from "react";
import { type FieldValues } from "react-hook-form";
import { toast } from "react-toastify";
import {
  Organization,
  type OrganizationCreateRequest,
} from "~/api/models/organisation";
import {
  getOrganisationById,
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
import { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient();
  if (session) {
    // 👇 prefetch queries (on server)
    await queryClient.prefetchQuery(["organisationProviderTypes"], () =>
      getOrganisationProviderTypes(context),
    );
    await queryClient.prefetchQuery(["organisation", id], () =>
      getOrganisationById(id, context),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component),
      id: id,
    },
  };
}

const RegisterOrganisation: NextPageWithLayout<{
  id: string;
}> = ({ id }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
  });

  const [organizationCreateRequest, setOrganizationCreateRequest] =
    useState<OrganizationCreateRequest>({
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
      providerTypes: organisation?.providerTypes?.map((x) => x.name) ?? [],
      logo: null,
      addCurrentUserAsAdmin: false,
      adminAdditionalEmails: [],
      registrationDocuments: [],
      educationProviderDocuments: [],
      businessDocuments: [],
    });

  const onSubmit = useCallback(async () => {
    setIsLoading(true);

    try {
      // update api
      await postOrganisation(organizationCreateRequest);

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
  }, [organizationCreateRequest, setIsLoading]);

  // form submission handler
  const onSubmitStep = useCallback(
    async (step: number, data: FieldValues) => {
      // set form data
      const model = {
        ...organizationCreateRequest,
        ...(data as OrganizationCreateRequest),
      };

      setOrganizationCreateRequest(model);

      await onSubmit();
      return;
    },
    [, organizationCreateRequest, onSubmit],
  );

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container max-w-5xl">
      {isLoading && <Loading />}

      <div className="flex flex-col pt-8">
        <h3 className="pl-16">Profile information</h3>

        <div className="flex flex-col justify-center gap-2 p-8 md:flex-row">
          <ul className="menu rounded-box menu-horizontal h-40 w-full gap-2 bg-white p-4 md:menu-vertical md:max-w-[300px]">
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
            {/* organisation: {JSON.stringify(organisation)} */}
            {step == 1 && (
              <>
                <div className="flex flex-col text-center">
                  <h2>Organisation details</h2>
                </div>
                <OrgInfoEdit
                  organisation={organizationCreateRequest}
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
                <div className="flex flex-col text-center">
                  <h2>Organisation admins</h2>
                </div>

                <OrgAdminsEdit
                  organisation={organizationCreateRequest}
                  onSubmit={(data) => onSubmitStep(4, data)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

RegisterOrganisation.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(RegisterOrganisation);
