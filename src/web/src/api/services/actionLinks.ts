import type { GetStaticPropsContext, GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  LinkInfo,
  LinkRequestCreateShare,
  LinkRequestCreateVerify,
  LinkSearchFilter,
  LinkSearchResult,
  LinkStatus,
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

//LAST HERE: need to rebuild docker
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
