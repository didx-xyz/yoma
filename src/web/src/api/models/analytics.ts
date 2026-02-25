import type { SchemaType } from "./credential";

export interface CredentialMetrics {
  type: SchemaType | string | number;
  count: number;
  countDisplay: string;
}

export interface CredentialMetricsAdmin {
  type: SchemaType | string | number;
  count: number;
}

export interface PlatformMetrics {
  userCount: number;
  organizationCount: number;
  countryCount: number;
  opportunityCount: number;
  userCountDisplay: string;
  organizationCountDisplay: string;
  countryCountDisplay: string;
  opportunityCountDisplay: string;
  credentialSummary: CredentialMetrics[];
}

export interface PlatformMetricsAdmin {
  userCount: number;
  organizationCount: number;
  countryCount: number;
  opportunityCount: number;
  userCountActive: number;
  organizationCountActive: number;
  organizationCountryCountActive: number;
  opportunityCountPublished: number;
  credentialSummary: CredentialMetricsAdmin[];
}
