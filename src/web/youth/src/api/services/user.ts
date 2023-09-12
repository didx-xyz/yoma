import ApiClient from "~/lib/axiosClient";
import type { User, UserProfile, UserProfileRequest } from "../models/user";

export const patchUser = async (model: UserProfileRequest): Promise<User> => {
  const { data } = await (await ApiClient).patch<User>("/user", model);
  return data;
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const { data } = await (await ApiClient).get<UserProfile>(`/user`);
  return data;
};
