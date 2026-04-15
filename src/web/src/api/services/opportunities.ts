import type { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { Country, Language } from "../models/lookups";
import type {
  Opportunity,
  OpportunityCategory,
  OpportunityDifficulty,
  OpportunityInfo,
  OpportunityRequestBase,
  OpportunitySearchCriteriaCommitmentIntervalOption,
  OpportunitySearchCriteriaZltoRewardRange,
  OpportunitySearchFilter,
  OpportunitySearchFilterAdmin,
  OpportunitySearchFilterCriteria,
  OpportunitySearchResults,
  OpportunitySearchResultsInfo,
  OpportunityType,
  OpportunityVerificationType,
  PublishedState,
  Status,
} from "../models/opportunity";
import type { OrganizationInfo } from "../models/organisation";
import type { CSVImportResult } from "../models/opportunity";

export const getOpportunitiesAdmin = async (
  filter: OpportunitySearchFilterAdmin,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunitySearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<OpportunitySearchResults>(
    `/opportunity/search/admin`,
    filter,
  );

  return data;
};

// this is used for public youth
export const getCategories = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityCategory[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityCategory[]>(
    "/opportunity/category",
  );
  return data;
};

// this is used for orgAdmin dashboards, admin pages etc
export const getCategoriesAdmin = async (
  organizations: string[] | null,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityCategory[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  let query = "";
  if (organizations && organizations.length > 0) {
    const params = new URLSearchParams();
    organizations.forEach((org: string) => params.append("organizations", org));
    query = `?${params.toString()}`;
  }
  const { data } = await instance.get<OpportunityCategory[]>(
    `/opportunity/search/filter/category/admin${query}`,
  );
  return data;
};

// this is used for orgAdmin dashboards, admin pages etc
export const getCountriesAdmin = async (
  organizations: string[] | null,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  let query = "";
  if (organizations && organizations.length > 0) {
    const params = new URLSearchParams();
    organizations.forEach((org: string) => params.append("organizations", org));
    query = `?${params.toString()}`;
  }
  const { data } = await instance.get<Country[]>(
    `/opportunity/search/filter/country/admin${query}`,
  );
  return data;
};

// this is used for orgAdmin dashboards, admin pages etc
export const getLanguagesAdmin = async (
  organizations: string[] | null,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Language[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  let query = "";
  if (organizations && organizations.length > 0) {
    const params = new URLSearchParams();
    organizations.forEach((org: string) => params.append("organizations", org));
    query = `?${params.toString()}`;
  }
  const { data } = await instance.get<Language[]>(
    `/opportunity/search/filter/language/admin${query}`,
  );
  return data;
};

// this is used for orgAdmin dashboards, admin pages etc
export const getOrganisationsAdmin = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OrganizationInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OrganizationInfo[]>(
    `/opportunity/search/filter/organization/admin`,
  );
  return data;
};

export const getDifficulties = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityDifficulty[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityDifficulty[]>(
    "/opportunity/difficulty",
  );
  return data;
};

export const getTypes = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityType[]>("/opportunity/type");
  return data;
};

export const getVerificationTypes = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
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
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Opportunity> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<Opportunity>(`/opportunity/${id}/admin`);

  // remove time and timezone from date
  data.dateStart = data.dateStart?.split("T")[0] ?? "";
  data.dateEnd = data.dateEnd?.split("T")[0] ?? "";

  return data;
};

// used for admins/orgAdmins, as well as users who have completed the opportunity (my opportunities) and tries to view the opportunity
export const getOpportunityInfoByIdAdminOrgAdminOrUser = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OpportunityInfo>(
    `/opportunity/${id}/auth/info`,
  );
  return data;
};

// returns published and expired opportunities (public/anonymous)
export const getOpportunityInfoById = async (
  id: string,
  includeExpired?: boolean,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OpportunityInfo>(
    `/opportunity/${id}/info${includeExpired ? "?includeExpired=true" : ""}`,
  );
  return data;
};

export const searchOpportunities = async (
  filter: OpportunitySearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunitySearchResultsInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  // default published state to active & not started
  if (!filter.publishedStates) {
    filter.publishedStates = ["Active", "NotStarted"];
  }

  const { data } = await instance.post<OpportunitySearchResultsInfo>(
    `/opportunity/search`,
    filter,
  );
  return data;
};

