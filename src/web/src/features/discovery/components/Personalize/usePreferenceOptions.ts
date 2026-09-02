import { useQuery } from "@tanstack/react-query";
import { getEducations, getGenders, getSkills } from "~/api/services/lookups";
import type { PreferenceOptionsSource } from "../../registry/preferenceSteps";
import { useDiscovery } from "../../state/DiscoveryContext";

/**
 * Resolves a preference block's `optionsSource` to `{id, label}` options from the discovery
 * lookups — the single place wizard blocks bind to data, mirroring `useSectionModel` for filter
 * sections.
 */
export interface PreferenceOption {
  id: string;
  label: string;
}

export function usePreferenceOptions(
  source: PreferenceOptionsSource | null,
): PreferenceOption[] {
  const { lookups } = useDiscovery();
  switch (source) {
    case "categories":
      return lookups.categories.map((c) => ({ id: c.id, label: c.name }));
    case "commitmentIntervals":
      return lookups.timeIntervals.map((i) => ({
        id: i.id,
        label: `Up to a ${i.name.toLowerCase()}`,
      }));
    case "engagementTypes":
      return lookups.engagementTypes.map((e) => ({ id: e.id, label: e.name }));
    case "languages":
      return lookups.languages.map((l) => ({ id: l.id, label: l.name }));
    case "skills": // searched on demand by the lookupSearch block, not listed up front
    case null:
      return [];
  }
}

/** Skill search for the lookupSearch block (EMSI lookup, server-side name filter). */
export function useSkillSearch(text: string): PreferenceOption[] {
  const { data } = useQuery({
    queryKey: ["discovery", "skillSearch", text],
    queryFn: () =>
      getSkills({ nameContains: text, pageNumber: 1, pageSize: 20 }),
    enabled: text.trim().length >= 2,
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
