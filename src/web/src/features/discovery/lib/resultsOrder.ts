import { OPPORTUNITY_TYPE_NANE_JOB } from "~/lib/constants";
import type { DiscoverySort } from "./types";

/**
 * How the results are ordered, as the results header shows it (2026-10-03). Pure; the request
 * side of the sort is `searchRequest.ts` (`ORDERING`).
 */

/**
 * Exactly Newest · Ending soonest · Most ZLTO; there is deliberately no "Best match" (nothing
 * server-side computes relevance).
 */
export const SORT_OPTIONS: readonly { id: DiscoverySort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "endingSoonest", label: "Ending soonest" },
  { id: "mostZlto", label: "Most ZLTO" },
];

/** Every effective type is Job — keyed to the core Type enum name, never a custom field. */
export const isJobsOnly = (types: string[]): boolean =>
  types.length > 0 && types.every((type) => type === OPPORTUNITY_TYPE_NANE_JOB);

/**
 * The options the header offers. Jobs carry no ZLTO, so Most ZLTO is hidden on a Jobs-only search
 * — hide, not grey, as Paid and rewards hides its ZLTO half (2026-09-23) — unless it is the sort
 * already: a selected option is never hidden (2026-09-28).
 */
export const visibleSortOptions = (
  types: string[],
  sort: DiscoverySort,
): readonly { id: DiscoverySort; label: string }[] =>
  SORT_OPTIONS.filter(
    (option) =>
      option.id !== "mostZlto" || sort === "mostZlto" || !isJobsOnly(types),
  );

/**
 * Why a Jobs-only Most ZLTO search looks unsorted, or `null` when it doesn't. Every Job ties at no
 * ZLTO, so the request's `DateCreated` tie-break decides the order.
 */
export const sortNote = (
  types: string[],
  sort: DiscoverySort,
): string | null =>
  sort === "mostZlto" && isJobsOnly(types)
    ? "Jobs don't carry ZLTO, so they're shown newest first."
    : null;

/**
 * Where the "Incentive not specified" divider goes on this page: before its first item whose
 * incentive is unset, when the page was FETCHED under a Paid filter. The API lists the explicit
 * matches first and the unknowns after, whatever the sort — the root `incentivized` criterion
 * with no mode does that (`searchRequest.ts`).
 *
 * The page's own filter, never the current one: while the next search loads, the page on screen
 * may be the previous search's. Fetched under the same filter (another sort, the next page), its
 * order still holds and the divider stays, so the faded results keep their layout; fetched under
 * another filter or none, its order says nothing and there is no divider.
 *
 * `null` when there is no divider: no page, no Paid filter behind it, or nothing on it
 * unspecified. 0 when the page begins in the unknown bucket.
 */
export function incentiveSplitAt(
  page:
    | {
        items: { incentivized: boolean | null | undefined }[];
        /**
         * The Paid filter the page was fetched with. Missing on a page cached before it was
         * recorded (it survives a dev Fast Refresh): unknown, so no divider.
         */
        paidFilter?: boolean | null;
      }
    | undefined,
): number | null {
  if (!page || page.paidFilter == null) return null;
  const index = page.items.findIndex((item) => item.incentivized == null);
  return index === -1 ? null : index;
}
