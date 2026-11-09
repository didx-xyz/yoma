import type { GetStaticPropsContext, GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  Organization,
  OrganizationProviderType,
  OrganizationRequestBase,
  OrganizationRequestUpdateStatus,
  OrganizationRewardPools,
  OrganizationSearchFilter,
  OrganizationSearchResults,
  UserInfo,
} from "../models/organisation";
import { objectToFormData } from "~/lib/utils";
import type { Settings, SettingsRequest } from "../models/common";

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
  const formData = objectToFormData(model, undefined, undefined, false);

  const { data } = await (
    await ApiClient
  ).post<Organization>("/organization", formData, {
    headers: {
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const patchOrganisation = async (
  model: OrganizationRequestBase,
): Promise<Organization> => {
  const formData = objectToFormData(model, undefined, undefined, false);

  const { data } = await (
    await ApiClient
  ).patch<Organization>("/organization", formData);
  return data;
};

/**
 * `PATCH /organization/{id}/rewardpool` — Admin-only, pool-only update. Sends exactly
 * `{ zltoRewardPoolCurrentFinancialYear }` (`null` = no organisation-level cap) and returns the
 * full updated `Organization`; administrators and other metadata are untouched server-side.
 */
export const patchOrganisationRewardPool = async (
  id: string,
  model: OrganizationRewardPools,
): Promise<Organization> => {
  const { data } = await (
    await ApiClient
  ).patch<Organization>(
    `/organization/${encodeURIComponent(id)}/rewardpool`,
    model,
  );
  return data;
};

export const updateOrganisationLogo = async (
  id: string,
  file: any,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
) => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const formData = new FormData();
  formData.append("file", file);

  const { data } = await instance.patch(
    `/organization/${encodeURIComponent(id)}/logo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data;
};

export const getOrganisationById = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Organization> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Organization>(
    `/organization/${encodeURIComponent(id)}`,
  );
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
  const { data } = await instance.get<UserInfo[]>(
    `/organization/${encodeURIComponent(id)}/admin`,
  );
  return data;
};

export const patchOrganisationStatus = async (
  id: string,
  model: OrganizationRequestUpdateStatus,
) => {
  await (
    await ApiClient
  ).patch<Organization>(
    `/organization/${encodeURIComponent(id)}/status`,
    model,
  );
};

export const getOrganisationSettingsById = async (
  id: string,
  context?: GetServerSidePropsContext,
): Promise<Settings> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Settings>(
    `/organization/${encodeURIComponent(id)}/settings`,
  );
  return data;
};

export const updateOrganisationSettings = async (
  id: string,
  model: SettingsRequest,
) => {
  await (
    await ApiClient
  ).patch<Organization>(
    `/organization/${encodeURIComponent(id)}/settings`,
    model,
  );
};
