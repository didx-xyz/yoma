import type { GetStaticPropsContext, GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  Organization,
  OrganizationProviderType,
  OrganizationRequestBase,
  OrganizationRequestUpdateStatus,
  OrganizationSearchFilter,
  OrganizationSearchResults,
  UserInfo,
} from "../models/organisation";

export const getOrganisationProviderTypes = async (
  context?: GetServerSidePropsContext,
): Promise<OrganizationProviderType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OrganizationProviderType[]>(
    "/organization/lookup/providerType",
  );
  return data;
};

export const postOrganisation = async (
  model: OrganizationRequestBase,
): Promise<Organization> => {
  // convert model to form data
  /* eslint-disable */
  const formData = new FormData();
  for (const property in model) {
    let propVal = (model as any)[property];

    if (property === "logo") {
      // send as first item in array
      formData.append(property, propVal ? propVal[0] : null);
    } else if (
      property === "providerTypes" ||
      property === "adminEmails" ||
      property === "registrationDocuments" ||
      property === "educationProviderDocuments" ||
      property === "businessDocuments" ||
      property === "registrationDocumentsDelete" ||
      property === "educationProviderDocumentsDelete" ||
      property === "businessDocumentsDelete"
    ) {
      // send as multiple items in form data
      for (const file of propVal) {
        formData.append(property, file);
      }
    } else formData.append(property, propVal);
  }
  /* eslint-enable */

  const { data } = await (
    await ApiClient
  ).post<Organization>("/organization", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const patchOrganisation = async (
  model: OrganizationRequestBase,
): Promise<Organization> => {
  // convert model to form data
  /* eslint-disable */
  const formData = new FormData();
  for (const property in model) {
    let propVal = (model as any)[property];

    if (property === "logo") {
      // send as first item in array
      formData.append(property, propVal ? propVal[0] : null);
    } else if (
      property === "providerTypes" ||
      property === "adminEmails" ||
      property === "registrationDocuments" ||
      property === "educationProviderDocuments" ||
      property === "businessDocuments" ||
      property === "registrationDocumentsDelete" ||
      property === "educationProviderDocumentsDelete" ||
      property === "businessDocumentsDelete"
    ) {
      // send as multiple items in form data
      for (const file of propVal) {
        formData.append(property, file);
      }
    } else formData.append(property, propVal);
  }
  /* eslint-enable */

  const { data } = await (
    await ApiClient
  ).patch<Organization>("/organization", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getOrganisationById = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Organization> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<Organization>(`/organization/${id}`);
  return data;
};

export const getOrganisations = async (
  filter: OrganizationSearchFilter,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchResults>(
    "/organization/search",
    filter,
  );
  return data;
};

export const getOrganisationAdminsById = async (
  id: string,
  context?: GetServerSidePropsContext,
): Promise<UserInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<UserInfo[]>(`/organization/${id}/admin`);
  return data;
};

export const patchOrganisationStatus = async (
  id: string,
  model: OrganizationRequestUpdateStatus,
) => {
  await (
    await ApiClient
  ).patch<Organization>(`/organization/${id}/status`, model);
};
