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

  /* eslint-disable */
  // convert model to form data
  // const formData = new FormData();
  // for (const property in model) {
  //   let propVal = (model as any)[property];
  //   if (propVal == null || propVal === undefined) continue;

  //   formData.append(property, propVal);
  // }
  /* eslint-enable */

  await (
    await ApiClient
  ).put(`/myopportunity/action/${opportunityId}/verify`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
