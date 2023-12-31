import { type GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  OpportunityCategory,
  OpportunityDifficulty,
  OpportunityType,
  OpportunityVerificationType,
  OpportunitySearchFilterAdmin,
  OpportunitySearchResults,
  OpportunityRequestBase,
  Opportunity,
  OpportunityInfo,
  OpportunitySearchResultsInfo,
  OpportunitySearchFilter,
  OpportunitySearchCriteriaZltoReward,
  OpportunitySearchCriteriaCommitmentInterval,
  Status,
} from "../models/opportunity";
import type { Country, Language } from "../models/lookups";
import type { OrganizationInfo } from "../models/organisation";

export const getOpportunitiesAdmin = async (
  filter: OpportunitySearchFilterAdmin,
  context?: GetServerSidePropsContext,
): Promise<OpportunitySearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<OpportunitySearchResults>(
    `/opportunity/search/admin`,
    filter,
  );

  return data;
};

export const getCategories = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityCategory[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityCategory[]>(
    "/opportunity/category",
  );
  return data;
};

export const getDifficulties = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityDifficulty[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityDifficulty[]>(
    "/opportunity/difficulty",
  );
  return data;
};

export const getTypes = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityType[]>("/opportunity/type");
  return data;
};

export const getVerificationTypes = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityVerificationType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityVerificationType[]>(
    "/opportunity/verificationType",
  );
  return data;
};
export const createOpportunity = async (
  model: OpportunityRequestBase,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).post<Opportunity>("/opportunity", model);
  return data;
};

export const updateOpportunity = async (
  model: OpportunityRequestBase,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).patch<Opportunity>("/opportunity", model);
  return data;
};

export const getOpportunityById = async (
  id: string,
  context?: GetServerSidePropsContext,
): Promise<Opportunity> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<Opportunity>(`/opportunity/${id}/admin`);
  return data;
};

export const getOpportunityInfoByIdAdmin = async (
  id: string,
  context?: GetServerSidePropsContext,
): Promise<OpportunityInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OpportunityInfo>(
    `/opportunity/${id}/admin/info`,
  );
  return data;
};

export const getOpportunityInfoById = async (
  id: string,
  includeExpired?: boolean,
  context?: GetServerSidePropsContext,
): Promise<OpportunityInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OpportunityInfo>(
    `/opportunity/${id}/info${includeExpired ? "?includeExpired=true" : ""}`,
  );
  return data;
};

export const searchOpportunities = async (
  filter: OpportunitySearchFilter,
  context?: GetServerSidePropsContext,
): Promise<OpportunitySearchResultsInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<OpportunitySearchResultsInfo>(
    `/opportunity/search`,
    filter,
  );
  return data;
};

export const getOpportunityCategories = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityCategory[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OpportunityCategory[]>(
    `/opportunity/search/filter/category`,
  );
  return data;
};

export const getOpportunityCountries = async (
  context?: GetServerSidePropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<Country[]>(
    `/opportunity/search/filter/country`,
  );
  return data;
};

export const getOpportunityLanguages = async (
  context?: GetServerSidePropsContext,
): Promise<Language[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<Language[]>(
    `/opportunity/search/filter/language`,
  );
  return data;
};

export const getOpportunityOrganizations = async (
  context?: GetServerSidePropsContext,
): Promise<OrganizationInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OrganizationInfo[]>(
    `/opportunity/search/filter/organization`,
  );
  return data;
};

export const getOpportunityTypes = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OpportunityType[]>(`/opportunity/type`);
  return data;
};

export const getCommitmentIntervals = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunitySearchCriteriaCommitmentInterval[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<
    OpportunitySearchCriteriaCommitmentInterval[]
  >(`/opportunity/search/filter/commitmentInterval`);
  return data;
};

export const getZltoRewardRanges = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunitySearchCriteriaZltoReward[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OpportunitySearchCriteriaZltoReward[]>(
    `/opportunity/search/filter/zltoReward`,
  );
  return data;
};

export const updateOpportunityStatus = async (
  opportunityId: string,
  status: Status,
  context?: GetServerSidePropsContext,
): Promise<Opportunity> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.patch<Opportunity>(
    `/opportunity/${opportunityId}/${status}`,
  );
  return data;
};

// export const updateOpportunityStatus = async (
//   opportunityId: string,
//   status: Status,
//   context?: GetServerSidePropsContext,
// ): Promise<Opportunity> => {
//   const instance = context ? ApiServer(context) : await ApiClient;

//   const { data } = await instance.patch<Opportunity>(
//     `/opportunity/${opportunityId}/${status}`,
//   );
//   return data;
// };
