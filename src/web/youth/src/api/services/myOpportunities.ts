import { type GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { Opportunity } from "../models/opportunity";
import { MyOpportunityRequestVerify } from "../models/myOpportunity";

export const saveMyOpportunity = async (
  opportunityId: string,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).put<Opportunity>(`/myopportunity/action/{opportunityId}/save`);
  return data;
};

export const performActionSendForVerificationManual = async (
  opportunityId: string,
  model: MyOpportunityRequestVerify,
): Promise<any> => {
  /* eslint-disable */
  // convert model to form data
  const formData = new FormData();
  for (const property in model) {
    let propVal = (model as any)[property];

    /* if (property === "logo") {
      // send as first item in array
      formData.append(property, propVal ? propVal[0] : null);
    } else if (
      property === "providerTypes" ||
      property === "adminEmails" ||
      property === "registrationDocuments" ||
      property === "educationProviderDocuments" ||
      property === "businessDocuments" ||
      property === "registrationDocumentsDelete" ||
      property === "educationProviderDocumentsDelete" ||
      property === "businessDocumentsDelete"
    ) {
      // send as multiple items in form data
      for (const file of propVal) {
        formData.append(property, file);
      }
    } else*/ formData.append(property, propVal);
  }
  /* eslint-enable */

  await (
    await ApiClient
  ).put(`/myopportunity/action/${opportunityId}/verify`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
