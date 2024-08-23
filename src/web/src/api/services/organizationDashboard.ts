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

  // mock data
  // const data = {
  //   opportunities: {
  //     engagements: {
  //       data: [
  //         { date: "2021-01-01", values: [0, 0, 0, 0] },
  //         { date: "2021-01-02", values: [0, 0, 0, 0] },
  //         { date: "2021-01-03", values: [0, 0, 0, 0] },
  //         { date: "2021-01-04", values: [0, 0, 0, 0] },
  //         { date: "2021-01-05", values: [0, 0, 0, 0] },
  //         { date: "2021-01-06", values: [0, 0, 0, 0] },
  //         { date: "2021-01-07", values: [0, 0, 0, 0] },
  //         { date: "2021-01-08", values: [0, 0, 0, 0] },
  //         { date: "2021-01-09", values: [0, 0, 0, 0] },
  //         { date: "2021-01-10", values: [0, 0, 0, 0] },
  //         { date: "2021-01-11", values: [0, 0, 0, 0] },
  //         { date: "2021-01-12", values: [0, 0, 0, 0] },
  //         { date: "2021-01-13", values: [0, 0, 0, 0] },
  //         { date: "2021-01-14", values: [0, 0, 0, 0] },
  //         { date: "2021-01-15", values: [0, 0, 0, 0] },
  //         { date: "2021-01-16", values: [0, 0, 0, 0] },
  //         { date: "2021-01-17", values: [0, 0, 0, 0] },
  //         { date: "2021-01-18", values: [0, 0, 0, 0] },
  //         { date: "2021-01-19", values: [0, 0, 0, 0] },
  //         { date: "2021-01-20", values: [0, 0, 0, 0] },
  //         { date: "2021-01-21", values: [0, 0, 0, 0] },
  //         { date: "2021-01-22", values: [0, 0, 0, 0] },
  //         { date: "2021-01-23", values: [0, 0, 0, 0] },
  //         { date: "2021-01-24", values: [0, 0, 0, 0] },
  //         { date: "2021-01-25", values: [0, 0, 0, 0] },
  //         { date: "2021-01-26", values: [0, 0, 0, 0] },
  //         { date: "2021-01-27", values: [0, 0, 0, 0] },
  //         { date: "2021-01-28", values: [0, 0, 0, 0] },
  //         { date: "2021-01-29", values: [0, 0, 0, 0] },
  //         { date: "2021-01-30", values: [0, 0, 0, 0] },
  //         { date: "2021-01-31", values: [0, 0, 0, 0] },
  //       ],
  //       legend: ["Engaged", "Completed", "Viewed", "Total"],
  //       count: [0, 0, 0, 0],
  //     },
  //     completion: {
  //       legend: "Completed",
  //       count: 0,
  //     },
  //     conversionRate: {
  //       legend: "Conversion Rate",
  //       count: 0,
  //     },
  //     reward: {
  //       legend: "Reward",
  //       count: 0,
  //     },
  //     engaged: {
  //       legend: "Engaged",
  //       count: 0,
  //     },
  //   },
  //   skills: {
  //     items: {
  //       data: [
  //         { date: "2021-01-01", values: [0, 0, 0, 0] },
  //         { date: "2021-01-02", values: [0, 0, 0, 0] },
  //         { date: "2021-01-03", values: [0, 0, 0, 0] },
  //         { date: "2021-01-04", values: [0, 0, 0, 0] },
  //         { date: "2021-01-05", values: [0, 0, 0, 0] },
  //         { date: "2021-01-06", values: [0, 0, 0, 0] },
  //         { date: "2021-01-07", values: [0, 0, 0, 0] },
  //         { date: "2021-01-08", values: [0, 0, 0, 0] },
  //         { date: "2021-01-09", values: [0, 0, 0, 0] },
  //         { date: "2021-01-10", values: [0, 0, 0, 0] },
  //         { date: "2021-01-11", values: [0, 0, 0, 0] },
  //         { date: "2021-01-12", values: [0, 0, 0, 0] },
  //         { date: "2021-01-13", values: [0, 0, 0, 0] },
  //         { date: "2021-01-14", values: [0, 0, 0, 0] },
  //         { date: "2021-01-15", values: [0, 0, 0, 0] },
  //         { date: "2021-01-16", values: [0, 0, 0, 0] },
  //         { date: "2021-01-17", values: [0, 0, 0, 0] },
  //         { date: "2021-01-18", values: [0, 0, 0, 0] },
  //         { date: "2021-01-19", values: [0, 0, 0, 0] },
  //         { date: "2021-01-20", values: [0, 0, 0, 0] },
  //         { date: "2021-01-21", values: [0, 0, 0, 0] },
  //         { date: "2021-01-22", values: [0, 0, 0, 0] },
  //         { date: "2021-01-23", values: [0, 0, 0, 0] },
  //         { date: "2021-01-24", values: [0, 0, 0, 0] },
  //         { date: "2021-01-25", values: [0, 0, 0, 0] },
  //         { date: "2021-01-26", values: [0, 0, 0, 0] },
  //         { date: "2021-01-27", values: [0, 0, 0, 0] },
  //         { date: "2021-01-28", values: [0, 0, 0, 0] },
  //         { date: "2021-01-29", values: [0, 0, 0, 0] },
  //         { date: "2021-01-30", values: [0, 0, 0, 0] },
  //         { date: "2021-01-31", values: [0, 0, 0, 0] },
  //       ],
  //       legend: ["Skills", "Completed", "Viewed", "Total"],
  //       count: [0, 0, 0, 0],
  //     },
  //     topCompleted: {
  //       legend: "Top Completed",
  //       topCompleted: [],
  //     },
  //   },
  //   demographics: {
  //     engagements: {
  //       data: [
  //         { date: "2021-01-01", values: [0, 0, 0, 0] },
  //         { date: "2021-01-02", values: [0, 0, 0, 0] },
  //         { date: "2021-01-03", values: [0, 0, 0, 0] },
  //         { date: "2021-01-04", values: [0, 0, 0, 0] },
  //         { date: "2021-01-05", values: [0, 0, 0, 0] },
  //         { date: "2021-01-06", values: [0, 0, 0, 0] },
  //         { date: "2021-01-07", values: [0, 0, 0, 0] },
  //         { date: "2021-01-08", values: [0, 0, 0, 0] },
  //         { date: "2021-01-09", values: [0, 0, 0, 0] },
  //         { date: "2021-01-10", values: [0, 0, 0, 0] },
  //         { date: "2021-01-11", values: [0, 0, 0, 0] },
  //         { date: "2021-01-12", values: [0, 0, 0, 0] },
  //         { date: "2021-01-13", values: [0, 0, 0, 0] },
  //         { date: "2021-01-14", values: [0, 0, 0, 0] },
  //         { date: "2021-01-15", values: [0, 0, 0, 0] },
  //         { date: "2021-01-16", values: [0, 0, 0, 0] },
  //         { date: "2021-01-17", values: [0, 0, 0, 0] },
  //         { date: "2021-01-18", values: [0, 0, 0, 0] },
  //         { date: "2021-01-19", values: [0, 0, 0, 0] },
  //         { date: "2021-01-20", values: [0, 0, 0, 0] },
  //         { date: "2021-01-21", values: [0, 0, 0, 0] },
  //         { date: "2021-01-22", values: [0, 0, 0, 0] },
  //         { date: "2021-01-23", values: [0, 0, 0, 0] },
  //         { date: "2021-01-24", values: [0, 0, 0, 0] },
  //         { date: "2021-01-25", values: [0, 0, 0, 0] },
  //         { date: "2021-01-26", values: [0, 0, 0, 0] },
  //         { date: "2021-01-27", values: [0, 0, 0, 0] },
  //         { date: "2021-01-28", values: [0, 0, 0, 0] },
  //         { date: "2021-01-29", values: [0, 0, 0, 0] },
  //         { date: "2021-01-30", values: [0, 0, 0, 0] },
  //         { date: "2021-01-31", values: [0, 0, 0, 0] },
  //       ],
  //       legend: ["Demographics", "Completed", "Viewed", "Total"],
  //       count: [0, 0, 0, 0],
  //     },
  //     completion: {
  //       legend: "Completed",
  //       count: 0,
  //     },
  //     conversionRate: {
  //       legend: "Conversion Rate",
  //       count: 0,
  //     },
  //     reward: {
  //       legend: "Reward",
  //       count: 0,
  //     },
  //     engaged: {
  //       legend: "Engaged",
  //       count: 0,
  //     },
  //   },
  //   dateStamp: "2021-01-31",
  // };
  // data.skills = {
  //   items: {
  //     data: [
  //       { date: "2021-01-01", values: [3] },
  //       { date: "2021-01-02", values: [3] },
  //       { date: "2021-01-03", values: [3] },
  //       // { date: "2021-01-04", values: [0] },
  //       // { date: "2021-01-05", values: [0] },
  //       // { date: "2021-01-06", values: [0] },
  //       // { date: "2021-01-07", values: [4] },
  //       // { date: "2021-01-08", values: [5] },
  //       // { date: "2021-01-09", values: [0] },
  //       // { date: "2021-01-10", values: [0] },
  //       // { date: "2021-01-11", values: [6] },
  //       // { date: "2021-01-12", values: [0] },
  //       // { date: "2021-01-13", values: [0] },
  //       // { date: "2021-01-14", values: [2] },
  //       // { date: "2021-01-15", values: [0] },
  //       // { date: "2021-01-16", values: [0] },
  //       // { date: "2021-01-17", values: [1] },
  //       // { date: "2021-01-18", values: [0] },
  //       // { date: "2021-01-19", values: [4] },
  //       // { date: "2021-01-20", values: [3] },
  //       // { date: "2021-01-21", values: [2] },
  //       // { date: "2021-01-22", values: [1] },
  //       // { date: "2021-01-23", values: [0] },
  //       // { date: "2021-01-24", values: [0] },
  //       // { date: "2021-01-25", values: [0] },
  //       // { date: "2021-01-26", values: [0] },
  //       // { date: "2021-01-27", values: [0] },
  //       // { date: "2021-01-28", values: [0] },
  //       // { date: "2021-01-29", values: [0] },
  //       // { date: "2021-01-30", values: [0] },
  //       // { date: "2021-01-31", values: [0] },
  //     ],
  //     legend: ["Skills" /*, "Completed", "Viewed", "Total"*/],
  //     count: [0, 0, 0, 0],
  //   },
  //   topCompleted: {
  //     legend: "Most completed skills",
  //     topCompleted: [
  //       {
  //         id: "1",
  //         name: "Skill 1",
  //         infoURL: "",
  //       },
  //       {
  //         id: "2",
  //         name: "Skill 2",
  //         infoURL: "",
  //       },
  //       {
  //         id: "3",
  //         name: "Skill 3",
  //         infoURL: "",
  //       },
  //     ],
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
): Promise<OrganizationSearchSso> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchSso>(
    "/organization/search/analytics/sso",
    filter,
  );
  return data;
};

export const getCountries = async (
  organisationId: string | null,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Country[]>(
    `/organization/search/analytics/country${
      organisationId ? `?organizationId=${organisationId}` : ""
    }`,
  );
  return data;
};
