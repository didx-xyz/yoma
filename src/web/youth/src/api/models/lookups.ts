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
