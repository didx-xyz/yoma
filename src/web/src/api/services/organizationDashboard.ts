import { GetStaticPropsContext, type GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  OrganizationSearchFilterBase,
  OrganizationSearchResultsOpportunity,
  OrganizationSearchResultsSummary,
  OrganizationSearchResultsYouth,
} from "../models/organizationDashboard";
import { OpportunityCategory } from "../models/opportunity";

// this is used for orgAdmin dashboards, admin pages etc
export const getCategoriesAdmin = async (
  organisationId: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OpportunityCategory[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityCategory[]>(
    `/organization/search/filter/category/admin?organisationId=${organisationId}`,
  );
  return data;
};

export const searchOrganizationEngagement = async (
  filter: OrganizationSearchFilterBase,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResultsSummary> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchResultsSummary>(
    "/organization/search/analytics/engagement",
    filter,
  );
  return data;
  console.info("getOrganisationDashboardSummary", filter);

  //TODO:
  // return hard-code data for now
  return {
    opportunities: {
      viewedCompleted: {
        legend: ["Viewed", "Completed"],
        data: [
          {
            date: "2021-01",
            values: [100, 150],
          },
          {
            date: "2021-02",
            values: [190, 10],
          },
          {
            date: "2021-03",
            values: [110, 250],
          },
          {
            date: "2021-04",
            values: [200, 70],
          },
        ],
        count: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200],
      },
      completion: {
        legend: "Completion",
        averageTimeInDays: 10,
      },
      conversionRate: {
        legend: "Conversion Rate",
        completedCount: 1000,
        viewedCount: 1200,
        percentage: 80,
      },
      reward: {
        legend: "Reward",
        totalAmount: 10000,
      },
      selected: {
        legend: "Selected",
        count: 100,
      },
    },
    skills: {
      items: {
        legend: ["Skills"],
        data: [
          {
            date: "2021-01",
            values: [200],
          },
          {
            date: "2021-02",
            values: [250],
          },
          {
            date: "2021-03",
            values: [100],
          },
          {
            date: "2021-04",
            values: [550],
          },
        ],
        count: [100, 200, 300, 400],
      },
      topCompleted: {
        legend: "Top Completed",
        topCompleted: [
          {
            id: "1",
            name: "Skill 1",
            infoURL: "https://www.google.com",
          },
          {
            id: "2",
            name: "Skill 2",
            infoURL: "https://www.google.com",
          },
          {
            id: "3",
            name: "Skill 3",
            infoURL: "https://www.google.com",
          },
          {
            id: "4",
            name: "Skill 4",
            infoURL: "https://www.google.com",
          },
          {
            id: "5",
            name: "Skill 5",
            infoURL: "https://www.google.com",
          },
        ],
      },
    },
    demographics: {
      countries: {
        legend: "Countries",
        items: { date1: 100, item2: 200 },
      },
      genders: {
        legend: "genders",
        items: { item1: 100, item2: 200 },
      },
      ages: {
        legend: "ages",
        items: { item1: 100, item2: 200 },
      },
    },
    dateStamp: "2021-12-01",
  };
};

export const searchOrganizationOpportunities = async (
  filter: OrganizationSearchFilterBase,
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
  filter: OrganizationSearchFilterBase,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResultsYouth> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<OrganizationSearchResultsYouth>(
    "/organization/search/analytics/youth",
    filter,
  );
  return data;
};
