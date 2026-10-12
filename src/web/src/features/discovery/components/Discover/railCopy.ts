import type { UserGoal } from "~/api/models/userPreferences";
import type { ChipSummary } from "../../lib/chipModel";
import { tunedToText as chipsTunedToText } from "../../lib/chipModel";
import type { LandingRail, RailPlace } from "../../lib/landingRails";

/**
 * A landing rail's title and subtitle (2026-10-07 cards and rails spec, §4 copy table). One rail
 * kind, one line each; the place under a rail closes its subtitle (", near Cape Town").
 *
 * Names keep their own case: a lookup name is never lowercased (it produced "ai").
 */
export interface RailCopy {
  title: string;
  subtitle: string;
}

/** The most specific place a rail names: "near Cape Town" · "in Western Cape" · "in South Africa". */
export const railPlaceText = (place: RailPlace | null): string | null => {
  if (!place) return null;
  if (place.city) return `near ${place.city}`;
  if (place.region) return `in ${place.region}`;
  if (place.countryName) return `in ${place.countryName}`;
  return null;
};

const GOAL_COPY: Record<UserGoal, { title: string; because: string }> = {
  job: { title: "Jobs for you", because: "Because you want to get a job" },
  learn: {
    title: "Learning for you",
    because: "Because you want to learn new skills",
  },
  event: {
    title: "Events for you",
    because: "Because you want to attend events",
  },
  impact: {
    title: "Impact actions for you",
    because: "Because you want to volunteer and give back",
  },
  biz: {
    title: "Programmes to start a business",
    because: "Because you want to start a business",
  },
};

/** Picked for you names its first two values, as the preference banner does. */
const TUNED_TO_SHOWN = 2;

/**
 * Picked for you's "tuned to" values, worded exactly as the preference banner words them, so the
 * two never disagree: the first two nameable ones, then every other value as one count ("Job ·
 * Technology, AI & Data +7 others"). `""` when nothing may be named. The values are the chips'
 * own, case and all.
 */
export const tunedToText = (summary: ChipSummary): string =>
  chipsTunedToText(summary, TUNED_TO_SHOWN);

/** "Up to a month" → "up to a month", after "Fits in". */
const lowerFirst = (text: string): string =>
  text.charAt(0).toLowerCase() + text.slice(1);

/**
 * `tunedTo` is Picked for you's: `tunedToText` of the inherited values ("Job · Technology, AI &
 * Data +7 others"); `""` when none may be named (a private or unnamed value).
 */
export function railCopy(rail: LandingRail, tunedTo: string): RailCopy {
  const placeText = railPlaceText(rail.place);
  /** The subtitle, with the place after a comma when there is one. */
  const onPlace = (text: string): string =>
    placeText ? `${text}, ${placeText}` : text;

  switch (rail.kind) {
    case "picked":
      return {
        title: "Picked for you",
        subtitle: tunedTo
          ? `Based on your choices: ${tunedTo}`
          : "Because of your preferences",
      };
    case "near":
      return {
        title: placeText ? `Opportunities ${placeText}` : "Opportunities",
        subtitle: "Every type, close to where you are",
      };
    case "goal":
      return {
        title: GOAL_COPY[rail.goal].title,
        subtitle: onPlace(GOAL_COPY[rail.goal].because),
      };
    case "category":
      return {
        title: rail.category.name,
        subtitle: onPlace("One of your interests"),
      };
    case "commitment":
      return {
        title: rail.intervalLabel
          ? `Fits in ${lowerFirst(rail.intervalLabel)}`
          : "Fits your time",
        subtitle: onPlace("Fits the time you said you have"),
      };
    case "under-an-hour":
      return {
        title: "Done in under an hour",
        subtitle: onPlace("Quick wins that fit into your day"),
      };
    case "paid":
      return {
        title: "Paid opportunities",
        subtitle: onPlace("Paid or rewarded"),
      };
    case "featured":
      return {
        title: "Featured",
        subtitle: onPlace("Hand-picked by the Yoma team"),
      };
    case "latest":
      return {
        title: "Latest opportunities",
        subtitle: "Newest start dates first",
      };
  }
}
