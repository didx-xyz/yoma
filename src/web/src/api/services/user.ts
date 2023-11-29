import ApiClient from "~/lib/axiosClient";
import type { UserProfile, UserProfileRequest } from "../models/user";

export const patchUser = async (
  model: UserProfileRequest,
): Promise<UserProfile> => {
  const { data } = await (await ApiClient).patch<UserProfile>("/user", model);
  return data;
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const { data } = await (await ApiClient).get<UserProfile>(`/user`);
  return data;
};

export const patchPhoto = async (file: any): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append("file", file.file);

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
