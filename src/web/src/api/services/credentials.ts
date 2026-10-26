import ApiClient from "~/lib/axiosClient";
import type { GetServerSidePropsContext } from "next";
import ApiServer from "~/lib/axiosServer";
import type {
  SSICredential,
  SSISchema,
  SSISchemaEntity,
  SSISchemaRequestCreate,
  SSISchemaRequestUpdate,
  SSISchemaType,
  SSIWalletFilter,
  SSIWalletSearchResults,
  SchemaType,
} from "../models/credential";

export const getSchemas = async (
  schemaType?: SchemaType,
  typeContext?: string | null,
  context?: GetServerSidePropsContext,
): Promise<SSISchema[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  // construct querystring parameters from filter
  const params = new URLSearchParams();
  if (schemaType !== undefined && schemaType !== null)
    params.append("schemaType", schemaType.toString());
  // only honoured together with a schema type; returns generic schemas plus those matching the context
  if (typeContext) params.append("typeContext", typeContext);
  const { data } = await instance.get<SSISchema[]>(
    `/ssi/schema?${params.toString()}`,
  );
  return data;
};

export const getSchemaEntities = async (
  schemaType?: SchemaType,
  typeContext?: string | null,
  context?: GetServerSidePropsContext,
): Promise<SSISchemaEntity[]> => {
  const params = new URLSearchParams();
  if (schemaType !== undefined && schemaType !== null)
    params.append("schemaType", schemaType.toString());
  // with no context only generic custom fields are returned; with one, generic + matching fields
  if (typeContext) params.append("typeContext", typeContext);

  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<SSISchemaEntity[]>(
    `/ssi/schema/entity?${params.toString()}`,
  );
  return data;
};

export const createSchema = async (
  model: SSISchemaRequestCreate,
): Promise<SSISchema> => {
  const { data } = await (
    await ApiClient
  ).post<SSISchema>("/ssi/schema", model);
  return data;
};

export const updateSchema = async (
  model: SSISchemaRequestUpdate,
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
  const { data } = await instance.get<SSISchema>(
    `/ssi/schema/${encodeURIComponent(name)}`,
  );
  return data;
};

export const getSchemaTypes = async (
  context?: GetServerSidePropsContext,
): Promise<SSISchemaType[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<SSISchemaType[]>("/ssi/schema/types");
  return data;
};

export const searchCredentials = async (
  filter: SSIWalletFilter,
  context?: GetServerSidePropsContext,
): Promise<SSIWalletSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<SSIWalletSearchResults>(
    `/ssi/wallet/user/search`,
    filter,
  );
  return data;
};

export const getCredentialById = async (id: string): Promise<SSICredential> => {
  const { data } = await (
    await ApiClient
  ).post<SSICredential>(`/ssi/wallet/user/${id}`);
  return data;
};
