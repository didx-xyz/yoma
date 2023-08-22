import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getCountries, getGenders } from "~/api/lookups";
import type { Country, Gender } from "~/api/models/lookups";

export const useGenders = (): UseQueryResult<Gender[]> => {
  return useQuery(["genders"], () => getGenders());
};

export const useCountries = (): UseQueryResult<Country[]> => {
  return useQuery(["countries"], () => getCountries());
};
