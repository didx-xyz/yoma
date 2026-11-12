import Image from "next/image";
import Moment from "react-moment";
import type { SSICredentialInfo } from "~/api/models/credential";
import { CredentialStatusBadge } from "~/components/Credentials/CredentialStatusBadge";
import {
  CARD_ACTION_CLASS,
  CARD_BAND_CLASS,
  CARD_CHIP_CLASS,
  CARD_LOGO_CLASS,
  CARD_TITLE_CLASS,
} from "~/lib/card";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { typeBadgeClass, typeBandClass } from "~/lib/typeColours";

// ─────────────────────────────────────────────────────────────────────────────
// CredentialCard (YOM-1283)
//
// A passport credential card in the discovery card's language
// (`features/discovery/components/Results/OpportunityCard.tsx`, which takes precedence): the
// issuer logo on the type's tinted band, the type chip, title and issuer in reserved slots, and
// the type-coloured action at the foot — its only control, as on the discovery card.
//
// The type comes only from the API: `schemaType` for the YoID family, `typeContext` for an
// Opportunity's type (YOM-1277), resolved once per group by `credentialTypeKey`; a credential
// with neither is Other. Colours are the type palette shared with discovery and the YoID
// opportunity cards (`lib/typeColours.ts`).
//
// The status pill (YOM-1310) is bound to the API's `verificationStatus` / `status` — it was a
// fixed "Verified" before PR #2028 exposed them. Revoked or expired copies stay on the list
// (the API keeps them until cleanup) and read "Invalid"; an older API or an unresolved status
// reads "Unverified". The article is keyed and addressed by the credential's own id, so a
// revoked YoID and its issued replacement can sit side by side.
// ─────────────────────────────────────────────────────────────────────────────

export const CredentialCard: React.FC<{
  credential: SSICredentialInfo;
  /** The credential's palette key (`credentialTypeKey`). */
  typeKey: string;
  label: string;
  onOpen: (credential: SSICredentialInfo) => void;
}> = ({ credential, typeKey, label, onOpen }) => (
  <article
    data-credential-id={credential.id}
    className="shadow-custom flex h-full flex-col rounded-xl bg-white"
  >
    <div
      className={`${CARD_BAND_CLASS} rounded-t-xl ${typeBandClass(typeKey)}`}
    >
      {credential.issuerLogoURL && (
        // Unoptimized: the logo URL is whatever was signed at issuance, so its host need not be
        // one `next.config` allows.
        <Image
          src={credential.issuerLogoURL}
          alt=""
          width={48}
          height={48}
          unoptimized
          className={CARD_LOGO_CLASS}
        />
      )}
    </div>

    <div className="flex grow flex-col gap-1.5 p-3">
      <div className="flex h-5 shrink-0 items-center justify-between gap-2">
        <span className={`${CARD_CHIP_CLASS} ${typeBadgeClass(typeKey)}`}>
          {label}
        </span>
        <CredentialStatusBadge credential={credential} />
      </div>
      <h3 className={CARD_TITLE_CLASS}>{credential.title}</h3>
      <p className="h-4 truncate text-xs leading-4 font-semibold text-black">
        {credential.issuer}
      </p>
      <p className="text-gray-dark h-4 text-xs leading-4">
        {credential.dateIssued && (
          <>
            Issued{" "}
            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
              {credential.dateIssued}
            </Moment>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={() => onOpen(credential)}
        className={`${CARD_ACTION_CLASS} mt-auto shrink-0 ${typeBadgeClass(typeKey)}`}
      >
        View credential
      </button>
    </div>
  </article>
);
