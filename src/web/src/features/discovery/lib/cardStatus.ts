import type { OpportunityInfo } from "~/api/models/opportunity";
import { Status } from "~/api/models/opportunity";
import type { ClosingInfo } from "./dates";
import { closingInfo } from "./dates";

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
 *   open    = the closing label from `closingInfo`, and "X of Y places left" when a limit exists
 *
 * `status` arrives as the enum NAME ("Active") — the model's `Status | string` — so both forms
 * are accepted. Places render from exposed fields only (`participantLimit`, counts, and the
 * API's own `participantLimitReached`); nothing is computed from anything else.
 */
export interface CardStatus {
  closing: ClosingInfo;
  closed: boolean;
  places: string | null;
}

const statusName = (status: OpportunityInfo["status"]): string =>
  typeof status === "number" ? (Status[status] ?? "") : status;

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
    };

  if (opportunity.participantLimit === null)
    return { closing, closed, places: null };

  const full =
    opportunity.participantLimitReached ||
    opportunity.participantCountTotal >= opportunity.participantLimit;
  if (full) return { closing, closed, places: "No places left" };

  const left = opportunity.participantLimit - opportunity.participantCountTotal;
  return {
    closing,
    closed,
    places: `${left} of ${opportunity.participantLimit} places left`,
  };
}
