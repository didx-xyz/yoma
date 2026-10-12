import type { MyOpportunityInfo } from "~/api/models/myOpportunity";
import { OPPORTUNITY_TYPE_NAME_ENTREPRENEURSHIP } from "~/lib/constants";

/**
 * Where a completion happened, as the admin screens show it (2026-10-11): "Cape Town, Western
 * Cape, South Africa", most specific first, with a repeated name said once. The API's own
 * `location` is never filled, so the text is built here. Null when no country was captured.
 *
 * For Entrepreneurship it is the venture's business location, which the youth gave; for the
 * other types it is the youth's profile place when they submitted an on-site or hybrid one.
 */
export function completionLocation(
  info: Pick<
    MyOpportunityInfo,
    "country" | "region" | "city" | "opportunityType"
  >,
): { label: string; text: string } | null {
  if (!info.country) return null;
  const parts: string[] = [];
  for (const part of [info.city, info.region, info.country]) {
    const trimmed = part?.trim();
    if (
      trimmed &&
      !parts.some((p) => p.toLowerCase() === trimmed.toLowerCase())
    )
      parts.push(trimmed);
  }
  return {
    label:
      info.opportunityType === OPPORTUNITY_TYPE_NAME_ENTREPRENEURSHIP
        ? "Business location"
        : "Completed in",
    text: parts.join(", "),
  };
}
