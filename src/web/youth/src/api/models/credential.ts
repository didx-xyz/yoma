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
