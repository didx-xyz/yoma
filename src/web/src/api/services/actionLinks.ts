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
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<LinkSearchResultsUsage>(
    "/actionLink/search/usage",
    filter,
  );
  return data;
};
