import { type GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import {
  type OpportunitySearchFilterAdmin,
  type OpportunitySearchResults,
} from "../models/opportunity";

export const getOpportunitiesAdmin = async (
  context: GetServerSidePropsContext,
  filter?: OpportunitySearchFilterAdmin,
): Promise<OpportunitySearchResults[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<OpportunitySearchResults[]>(
    `/opportunity/search/admin`,
    filter,
  );

  return data;
};
