import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getAccessibilityOptions,
  getEducations,
  getGenders,
  getSkills,
} from "~/api/services/lookups";
import { getCategories } from "~/api/services/opportunities";
import { upToIntervalLabel } from "../../lib/format";
import type { PreferenceOptionsSource } from "../../registry/preferenceSteps";
import { useDiscovery } from "../../state/DiscoveryContext";

/**
 * Resolves a preference block's `optionsSource` to `{id, label}` options — the single place wizard
 * blocks bind to data, mirroring `useSectionModel` for filter sections.
 */
export interface PreferenceOption {
  id: string;
  label: string;
}

/** The API's minimum for a skill name search (`nameContains`, 3–50 characters). */
const SKILL_SEARCH_MIN_CHARS = 3;

/** The full accessibility list (16 values, Other last) — anonymous, shared with opportunities. */
export function useAccessibilityOptions(): { id: string; name: string }[] {
  const { data } = useQuery({
    queryKey: ["discovery", "lookup", "accessibility"],
    queryFn: () => getAccessibilityOptions(),
    staleTime: Infinity,
  });
  return data ?? [];
}

export function usePreferenceOptions(
  source: PreferenceOptionsSource | null,
): PreferenceOption[] {
  const { lookups } = useDiscovery();
  const { status } = useSession();
  // Interests: the FULL category list for a signed-in youth (`/opportunity/category` is
  // authenticated), so a stored interest with no published opportunity today stays visible and
  // deselectable. Anonymous youth get the published list the filters use.
  const { data: allCategories } = useQuery({
    queryKey: ["discovery", "lookup", "allCategories"],
    queryFn: () => getCategories(),
    enabled: source === "categories" && status === "authenticated",
    staleTime: Infinity,
  });
  const accessibility = useAccessibilityOptions();

  switch (source) {
    case "categories":
      return (allCategories ?? lookups.categories).map((c) => ({
        id: c.id,
        label: c.name,
      }));
    case "commitmentIntervals":
      return lookups.timeIntervals.map((i) => ({
        id: i.id,
        label: upToIntervalLabel(i.name),
      }));
    case "engagementTypes":
      return lookups.engagementTypes.map((e) => ({
        id: e.id,
        label: e.displayName || e.name,
      }));
    case "languages":
      return lookups.languages.map((l) => ({ id: l.id, label: l.name }));
    case "accessibility":
      return accessibility.map((a) => ({ id: a.id, label: a.name }));
    case "skills": // searched on demand by the lookupSearch block, not listed up front
    case null:
      return [];
  }
}

/** Skill search for the lookupSearch block (EMSI lookup, server-side name filter). */
export function useSkillSearch(text: string): PreferenceOption[] {
  const needle = text.trim();
  const { data } = useQuery({
    queryKey: ["discovery", "skillSearch", needle],
    queryFn: () =>
      getSkills({ nameContains: needle, pageNumber: 1, pageSize: 20 }),
    enabled: needle.length >= SKILL_SEARCH_MIN_CHARS,
  });
  return (data?.items ?? []).map((s) => ({ id: s.id, label: s.name }));
}

/** Identity lookups for the read-only block — labels only, never written. */
export function useIdentityLookups(): {
  genderName: (id: string | null) => string;
  educationName: (id: string | null) => string;
} {
  const { data: genders } = useQuery({
    queryKey: ["discovery", "lookup", "genders"],
    queryFn: () => getGenders(),
    staleTime: Infinity,
  });
  const { data: educations } = useQuery({
    queryKey: ["discovery", "lookup", "educations"],
    queryFn: () => getEducations(),
    staleTime: Infinity,
  });
  const nameOf =
    (items: { id: string; name: string }[] | undefined) =>
    (id: string | null): string =>
      (id && items?.find((item) => item.id === id)?.name) || "Not set";
  return {
    genderName: nameOf(genders),
    educationName: nameOf(educations),
  };
}
