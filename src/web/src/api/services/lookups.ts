import ApiClient from "~/lib/axiosClient";
import type {
  Accessibility,
  Country,
  Currency,
  Education,
  EngagementType,
  Gender,
  Language,
  SkillSearchFilter,
  SkillSearchResults,
  SustainableDevelopmentGoal,
  TargetedGroup,
  TimeInterval,
} from "../models/lookups";
import type { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiServer from "~/lib/axiosServer";

export const getGenders = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Gender[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Gender[]>("/lookup/gender");
  return data;
};

export const getCountries = async (
  excludeWorldwide?: boolean,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  // construct querystring parameters
  const params = new URLSearchParams();
  if (excludeWorldwide !== undefined) {
    params.append("excludeWorldwide", excludeWorldwide.toString());
  }

  const url = params.toString()
    ? `/lookup/country?${params.toString()}`
    : "/lookup/country";

  const { data } = await instance.get<Country[]>(url);
  return data;
};

export const getLanguages = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Language[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Language[]>("/lookup/language");
  return data;
};

export const getTimeIntervals = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<TimeInterval[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<TimeInterval[]>("/lookup/timeInterval");
  return data;
};

export const getSkills = async (
  filter: SkillSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<SkillSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  // construct querystring parameters from filter
  const params = new URLSearchParams();
  if (filter.nameContains) params.append("nameContains", filter.nameContains);
  if (filter.pageNumber)
    params.append("pageNumber", filter.pageNumber.toString());
  if (filter.pageSize) params.append("pageSize", filter.pageSize.toString());

  const { data } = await instance.get<SkillSearchResults>(
    `/lookup/skill?${params.toString()}`,
  );
  return data;
};

export const getEducations = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Education[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Education[]>("/lookup/education");
  return data;
};

export const getEngagementTypes = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<EngagementType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<EngagementType[]>("/lookup/engagement");
  return data;
};

export const getCurrencies = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Currency[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Currency[]>("/lookup/currency");
  return data;
};

export const getTargetedGroups = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<TargetedGroup[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<TargetedGroup[]>(
    "/lookup/targeted/group",
  );
  return data;
};

export const getSustainableDevelopmentGoals = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<SustainableDevelopmentGoal[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<SustainableDevelopmentGoal[]>(
    "/lookup/sustainable/development/goal",
  );
  return data;
};

/** Opportunity accommodations and youth accessibility requirements share this list. */
export const getAccessibilityOptions = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Accessibility[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Accessibility[]>("/lookup/accessibility");
  return data;
};
