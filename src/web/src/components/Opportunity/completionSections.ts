// ─────────────────────────────────────────────────────────────────────────────
// The youth completion form's sections (2026-10-21): their order, and the pure rule behind
// each header's status line. The form (`OpportunityCompletionEdit`) counts a section's
// fields from the values react-hook-form already holds and asks here what to show.
// ─────────────────────────────────────────────────────────────────────────────

/** The sections in table order; a section renders only when it applies. */
export const COMPLETION_SECTION_IDS = [
  "completion-proof",
  "completion-details",
  "completion-business",
  "completion-feedback",
] as const;

export type CompletionSectionId = (typeof COMPLETION_SECTION_IDS)[number];

export type CompletionSectionStatus =
  /** Every required field has a value and nothing is invalid. */
  | { kind: "done" }
  /** `count` fields are missing or invalid: "to do" before a submit, "to fix" after one. */
  | { kind: "attention"; count: number; afterSubmit: boolean }
  /** No required fields, nothing given, no errors. */
  | { kind: "optional" };

export interface CompletionSectionCounts {
  /** How many of the section's fields are required. */
  required: number;
  /** How many required fields have a value. */
  requiredGiven: number;
  /** How many fields, required or not, have a value. */
  given: number;
  /** How many fields have an error: a missing required value or an invalid one. */
  errors: number;
}

/**
 * Done: at least one required field and all of them given, with no errors; or, with no required
 * fields, at least one value given. Needs attention: any error or missing required value (the
 * larger of the two counts, so a required field still counts while validation catches up).
 * Otherwise Optional.
 */
export function completionSectionStatus(
  counts: CompletionSectionCounts,
  isSubmitted: boolean,
): CompletionSectionStatus {
  const todo = Math.max(counts.errors, counts.required - counts.requiredGiven);
  if (todo > 0)
    return { kind: "attention", count: todo, afterSubmit: isSubmitted };
  if (counts.required > 0 || counts.given > 0) return { kind: "done" };
  return { kind: "optional" };
}

/**
 * Where an auto-advance goes: the first section after `from`, in table order, that is present
 * and not Done. Null when every later section is Done or absent.
 */
export function nextCompletionSection(
  from: CompletionSectionId,
  statuses: Partial<Record<CompletionSectionId, CompletionSectionStatus>>,
): CompletionSectionId | null {
  const start = COMPLETION_SECTION_IDS.indexOf(from) + 1;
  for (const id of COMPLETION_SECTION_IDS.slice(start)) {
    const status = statuses[id];
    if (status && status.kind !== "done") return id;
  }
  return null;
}
