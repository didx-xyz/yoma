import type { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { Settings, SettingsRequest } from "../models/common";
import type {
  UserProfile,
  UserRequestProfile,
  UserSkillInfo,
} from "../models/user";

export const patchUser = async (
  model: UserRequestProfile,
): Promise<UserProfile> => {
  const { data } = await (await ApiClient).patch<UserProfile>("/user", model);
  return data;
};

export const getUserProfile = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<UserProfile> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<UserProfile>(`/user`);

  return data;
};

export const patchPhoto = async (file: any): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await (
    await ApiClient
  ).patch<UserProfile>("/user/photo", formData, {
    headers: { "Content-Type": "multipart/form-data", Accept: "text/plain" },
  });

  return data;
};

export const patchYoIDOnboarding = async (): Promise<UserProfile> => {
  const { data } = await (await ApiClient).patch<UserProfile>("/user/yoId");
  return data;
};

export const getSettings = async (
  context?: GetServerSidePropsContext,
): Promise<Settings> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<Settings>("/user/settings");

  return data;
};

export const updateSettings = async (
  model: SettingsRequest,
  context?: GetServerSidePropsContext,
): Promise<UserProfile> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.patch<UserProfile>("/user/settings", model);

  return data;
};

export const getUserSkills = async (
  context?: GetServerSidePropsContext,
): Promise<UserSkillInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<UserSkillInfo[]>("/user/skills");

  return data;
};
