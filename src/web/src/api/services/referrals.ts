import { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import {
  AdminReferralLinkSearchFilter,
  AdminReferralLinkUsageSearchFilter,
  BlockReason,
  BlockRequest,
  Program,
  ProgramInfo,
  ProgramRequestCreate,
  ProgramRequestUpdate,
  ProgramSearchFilter,
  ProgramSearchFilterAdmin,
  ProgramSearchResults,
  ProgramSearchResultsInfo,
  ProgramStatus,
  ReferralAnalyticsSearchFilter,
  ReferralAnalyticsSearchFilterAdmin,
  ReferralAnalyticsSearchResults,
  ReferralAnalyticsSearchResultsInfo,
  ReferralAnalyticsUser,
  ReferralLink,
  ReferralLinkRequestCreate,
  ReferralLinkRequestUpdate,
  ReferralLinkSearchResults,
  ReferralLinkUsageInfo,
  ReferralLinkUsageSearchFilterAdmin,
  ReferralLinkUsageSearchResults,
  ReferralParticipationRole,
  UnblockRequest,
} from "../models/referrals";

// create/edit/info
export const getReferralProgramById = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Program>(`/referral/program/${id}/admin`);
  return data;
};

export const searchReferralPrograms = async (
  filter: ProgramSearchFilterAdmin,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ProgramSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ProgramSearchResults>(
    `/referral/program/search/admin`,
    filter,
  );
  return data;
};

export const createReferralProgram = async (
  request: ProgramRequestCreate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<Program>(
    `/referral/program/create`,
    request,
  );
  return data;
};

export const updateReferralProgram = async (
  request: ProgramRequestUpdate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<Program>(
    `/referral/program/update`,
    request,
  );
  return data;
};

export const updateReferralProgramStatus = async (
  id: string,
  status: ProgramStatus,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<Program>(
    `/referral/program/${id}/${status}`,
  );
  return data;
};

export const setReferralProgramAsDefault = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<Program>(
    `/referral/program/${id}/default`,
  );
  return data;
};

export const updateReferralProgramImage = async (
  id: string,
  file: File,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const formData = new FormData();
  formData.append("file", file);

  const { data } = await instance.patch<Program>(
    `/referral/program/${id}/image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return data;
};

export const getReferralLinkById = async (
  id: string,
  includeQRCode?: boolean,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLink> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const params = includeQRCode !== undefined ? { includeQRCode } : {};
  const { data } = await instance.get<ReferralLink>(`/referral/link/${id}`, {
    params,
  });
  return data;
};

export const searchReferralLinks = async (
  filter: AdminReferralLinkSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkSearchResults>(
    `/referral/link/search`,
    filter,
  );
  return data;
};

export const createReferralLink = async (
  request: ReferralLinkRequestCreate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLink> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLink>(
    `/referral/link/create`,
    request,
  );
  return data;
};

export const updateReferralLink = async (
  request: ReferralLinkRequestUpdate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLink> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<ReferralLink>(
    `/referral/link/update`,
    request,
  );
  return data;
};

export const cancelReferralLink = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLink> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<ReferralLink>(
    `/referral/link/${id}/cancel`,
  );
  return data;
};

// User-facing program endpoints
export const getAvailableReferralPrograms = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<boolean> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<boolean>(`/referral/program/available`);
  return data;
};

export const getDefaultReferralProgram = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ProgramInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ProgramInfo>(
    `/referral/program/default/info`,
  );
  return data;
};

export const searchReferralProgramsInfo = async (
  filter: ProgramSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ProgramSearchResultsInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ProgramSearchResultsInfo>(
    `/referral/program/search`,
    filter,
  );
  return data;
};

export const getReferralProgramInfoById = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ProgramInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ProgramInfo>(
    `/referral/program/${id}/info`,
  );
  return data;
};

export const getReferralProgramInfoByLinkId = async (
  linkId: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ProgramInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ProgramInfo>(
    `/referral/program/by-link/${linkId}/info`,
  );
  return data;
};

export const getReferralStatus = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<boolean> => {
  // This is now replaced by getAvailableReferralPrograms
  return getAvailableReferralPrograms(context);
};

export const getReferralLinkUsageById = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ReferralLinkUsageInfo>(
    `/referral/link/usage/${id}`,
  );
  return data;
};

export const getReferralLinkUsageByIdAsReferee = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ReferralLinkUsageInfo>(
    `/referral/link/${id}/usage`,
  );
  return data;
};

export const getReferralLinkUsageByProgramIdAsReferee = async (
  programId: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ReferralLinkUsageInfo>(
    `/referral/program/${programId}/link/usage/referee`,
  );

  return data;
};
export const searchReferralLinkUsagesAsReferrer = async (
  filter: AdminReferralLinkUsageSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkUsageSearchResults>(
    `/referral/link/usage/search/referrer`,
    filter,
  );
  return data;
};

export const searchReferralLinkUsagesAsReferee = async (
  filter: AdminReferralLinkUsageSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkUsageSearchResults>(
    `/referral/link/usage/search/referee`,
    filter,
  );
  return data;
};

export const searchReferralLinkUsagesAdmin = async (
  filter: ReferralLinkUsageSearchFilterAdmin,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkUsageSearchResults>(
    `/referral/link/usage/search/admin`,
    filter,
  );
  return data;
};

export const claimReferralLinkAsReferee = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<void> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.post(`/referral/link/${id}/claim`);
};

export const searchReferralLinksAdmin = async (
  filter: any,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkSearchResults>(
    `/referral/link/search/admin`,
    filter,
  );
  return data;
};

export const getBlockReasons = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<BlockReason[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<BlockReason[]>("/referral/block/reason");
  return data;
};

export const blockReferrer = async (
  request: BlockRequest,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<void> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.put("/referral/block", request);
};

export const unblockReferrer = async (
  request: UnblockRequest,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<void> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.patch("/referral/unblock", request);
};

// Analytics endpoints
export const getMyReferralAnalytics = async (
  role: ReferralParticipationRole,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralAnalyticsUser> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ReferralAnalyticsUser>(
    `/referral/analytics/${role}`,
  );
  return data;
};

export const searchReferralAnalytics = async (
  filter: ReferralAnalyticsSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralAnalyticsSearchResultsInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralAnalyticsSearchResultsInfo>(
    `/referral/analytics/search`,
    filter,
  );
  return data;
};

export const searchReferralAnalyticsAdmin = async (
  filter: ReferralAnalyticsSearchFilterAdmin,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralAnalyticsSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralAnalyticsSearchResults>(
    `/referral/analytics/search/admin`,
    filter,
  );
  return data;
};
