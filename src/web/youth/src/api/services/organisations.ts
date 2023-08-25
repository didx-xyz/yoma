import { type GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import {
  type Organization,
  type OrganizationProviderType,
  type OrganizationRequest,
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
  model: OrganizationRequest,
): Promise<Organization> => {
  const { data } = await ApiClient.post<Organization>("/organization", model);
  return data;
};

// export const uploadOrganisationImage = async (
//   organisationId: string,
//   model: ImageRequestDto,
// ): Promise<OrganisationResponseDto> => {
//   const { data } = await ApiClient.post<ApiResponse<OrganisationResponseDto>>(
//     `/organisations/${organisationId}/logo`,
//     model,
//     { headers: { "Content-Type": "multipart/form-data" } },
//   );

//   if (!data.meta.success) throw new Error(data.meta.message);
//   return data.data;
// };
