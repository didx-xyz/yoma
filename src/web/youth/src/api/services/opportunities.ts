import { type GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  OpportunityCategory,
  OpportunityDifficulty,
  OpportunityType,
  OpportunityVerificationType,
  OpportunitySearchFilterAdmin,
  OpportunitySearchResults,
  OpportunityRequestBase,
  Opportunity,
  OpportunityInfo,
} from "../models/opportunity";

export const getOpportunitiesAdmin = async (
  filter: OpportunitySearchFilterAdmin,
  context?: GetServerSidePropsContext,
): Promise<OpportunitySearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<OpportunitySearchResults>(
    `/opportunity/search/admin`,
    filter,
  );

  return data;
};

export const getCategories = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityCategory[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityCategory[]>(
    "/opportunity/category",
  );
  return data;
};

export const getDifficulties = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityDifficulty[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityDifficulty[]>(
    "/opportunity/difficulty",
  );
  return data;
};

export const getTypes = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityType[]>("/opportunity/type");
  return data;
};

export const getVerificationTypes = async (
  context?: GetServerSidePropsContext,
): Promise<OpportunityVerificationType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OpportunityVerificationType[]>(
    "/opportunity/verificationType",
  );
  return data;
};
export const createOpportunity = async (
  model: OpportunityRequestBase,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).post<Opportunity>("/opportunity", model);
  return data;
};

export const updateOpportunity = async (
  model: OpportunityRequestBase,
): Promise<Opportunity> => {
  const { data } = await (
    await ApiClient
  ).patch<Opportunity>("/opportunity", model);
  return data;
};

export const getOpportunityById = async (
  id: string,
  context?: GetServerSidePropsContext,
): Promise<Opportunity> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<Opportunity>(`/opportunity/${id}/admin`);
  return data;
};

export const getOpportunityInfoById = async (
  id: string,
  context?: GetServerSidePropsContext,
): Promise<OpportunityInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<OpportunityInfo>(`/opportunity/${id}`);
  return data;
};
