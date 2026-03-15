## Referral Pages: Current UAT Flow

This document reflects the current implemented flow for the new referral pages.

## 1. Referrals Landing (`/referrals`)

Purpose: Single entry point for anonymous users, referrers, and referees.

Current behavior:
- Anonymous users see an intro/welcome experience with sign-in CTA.
- Authenticated users see a context-aware welcome section.
- User blocked for referrals sees a blocked-state panel.
- Programs are shown in a carousel with country filtering.
- Country defaults to user country + `Worldwide` when user country is available.
- Program carousel supports incremental loading as user scrolls/slides.
- "Create link" is available via modal where applicable.
- Referrer stats are visible from the landing page.
- "My referrals" and "My programmes" are rendered as card/carousel experiences.

Main data sources:
- `searchReferralProgramsInfo`
- `searchReferralLinks`
- `searchReferralLinkUsagesAsReferrer`
- `searchReferralLinkUsagesAsReferee`
- `getCountries`

## 2. Program Details (`/referrals/program/[programId]`)

Purpose: Program-first page before link creation.

Current behavior:
- SSR prefetch of program details.
- Top summary card with status-aware CTA.
- CTA opens create-link modal for authenticated users.
- Unauthenticated users are redirected through login flow before creating a link.
- Program status disables create-link action for inactive/expired/limit reached/deleted states.
- Program description, pathway tasks, time requirement, and reward card are shown.
- On create-link success, user is routed to the created link page.

## 3. Claim Page (`/referrals/claim/[programId]?linkId=...`)

Purpose: Referee entry point from shared link.

Current behavior:
- Requires `linkId` query param.
- Program is resolved via link-based endpoint.
- Unauthenticated users get login CTA with analytics tracking.
- If authenticated and profile incomplete, profile completion wizard is shown inline.
- Claim is auto-attempted when profile is complete.
- If already claimed, user is redirected to progress page.
- Error states show detailed reasons with alternative actions.
- Social metadata (Open Graph/Twitter) is populated from program details.

## 4. Link Details (`/referrals/link/[id]`)

Purpose: Referrer page to manage and share a specific link.

Current behavior:
- SSR prefetch for link + program.
- Unauthenticated access redirects to sign-in.
- Blocked users see blocked-state panel.
- Top card displays program context and share CTA.
- Share CTA is status-aware and disabled for unavailable program states.
- Share modal supports copy/share actions and reward context.
- Link stats and referee usage list are displayed.

## 5. Referee Progress (`/referrals/progress/[programId]`)

Purpose: Track completion after claim.

Current behavior:
- SSR prefetch for referee usage + program.
- Refetches usage every 30s for near-real-time progress.
- Shows claim success toast after redirect from claim flow.
- Displays progress card, pathway tasks, time remaining, and reward card.
- Shows contextual content with referrer name.
- Not-found/unavailable state includes alternative actions.

## 6. Shared Architecture Notes

- New pages consistently use `ReferralShell` and `new/*` referral UI components.
- React Query is used for hydration, caching, and refetch behavior.
- Error states are handled across 401/404/500 style responses.
- Back navigation and breadcrumb labels are standardized.

## 7. Component Cleanup Candidates (`src/components/Referrals`)

Based on current import usage in `src/web/src/pages/referrals` and `src/web/src/pages/admin/referrals`, these files are not used by current page flows and are candidates for removal in a cleanup PR:

- `src/components/Referrals/new/ReferralPageShell.tsx`
- `src/components/Referrals/AdminReferrerBlockForm.tsx`
- `src/components/Referrals/InstructionHeaders.tsx`
- `src/components/Referrals/PathwayComponents.tsx`
- `src/components/Referrals/PathwayTaskOpportunity.tsx`
- `src/components/Referrals/ProgramPathwayView.tsx`
- `src/components/Referrals/ProgramRow.tsx`
- `src/components/Referrals/RefereeProgramDetails.tsx`
- `src/components/Referrals/RefereeProgressTracker.tsx`
- `src/components/Referrals/RefereeStatusBanner.tsx`
- `src/components/Referrals/RefereeUsagesList.tsx`
- `src/components/Referrals/ReferrerLinksList.tsx`
- `src/components/Referrals/ReferrerProgramsList.tsx`
- `src/components/Referrals/ShareButtons.tsx`

Potentially removable with dependency check:
- `src/components/Referrals/ReferrerLinkDetails.tsx` (currently used by `ReferralShareModal`; remove only if modal is refactored first)

## 8. Recommended Next Steps Before UAT Sign-off

- Remove the unused components listed above in a dedicated cleanup commit.
- Run TypeScript, lint, and referral-page smoke tests after cleanup.
- Keep admin changes isolated for the follow-up pass.
