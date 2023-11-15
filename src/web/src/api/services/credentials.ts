import ApiClient from "~/lib/axiosClient";
import type { GetServerSidePropsContext } from "next";
import ApiServer from "~/lib/axiosServer";
import type {
  SSICredential,
  SSISchema,
  SSISchemaEntity,
  SSISchemaRequest,
  SSISchemaType,
  SSIWalletFilter,
  SSIWalletSearchResults,
  SchemaType,
} from "../models/credential";

export const getSchemas = async (
  schemaType?: SchemaType,
  context?: GetServerSidePropsContext,
): Promise<SSISchema[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  // construct querystring parameters from filter
  const params = new URLSearchParams();
  if (schemaType !== undefined && schemaType !== null)
    params.append("schemaType", schemaType.toString());
  const { data } = await instance.get<SSISchema[]>(
    `/ssi/schema?${params.toString()}`,
  );
  return data;
};

export const getSchemaEntities = async (
  schemaType?: SchemaType,
  context?: GetServerSidePropsContext,
): Promise<SSISchemaEntity[]> => {
  let querystring = "";
  if (schemaType !== undefined && schemaType !== null)
    querystring = `?schemaType=${schemaType}`;

  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<SSISchemaEntity[]>(
    `/ssi/schema/entity${querystring}`,
  );
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

export const searchCredentials = async (
  filter: SSIWalletFilter,
  context?: GetServerSidePropsContext,
): Promise<SSIWalletSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  // if environment is Local, return hardcoded data
  // if (process.env.NEXT_PUBLIC_ENVIRONMENT === "local") {
  //   return {
  //     totalCount: 10,
  //     items: [
  //       {
  //         id: "9a8bba63-92ef-4f2b-8240-3c595db3c1c9",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer:
  //           "Awesome A Wonderful An Fantastic Exciting Amazing The Incredible 1649058286",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/f76cde7a-3c8a-4c93-b26c-af4d7bdf28c2.png",
  //         title:
  //           "Exciting A Incredible Wonderful The Amazing Unbelievable Fantastic Awesome An 641932871",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //       {
  //         id: "6bc90358-ab3e-480c-95b5-c46a1aaac8f9",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer:
  //           "A Exciting Wonderful Fantastic Awesome An Amazing The Incredible 1036273912",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/555f5894-30d2-4641-8e1d-5b2dcbad481a.png",
  //         title:
  //           "The Stunning A Awesome Impressive An Great Amazing Exciting Wonderful Incredible Fantastic Unbelievable Marvelous 1101577005",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //       {
  //         id: "3fdb7235-1413-43b8-8f2a-578344f21aeb",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer:
  //           "Exciting An Amazing The Fantastic Incredible Wonderful A Awesome 929763151",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/302a1a39-4a38-409a-8f46-7b8a341d2a90.png",
  //         title:
  //           "Great Fantastic Incredible Exciting The A An Awesome Unbelievable Amazing Wonderful 323762400",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //       {
  //         id: "1512098e-b960-47fd-880d-2a5ce22129ea",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer:
  //           "A The Amazing Awesome Exciting Fantastic Incredible Wonderful An 1867562971",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/7d4ae951-b1f5-463f-bc57-e4df992526c6.png",
  //         title:
  //           "An Awesome Stunning The A Fantastic Amazing Exciting Marvelous Incredible Impressive Unbelievable Great Wonderful 113233848",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //       {
  //         id: "4d6d0427-6eae-4710-a7be-56dc21b9b810",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer:
  //           "Wonderful Exciting An Fantastic A The Amazing Awesome Incredible 1834070116",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/f43822f0-14c7-493a-9cbd-e8b1fe4dd49e.png",
  //         title:
  //           "Amazing Exciting An Awesome Incredible Marvelous A Unbelievable Great The Fantastic Wonderful 78718424",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //       {
  //         id: "469aca6a-ad82-41b6-b1a0-720bee9ff5c8",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer:
  //           "Wonderful Exciting An Fantastic A The Amazing Awesome Incredible 1834070116",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/f43822f0-14c7-493a-9cbd-e8b1fe4dd49e.png",
  //         title:
  //           "A Amazing Awesome An Incredible Wonderful The Fantastic 1039518200",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //       {
  //         id: "6d168163-071f-4b03-8a03-3c276de4c803",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer:
  //           "An Fantastic Awesome Incredible The A Wonderful Exciting Amazing 1194942930",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/8bae206d-dbd2-42a9-bef4-1a355d6b3dda.png",
  //         title: "A An Amazing Awesome Fantastic Incredible The 1041309201",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //       {
  //         id: "aee67d91-ec2a-481f-b8b2-56f6ed8b5663",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer: "Yoma (Youth Agency Marketplace)",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/9273c7b5-fa3d-40e4-a598-717845673ef3.png",
  //         title:
  //           "A Exciting An Incredible Fantastic Wonderful Awesome Amazing The 1505314093",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //       {
  //         id: "a024b9e4-ee4b-4acb-acc0-b92dde3d382f",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer:
  //           "Wonderful Exciting An Fantastic A The Amazing Awesome Incredible 1834070116",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/f43822f0-14c7-493a-9cbd-e8b1fe4dd49e.png",
  //         title:
  //           "The Wonderful An Amazing Awesome Fantastic A Incredible 75112812",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //       {
  //         id: "90553b76-f1fc-4931-b2d2-14a59d4848d3",
  //         artifactType: "Indy",
  //         schemaType: "Opportunity",
  //         issuer:
  //           "Incredible Wonderful Fantastic Exciting An A Amazing The Awesome 681536878",
  //         issuerLogoURL:
  //           "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/ac5dba73-a909-44a3-8fe7-1e15ca191e9d.png",
  //         title:
  //           "Amazing Awesome An Wonderful Exciting Fantastic The Unbelievable Incredible A 1427145600",
  //         dateIssued: "2023-11-15T00:00:00+00:00",
  //         attributes: [],
  //       },
  //     ],
  //   };
  // }

  const { data } = await instance.post<SSIWalletSearchResults>(
    `/ssi/wallet/user/search`,
    filter,
  );
  return data;
};

