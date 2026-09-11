import { useAtomValue } from "jotai";
import Link from "next/link";
import React from "react";
import { IoAlbumsOutline } from "react-icons/io5";
import { userProfileAtom } from "~/lib/store";

/**
 * Route back to the youth's in-progress opportunities — a LINK to the existing YoID surface
 * (`/yoid/opportunities/pending`), never a rebuild of it. The count badge is the profile's
 * `opportunityCountPending`, which is already loaded with the profile — no extra request.
 * Signed-out visitors have no in-progress list, so the link renders only with a profile.
 */
export const MyOpportunitiesLink: React.FC = () => {
  const profile = useAtomValue(userProfileAtom);
  if (!profile) return null;

  return (
    <Link
      href="/yoid/opportunities/pending"
      className="text-purple flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold md:text-sm"
    >
      <IoAlbumsOutline className="h-4 w-4" />
      <span className="hidden sm:inline">My opportunities</span>
      {profile.opportunityCountPending > 0 && (
        <span className="bg-purple flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs text-white">
          {profile.opportunityCountPending}
        </span>
      )}
    </Link>
  );
};
