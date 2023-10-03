export interface SSISchema {
  id: string;
  name: string;
  version: string;
  entities: SSISchemaEntity[] | null;
}

export interface SSISchemaEntity {
  id: string;
  name: string;
  properties: SSISchemaEntityProperty[] | null;
}

export interface SSISchemaEntityProperty {
  id: string;
  attributeName: string;
  typeName: string;
  valueDescription: string;
  required: boolean;
}

export interface SSISchemaRequest {
  name: string;
  artifactType: ArtifactType | null;
  attributes: string[];
}

export enum ArtifactType {
  Indy,
  Ld_proof,
}
