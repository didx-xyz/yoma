import ApiClient from "~/lib/axiosClient";
import type { Opportunity } from "../models/opportunity";
import type {
  MyOpportunityRequestVerify,
  MyOpportunityRequestVerifyFinalizeBatch,
  MyOpportunityResponseVerify,
  MyOpportunityResponseVerifyFinalizeBatch,
  MyOpportunitySearchCriteriaOpportunity,
  MyOpportunitySearchFilter,
  MyOpportunitySearchFilterAdmin,
  MyOpportunitySearchResults,
  VerificationStatus,
} from "../models/myOpportunity";
import { objectToFormData } from "~/lib/utils";
import type {
  GetServerSidePropsContext,
  GetStaticPropsContext,
} from "next/types";
import ApiServer from "~/lib/axiosServer";
import type { TimeIntervalSummary } from "../models/organizationDashboard";

export const saveMyOpportunity = async (
  opportunityId: string,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).put<Opportunity>(`/myopportunity/action/${opportunityId}/save`);
  return data;
};

export const removeMySavedOpportunity = async (
  opportunityId: string,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).delete<Opportunity>(`/myopportunity/action/${opportunityId}/save/remove`);
  return data;
};

export const isOpportunitySaved = async (
  opportunityId: string,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).get<Opportunity>(`/myopportunity/action/${opportunityId}/saved`);
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
  const { data } = await instance.get<MyOpportunityResponseVerify>(
    `/myopportunity/action/${opportunityId}/verify/status`,
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

export const searchMyOpportunitiesSummary = async (
  context?: GetServerSidePropsContext,
): Promise<TimeIntervalSummary> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<TimeIntervalSummary>(
    `/myopportunity/summary`,
  );

  return data;

  // //TODO: mock data:
  // const mockTimeValueEntries: TimeValueEntry[] = [
  //   { date: "2023-04-01", values: [10, 20, 30, 4] },
  //   { date: "2023-04-02", values: [65, 25, 35, 13] },
  //   { date: "2023-04-03", values: [29, 130, 140, 12] },
  //   { date: "2023-04-04", values: [25, 35, 45, 0] },
  //   { date: "2023-04-05", values: [130, 240, 250, 3] },
  //   { date: "2023-04-06", values: [35, 145, 55, 1] },
  // ];

  // const mockTimeIntervalSummary: TimeIntervalSummary = {
  //   legend: ["Completed", "Pending", "Rejected", "Saved"],
  //   data: mockTimeValueEntries,
  //   count: [3, 3, 3, 40],
  // };

  // return mockTimeIntervalSummary;
};

export const performActionVerifyBulk = async (
  model: MyOpportunityRequestVerifyFinalizeBatch,
  context?: GetServerSidePropsContext,
): Promise<MyOpportunityResponseVerifyFinalizeBatch> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.patch(
    `/myopportunity/verification/finalize/batch`,
    model,
  );

  return data;
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
  verificationStatuses?: VerificationStatus[] | string[] | null,
  context?: GetServerSidePropsContext,
): Promise<MyOpportunitySearchCriteriaOpportunity[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  let querystring = "";
  if (organisations) {
    querystring += `organizations=${organisations.join(",")}`;
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

export const performActionInstantVerificationManual = async (
  linkId: string,
  context?: GetServerSidePropsContext,
): Promise<void> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.put(`/myopportunity/action/link/${linkId}/verify`);
};

export const getMyOpportunitiesExportToCSV = async (
  filter: MyOpportunitySearchFilterAdmin,

  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<File> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post(
    `/myopportunity/search/admin/csv`,
    filter,
    {
      responseType: "blob", // set responseType to 'blob' or 'arraybuffer'
    },
  );

  // create the file name
  const date = new Date();
  const dateString = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  const fileName = `Verifications_${dateString}.csv`;

  // create a new Blob object using the data
  const blob = new Blob([data], { type: "text/csv" });

  // create a new File object from the Blob
  const file = new File([blob], fileName);

  return file;
};

export const performActionNavigateExternalLink = async (
  opportunityId: string,
  context?: GetServerSidePropsContext,
): Promise<any> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.put(
    `/myopportunity/action/${opportunityId}/navigateExternalLink`,
  );
};

export const downloadVerificationFiles = async (
  opportunityId: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<File> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  try {
    const response = await instance.get(
      `/myopportunity/action/${opportunityId}/verify/files`,
      {
        responseType: "blob", // set responseType to 'blob' or 'arraybuffer',
        withCredentials: true,
      },
    );

    // Log headers to debug
    debugger;
    console.log("Response Headers:", response.headers);

    // get file name from result
    const contentDisposition = response.headers["content-disposition"];
    if (!contentDisposition) {
      throw new Error("Content-Disposition header is missing");
    }

    const contentType = response.headers["content-type"];
    if (!contentType) {
      throw new Error("Content-Type header is missing");
    }

    const fileName = contentDisposition.split("filename=")[1].replace(/"/g, "");

    // create a new Blob object using the data
    const blob = new Blob([response.data], { type: contentType });

    // create a new File object from the Blob
    const file = new File([blob], fileName);

    return file;
  } catch (error) {
    console.error("Error downloading verification files:", error);
    throw error;
  }
};
