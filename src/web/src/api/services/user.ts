import type { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { Settings, SettingsRequest } from "../models/common";
import type {
  UserGoalLookup,
  UserPreferencesRequest,
  UserPreferencesResponse,
  UserProfile,
  UserRequestProfile,
  UserSkillInfo,
  UserSkillType,
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

export const deletePhoto = async (): Promise<void> => {
  await (await ApiClient).delete("/user/photo");
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

/**
 * The youth's skills. Unfiltered, the API returns BOTH earned (`Verified`) and self-attested
 * skills, so every earned-skills view (passport, YoID, the drawer card) must ask for `Verified`.
 */
export const getUserSkills = async (
  type: UserSkillType | null,
  context?: GetServerSidePropsContext,
): Promise<UserSkillInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.get<UserSkillInfo[]>(
    type ? `/user/skills?type=${type}` : "/user/skills",
  );

  return data;
};

/** Authenticated (User role). The five sentence-case goals; render `name`. */
export const getUserGoals = async (): Promise<UserGoalLookup[]> => {
  const { data } = await (await ApiClient).get<UserGoalLookup[]>("/user/goal");
  return data;
};

/** Never-saved preferences come back as null scalars and empty lists, not a 404. */
export const getUserPreferencesApi =
  async (): Promise<UserPreferencesResponse> => {
    const { data } = await (
      await ApiClient
    ).get<UserPreferencesResponse>("/user/preferences");
    return data;
  };

/** Complete replacement — send every field; the full updated preferences come back. */
export const patchUserPreferences = async (
  request: UserPreferencesRequest,
): Promise<UserPreferencesResponse> => {
  const { data } = await (
    await ApiClient
  ).patch<UserPreferencesResponse>("/user/preferences", request);
  return data;
};
