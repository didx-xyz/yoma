import type { GetStaticPropsContext, GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import {
  type LinkInfo,
  type LinkRequestCreateShare,
  type LinkRequestCreateVerify,
  type LinkSearchFilter,
  type LinkSearchFilterUsage,
  type LinkSearchResult,
  type LinkSearchResultsUsage,
  type LinkStatus,
} from "../models/actionLinks";

export const createLinkSharing = async (
  request: LinkRequestCreateShare,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<LinkInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<LinkInfo>(
    "/actionLink/create/sharing",
    request,
  );
  return data;
};

export const createLinkInstantVerify = async (
  request: LinkRequestCreateVerify,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<LinkInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<LinkInfo>(
    "/actionLink/create/instantVerify",
    request,
  );
  return data;
};

export const getLinkById = async (
  linkId: string,
  includeQRCode: boolean,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<LinkInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<LinkInfo>(
    `/actionLink/${linkId}?includeQRCode=${includeQRCode}`,
  );
  return data;
};

export const searchLinks = async (
  filter: LinkSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<LinkSearchResult> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<LinkSearchResult>(
    "/actionLink/search",
    filter,
  );
  return data;
};

export const updateLinkStatus = async (
  linkId: string,
  status: LinkStatus,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<LinkInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<LinkInfo>(
    `/actionLink/${linkId}/status?status=${status}`,
  );
  return data;
};

export const searchLinkUsage = async (
  filter: LinkSearchFilterUsage,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<LinkSearchResultsUsage> => {
  // Return mock data until endpoint is implemented
  //   return {
  //     link: {
  //       id: filter.id ?? "mock-link-id",
  //       name: "Mock Link Name",
  //       description: "This is a mock link description.",
  //       entityType: "Opportunity",
  //       action: "Share",
  //       statusId: "1",
  //       status: "Active",
  //       entityId: "mock-entity-id",
  //       entityTitle: "Mock Opportunity Title",
  //       entityOrganizationId: "mock-org-id",
  //       entityOrganizationName: "Mock Org Name Mock Org Name",
  //       uRL: "https://example.com/mock-link",
  //       shortURL: "https://ex.com/ml",
  //       qrCodeBase64: null,
  //       usagesLimit: 10,
  //       usagesTotal: 5,
  //       usagesAvailable: 5,
  //       dateEnd: "2025-12-31",
  //       distributionList: ["user1@example.com", "user2@example.com"],
  //       lockToDistributionList: false,
  //       dateCreated: "2025-01-01",
  //       dateModified: "2025-07-31",
  //     },
  //     totalCount: 2,
  //     items: [
  //       {
  //         userId: "user-1",
  //         username: "user1",
  //         email: "user1@example.com",
  //         phoneNumber: "+1234567890",
  //         displayName: "User One",
  //         country: "CountryA",
  //         age: 30,
  //         claimed: true,
  //         dateClaimed: "2025-02-01",
  //       },
  //       {
  //         userId: "user-2",
  //         username: "user2",
  //         email: "user2@example.com",
  //         phoneNumber: "+0987654321",
  //         displayName: "User Two",
  //         country: "CountryB",
  //         age: 25,
  //         claimed: false,
  //         dateClaimed: null,
  //       },
  //     ],
  //   };

  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<LinkSearchResultsUsage>(
    "/actionLink/search/usage",
    filter,
  );
  return data;
};
