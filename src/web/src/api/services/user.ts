import ApiClient from "~/lib/axiosClient";
import type {
  Settings,
  UserProfile,
  UserRequestProfile,
  UserRequestSettings,
  UserSkillInfo,
} from "../models/user";
import type { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiServer from "~/lib/axiosServer";

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

  //TODO: remove
  // const stringItem: SettingItem = {
  //   key: "testStringKey",
  //   title: "Test String Item",
  //   description: "This is a test string item for testing purposes.",
  //   type: "String", // Assuming 'string' is a valid type or part of SettingType enum
  //   enabled: true,
  //   value: "Test String Value",
  // };

  // const numberItem: SettingItem = {
  //   key: "testNumberKey",
  //   title: "Test Number Item",
  //   description: "This is a test number item for testing purposes.",
  //   type: "Number", // Assuming 'number' is a valid type or part of SettingType enum
  //   enabled: true,
  //   value: 42,
  // };

  // MOCK DATA with string and number items
  // if (data && data.groups.length > 0) {
  //   if (!data.groups[0].items) {
  //     data.groups[0].items = [];
  //   }
  //   data.groups[0].items.push(stringItem, numberItem);
  // }

  return data;
};

export const updateSettings = async (
  model: UserRequestSettings,
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
