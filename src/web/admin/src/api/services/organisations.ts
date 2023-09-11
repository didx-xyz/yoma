import { type GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import {
  type OrganizationRequestUpdateStatus,
  type Organization,
  type OrganizationCreateRequest,
  type OrganizationProviderType,
  type OrganizationSearchFilter,
  type OrganizationSearchResults,
  type UserInfo,
} from "../models/organisation";

export const getOrganisationProviderTypes = async (
  context?: GetServerSidePropsContext,
): Promise<OrganizationProviderType[]> => {
  const { data } = context
    ? await ApiServer(context).get<OrganizationProviderType[]>(
        "/organization/lookup/providerType",
      )
    : await ApiClient.get<OrganizationProviderType[]>(
        "/organization/lookup/providerType",
      );
  return data;
};

export const postOrganisation = async (
  model: OrganizationCreateRequest,
): Promise<Organization> => {
  /* eslint-disable */
  // convert model to form data
  const formData = new FormData();
  for (const property in model) {
    if (property === "logo") {
      // send as first item in array
      formData.append(property, (model as any)[property][0]);
    } else if (
      property === "registrationDocuments" ||
      property === "educationProviderDocuments" ||
      property === "businessDocuments" ||
      property === "providerTypeIds" ||
      property === "adminAdditionalEmails"
    ) {
      // send as multiple items in form data
      for (const file of (model as any)[property]) {
        formData.append(property, file);
      }
    } else formData.append(property, (model as any)[property]);
  }
  /* eslint-enable */

  const { data } = await ApiClient.post<Organization>(
    "/organization/create",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data;
};

export const getOrganisations = async (
  filter: OrganizationSearchFilter,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResults> => {
  const { data } = context
    ? await ApiServer(context).post<OrganizationSearchResults>(
        "/organization/search",
        filter,
      )
    : await ApiClient.post<OrganizationSearchResults>(
        "/organization/search",
        filter,
      );
  return data;
};

export const getOrganisationById = async (
  id: string,
  context?: GetServerSidePropsContext,
): Promise<Organization> => {
  const { data } = context
    ? await ApiServer(context).get<Organization>(`/organization/${id}`)
    : await ApiClient.get<Organization>(`/organization/${id}`);
  return data;
};

export const getOrganisationAdminsById = async (
  id: string,
  context?: GetServerSidePropsContext,
): Promise<UserInfo[]> => {
  const { data } = context
    ? await ApiServer(context).get<UserInfo[]>(`/organization/${id}/admin`)
    : await ApiClient.get<UserInfo[]>(`/organization/${id}/admin`);
  return data;
};

export const putOrganisationStatus = async (
  id: string,
  model: OrganizationRequestUpdateStatus,
) => {
  await ApiClient.put<Organization>(`/organization/${id}/status`, model);
};
