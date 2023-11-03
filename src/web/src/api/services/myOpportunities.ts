import ApiClient from "~/lib/axiosClient";
import type { Opportunity } from "../models/opportunity";
import type { MyOpportunityRequestVerify } from "../models/myOpportunity";
import { objectToFormData } from "~/lib/utils";

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
): Promise<string | null> => {
  const { data } = await (
    await ApiClient
  ).post<string | null>(
    `/myopportunity/action/verify/status?opportunityId=${opportunityId}`,
  );
  return data;
};
