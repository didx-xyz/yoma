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
  description: string;
  url: string;
  badgeCount?: number | null;
  selected: boolean;
  icon?: any;
}
