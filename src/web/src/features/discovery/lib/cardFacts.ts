import {
  AccessibilitySupport,
  type CustomFieldDefinition,
  type OpportunityInfo,
} from "~/api/models/opportunity";
import { formatAccessibilitySupport } from "~/components/Opportunity/Admin/opportunityCoreFields";
import { ENTREPRENEURSHIP_PROGRAMME_OPTIONS } from "~/lib/customFields/customFieldRules";
import { calendarDaysUntil } from "./dates";

/**
 * The card's priority facts (round 7, artboard 9a): ONE place decides them, like `money.ts`
 * decides the pay line and `cardStatus.ts` the status row.
 *
 * Per type, in priority order, from the brief's table, minus what the card already shows in its
 * own slots (money beside the type chip, place and engagement on the org line, places left and
 * the end date in the status row, Featured and Ending soon in the band). Up to FOUR (Jason,
 * 2026-10-07): the first four candidates whose rule holds; an empty one hands its slot on. Every
 * type ends with `languages · skills` (2026-10-08, Jason), so most cards fill the 2 × 2 grid;
 * they are left out of the lines below.
 *
 *   Job       employment · date · effort · a11y*   (qualification is left out:
 *                                                  `jobMinimumQualification` is not a
 *                                                  system-controlled key — the reason "No
 *                                                  experience needed" is parked too)
 *   Learning  effort · difficulty · date · a11y*
 *   Impact    tools · effort · date · a11y* · difficulty
 *   Event     date · accessibility · effort · difficulty
 *   Entrepreneurship  programme · effort · date · a11y*   (programme only: the venture stage
 *                                                         targeted is not a system-controlled
 *                                                         key either)
 *   Other     effort · date · a11y* · difficulty
 *
 * The rules (2026-10-07 card facts spec): the start date only while it is today or later (a past
 * start tells the youth nothing they can act on; the end date is the status row's). `a11y*` is
 * the accessibility fact only while accessibility is part of this search (`accessibilityInSearch`:
 * the surface's effective accommodations, inherited or picked); an Event names its accessibility
 * whenever it says something. It names the opportunity's accommodations, never the youth's needs.
 * The languages are the opportunity's ("English, French +1"); the skills count what a verified
 * completion adds to the youth's YoID ("5 skills to earn"), so only while verification is on.
 *
 * Every `text` says what it is ("Permanent", "1 week effort", "Starts tomorrow"), as the card
 * shows no labels; `name` and `value` are the tooltip's two lines, `tip` joins them (the list
 * row's hover title) and `label` is the fact's accessible name.
 *
 * Custom-field facts key ONLY on the API's protected keys (`CustomFieldConstants`), and label
 * option keys through the loaded definitions — a key the definitions no longer carry simply
 * yields no fact. Empty facts are skipped; payload data only, nothing fetched per card.
 */
export type CardFactKind =
  | "employment"
  | "effort"
  | "difficulty"
  | "tools"
  | "date"
  | "accessibility"
  | "programme"
  | "languages"
  | "skills";

export interface CardFact {
  kind: CardFactKind;
  text: string;
  /** The tooltip's first line: "Start date". */
  name: string;
  /** The tooltip's second line, the whole value the card may truncate: "Fri 9 Oct". */
  value: string;
  /** "Start date: Fri 9 Oct" — the name, then the value. */
  tip: string;
  /**
   * The fact button's accessible name, leading with the visible text so a voice command that
   * names it finds it (WCAG 2.5.3): "Starts Fri (Start date: Fri 9 Oct)".
   */
  label: string;
}

/** Every type's last candidates: they fill the slots its own facts leave (2026-10-08). */
const FILLERS: CardFactKind[] = ["languages", "skills"];

const PRIORITY: Record<string, CardFactKind[]> = {
  Job: ["employment", "date", "effort", "accessibility", ...FILLERS],
  Learning: ["effort", "difficulty", "date", "accessibility", ...FILLERS],
  ImpactAction: [
    "tools",
    "effort",
    "date",
    "accessibility",
    "difficulty",
    ...FILLERS,
  ],
  Event: ["date", "accessibility", "effort", "difficulty", ...FILLERS],
  Entrepreneurship: [
    "programme",
    "effort",
    "date",
    "accessibility",
    ...FILLERS,
  ],
  Other: ["effort", "date", "accessibility", "difficulty", ...FILLERS],
};

/** Types whose accessibility is a fact whenever the opportunity states it, search or not. */
const ACCESSIBILITY_ALWAYS = ["Event"];

const NAMES: Record<CardFactKind, string> = {
  employment: "Employment type",
  effort: "Time commitment",
  difficulty: "Difficulty",
  tools: "Tools needed",
  date: "Start date",
  accessibility: "Accessibility",
  programme: "Programme",
  languages: "Languages",
  skills: "Skills you earn",
};

/** Mirrors `CustomFieldConstants` (API) — persisted contracts, never rename. */
const KEYS = {
  employmentType: "jobEmploymentType",
  employmentDuration: "jobEmploymentDuration",
  employmentDurationUnit: "jobEmploymentDurationUnit",
  toolsRequired: "impactActionToolsRequired",
  programmeType: "entrepreneurshipProgrammeType",
  programmeOtherDescription: "entrepreneurshipProgrammeOtherDescription",
  difficulty: {
    Learning: "learningDifficulty",
    ImpactAction: "impactActionDifficulty",
    Event: "eventDifficulty",
    Other: "otherDifficulty",
  } as Record<string, string>,
} as const;

const MAX_FACTS = 4;

