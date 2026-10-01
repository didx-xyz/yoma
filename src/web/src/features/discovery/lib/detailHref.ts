/**
 * Where a discovery card or row opens (round 7, Jason 2026-09-30): the EXPERIMENTAL detail page.
 * Discovery is itself the experimental surface, so it links to the new layout; the legacy
 * `/opportunities` page and everything else keep the existing `/opportunities/{id}`. One place,
 * so the card and the row can never disagree — and flipping back is one line.
 */
export const detailHref = (opportunityId: string): string =>
  `/opportunities/${opportunityId}/experimental`;
