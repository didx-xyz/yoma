import ApiClient from "~/lib/axiosClient";
import type {
  Country,
  Education,
  Gender,
  Language,
  SkillSearchFilter,
  SkillSearchResults,
  TimeInterval,
} from "../models/lookups";
import type { GetServerSidePropsContext } from "next";
import ApiServer from "~/lib/axiosServer";

export const getGenders = async (
  context?: GetServerSidePropsContext,
): Promise<Gender[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Gender[]>("/lookup/gender");
  return data;
};

export const getCountries = async (
  context?: GetServerSidePropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Country[]>("/lookup/country");
  return data;
};

export const getLanguages = async (
  context?: GetServerSidePropsContext,
): Promise<Language[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Language[]>("/lookup/language");
  return data;
};

export const getTimeIntervals = async (
  context?: GetServerSidePropsContext,
): Promise<TimeInterval[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<TimeInterval[]>("/lookup/TimeInterval");
  return data;
};

export const getSkills = async (
  filter: SkillSearchFilter,
  context?: GetServerSidePropsContext,
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
  context?: GetServerSidePropsContext,
): Promise<Education[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Education[]>("/lookup/education");
  return data;
};
