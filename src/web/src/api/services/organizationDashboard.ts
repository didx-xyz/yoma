import type { GetStaticPropsContext, GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  OrganizationSearchFilterEngagement,
  OrganizationSearchFilterOpportunity,
  OrganizationSearchFilterSSO,
  OrganizationSearchFilterYouth,
  OrganizationSearchResultsOpportunity,
  OrganizationSearchResultsSummary,
  OrganizationSearchResultsYouth,
  OrganizationSearchSso,
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
): Promise<OrganizationSearchSso> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchSso>(
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
