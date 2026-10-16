/**
 * Where a discovery card or row opens: the opportunity's detail page. (On 2026-09-30 this pointed
 * at a separate `/experimental` route; since 2026-10-01 the round-7 layout IS `/opportunities/{id}`
 * whenever the release kill-switch is on, so there is one route again.) One place, so the card and
 * the row can never disagree.
 */
export const detailHref = (opportunityId: string): string =>
  `/opportunities/${opportunityId}`;
