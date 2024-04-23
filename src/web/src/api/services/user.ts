import ApiClient from "~/lib/axiosClient";
import type { UserProfile, UserRequestProfile } from "../models/user";
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
