import type {
  CustomFieldDefinition,
  OpportunityInfo,
} from "~/api/models/opportunity";
import { formatAccessibilitySupport } from "~/components/Opportunity/Admin/opportunityCoreFields";

/**
 * The card's "up to two priority facts" (round 7, artboard 9a) — ONE place decides them, like
 * `money.ts` decides the pay line and `cardStatus.ts` the status row.
 *
 * Per type, in priority order, from the brief's table — minus what the card already shows in its
 * own slots (money beside the type chip, place on the org line, places in the status row):
 *
 *   Job       employment          (qualification is left out: \`jobMinimumQualification\` is not a
 *                                  system-controlled key — the reason "No experience needed" is
 *                                  parked too)
 *   Learning  effort · difficulty
 *   Impact    tools · effort
 *   Event     date · accessibility
 *   Other     effort
 *
 * Custom-field facts key ONLY on the API's protected keys (\`CustomFieldConstants\`), and label
 * option keys through the loaded definitions — a key the definitions no longer carry simply
 * yields no fact. Empty facts are skipped; payload data only, nothing fetched per card.
 */
export type CardFactKind =
  | "employment"
  | "effort"
  | "difficulty"
  | "tools"
  | "date"
  | "accessibility";

export interface CardFact {
  kind: CardFactKind;
  text: string;
}

const PRIORITY: Record<string, CardFactKind[]> = {
  Job: ["employment"],
  Learning: ["effort", "difficulty"],
  ImpactAction: ["tools", "effort"],
  Event: ["date", "accessibility"],
  Other: ["effort"],
};

/** Mirrors `CustomFieldConstants` (API) — persisted contracts, never rename. */
const KEYS = {
  employmentType: "jobEmploymentType",
  employmentDuration: "jobEmploymentDuration",
  employmentDurationUnit: "jobEmploymentDurationUnit",
  toolsRequired: "impactActionToolsRequired",
  difficulty: {
    Learning: "learningDifficulty",
    ImpactAction: "impactActionDifficulty",
    Event: "eventDifficulty",
    Other: "otherDifficulty",
  } as Record<string, string>,
} as const;

const MAX_FACTS = 2;

/** "Camera, Hand tools +2" — the first two names, the rest as a count. */
const firstTwo = (names: string[]): string =>
  names.length > 2
    ? `${names.slice(0, 2).join(", ")} +${names.length - 2}`
    : names.join(", ");

export function cardFacts(
  opportunity: OpportunityInfo,
  definitions: CustomFieldDefinition[],
): CardFact[] {
  const fields = opportunity.customFields ?? [];
  const field = (key: string) =>
    fields.find((f) => f.key.toLowerCase() === key.toLowerCase());
  const optionNames = (key: string): string[] => {
    const definition = definitions.find(
      (d) => d.key.toLowerCase() === key.toLowerCase(),
    );
    if (!definition) return [];
    return (field(key)?.values ?? []).flatMap(
      (value) => definition.options?.find((o) => o.key === value)?.name ?? [],
    );
  };

  const build = (kind: CardFactKind): string | null => {
    switch (kind) {
      case "employment": {
        const types = optionNames(KEYS.employmentType);
        const count = field(KEYS.employmentDuration)?.value;
        const unit = optionNames(KEYS.employmentDurationUnit)[0];
        const duration =
          count && unit ? `${count} ${unit.toLowerCase()}` : null;
        return [types.join(", "), duration].filter(Boolean).join(" · ") || null;
      }
      case "effort":
        return opportunity.commitmentIntervalDescription || null;
      case "difficulty": {
        const key = KEYS.difficulty[opportunity.type];
        return key ? (optionNames(key)[0] ?? null) : null;
      }
      case "tools": {
        const names = optionNames(KEYS.toolsRequired);
        return names.length > 0 ? firstTwo(names) : null;
      }
      case "date":
        return opportunity.dateStart
          ? new Date(opportunity.dateStart).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              // dates are calendar days stored in UTC — label them in UTC (see dates.ts)
              timeZone: "UTC",
            })
          : null;
      case "accessibility": {
        const accommodations = (opportunity.accommodations ?? []).map(
          (a) => a.name,
        );
        if (accommodations.length > 0) return firstTwo(accommodations);
        const support = formatAccessibilitySupport(
          opportunity.accessibilitySupport,
        );
        return support && opportunity.accessibilitySupport !== "No"
          ? `Accessibility: ${support}`
          : null;
      }
    }
  };

  return (PRIORITY[opportunity.type] ?? [])
    .flatMap((kind): CardFact[] => {
      const text = build(kind);
      return text ? [{ kind, text }] : [];
    })
    .slice(0, MAX_FACTS);
}