export const getCredentialById = async (id: string): Promise<SSICredential> => {
  // if environment is Local, return hardcoded data
  // if (process.env.NEXT_PUBLIC_ENVIRONMENT === "local") {
  //   return {
  //     id: "9a8bba63-92ef-4f2b-8240-3c595db3c1c9",
  //     artifactType: "Indy",
  //     schemaType: "Opportunity",
  //     issuer:
  //       "Awesome A Wonderful An Fantastic Exciting Amazing The Incredible 1649058286",
  //     issuerLogoURL:
  //       "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/development/photos/f76cde7a-3c8a-4c93-b26c-af4d7bdf28c2.png",
  //     title:
  //       "Exciting A Incredible Wonderful The Amazing Unbelievable Fantastic Awesome An 641932871",
  //     dateIssued: "2023-11-15T00:00:00+00:00",
  //     attributes: [
  //       {
  //         name: "Attribute 1",
  //         nameDisplay: "Attribute 1",
  //         valueDisplay: "Value 1",
  //       },
  //       {
  //         name: "Attribute 2",
  //         nameDisplay: "Attribute 2",
  //         valueDisplay: "Value 2",
  //       },
  //       {
  //         name: "Attribute 3",
  //         nameDisplay: "Attribute 3",
  //         valueDisplay: "Value 3",
  //       },
  //       {
  //         name: "Attribute 4",
  //         nameDisplay: "Attribute 4",
  //         valueDisplay: "Value 4",
  //       },
  //     ],
  //   };
  // }

  const { data } = await (
    await ApiClient
  ).post<SSICredential>(`/ssi/wallet/user/${id}`);
  return data;
};
