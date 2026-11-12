import { IoMdCheckmark, IoMdClose, IoMdHelp } from "react-icons/io";
import type { SSICredentialBase } from "~/api/models/credential";
import {
  CREDENTIAL_BADGE_CLASS,
  credentialBadge,
} from "~/lib/credentials/credentialStatus";

// The passport card's and the detail dialog's status pill (YOM-1310). The verdict and wording
// come from `lib/credentials/credentialStatus.ts`; this only draws them. `data-status` carries
// the kind so a test can assert the verdict without parsing the label.

const ICON: Record<"verified" | "invalid" | "unverified", React.ReactNode> = {
  verified: <IoMdCheckmark className="h-3 w-3" aria-hidden />,
  invalid: <IoMdClose className="h-3 w-3" aria-hidden />,
  unverified: <IoMdHelp className="h-3 w-3" aria-hidden />,
};

export const CredentialStatusBadge: React.FC<{
  credential: Pick<SSICredentialBase, "status" | "verificationStatus">;
  /** `full` spells out the reason ("Invalid — revoked"); `short` keeps the pill to one word. */
  variant?: "short" | "full";
  className?: string;
}> = ({ credential, variant = "short", className = "" }) => {
  const badge = credentialBadge(credential);
  return (
    <span
      data-status={badge.kind}
      title={badge.description}
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CREDENTIAL_BADGE_CLASS[badge.kind]} ${className}`}
    >
      {ICON[badge.kind]}
      {variant === "full" ? badge.description : badge.label}
    </span>
  );
};
