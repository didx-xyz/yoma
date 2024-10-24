import type { FormFile } from "~/api/models/common";

export interface OrganizationRequestViewModel {
  id: string;
  name: string;
  websiteURL: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  vATIN: string | null;
  taxNumber: string | null;
  registrationNumber: string | null;
  city: string | null;
  countryId: string | null;
  streetAddress: string | null;
  province: string | null;
  postalCode: string | null;
  tagline: string | null;
  biography: string | null;
  logo: FormFile | null;
  providerTypes: string[];
  registrationDocuments: FormFile[] | null;
  educationProviderDocuments: FormFile[] | null;
  businessDocuments: FormFile[] | null;
  addCurrentUserAsAdmin: boolean;
  admins: string[];
  registrationDocumentsDelete: string[] | null;
  educationProviderDocumentsDelete: string[] | null;
  businessDocumentsDelete: string[] | null;
  ssoClientIdInbound: string | null;
  ssoClientIdOutbound: string | null;
  zltoRewardPool: number | null;
  yomaRewardPool: number | null;
}
