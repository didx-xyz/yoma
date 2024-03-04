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
import type { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiServer from "~/lib/axiosServer";

//TODO: remove/change once api is ready
export const getAges = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Gender[]> => {
  // const instance = context ? ApiServer(context) : await ApiClient;
  // const { data } = await instance.get<Gender[]>("/lookup/gender");
  // return data;

  // return hard-code data for now
  return [
    { name: "0-19", id: "0-19" },
    { name: "20-39", id: "20-39" },
    { name: "40-59", id: "40-59" },
    { name: "60+", id: "60+" },
  ];
};

export const getGenders = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Gender[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Gender[]>("/lookup/gender");
  return data;
};

export const getCountries = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Country[]>("/lookup/country");
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
  const { data } = await instance.get<TimeInterval[]>("/lookup/TimeInterval");
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
