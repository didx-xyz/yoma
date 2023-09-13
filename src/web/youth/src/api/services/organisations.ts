import { type GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import {
  type Organization,
  type OrganizationProviderType,
  type OrganizationRequestBase,
} from "../models/organisation";

export const getOrganisationProviderTypes = async (
  context?: GetServerSidePropsContext,
): Promise<OrganizationProviderType[]> => {
  const { data } = context
    ? await ApiServer(context).get<OrganizationProviderType[]>(
        "/organization/lookup/providerType",
      )
    : await (
        await ApiClient
      ).get<OrganizationProviderType[]>("/organization/lookup/providerType");
  return data;
};

export const postOrganisation = async (
  model: OrganizationRequestBase,
): Promise<Organization> => {
  /* eslint-disable */
  // convert model to form data
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
  /* eslint-disable */
  // convert model to form data
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
  context?: GetServerSidePropsContext,
): Promise<Organization> => {
  /* eslint-disable */
  const { data } = context
    ? await ApiServer(context).get<Organization>(`/organization/${id}`)
    : await ApiClient.get<Organization>(`/organization/${id}`);
  return data;
  /* eslint-enable */
};