/** "Wed 7 Oct"; with the year ("Wed 6 Jan 2027") when it is not this year. */
export const fullDate = (date: Date, now: Date): string => {
  const label = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    // dates are calendar days stored in UTC — label them in UTC (see dates.ts)
    timeZone: "UTC",
  });
  // Appended, not `year: "numeric"`, which en-GB writes with a comma ("Wed, 6 Jan 2027").
  const year = date.getUTCFullYear();
  return year === now.getFullYear() ? label : `${label} ${year}`;
};

/** "Starts today" · "Starts tomorrow" · "Starts Fri" within the week · "Starts 14 Nov". */
export const startsText = (start: Date, days: number): string => {
  if (days === 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  const label = start.toLocaleDateString("en-GB", {
    ...(days <= 6
      ? { weekday: "short" as const }
      : { day: "numeric" as const, month: "short" as const }),
    timeZone: "UTC",
  });
  return `Starts ${label}`;
};

/** "Camera, Hand tools +2" — the first two names, the rest as a count. */
const firstTwo = (names: string[]): string =>
  names.length > 2
    ? `${names.slice(0, 2).join(", ")} +${names.length - 2}`
    : names.join(", ");

/** What the card shows, and the whole value the tooltip names. */
interface Built {
  text: string;
  value: string;
}

const same = (value: string): Built => ({ text: value, value });

export function cardFacts(
  opportunity: OpportunityInfo,
  definitions: CustomFieldDefinition[],
  now: Date,
  /**
   * Accessibility is part of this search: the surface's effective `accommodations` (inherited
   * needs or picked by hand) are non-empty. Context already on the page, never a request.
   */
  accessibilityInSearch: boolean,
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

  const build = (kind: CardFactKind): Built | null => {
    switch (kind) {
      case "employment": {
        // The type names alone ("Permanent"): "Permanent employment" truncated at 390 (2026-10-07).
        const types = optionNames(KEYS.employmentType).join(", ");
        const count = field(KEYS.employmentDuration)?.value;
        const unit = optionNames(KEYS.employmentDurationUnit)[0];
        const duration =
          count && unit ? `${count} ${unit.toLowerCase()}` : null;
        const text = [types, duration].filter(Boolean).join(" · ");
        return text ? same(text) : null;
      }
      case "effort": {
        const effort = opportunity.commitmentIntervalDescription;
        return effort
          ? { text: `${effort.toLowerCase()} effort`, value: effort }
          : null;
      }
      case "difficulty": {
        const key = KEYS.difficulty[opportunity.type];
        // The level's own name: the options already read as levels ("Any level", "Open to
        // all", "Beginner"), so a "level" suffix doubled up ("Any level level").
        const level = key ? optionNames(key)[0] : undefined;
        return level ? same(level) : null;
      }
      case "programme": {
        // "Other" carries its own name in the description (`customFieldRules.ts` pairs them)
        const other = (field(KEYS.programmeType)?.values ?? []).includes(
          ENTREPRENEURSHIP_PROGRAMME_OPTIONS.Other,
        );
        const description = field(KEYS.programmeOtherDescription)?.value;
        // The options are programme names ("BeGreen", "JA Company Programme"), so they get the
        // word as a prefix.
        const name =
          other && description
            ? description
            : optionNames(KEYS.programmeType)[0];
        return name ? { text: `Programme: ${name}`, value: name } : null;
      }
      case "tools": {
        const names = optionNames(KEYS.toolsRequired);
        return names.length > 0
          ? { text: `Tools: ${firstTwo(names)}`, value: names.join(", ") }
          : null;
      }
      case "date": {
        if (!opportunity.dateStart) return null;
        const start = new Date(opportunity.dateStart);
        const days = calendarDaysUntil(start, now);
        // A start that has passed is not something to act on: no fact, the next one moves up.
        if (days < 0) return null;
        return { text: startsText(start, days), value: fullDate(start, now) };
      }
      case "languages": {
        const names = (opportunity.languages ?? []).map((l) => l.name);
        return names.length > 0
          ? { text: firstTwo(names), value: names.join(", ") }
          : null;
      }
      case "skills": {
        const names = (opportunity.skills ?? []).map((skill) => skill.name);
        return opportunity.verificationEnabled && names.length > 0
          ? {
              text: `${names.length} skill${names.length === 1 ? "" : "s"} to earn`,
              value: names.join(", "),
            }
          : null;
      }
      case "accessibility": {
        if (
          !accessibilityInSearch &&
          !ACCESSIBILITY_ALWAYS.includes(opportunity.type)
        )
          return null;
        const accommodations = (opportunity.accommodations ?? []).map(
          (a) => a.name,
        );
        // An on-request list is what the provider can arrange, not an offer: the bare names
        // read as one (2026-10-03).
        if (accommodations.length > 0) {
          const onRequest =
            opportunity.accessibilitySupport ===
            AccessibilitySupport.AvailableOnRequest;
          return {
            text: `${onRequest ? "On request" : "Accessibility"}: ${firstTwo(accommodations)}`,
            value: `${onRequest ? "On request: " : ""}${accommodations.join(", ")}`,
          };
        }
        const support = formatAccessibilitySupport(
          opportunity.accessibilitySupport,
        );
        // The tooltip already names the fact: its value is the support alone ("Yes").
        return support && opportunity.accessibilitySupport !== "No"
          ? { text: `Accessibility: ${support}`, value: support }
          : null;
      }
    }
  };

  return (PRIORITY[opportunity.type] ?? [])
    .flatMap((kind): CardFact[] => {
      const built = build(kind);
      return built
        ? [
            {
              kind,
              text: built.text,
              name: NAMES[kind],
              value: built.value,
              tip: `${NAMES[kind]}: ${built.value}`,
              label: `${built.text} (${NAMES[kind]}: ${built.value})`,
            },
          ]
        : [];
    })
    .slice(0, MAX_FACTS);
}
