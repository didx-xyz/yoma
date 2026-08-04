import type {
  Organization,
  OrganizationRequestBase,
  OrganizationRewardPools,
} from "~/api/models/organisation";

/**
 * Builds a complete `PATCH /organization` payload from an organisation.
 *
 * ⚠️ WHY THIS EXISTS: `PATCH /organization` is a **full replacement**, not a partial patch — it takes
 * the whole `OrganizationRequestBase` as multipart form data and assigns every field. There is no
 * narrower endpoint for the reward pools. So any surface that wants to change one pool has to resend
 * everything else exactly as it is, and getting that wrong silently clears organisation data.
 *
 * Doing it in one place means the organisation edit page and the Treasury Organisations tab produce
 * byte-identical payloads, and the mapping is reviewable once instead of per caller.
 *
 * Notes on the fields that are not simply copied:
 *  - `logo` is deliberately absent — the logo is uploaded through its own endpoint
 *    (`PATCH /organization/{id}/logo`), and including it here would re-submit it.
 *  - document arrays are empty: this payload changes no documents, and the `…Delete` arrays must be
 *    empty or the server removes them.
 *  - `admins` is rebuilt from `administrators` (email, falling back to phone), matching what the edit
 *    page sends. The validator requires at least one admin when `addCurrentUserAsAdmin` is false, so
 *    an organisation with no administrators will be rejected server-side — surfaced as-is rather than
 *    papered over.
 */
export const organizationRequestFromOrganization = (
  organization: Organization,
  overrides?: Partial<OrganizationRequestBase>,
): OrganizationRequestBase => ({
  id: organization.id,
  name: organization.name,
  websiteURL: organization.websiteURL ?? null,
  primaryContactName: organization.primaryContactName ?? null,
  primaryContactEmail: organization.primaryContactEmail ?? null,
  primaryContactPhone: organization.primaryContactPhone ?? null,
  vATIN: organization.vATIN ?? null,
  taxNumber: organization.taxNumber ?? null,
  registrationNumber: organization.registrationNumber ?? null,
  city: organization.city ?? null,
  countryId: organization.countryId ?? null,
  streetAddress: organization.streetAddress ?? null,
  province: organization.province ?? null,
  postalCode: organization.postalCode ?? null,
  tagline: organization.tagline ?? null,
  biography: organization.biography ?? null,
  providerTypes: organization.providerTypes?.map((type) => type.id) ?? [],
  addCurrentUserAsAdmin: false,
  admins:
    organization.administrators
      ?.map((admin) => admin.email ?? admin.phoneNumber)
      .filter((value): value is string => !!value) ?? [],
  registrationDocuments: [],
  educationProviderDocuments: [],
  businessDocuments: [],
  registrationDocumentsDelete: [],
  educationProviderDocumentsDelete: [],
  businessDocumentsDelete: [],
  ssoClientIdInbound: organization.ssoClientIdInbound ?? null,
  ssoClientIdOutbound: organization.ssoClientIdOutbound ?? null,
  zltoRewardPoolCurrentFinancialYear:
    organization.zltoRewardPoolCurrentFinancialYear,
  yomaRewardPoolCurrentFinancialYear:
    organization.yomaRewardPoolCurrentFinancialYear,
  ...overrides,
});

/** The same payload with only the reward pools changed. */
export const organizationRewardPoolsRequest = (
  organization: Organization,
  pools: OrganizationRewardPools,
): OrganizationRequestBase =>
  organizationRequestFromOrganization(organization, pools);
