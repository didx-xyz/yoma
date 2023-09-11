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
    if (id != "register") {
      await queryClient.prefetchQuery(["organisation", id], () =>
        getOrganisationById(id, context),
      );
    }
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
    enabled: id != "register",
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

      if (step === 4) {
        await onSubmit();
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
      organisation: {JSON.stringify(organisation)}
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
    </div>
  );
};

RegisterOrganisation.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(RegisterOrganisation);
