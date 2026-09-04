import type { IconType } from "react-icons";
import {
  IoBookOutline,
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoHeartOutline,
  IoStarOutline,
} from "react-icons/io5";
import type { PreferenceKey } from "../lib/types";

/**
 * The personalization wizard (YOM-1261), as data. Six steps cover the seven editable
 * preferences; `<StepBlock kind=…>` is the single kind→control switch. Adding a preference is a
 * data change here — no new JSX. Entries with `comingSoon` render a badge and are NOT selectable;
 * that is the reusable pattern for anything the BA has not settled (visible and inert beats
 * quietly missing).
 */

export type StepBlockKind =
  | "cards"
  | "chips"
  | "rows"
  | "pills"
  | "toggle"
  | "lookupSearch"
  | "readonly";

export type PreferenceOptionsSource =
  | "categories"
  | "skills"
  | "commitmentIntervals"
  | "engagementTypes"
  | "languages";

export interface StepBlockEntry {
  id: string;
  label: string;
  icon?: IconType;
  /** Right-hand caption (readonly identity rows: what the field maps to). */
  caption?: string;
  comingSoon?: boolean;
}

export interface StepBlockDef {
  kind: StepBlockKind;
  /** The preference this block edits; `null` only for the readonly identity block. */
  prefKey: PreferenceKey | null;
  heading: string | null;
  /** Stated caveat — null rules, proposed/unconfirmed markers, opt-in warnings. */
  note: string | null;
  /** Lookup-fed options, or… */
  optionsSource: PreferenceOptionsSource | null;
  /** …static entries (goal cards, pay pills, readonly rows). */
  entries: StepBlockEntry[] | null;
}

export interface PreferenceStepDef {
  id: string;
  title: string;
  subheading: string;
  infoNote: string | null;
  blocks: StepBlockDef[];
}

const PROPOSED = "Proposed — awaiting BA sign-off (YOM-1264).";

export const PREFERENCE_STEPS: PreferenceStepDef[] = [
  {
    id: "goal",
    title: "What brings you to Yoma?",
    subheading:
      "One choice only — it sets the shape of your feed, and you can change it any time.",
    infoNote:
      "Attend events is new — it closes a gap where Events were reachable from no goal at all. Start a business is shown but marked coming soon: it is the one goal with no agreed filter mapping yet, so it stays visible and inert rather than quietly missing.",
    blocks: [
      {
        kind: "cards",
        prefKey: "goal",
        heading: null,
        note: null,
        optionsSource: null,
        entries: [
          { id: "job", label: "Get a job", icon: IoBriefcaseOutline },
          { id: "learn", label: "Learn new skills", icon: IoBookOutline },
          { id: "event", label: "Attend events", icon: IoCalendarOutline },
          {
            id: "impact",
            label: "Volunteer & give back",
            icon: IoHeartOutline,
          },
          {
            id: "biz",
            label: "Start a business",
            icon: IoStarOutline,
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: "interests",
    title: "What are you interested in?",
    subheading:
      "Pick as many as you like — these shape which categories lead your feed.",
    infoNote: null,
    blocks: [
      {
        kind: "chips",
        prefKey: "targetCategories",
        heading: null,
        note: null,
        optionsSource: "categories",
        entries: null,
      },
    ],
  },
  {
    id: "skills",
    title: "What skills do you have?",
    subheading:
      "Search and add skills — verified skills from your YoID count automatically.",
    infoNote: null,
    blocks: [
      {
        kind: "lookupSearch",
        prefKey: "skills",
        heading: null,
        note: "Only jobs are matched on required skills; learning and volunteering award skills instead.",
        optionsSource: "skills",
        entries: null,
      },
    ],
  },
  {
    id: "time-format",
    title: "How much time do you have?",
    subheading: "A ceiling, not a target — and how you'd like to take part.",
    infoNote: null,
    blocks: [
      {
        kind: "pills",
        prefKey: "maxCommitment",
        heading: "Time commitment",
        // Matches the section's null rule: the API's interval filter EXCLUDES unset commitments.
        note: "Opportunities that don't state a time commitment are excluded by this.",
        optionsSource: "commitmentIntervals",
        entries: null,
      },
      {
        kind: "pills",
        prefKey: "engagement",
        heading: "How you take part",
        note: PROPOSED,
        optionsSource: "engagementTypes",
        entries: null,
      },
    ],
  },
  // Pay was removed as a stored preference (2026-08-31 revision §4) — it stays a session filter.
  {
    id: "language",
    title: "What languages work for you?",
    subheading: "The languages you're comfortable working in.",
    infoNote: null,
    blocks: [
      {
        kind: "chips",
        prefKey: "languages",
        heading: "Language",
        note: PROPOSED,
        optionsSource: "languages",
        entries: null,
      },
    ],
  },
  {
    id: "accessibility-identity",
    title: "Anything we should accommodate?",
    subheading: "Opt-in, private to Yoma, and never shared with anyone.",
    infoNote: null,
    blocks: [
      {
        kind: "toggle",
        prefKey: "accessibility",
        heading: "Accessibility",
        note: "Turning this on will exclude opportunities that haven't described their accommodations. It is never shared outside Yoma — not with partners, not in credentials, not in analytics.",
        optionsSource: null,
        entries: null,
      },
      {
        kind: "readonly",
        prefKey: null,
        heading: "From your profile — read, never changed here",
        note: "These are used to shape your feed and are never written by this dialog.",
        optionsSource: null,
        entries: [
          {
            id: "country",
            label: "Country",
            caption: "Maps to: location country",
          },
          {
            id: "dateOfBirth",
            label: "Date of birth",
            caption: "Maps to: age range",
          },
          {
            id: "gender",
            label: "Gender",
            caption: "Ranking only — never a filter",
          },
          {
            id: "education",
            label: "Education",
            caption: "No filter yet — deferred to the AI project",
          },
        ],
      },
    ],
  },
];
