import { PaginationFilter } from "./common";

export interface Country {
  id: string;
  name: string;
  codeAlpha2: string;
  codeAlpha3: string;
  codeNumeric: string;
}

export interface Gender {
  id: string;
  name: string;
}
export interface Language {
  id: string;
  name: string;
  codeAlpha2: string;
}

export interface Skill {
  id: string;
  name: string;
  infoURL: string | null;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SkillSearchResults {
  totalCount: number | null;
  items: Skill[];
}

export interface SkillSearchFilter extends PaginationFilter {
  nameContains: string | null;
}

export interface TimeInterval {
  id: string;
  name: string;
}
