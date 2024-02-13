import ApiClient from "~/lib/axiosClient";
import type { Opportunity } from "../models/opportunity";
import type {
  MyOpportunityRequestVerify,
  MyOpportunityRequestVerifyFinalize,
  MyOpportunityRequestVerifyFinalizeBatch,
  MyOpportunityResponseVerify,
  MyOpportunitySearchCriteriaOpportunity,
  MyOpportunitySearchFilter,
  MyOpportunitySearchFilterAdmin,
  MyOpportunitySearchResults,
  VerificationStatus,
} from "../models/myOpportunity";
import { objectToFormData } from "~/lib/utils";
import type { GetServerSidePropsContext } from "next/types";
import ApiServer from "~/lib/axiosServer";

export const saveMyOpportunity = async (
  opportunityId: string,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).put<Opportunity>(`/myopportunity/action/${opportunityId}/save`);
  return data;
};

export const performActionSendForVerificationManual = async (
  opportunityId: string,
  model: MyOpportunityRequestVerify,
): Promise<any> => {
  const formData = objectToFormData(model);

  await (
    await ApiClient
  ).put(`/myopportunity/action/${opportunityId}/verify`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getVerificationStatus = async (
  opportunityId: string,
  context?: GetServerSidePropsContext,
): Promise<MyOpportunityResponseVerify> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<MyOpportunityResponseVerify>(
    `/myopportunity/action/verify/status?opportunityId=${opportunityId}`,
  );

  return data;
};

export const searchMyOpportunities = async (
  filter: MyOpportunitySearchFilter,
  context?: GetServerSidePropsContext,
): Promise<MyOpportunitySearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<MyOpportunitySearchResults>(
    `/myopportunity/search`,
    filter,
  );
  return data;
};

export const searchMyOpportunitiesAdmin = async (
  filter: MyOpportunitySearchFilterAdmin,
  context?: GetServerSidePropsContext,
): Promise<MyOpportunitySearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<MyOpportunitySearchResults>(
    `/myopportunity/search/admin`,
    filter,
  );
  return data;
};

export const performActionVerifyManual = async (
  model: MyOpportunityRequestVerifyFinalize,
): Promise<any> => {
  await (await ApiClient).patch(`/myopportunity/verification/finalize`, model);
};

export const performActionVerifyBulk = async (
  model: MyOpportunityRequestVerifyFinalizeBatch,
): Promise<any> => {
  await (
    await ApiClient
  ).patch(`/myopportunity/verification/finalize/batch`, model);
};

export const performActionViewed = async (
  opportunityId: string,
  context?: GetServerSidePropsContext,
): Promise<any> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.put(`/myopportunity/action/${opportunityId}/view`);
};

export const getOpportunitiesForVerification = async (
  organisations?: string[],
  verificationStatuses?: VerificationStatus[],
  context?: GetServerSidePropsContext,
): Promise<MyOpportunitySearchCriteriaOpportunity[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  let querystring = "";
  if (organisations) {
    querystring += `organisations=${organisations.join(",")}`;
  }
  if (verificationStatuses) {
    querystring += `&verificationStatuses=${verificationStatuses.join(",")}`;
  }
  if (querystring.length > 0) {
    querystring = `?${querystring}`;
  }

  const { data } = await instance.get<MyOpportunitySearchCriteriaOpportunity[]>(
    `/myopportunity/search/filter/opportunity${querystring}`,
  );
  return data;
};

export const performActionCancel = async (
  opportunityId: string,
  context?: GetServerSidePropsContext,
): Promise<any> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.delete(`/myopportunity/action/${opportunityId}/verify/delete`);
};
