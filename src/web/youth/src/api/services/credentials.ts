import ApiClient from "~/lib/axiosClient";
import type { GetServerSidePropsContext } from "next";
import ApiServer from "~/lib/axiosServer";
import type {
  SSISchema,
  SSISchemaEntity,
  SSISchemaRequest,
  SSISchemaType,
  SchemaType,
} from "../models/credential";

export const getSchemas = async (
  schemaType?: SchemaType,
  context?: GetServerSidePropsContext,
): Promise<SSISchema[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  // construct querystring parameters from filter
  const params = new URLSearchParams();
  if (schemaType !== undefined)
    params.append("schemaType", schemaType.toString());
  const { data } = await instance.get<SSISchema[]>(
    `/ssi/schema?${params.toString()}`,
  );
  return data;
};

export const getSchemaEntities = async (
  context?: GetServerSidePropsContext,
): Promise<SSISchemaEntity[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<SSISchemaEntity[]>("/ssi/schema/entity");
  return data;
};

export const createSchema = async (
  model: SSISchemaRequest,
): Promise<SSISchema> => {
  const { data } = await (
    await ApiClient
  ).post<SSISchema>("/ssi/schema", model);
  return data;
};

export const updateSchema = async (
  model: SSISchemaRequest,
): Promise<SSISchema> => {
  const { data } = await (
    await ApiClient
  ).patch<SSISchema>("/ssi/schema", model);
  return data;
};

export const getSchemaByName = async (
  name: string,
  context?: GetServerSidePropsContext,
): Promise<SSISchema> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<SSISchema>(`/ssi/schema/${name}`);
  return data;
};

export const getSchemaTypes = async (
  context?: GetServerSidePropsContext,
): Promise<SSISchemaType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<SSISchemaType[]>("/ssi/schema/types");
  return data;
};
