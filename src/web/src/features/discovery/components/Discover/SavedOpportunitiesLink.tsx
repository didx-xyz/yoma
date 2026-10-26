import { useAtomValue } from "jotai";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { IoHeartOutline } from "react-icons/io5";
import { userProfileAtom } from "~/lib/store";
import { formatNumber } from "../../lib/format";
import { HERO_BONE_CLASS } from "./heroSkeleton";

/**
 * Route to the youth's saved opportunities — a LINK to the existing YoID surface
 * (`/yoid/opportunities/saved`), never a rebuild of it. The count is the profile's
 * `opportunityCountSaved`, already loaded with the profile — no extra request. Signed-out
 * visitors have no saved list, so the link renders only with a profile. The heart is the Saved
 * sub-tab's icon. Below `lg` the label is for screen readers only (heart and count), so the
 * search-bar row fits at 768 (Jason, 2026-10-21, F1/F2).
 *
 * Fixed width (2026-10-22): the profile arrives after first paint (`Global.tsx` fetches it once
 * the session is known), and the pill appearing beside the search bar shrank the bar and reflowed
 * its segments. So the pill is as wide for "Saved 3" as for "Saved 1 234", and while the session
 * is loading — or known and the profile still on its way — a bone of the same size holds the
 * spot. The profile fetch reports failure only as a toast, so the bone gives up after
 * `BONE_TIMEOUT_MS` rather than shimmering for good. Signed out, nothing is reserved.
 */
const BOX =
  "flex min-h-10 w-20 shrink-0 items-center justify-center gap-2 rounded-full text-xs font-semibold md:text-sm lg:w-36";
const BONE_TIMEOUT_MS = 8000;

export const SavedOpportunitiesLink: React.FC = () => {
  const { status } = useSession();
  const profile = useAtomValue(userProfileAtom);
  const pending =
    !profile && (status === "loading" || status === "authenticated");
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setGaveUp(true), BONE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  if (!profile)
    return pending && !gaveUp ? (
      <span aria-hidden className={`${BOX} ${HERO_BONE_CLASS}`} />
    ) : null;

  return (
    <Link
      href="/yoid/opportunities/saved"
      title="Saved opportunities"
      className={`text-purple bg-white ${BOX}`}
    >
      <IoHeartOutline className="h-4 w-4 shrink-0" />
      <span className="max-lg:sr-only">Saved</span>
      {profile.opportunityCountSaved > 0 && (
        <span className="bg-purple flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs text-white tabular-nums">
          {formatNumber(profile.opportunityCountSaved)}
        </span>
      )}
    </Link>
  );
};
