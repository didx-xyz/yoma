import ApiClient from "~/lib/axiosClient";
import type { Country, Gender } from "../models/lookups";

export const getGenders = async (): Promise<Gender[]> => {
  const { data } = await (await ApiClient).get<Gender[]>("/lookup/gender");
  return data;
};

export const getCountries = async (): Promise<Country[]> => {
  const { data } = await (await ApiClient).get<Country[]>("/lookup/country");
  return data;
};
