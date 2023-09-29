import ApiClient from "~/lib/axiosClient";
import type { GetServerSidePropsContext } from "next";
import ApiServer from "~/lib/axiosServer";
import type { SSISchema } from "../models/credential";

export const getSchemas = async (
  context?: GetServerSidePropsContext,
): Promise<SSISchema[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<SSISchema[]>("/ssi/schema");
  return data;
};
