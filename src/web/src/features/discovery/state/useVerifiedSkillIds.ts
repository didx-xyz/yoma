import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { UserSkillType } from "~/api/models/user";
import { getUserSkills } from "~/api/services/user";
import { hasSettled } from "../lib/apiStatus";

const NONE: string[] = [];

/**
 * The signed-in youth's VERIFIED skill ids; none when signed out. The user menu's query key and
 * fetcher (`components/NavBar/UserMenu.tsx`), so every reader shares one cache entry: one request
 * a session, never one per card or tile. Read by the inherited skills (`mapPreferencesToFilters`),
 * "Make this my default" and the wizard's skill picker, which shows these as already verified.
 *
 * `settled` once the session is known and, signed in, the query has answered or failed once —
 * the search waits for it, so its first request is not replaced a moment later.
 */
export function useVerifiedSkillIds(): { ids: string[]; settled: boolean } {
  const { status } = useSession();
  const query = useQuery({
    queryKey: ["User", "Skills", UserSkillType.Verified],
    queryFn: () => getUserSkills(UserSkillType.Verified),
    enabled: status === "authenticated",
  });
  const { data } = query;
  const ids = useMemo(
    () =>
      status === "authenticated" && data ? data.map((skill) => skill.id) : NONE,
    [status, data],
  );
  return {
    ids,
    settled:
      status === "unauthenticated" ||
      (status === "authenticated" && hasSettled(query)),
  };
}
