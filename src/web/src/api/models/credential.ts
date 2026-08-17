import type { PaginationFilter } from "./common";
import type { CustomFieldDataType, CustomFieldLookupType } from "./opportunity";

export interface SSISchemaEntity {
  id: string;
  name: string;
  properties: SSISchemaEntityProperty[] | null;
  /**
   * Dynamic custom fields selectable as schema attributes. Present on schema-entity discovery
   * (the fields applicable to the requested type/context) and on a schema (the fields it maps).
   */
  customFields: SSISchemaEntityCustomField[] | null;
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
  /**
   * Developer-controlled presentation group, seeded via migration and read-only to schema admins.
   * Statics and custom fields share one grouping space. Null for system properties (they render in
   * the credential's fixed header) and for anything not yet configured — ungrouped sorts last.
   */
  group: string | null;
  subGroup: string | null;
  sortOrder: number | null;
}

/**
 * A custom-field definition offered as a credential schema attribute
 * (Yoma.Core.Domain.SSI.Models.Lookups.SSISchemaEntityCustomField). The definition stays owned by
 * the custom-field domain — schema management only maps it.
 */
export interface SSISchemaEntityCustomField {
  id: string;
  key: string;
  nameDisplay: string;
  description: string | null;
  /** `{EntityType}_{key}`. The stable identifier submitted in SSISchemaRequestCreate.attributes. */
  attributeName: string;
  typeName: string;
  /** null = generic; otherwise the Opportunity Type *name* the field is scoped to. */
  typeContext: string | null;
  dataType: CustomFieldDataType | string; //NB: string
  lookupType: CustomFieldLookupType | string | null; //NB: string
  supportsMultiple: boolean | null;
  group: string;
  subGroup: string | null;
  sortOrder: number;
  required: boolean;
  isActive: boolean;
  /** Developer-controlled. Displayed, never managed, by schema administration. */
  isSystem: boolean;
  /** Set once the field is mapped to a schema version. Managed by schema administration. */
  isSchemaMapped: boolean;
  isProtected: boolean;
}

/** POST /ssi/schema — `name` is the friendly name; the API builds the full name. */
export interface SSISchemaRequestCreate {
  name: string;
  typeId: string;
  /** Opportunity schemas only; the Opportunity Type *name*. null/omitted = generic. */
  typeContext: string | null;
  artifactType: ArtifactType | string | null;
  attributes: string[];
}

/** PATCH /ssi/schema — `name` is the *full* name; only attributes may change. */
export interface SSISchemaRequestUpdate {
  name: string;
  attributes: string[];
}

// NB: the member names match the API enum, which is what the API returns for `artifactType`.
// ACR is described as "AnonCreds" — see ARTIFACT_TYPE_LABELS.
export enum ArtifactType {
  JWS,
  ACR,
}

export const ARTIFACT_TYPE_LABELS: Record<keyof typeof ArtifactType, string> = {
  JWS: "JWS",
  ACR: "AnonCreds",
};

export enum SchemaType {
  Opportunity,
  YoID,
}

export interface SSISchemaType {
  id: string;
  type: SchemaType | string; //NB: string
  name: string;
  description: string;
  supportMultiple: boolean;
}

export interface SSISchema {
  id: string;
  /** Full provider name: `{Type}|{Name}`, or `{Type}|{TypeContext}|{Name}`. */
  name: string;
  /** Friendly name supplied by the administrator, without type or context. */
  displayName: string;
  typeId: string;
  type: SchemaType | string; //NB: string
  typeDescription: string;
  /** Opportunity schemas only; the Opportunity Type name. null = generic. */
  typeContext: string | null;
  version: string;
  artifactType: ArtifactType | string; //NB: string
  artifactTypeDescription: string;
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

// NB: the wallet response is already ordered. Consumers render `group`/`subGroup` as headings and
// must not infer grouping from the signed credential payload. Consumed by YOM-1283.
export interface SSICredentialAttribute {
  name: string;
  nameDisplay: string;
  valueDisplay: string;
  /** null = ungrouped; returned after the configured groups, in display-label order. */
  group: string | null;
  subGroup: string | null;
  sortOrder: number | null;
}
