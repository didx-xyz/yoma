export interface ErrorResponseItem {
  type: string;
  message: string;
}

export interface PaginationFilter {
  pageNumber: number | null;
  pageSize: number | null;
}

export interface FormFile {
  contentType: string;
  contentDisposition: string;
  headers: [];
  length: number;
  name: string;
  fileName: string;
}

export interface Geometry {
  type: SpatialType | string; //HACK: api wants string not enum int
  coordinates: number[][] | null;
}

export enum SpatialType {
  None,
  Point,
}

export interface TabItem {
  title: string;
  description?: string;
  url?: string;
  badgeCount?: number | null;
  selected?: boolean;
  iconImage?: any;
  iconElement?: React.ReactElement;
}

export interface Settings {
  groups: SettingGroup[];
}

export interface SettingGroup {
  group: string;
  items: SettingItem[] | null;
  groups: SettingGroup[] | null;
}

export interface SettingItem {
  key: string;
  title: string;
  description: string;
  type: SettingType | string; //NB: string
  enabled: boolean;
  visible: boolean;
  value: any;
}

export enum SettingType {
  Boolean,
  Number,
  String,
}

export interface SettingsRequest {
  settings: Record<string, any>;
}

export interface CSVImportResult {
  imported: boolean;
  headerErrors: boolean;
  recordsTotal: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: CSVImportErrorRow[] | null;
}

export interface CSVImportErrorRow {
  number: number | null;
  alias: string;
  items: CSVImportErrorItem[];
}

export interface CSVImportErrorItem {
  type: CSVImportErrorType;
  message: string;
  field: string | null;
  value: string | null;
}

export enum CSVImportErrorType {
  ProcessingError = "ProcessingError",
  RequiredFieldMissing = "RequiredFieldMissing",
  InvalidFieldValue = "InvalidFieldValue",
}
