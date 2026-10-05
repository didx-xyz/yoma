import type { IconType } from "react-icons";
import {
  IoBookOutline,
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoHeartOutline,
  IoRocketOutline,
} from "react-icons/io5";
import type { PreferenceKey } from "../lib/types";

/**
 * The personalization wizard (YOM-1261), as data. Six steps cover the nine editable
 * preferences; `<StepBlock kind=…>` is the single kind→control switch. Adding a preference is a
 * data change here — no new JSX. Entries with `comingSoon` render a badge and are NOT selectable;
 * that is the reusable pattern for anything the BA has not settled (visible and inert beats
 * quietly missing). No entry carries it today — "Start a business" was the last, and the BA
 * mapping landed on 2026-09-22.
 */

export type StepBlockKind =
  | "cards"
  | "chips"
  | "rows"
  | "pills"
  | "lookupSearch"
  | "readonly"
  /** Country (anonymous) or the profile country (signed-in), then region / city. */
  | "location"
  /** Accessibility requirements, plus the description the API requires with "Other". */
  | "accessibility";

export type PreferenceOptionsSource =
  | "categories"
  | "skills"
  | "commitmentIntervals"
  | "engagementTypes"
  | "languages"
  | "accessibility";

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
  /** A boxed note under the step's blocks — for rules the youth needs, never design rationale. */
  infoNote: string | null;
  blocks: StepBlockDef[];
}

export const PREFERENCE_STEPS: PreferenceStepDef[] = [
  // Goal mapping per the BA sheet (2026-09-22): Get a job → Job · Learn new skills → Learning ·
  // Volunteer → Impact Action · Start a business → Category "Business, Finance & Marketing".
  // The ids are web keys; the saved goal is the `/user/goal` lookup entry of the same name.
  // "Attend events" is a design proposal still awaiting BA confirmation (it closes the gap where
  // Events were reachable from no goal) — kept selectable, recorded in the feature doc.
  {
    id: "goal",
    title: "What brings you to Yoma?",
    subheading:
      "One choice only — it sets the shape of your feed, and you can change it any time.",
    infoNote: null,
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
          { id: "biz", label: "Start a business", icon: IoRocketOutline },
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
        // The saved skills narrow Jobs only, inclusively (2026-10-03, `searchRequest.ts`).
        note: "Your skills narrow jobs only: a job that asks for none of them is hidden, and one that lists no skills stays in.",
        optionsSource: "skills",
        entries: null,
      },
    ],
  },
  {
    id: "time-format",
    title: "How much time do you have?",
    subheading:
      "The most time you can give, and the ways you'd like to take part.",
    infoNote: null,
    blocks: [
      {
        kind: "pills",
        prefKey: "maxCommitment",
        heading: "How long", // matches the filter section's name
        // Matches the section's null rule: a maximum keeps opportunities with no commitment set
        // (the revised search contract, 2026-10-03).
        note: "Ones with no time commitment stay in your feed.",
        optionsSource: "commitmentIntervals",
        entries: null,
      },
      // Multi-select since 2026-10-03: the API stores a list (`engagementTypes`). Inherited, the
      // opportunities that don't say stay in. The note's first sentence is the multi-select cue.
      {
        kind: "pills",
        prefKey: "engagement",
        heading: "How you take part",
        note: "Pick any that suit you. Ones that don't say how you take part stay in your feed.",
        optionsSource: "engagementTypes",
        entries: null,
      },
      // The API's `incentivized` preference (2026-09-28) — the BA's Paid Work Preference, back as
      // a stored preference. Any incentive counts: pay, ZLTO or another reward.
      {
        kind: "pills",
        prefKey: "incentivized",
        heading: "Pay or rewards",
        note: "Leave both off if it doesn't matter. Ones with no incentive specified stay in, after the ones that match.",
        optionsSource: null,
        entries: [
          { id: "yes", label: "Paid or rewarded" },
          { id: "no", label: "Unpaid" },
        ],
      },
    ],
  },
  {
    id: "language",
    title: "Where are you, and what languages work for you?",
    subheading:
      "Where you're based, and the languages you're comfortable working in.",
    infoNote: null,
    blocks: [
      // Step 5, above Languages, rather than a step of its own (Jason, 2026-09-28: keep the
      // steps to a minimum; moved here from under Engagement the same day). The profile country
      // moved here from the read-only identity block.
      {
        kind: "location",
        prefKey: "location",
        heading: "Where you are",
        note: null,
        optionsSource: null,
        entries: null,
      },
      {
        kind: "chips",
        prefKey: "languages",
        heading: "Language",
        note: null,
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
      // The API's accessibility requirements (2026-09-28): the shared accessibility list, plus a
      // description when Other is picked. Inherited since 2026-10-03, inclusively: opportunities
      // that haven't described their accommodations stay in, an explicit No or a list missing a
      // need never does (`preferenceMapping.ts`). Other and its description are never searched.
      {
        kind: "accessibility",
        prefKey: "accessibility",
        heading: "Accessibility",
        note: "Opportunities that say No, or whose list misses something you pick, are hidden from your feed. Ones that haven't said stay in. Your needs are never shared outside Yoma — not with partners, not in credentials, not in analytics.",
        optionsSource: "accessibility",
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
            id: "dateOfBirth",
            label: "Date of birth",
            caption:
              "Maps to: your age — shows opportunities open to it; you can switch it off per search",
          },
          {
            id: "gender",
            label: "Gender",
            caption: "Ranking only — privacy sign-off pending",
          },
          {
            id: "education",
            label: "Education",
            caption: "No filter",
          },
        ],
      },
    ],
  },
];
