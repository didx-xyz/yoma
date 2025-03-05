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
  data.cumulative = {
    completions: {
      legend: [
        "Org1",
        "Org2 Org2Or g2O rg2 Org2 Org2Org2 v Org2",
        "Org3",
        "Org4",
        "Org5",
      ],
      data: [
        { date: "2024-01-01", values: [10, 20, 5, 25, 21] },
        { date: "2024-01-02", values: [15, 25, 3, 1, 16] },
        { date: "2024-01-03", values: [3, 16, 15, 20, 9] },
        { date: "2024-01-04", values: [2, 4, 31, 10, 16] },
        { date: "2024-01-05", values: [1, 11, 14, 5, 13] },
        { date: "2024-01-06", values: [5, 27, 31, 15, 2] },
      ],
      count: [2, 2, 1, 4, 7],
    },
  };

  //MOCK: skills and completions
  //   data.skills = {
  //     items: {
  //       legend: ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  //       data: [
  //         { date: "2024-01-01", values: [5, 10, 15, 20, 25] },
  //         { date: "2024-01-02", values: [7, 12, 18, 24, 30] },
  //         { date: "2024-01-03", values: [8, 14, 22, 28, 35] },
  //         { date: "2024-01-04", values: [9, 16, 24, 32, 40] },
  //         { date: "2024-01-05", values: [10, 20, 30, 40, 50] },
  //       ],
  //       count: [10, 20, 30, 40, 50],
  //     },
  //     topCompleted: {
  //       legend: "Top Completed Skills",
  //       topCompleted: [
  //         { id: "skill1", name: "Skill1", infoURL: null, countCompleted: 10 },
  //         {
  //           id: "skill2",
  //           name: "Skill2",
  //           infoURL: "https://example.com/skill2",
  //           countCompleted: 20,
  //         },
  //         { id: "skill3", name: "Skill3", infoURL: null, countCompleted: 30 },
  //         {
  //           id: "skill4",
  //           name: "Skill4",
  //           infoURL: "https://example.com/skill4",
  //           countCompleted: 40,
  //         },
  //         { id: "skill5", name: "Skill5", infoURL: null, countCompleted: 50 },
  //       ],
  //     },
  //   };

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

  //MOCK: SSO
  data.items = [
    {
      id: "org1",
      name: "Organization 1",
      logoId: "logo1",
      logoURL:
        "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/7ca30543-f2eb-4493-b3c7-9eb6dc4263bb.png",
      outbound: {
        legend: "Outbound SSO",
        enabled: true,
        clientId: "client-123",
        logins: {
          legend: ["Login Count"],
          data: [
            { date: "2024-01-01", values: [15] },
            { date: "2024-01-02", values: [22] },
            { date: "2024-01-03", values: [18] },
            { date: "2024-01-04", values: [25] },
            { date: "2024-01-05", values: [30] },
          ],
          count: [110],
        },
      },
      inbound: {
        legend: "Inbound SSO",
        enabled: true,
        clientId: "client-456",
        logins: {
          legend: ["Login Count"],
          data: [
            { date: "2024-01-01", values: [8] },
            { date: "2024-01-02", values: [12] },
            { date: "2024-01-03", values: [10] },
            { date: "2024-01-04", values: [15] },
            { date: "2024-01-05", values: [20] },
          ],
          count: [65],
        },
      },
    },
    {
      id: "org2",
      name: "Second Organization",
      logoId: "logo2",
      logoURL: null,
      outbound: {
        legend: "Outbound SSO",
        enabled: true,
        clientId: "client-789",
        logins: {
          legend: ["Login Count"],
          data: [
            { date: "2024-01-01", values: [5] },
            { date: "2024-01-02", values: [7] },
            { date: "2024-01-03", values: [6] },
            { date: "2024-01-04", values: [8] },
            { date: "2024-01-05", values: [10] },
          ],
          count: [36],
        },
      },
      inbound: {
        legend: "Inbound SSO",
        enabled: false,
        clientId: null,
        logins: {
          legend: ["Login Count"],
          data: [],
          count: [0],
        },
      },
    },
    {
      id: "org3",
      name: "Third Organization",
      logoId: "logo3",
      logoURL: null,
      outbound: {
        legend: "Outbound SSO",
        enabled: false,
        clientId: null,
        logins: {
          legend: ["Login Count"],
          data: [],
          count: [0],
        },
      },
      inbound: {
        legend: "Inbound SSO",
        enabled: false,
        clientId: null,
        logins: {
          legend: ["Login Count"],
          data: [],
          count: [0],
        },
      },
    },
  ];

  data.outboundLoginCount = 160;
  data.inboundLoginCount = 153;
  data.totalCount = 313;
  data.dateStamp = "2024-01-05T23:59:59Z";

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
