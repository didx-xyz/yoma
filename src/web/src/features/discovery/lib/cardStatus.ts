import type { OpportunityInfo } from "~/api/models/opportunity";
import { Status } from "~/api/models/opportunity";
import { OPPORTUNITY_TYPE_NANE_JOB } from "~/lib/constants";
import type { ClosingInfo } from "./dates";
import { closingInfo } from "./dates";
import { formatNumber } from "./format";

/**
 * Card status — ONE rule for the grid card and the compact row (2026-09-22).
 *
 * The search API returns an opportunity as long as its status is Active and it has started; it
 * does not look at the end date, which the expiry job applies later. So the surface can see an
 * opportunity that is Active by status but past its end date — on seeded fixtures (local, DEV)
 * that is every item, because they share one fixed end date. Trusting the end date is right:
 * a youth cannot apply to something that has closed. What was wrong was saying "Closed" and
 * "N of N places left" in the same breath, so:
 *
 *   closed  = status is not Active, OR the end date has passed  → "Closed", no places shown
 *   full    = the participant limit is reached                  → "No places left"
 *   open    = the closing label from `closingInfo`, and "X places left" when a limit exists
 *             ("1 place left"; the limit itself went on 2026-10-07 — "160 of 160" said it twice)
 *
 * A Job counts "positions", not "places" (BA R19, 2026-10-21): "3 positions left",
 * "No positions left". `placesNoun` is that word, for every surface that counts them (the
 * detail page's Places badge too); `full` carries the state itself, so nothing reads the wording.
 *
 * `status` arrives as the enum NAME ("Active") — the model's `Status | string` — so both forms
 * are accepted. Places render from exposed fields only (`participantLimit`, counts, and the
 * API's own `participantLimitReached`); nothing is computed from anything else.
 *
 * `highlight` is the card band's ONE badge (round 7, 2026-09-30), chosen from signals the card
 * already has — no new rules: an open opportunity closing within the urgency window reads
 * "Ending soon" (the same `urgent` flag that colours its closing label), else a featured one
 * reads "Featured" (the API's flag the old page's Featured row uses). Closed shows none — the
 * status row already says so. Labels stay ≤ 14 characters so a badge never reaches the logo.
 */
export interface CardHighlight {
  label: string;
  tone: "urgent" | "featured";
}

export interface CardStatus {
  closing: ClosingInfo;
  closed: boolean;
  places: string | null;
  /** The participant limit is reached (`places` says so in the type's word). */
  full: boolean;
  highlight: CardHighlight | null;
}

const statusName = (status: OpportunityInfo["status"]): string =>
  typeof status === "number" ? (Status[status] ?? "") : status;

/** "place", or "position" for a Job — singular; callers pluralise. */
export const placesNoun = (type: string): "place" | "position" =>
  type === OPPORTUNITY_TYPE_NANE_JOB ? "position" : "place";

export function cardStatus(
  opportunity: OpportunityInfo,
  now: Date,
): CardStatus {
  const closing = closingInfo(opportunity.dateEnd, now);
  const closed =
    statusName(opportunity.status) !== "Active" || closing.label === "Closed";
  if (closed)
    return {
      closing: { label: "Closed", urgent: false },
      closed,
      places: null,
      full: false,
      highlight: null,
    };

  let highlight: CardHighlight | null = null;
  if (closing.urgent) highlight = { label: "Ending soon", tone: "urgent" };
  else if (opportunity.featured)
    highlight = { label: "Featured", tone: "featured" };

  if (opportunity.participantLimit === null)
    return { closing, closed, places: null, full: false, highlight };

  const noun = placesNoun(opportunity.type);
  const full =
    opportunity.participantLimitReached ||
    opportunity.participantCountTotal >= opportunity.participantLimit;
  if (full)
    return { closing, closed, places: `No ${noun}s left`, full, highlight };

  const left = opportunity.participantLimit - opportunity.participantCountTotal;
  return {
    closing,
    closed,
    places: `${formatNumber(left)} ${left === 1 ? noun : `${noun}s`} left`,
    full,
    highlight,
  };
}
