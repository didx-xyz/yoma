import { type GetServerSidePropsContext } from "next";
// import ApiClient from "~/lib/axiosClient";
// import ApiServer from "~/lib/axiosServer";
import type {
  OrganizationSearchFilterBase,
  OrganizationSearchResultsSummary,
} from "../models/organizationDashboard";

//TODO:
export const getOrganisationDashboardSummary = async (
  filter: OrganizationSearchFilterBase,
  context?: GetServerSidePropsContext,
): Promise<OrganizationSearchResultsSummary> => {
  // const instance = context ? ApiServer(context) : await ApiClient;
  // const { data } = await instance.post<OrganizationSearchResultsSummary>(
  //   "/organization/TODO",
  //   filter,
  // );
  // return data;

  // return hard-code data for now
  return Promise.resolve({
    opportunities: {
      viewed: {
        timeInterval: {
          id: "1",
          name: "timeInterval1",
          // startDate: "2021-01-01",
          // endDate: "2021-12-31",
        },
        data: [
          { item1: 2019, item2: 2 },
          { item1: 2020, item2: 4 },
          { item1: 2021, item2: 4 },
          { item1: 2022, item2: 2 },
          { item1: 2023, item2: 4 },
          { item1: 2024, item2: 5 },
        ],
        count: 5,
      },
      completed: {
        timeInterval: {
          id: "1",
          name: "timeInterval1",
          // startDate: "2021-01-01",
          // endDate: "2021-12-31",
        },
        data: [
          { item1: 6, item2: 7 },
          { item1: 8, item2: 9 },
        ],
        count: 10,
      },
      completion: {
        averageTimeInDays: 11,
        percentage: 12,
      },
      conversionRate: {
        completedCount: 13,
        viewedCount: 14,
      },
      reward: {
        totalAmount: 15,
        percentage: 16,
      },
      published: {
        timeInterval: {
          id: "1",
          name: "timeInterval1",
          // startDate: "2021-01-01",
          // endDate: "2021-12-31",
        },
        data: [
          { item1: 17, item2: 18 },
          { item1: 19, item2: 20 },
        ],
        count: 21,
      },
      unpublished: {
        timeInterval: {
          id: "1",
          name: "timeInterval1",
          // startDate: "2021-01-01",
          // endDate: "2021-12-31",
        },
        data: [
          { item1: 22, item2: 23 },
          { item1: 24, item2: 25 },
        ],
        count: 26,
      },
      expired: {
        timeInterval: {
          id: "1",
          name: "timeInterval1",
          // startDate: "2021-01-01",
          // endDate: "2021-12-31",
        },
        data: [
          { item1: 27, item2: 28 },
          { item1: 29, item2: 30 },
        ],
        count: 31,
      },
      pending: {
        timeInterval: {
          id: "1",
          name: "timeInterval1",
          // startDate: "2021-01-01",
          // endDate: "2021-12-31",
        },
        data: [
          { item1: 32, item2: 33 },
          { item1: 34, item2: 35 },
        ],
        count: 36,
      },
    },
    skills: {
      items: {
        timeInterval: {
          id: "1",
          name: "timeInterval1",
          // startDate: "2021-01-01",
          // endDate: "2021-12-31",
        },
        data: [
          { item1: 37, item2: 38 },
          { item1: 39, item2: 40 },
        ],
        count: 41,
      },
      topCompleted: [
        { id: "skill_1", name: "skill1", infoURL: "infoURL1" },
        { id: "skill_2", name: "skill2", infoURL: "infoURL2" },
        { id: "skill_3", name: "skill3", infoURL: "infoURL3" },
        { id: "skill_4", name: "skill4", infoURL: "infoURL4" },
        { id: "skill_5", name: "skill5", infoURL: "infoURL5" },
        { id: "skill_6", name: "skill6", infoURL: "infoURL6" },
        { id: "skill_7", name: "skill7", infoURL: "infoURL7" },
        { id: "skill_8", name: "skill8", infoURL: "infoURL8" },
        { id: "skill_9", name: "skill9", infoURL: "infoURL9" },
        { id: "skill_10", name: "skill10", infoURL: "infoURL10" },
        { id: "skill_11", name: "skill11", infoURL: "infoURL11" },
        { id: "skill_12", name: "skill12", infoURL: "infoURL12" },
        { id: "skill_13", name: "skill13", infoURL: "infoURL13" },
        { id: "skill_14", name: "skill14", infoURL: "infoURL14" },
        { id: "skill_15", name: "skill15", infoURL: "infoURL15" },
        { id: "skill_16", name: "skill16", infoURL: "infoURL16" },
        { id: "skill_17", name: "skill17", infoURL: "infoURL17" },
        { id: "skill_18", name: "skill18", infoURL: "infoURL18" },
        { id: "skill_19", name: "skill19", infoURL: "infoURL19" },
        { id: "skill_20", name: "skill20", infoURL: "infoURL20" },
      ],
    },
    demographics: {
      countries: [
        { item1: "South Africa", item2: 24 },
        { item1: "Nigeria", item2: 45 },
        { item1: "Congo", item2: 15 },
        { item1: "Ivory Coast", item2: 17 },
      ],
      genders: [
        { item1: "Male", item2: 846 },
        { item1: "Femail", item2: 346 },
        { item1: "Other", item2: 0 },
      ],
      ages: [
        { item1: "0-19", item2: 48 },
        { item1: "20-39", item2: 246 },
        { item1: "40-59", item2: 246 },
        { item1: "60+", item2: 246 },
      ],
    },
    dateStamp: "2021-01-01",
  });
};
