import type { SSICredentialBase } from "~/api/models/credential";

// ─────────────────────────────────────────────────────────────────────────────
// Credential status badge (YOM-1310, API contract from YOM-1309 / PR #2028)
//
// One mapping for the passport card and the detail dialog, so the two can never disagree. The
// verdict comes from `verificationStatus`; `status` only supplies the reason behind Invalid.
//
// Rules from the API handover:
// - Missing fields (older API) are unspecified → Unverified. Never implicitly Verified.
// - A positive badge never overrides Revoked, Expired or Unknown: Verified requires the API's own
//   `Verified` *and* an `Issued` lifecycle.
// - Unknown is distinct from Invalid: it is "not established", not a failed check.
// - "Revoked" stays "revoked" (not Withdrawn).
// ─────────────────────────────────────────────────────────────────────────────

export type CredentialBadgeKind = "verified" | "invalid" | "unverified";

export interface CredentialBadge {
  kind: CredentialBadgeKind;
  /** Short pill text: "Verified", "Invalid", "Unverified". */
  label: string;
  /** Full text with the reason, for the detail dialog and tooltips: "Invalid — revoked". */
  description: string;
}

const INVALID_REASON: Record<string, string> = {
  Revoked: "revoked",
  Expired: "expired",
};

export const credentialBadge = (
  credential: Pick<SSICredentialBase, "status" | "verificationStatus">,
): CredentialBadge => {
  const status = credential.status?.toString();
  const verification = credential.verificationStatus?.toString();

  if (
    verification === "Invalid" ||
    status === "Revoked" ||
    status === "Expired"
  ) {
    const reason = status ? INVALID_REASON[status] : undefined;
    return {
      kind: "invalid",
      label: "Invalid",
      description: reason ? `Invalid — ${reason}` : "Invalid",
    };
  }

  if (verification === "Verified" && status === "Issued") {
    return { kind: "verified", label: "Verified", description: "Verified" };
  }

  return {
    kind: "unverified",
    label: "Unverified",
    description: "Unverified — status not established",
  };
};

/** Tailwind classes per verdict; the card and the dialog share them. */
export const CREDENTIAL_BADGE_CLASS: Record<CredentialBadgeKind, string> = {
  verified: "bg-green-light text-green",
  invalid: "bg-red-50 text-red-500",
  unverified: "bg-gray-light text-gray-dark",
};
