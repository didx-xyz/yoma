import type { GetStaticPropsContext, GetServerSidePropsContext } from "next";
import type {
  PlatformMetrics,
  PlatformMetricsAdmin,
} from "~/api/models/analytics";
import type {
  OrganizationSearchFilterEngagement,
  OrganizationSearchFilterOpportunity,
  OrganizationSearchFilterSSO,
  OrganizationSearchFilterYouth,
  OrganizationSearchResultsOpportunity,
  OrganizationSearchResultsSSO,
  OrganizationSearchResultsSummary,
  OrganizationSearchResultsYouth,
} from "~/api/models/organizationDashboard";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { Country } from "../models/lookups";

export const getPlatformMetrics = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<PlatformMetrics> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<PlatformMetrics>(
    "/analytics/platform/metrics",
  );

  return data;
};

export const getPlatformMetricsAdmin = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<PlatformMetricsAdmin> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<PlatformMetricsAdmin>(
    "/analytics/platform/metrics/admin",
  );

  return data;
};

export const searchOrganizationEngagement = async (
  filter: OrganizationSearchFilterEngagement,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResultsSummary> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchResultsSummary>(
    "/analytics/search/engagement",
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
    "/analytics/search/opportunities",
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
    "/analytics/search/youth",
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
    "/analytics/search/sso",
    filter,
  );

  return data;
};

export const getAnalyticsCountries = async (
  organizations?: string[] | null,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  let query = "";

  if (organizations && organizations.length > 0) {
    const params = new URLSearchParams();
    organizations.forEach((organization) =>
      params.append("organizations", organization),
    );
    query = `?${params.toString()}`;
  }

  const { data } = await instance.get<Country[]>(
    `/analytics/search/country${query}`,
  );

  return data;
};
