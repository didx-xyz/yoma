import type { PaginationFilter } from "./common";

export interface SSISchemaEntity {
  id: string;
  name: string;
  properties: SSISchemaEntityProperty[] | null;
  types: SSISchemaType[] | null;
}

export interface SSISchemaEntityProperty {
  id: string;
  nameDisplay: string;
  description: string;
  attributeName: string;
  typeName: string;
  system: boolean;
  required: boolean;
}

export interface SSISchemaRequest {
  name: string;
  typeId: string;
  artifactType: ArtifactType | string | null;
  attributes: string[];
}

export enum ArtifactType {
  JWS,
  AnonCreds,
}

export enum SchemaType {
  Opportunity,
  YoID,
}

export interface SSISchemaType {
  id: string;
  name: string;
  description: string;
  supportMultiple: boolean;
}

export interface SSISchema {
  id: string;
  name: string;
  displayName: string;
  typeId: string;
  type: SchemaType;
  typeDescription: string;
  version: string;
  artifactType: ArtifactType;
  entities: SSISchemaEntity[];
  propertyCount: number | null;
}

export interface SSIWalletFilter extends PaginationFilter {
  schemaType: SchemaType | null | string; //NB: string
}

export interface SSIWalletSearchResults {
  totalCount: number | null;
  items: SSICredentialInfo[];
}
export interface SSICredentialInfo extends SSICredentialBase {}

export interface SSICredential extends SSICredentialBase {}

export interface SSICredentialBase {
  id: string;
  artifactType: ArtifactType | string; //NB: string
  schemaType: SchemaType | string; //NB: string
  issuer: string;
  issuerLogoURL: string;
  title: string;
  dateIssued: string | null;
  attributes: SSICredentialAttribute[];
}

export interface SSICredentialAttribute {
  name: string;
  nameDisplay: string;
  valueDisplay: string;
}
