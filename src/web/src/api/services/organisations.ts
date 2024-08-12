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
import { objectToFormData } from "~/lib/utils";

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
  // send logo as single file (not array)
  model.logo = !!model?.logo?.length ? (model as any).logo[0] : null;

  const formData = objectToFormData(model);

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
  const formData = objectToFormData(model);

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
