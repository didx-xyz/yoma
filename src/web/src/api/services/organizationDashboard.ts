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
  // const { data } = await instance.post<OrganizationSearchResultsSummary>(
  //   "/organization/search/analytics/engagement",
  //   filter,
  // );
  // return data;

  const mockOrganizationSearchResults: OrganizationSearchResultsSummary = {
    opportunities: {
      engagements: {
        legend: ["Viewed", "Go-To Clicks", "Completions"],
        data: [
          {
            date: "2023-12-03T00:00:00+00:00",
            values: [0, 0, 1],
          },
          {
            date: "2023-12-10T00:00:00+00:00",
            values: [0, 0, 39],
          },
          {
            date: "2023-12-17T00:00:00+00:00",
            values: [0, 0, 11],
          },
          {
            date: "2023-12-24T00:00:00+00:00",
            values: [0, 0, 2],
          },
          {
            date: "2024-01-14T00:00:00+00:00",
            values: [0, 0, 7],
          },
          {
            date: "2024-01-21T00:00:00+00:00",
            values: [0, 0, 17],
          },
          {
            date: "2024-01-28T00:00:00+00:00",
            values: [0, 0, 52],
          },
          {
            date: "2024-02-04T00:00:00+00:00",
            values: [0, 0, 44],
          },
          {
            date: "2024-02-11T00:00:00+00:00",
            values: [0, 0, 41],
          },
          {
            date: "2024-02-18T00:00:00+00:00",
            values: [0, 0, 23],
          },
          {
            date: "2024-02-25T00:00:00+00:00",
            values: [0, 0, 10],
          },
          {
            date: "2024-03-10T00:00:00+00:00",
            values: [0, 0, 4],
          },
          {
            date: "2024-03-24T00:00:00+00:00",
            values: [6, 0, 0],
          },
          {
            date: "2024-03-31T00:00:00+00:00",
            values: [3, 0, 0],
          },
          {
            date: "2024-04-07T00:00:00+00:00",
            values: [4, 0, 0],
          },
          {
            date: "2024-06-02T00:00:00+00:00",
            values: [1, 0, 0],
          },
        ],
        count: [14, 0, 251],
      },
      completion: {
        legend: "Average time (days)",
        averageTimeInDays: 1,
      },
      conversionRate: {
        legend: "Conversion rate (average)",
        completedCount: 251,
        viewedCount: 14,
        percentage: 100.0,
      },
      reward: {
        legend: "ZLTO amount awarded",
        totalAmount: 90.0,
      },
      engaged: {
        legend: "Opportunities engaged",
        count: 2,
      },
    },
    skills: {
      items: {
        legend: ["Total unique skills"],
        data: [
          {
            date: "2023-12-03T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2023-12-10T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2023-12-17T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2023-12-24T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2024-01-14T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2024-01-21T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2024-01-28T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2024-02-04T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2024-02-11T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2024-02-18T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2024-02-25T00:00:00+00:00",
            values: [3],
          },
          {
            date: "2024-03-10T00:00:00+00:00",
            values: [3],
          },
        ],
        count: [3],
      },
      topCompleted: {
        legend: "Most completed skills",
        topCompleted: [
          {
            id: "486fa4d2-2294-451d-9cd1-f686699eb085",
            name: "Digital Literacy",
            infoURL: null,
          },
          {
            id: "b2b4bf12-9018-4082-995c-a65eadaf0dc2",
            name: "Environmentalism",
            infoURL: null,
          },
          {
            id: "c4ff7fc2-5034-49ee-b68c-4cceaeeb629d",
            name: "Professionalism",
            infoURL: null,
          },
        ],
      },
    },
    demographics: {
      education: {
        legend: "Education",
        items: {
          Unspecified: 251,
        },
      },
      countries: {
        legend: "Country",
        items: {
          "South Africa": 42,
          Unspecified: 209,
        },
      },
      genders: {
        legend: "Gender",
        items: {
          Female: 21,
          Male: 19,
          Other: 211,
        },
      },
      ages: {
        legend: "Age",
        items: {
          "0-19": 2,
          "20-24": 9,
          "25-29": 18,
          "30+": 13,
          Unspecified: 209,
        },
      },
    },
    dateStamp: "2024-12-04T05:30:48.6257557+00:00",
  };
  return mockOrganizationSearchResults;
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
