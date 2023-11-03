import type { FormFile, Geometry } from "./common";

export interface MyOpportunityRequestVerify {
  certificate: FormFile | null;
  voiceNote: FormFile | null;
  picture: FormFile | null;
  geometry: Geometry | null;
  dateStart: string | null;
  dateEnd: string | null;
}

export enum VerificationStatus {
  Pending,
  Rejected,
  Completed,
}
