import type { GetStaticPropsContext, GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  OrganizationSearchFilterEngagement,
  OrganizationSearchFilterOpportunity,
  OrganizationSearchFilterSSO,
  OrganizationSearchFilterYouth,
  OrganizationSearchResultsOpportunity,
  OrganizationSearchResultsSSO,
  OrganizationSearchResultsSummary,
  OrganizationSearchResultsYouth,
} from "../models/organizationDashboard";
import type { Country } from "../models/lookups";

export const searchOrganizationEngagement = async (
  filter: OrganizationSearchFilterEngagement,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResultsSummary> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchResultsSummary>(
    "/organization/search/analytics/engagement",
    filter,
  );

  //MOCK: cumulative completions
  // data.cumulative = {
  //   completions: {
  //     legend: [
  //       "Org1",
  //       "Org2 Org2Or g2O rg2 Org2 Org2Org2 v Org2",
  //       "Org3",
  //       "Org4",
  //       "Org5",
  //     ],
  //     data: [
  //       { date: "2024-01-01", values: [10, 20, 5, 25, 21] },
  //       { date: "2024-01-02", values: [15, 25, 3, 1, 16] },
  //       { date: "2024-01-03", values: [3, 16, 15, 20, 9] },
  //       { date: "2024-01-04", values: [2, 4, 31, 10, 16] },
  //       { date: "2024-01-05", values: [1, 11, 14, 5, 13] },
  //       { date: "2024-01-06", values: [5, 27, 31, 15, 2] },
  //     ],
  //     count: [2, 2, 1, 4, 7],
  //   },
  // };

  return data;
};

export const searchOrganizationOpportunities = async (
  filter: OrganizationSearchFilterOpportunity,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResultsOpportunity> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchResultsOpportunity>(
    "/organization/search/analytics/opportunities",
    filter,
  );
  return data;
};

export const searchOrganizationYouth = async (
  filter: OrganizationSearchFilterYouth,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResultsYouth> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchResultsYouth>(
    "/organization/search/analytics/youth",
    filter,
  );
  return data;
};

export const searchOrganizationSso = async (
  filter: OrganizationSearchFilterSSO,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResultsSSO> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchResultsSSO>(
    "/organization/search/analytics/sso",
    filter,
  );
  return data;
};

export const getCountries = async (
  organizations: string[],
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  let query = "";
  if (organizations && organizations.length > 0) {
    const params = new URLSearchParams();
    organizations.forEach((org) => params.append("organizations", org));
    query = `?${params.toString()}`;
  }
  const { data } = await instance.get<Country[]>(
    `/organization/search/analytics/country${query}`,
  );
  return data;
};