export const getOpportunityCategories = async (
  publishedStates?: PublishedState[],
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityCategory[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const params = new URLSearchParams();
  if (publishedStates && publishedStates.length > 0)
    publishedStates.forEach((state) =>
      params.append("publishedStates", state.toString()),
    );

  const { data } = await instance.get<OpportunityCategory[]>(
    `/opportunity/search/filter/category?${params.toString()}`,
  );
  return data;
};

export const getOpportunityCountries = async (
  publishedStates?: PublishedState[],
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const params = new URLSearchParams();
  if (publishedStates && publishedStates.length > 0)
    publishedStates.forEach((state) =>
      params.append("publishedStates", state.toString()),
    );

  const { data } = await instance.get<Country[]>(
    `/opportunity/search/filter/country?${params.toString()}`,
  );
  return data;
};

export const getOpportunityLanguages = async (
  publishedStates?: PublishedState[],
  languageCodeAlpha2Site?: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Language[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const params = new URLSearchParams();
  if (publishedStates && publishedStates.length > 0)
    publishedStates.forEach((state) =>
      params.append("publishedStates", state.toString()),
    );
  if (languageCodeAlpha2Site)
    params.append("languageCodeAlpha2Site", languageCodeAlpha2Site);

  const { data } = await instance.get<Language[]>(
    `/opportunity/search/filter/language?${params.toString()}`,
  );
  return data;
};

export const getOpportunityOrganizations = async (
  publishedStates?: PublishedState[],
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OrganizationInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const params = new URLSearchParams();
  if (publishedStates && publishedStates.length > 0)
    publishedStates.forEach((state) =>
      params.append("publishedStates", state.toString()),
    );

  const { data } = await instance.get<OrganizationInfo[]>(
    `/opportunity/search/filter/organization?${params.toString()}`,
  );
  return data;
};

export const getOpportunityTypes = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OpportunityType[]>(`/opportunity/type`);
  return data;
};

export const getCommitmentIntervals = async (
  publishedStates?: PublishedState[],
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunitySearchCriteriaCommitmentIntervalOption[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const params = new URLSearchParams();
  if (publishedStates && publishedStates.length > 0)
    params.append("publishedStates", publishedStates.join(","));

  const { data } = await instance.get<
    OpportunitySearchCriteriaCommitmentIntervalOption[]
  >(`/opportunity/search/filter/commitmentInterval?${params.toString()}`);
  return data;
};

export const getZltoRewardRanges = async (
  publishedStates?: PublishedState[],
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunitySearchCriteriaZltoRewardRange[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const params = new URLSearchParams();
  if (publishedStates && publishedStates.length > 0)
    params.append("publishedStates", publishedStates.join(","));

  const { data } = await instance.get<
    OpportunitySearchCriteriaZltoRewardRange[]
  >(`/opportunity/search/filter/zltoReward?${params.toString()}`);
  return data;
};

export const updateOpportunityStatus = async (
  opportunityId: string,
  status: Status,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Opportunity> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.patch<Opportunity>(
    `/opportunity/${opportunityId}/${status}`,
  );
  return data;
};

export const updateOpportunityHidden = async (
  opportunityId: string,
  hidden: boolean,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Opportunity> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.patch<Opportunity>(
    `/opportunity/${opportunityId}/hidden/${hidden}`,
  );
  return data;
};

export const getOpportunitiesAdminExportToCSV = async (
  filter: OpportunitySearchFilterAdmin,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<File> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post(
    `/opportunity/search/admin/csv`,
    filter,
    {
      responseType: "blob", // set responseType to 'blob' or 'arraybuffer'
    },
  );

  // create the file name
  const date = new Date();
  const dateString = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  const fileName = `Opportunities_${dateString}.csv`;

  // create a new Blob object using the data
  const blob = new Blob([data], { type: "text/csv" });

  // create a new File object from the Blob
  const file = new File([blob], fileName);

  return file;
};

export const searchCriteriaOpportunities = async (
  filter: OpportunitySearchFilterCriteria,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunitySearchResultsInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<OpportunitySearchResultsInfo>(
    `/opportunity/search/filter/opportunity`,
    filter,
  );
  return data;
};

export const getPublishedOrExpiredByLinkInstantVerify = async (
  linkId: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityInfo>(
    `/opportunity/info/link/${linkId}`,
  );
  return data;
};

export const updateFeatured = async (
  id: string,
  featured: boolean,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).patch<Opportunity>(`/opportunity/${id}/featured/${featured}`);
  return data;
};

export const importFromCSV = async (
  organisationId: string,
  file: any,
  validateOnly?: boolean,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<CSVImportResult> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams();
  if (validateOnly !== undefined)
    params.append("validateOnly", String(validateOnly));

  const url = `/opportunity/import/${organisationId}/csv${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const { data } = await instance.post<CSVImportResult>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
};
