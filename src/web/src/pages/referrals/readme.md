## Referral Pages

This document describes the features of the Yoma Ambassador referral program pages, including both end-user and admin experiences. Each section outlines the purpose of the page, its current behavior, and notable features to test for quality assurance.

---

## End-User Pages

---

## 1. Referrals Landing (`/referrals`)

Purpose: Single entry point for anonymous users, ambassadors and referees.

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
- Authenticated referees with confirmed actionable usage in `Initiated` or `Pending` state get a "New to Yoma?" top-nav shortcut.
- Referees with confirmed actionable usage can receive a reminder toast after sign-in once all blocking profile/settings/photo popups are completed.
- Reminder toast is shown once per signed-in session and is dismissed/reset on logout.

Notable features to test:
- Sign in as an anonymous user — verify welcome/intro experience with sign-in CTA is shown.
- Sign in as a blocked user — verify blocked-state panel renders instead of the normal content.
- Sign in as a referrer with no links — verify empty state for "My referrals" and appropriate CTA.
- Sign in as a referrer with links — verify stats card, "My referrals" list, and "My programmes" carousel populate correctly.
- Sign in as a referee — verify "My programmes" shows claimed programmes with progress.
- Sign in as a referee with a confirmed `Initiated` usage — verify the "New to Yoma?" top-nav links back to the claim page.
- Sign in as a referee with a confirmed `Pending` usage — verify the "New to Yoma?" top-nav links to the progress page.
- Complete profile/settings/photo popups for a referee with actionable usage — verify the reminder toast appears only once after the popup sequence completes.
- Sign out and sign back in as the same referee — verify the reminder toast can appear again for the new signed-in session.
- Apply a country filter — verify programme carousel updates to match selected country.
- Set user country in profile — verify it is pre-selected in the country filter on page load.
- Click "Create link" for a programme — verify modal opens and link is created successfully.
- Scroll/slide the programme carousel — verify lazy loading fetches additional items.

---

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

Notable features to test:
- Visit as an unauthenticated user — verify "Create Link" triggers sign-in redirect and returns to the page after login.
- Visit an Active programme — verify "Create Link" CTA is enabled via modal.
- Visit an Inactive/Deleted/Expired/LimitReached programme — verify "Create Link" CTA is disabled.
- Verify programme description, pathway steps, time remaining, and reward card all render correctly.
- Create a link successfully — verify redirect lands on the created link's detail page (`/referrals/link/[id]`).

---

## 3. Claim Page (`/referrals/claim/[programId]?linkId=...`)

Purpose: Referee entry point from shared link.

Current behavior:
- Requires `linkId` query param.
- Program is resolved via link-based endpoint.
- Unauthenticated users get login CTA with analytics tracking.
- Authenticated users first run the referral initiate step; this can create or confirm an `Initiated` usage before claim completes.
- If authenticated and profile incomplete, profile completion wizard is shown inline after initiate.
- A welcome toast is shown once on the claim page when inline profile completion is required.
- Claim is auto-attempted after initiate when the authenticated profile is already complete, or immediately after inline profile completion is saved.
- Successful initiate/claim refreshes the shared referee usage data used by global reminder/top-nav logic.
- If already claimed / already pending / own-link / expired / abandoned / programme-full conditions are hit, the page shows a detailed error state instead of redirecting blindly.
- Error states show detailed reasons with alternative actions.
- Social metadata (Open Graph/Twitter) is populated from program details.

Notable features to test:
- Open the claim URL as an unauthenticated user — verify login CTA is shown (not a claim attempt).
- Open the claim URL as an authenticated user with an incomplete profile — verify initiate runs, the inline profile wizard appears, and the welcome toast is shown once.
- Complete the profile wizard — verify claim is auto-attempted immediately after completion.
- Open the claim URL as an authenticated user with a complete profile — verify initiate runs and claim is auto-attempted without showing the inline profile wizard.
- Open the claim URL as a user who has already claimed this programme — verify an error state is shown rather than redirecting silently.
- Open the claim URL as a user who already has another pending claim for the programme — verify the specific alternative-link error state is shown.
- Open the claim URL as the referrer/owner of the link — verify the own-link validation error state is shown and the "New to Yoma?" top-nav does not appear.
- Open the claim URL where the programme completion limit has been reached — verify the "Programme Full" error state is shown.
- Open the claim URL with a missing or invalid `linkId` — verify appropriate error state and alternative-action links.
- Verify Open Graph/Twitter preview meta tags are populated from the programme name and description when sharing the URL.

---

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

Notable features to test:
- Access as an unauthenticated user — verify redirect to sign-in.
- Access as a blocked user — verify blocked-state panel renders.
- Share an Active programme link — verify share modal opens and copy-to-clipboard works.
- Share an Inactive/Expired/LimitReached programme link — verify "Share" CTA is disabled.
- Verify link statistics (Completed, Pending, Expired) reflect real data.
- Verify referee usage list populates with claimed users.

---

## 5. Referee Progress (`/referrals/progress/[programId]`)

Purpose: Track completion after claim.

Current behavior:
- SSR prefetch for referee usage + program.
- Refetches usage every 30s for near-real-time progress.
- Displays progress card, pathway tasks, time remaining, and reward card.
- Pathway task progress is sourced directly from `usage.pathway` (live API data).
- Shows contextual content with referrer name.
- Shows a welcome modal for active referee journeys and a congratulations modal for completed programmes.
- Welcome modal dismissal is tracked for the current signed-in session and is reset on logout.
- Local page state prevents the welcome modal from briefly reopening during sign-out transitions.
- Not-found/unavailable state includes alternative actions.

Notable features to test:
- Verify progress bar and `percentComplete` value match the pathway completion state.
- Complete a pathway task for the user and wait up to 30s — verify progress updates automatically without a manual refresh.
- Check a programme with no pathway — verify the pathway section is not rendered.
- Check a programme with a pathway — verify each step and task renders with correct completed/pending state.
- Verify time remaining card shows correct day count or "No time limit".
- Verify referrer name is displayed in the contextual section.
- Open an in-progress programme for the first time in a signed-in session — verify the welcome modal appears.
- Close the welcome modal and revisit/open another tab in the same signed-in session — verify it does not reopen.
- Sign out from the progress page — verify the welcome modal does not briefly flash during sign-out.
- Sign back in and revisit the same in-progress programme — verify the welcome modal can appear again in the new signed-in session.
- Open a completed programme — verify the congratulations modal appears with completion date and actual reward data.

---

## Admin Pages (Role: Admin required)

---

## 6. Admin — Referral Programs List (`/admin/referrals`)

Purpose: Admin landing page for all referral programmes with filtering, status tabs, and per-row management actions.

Notable features to test:
- Verify status tab counts (All, Active, Inactive, Expired, Deleted, Limit Reached, Uncompletable) match actual programme data.
- Click each status tab — verify the list filters correctly and URL updates.
- Search by name (`valueContains`) — verify results filter as expected.
- Apply country and date range filters — verify results narrow correctly; clearing filters restores the full list.
- Verify per-row feature indicators (Proof of Personhood, Pathway, Default, Hidden) match programme configuration.
- Verify ZLTO reward pool, balance, and cumulative-used values display correctly.
- For an Active programme: open the actions dropdown and confirm Inactivate, Edit, View Links, Delete, and Toggle Hidden are available.
- For an Inactive programme: open the actions dropdown and confirm Activate is available instead of Inactivate.
- Delete a programme — verify redirect to the Deleted tab after confirmation.
- Toggle Hidden on a programme — verify the Hidden indicator updates in the row without a page reload.
- Verify empty states: "Create your first referral program…" when no programmes exist; "No programs with this status." when a status tab has zero results.
- Click "Create Program" — verify redirect to the create form.

---

## 7. Admin — Create / Edit Referral Program (`/admin/referrals/create` or `/admin/referrals/[id]`)

Purpose: Multi-step wizard (5 data steps + 1 preview step) for creating and editing programmes.

Notable features to test:

**Step navigation:**
- Navigate between steps using the side menu — verify a warning icon (⚠️) appears on any step that has validation errors.
- Edit a field in Step 1, then click a different step without saving — verify the "Save Changes" dialog appears with *Save & Continue* and *Continue Without Saving* options.
- Choose *Continue Without Saving* — verify unsaved changes are discarded.

**Step 1 — Basic Info:**
- Submit without a name — verify required field error.
- Enter a name longer than 150 characters — verify character-limit error.
- Submit with no image (new programme) — verify required image error.
- Upload a valid image — verify preview updates.
- Enter a summary and description — verify both save and reload correctly on the edit form.

**Step 2 — Availability:**
- Submit without a start date — verify required field error.
- Set an end date earlier than the start date — verify date-order validation error.
- Clear all countries — verify required validation error.
- Change the selected countries after configuring a pathway in Step 5 — verify a warning that opportunity selections will be cleared.

**Step 3 — Completion & Rewards:**
- Submit with no completion window, no caps, and no ZLTO rewards — verify the "at least one of" cross-field validation error.
- Set a ZLTO referrer reward without any completion cap — verify the "cap required when rewards are set" cross-field error.
- Set a ZLTO reward pool lower than the sum of referrer + referee rewards — verify pool validation.
- Set a valid reward pool ≥ combined rewards — verify no error.

**Step 4 — Features:**
- Enable ZLTO rewards but disable both POP and Pathway — verify validation error ("POP or Pathway required when rewards are set").
- Enable "Is Default" without POP or Pathway — verify validation error.
- Enable "Multiple Links Allowed" without POP, per-referrer cap, or Pathway — verify validation error.

**Step 5 — Pathway:**
- Enable "Pathway Required" and navigate to Step 5 — verify pathway fields appear.
- Submit with no steps — verify minimum-step validation error.
- Add two steps with the same name — verify duplicate-name validation error.
- Add a step with no tasks — verify minimum-task error.
- Add the same opportunity to two tasks in the same step — verify uniqueness error.

**Step 6 — Preview:**
- Navigate to Preview with incomplete required steps — verify preview shows validation state and Submit is blocked.
- Complete all steps successfully — verify preview renders programme card and Submit is enabled.
- Submit a new programme — verify redirect to `/admin/referrals/[newId]/info`.
- Edit an existing programme and submit — verify redirect to `returnUrl` or `/admin/referrals`.

**Programme Expired modal:**
- Open an Expired programme for editing — verify the non-dismissable "Programme Expired" modal appears on load.

---

## 8. Admin — Programme Info (`/admin/referrals/[id]/info`)

Purpose: Read-only detail view of a single programme with tabbed sections.

Notable features to test:
- Verify all tabs render without errors: Preview, Program Info, Completion & Rewards, ZLTO Rewards, Features, Pathway, Analytics.
- Verify "Default" badge appears in the header only for default programmes.
- Verify Actions dropdown contains all applicable actions (Edit, View Links, Activate/Inactivate, Delete, Toggle Hidden) and that status-gated actions obey programme status.
- Click "Edit Program" — verify redirect to the edit form.
- Click "View Referral Links" — verify redirect to the links list for this programme.

---

## 9. Admin — Referral Links List (`/admin/referrals/[id]/links`)

Purpose: Lists all referral links for a specific programme.

Notable features to test:
- Verify status tab counts (All, Active, Cancelled, Limit Reached, Expired) reflect accurate data.
- Click each status tab — verify list filters correctly.
- Search by name (`valueContains`) — verify results narrow as expected.
- For a programme with a per-referrer cap, verify the "Remaining" completion count column is shown; for programmes without a cap, verify it is hidden.
- Verify "⚠️ Blocked on [date]" warning appears on links belonging to blocked ambassadors.
- Click the copy-to-clipboard URL button — verify the link URL is copied and a success toast appears.
- Click "Cancel" for a link via the actions dropdown — verify status updates to Cancelled.
- Click a link name — verify navigation to the usage list for that link.

---

## 10. Admin — Referral Link Usage List (`/admin/referrals/[id]/links/[linkId]/usage`)

Purpose: Lists all referee claim records for a specific referral link.

Notable features to test:
- Verify status tab counts (All, Pending, Completed, Expired) are accurate.
- Click each status tab — verify list filters correctly.
- Apply a date range filter — verify results are bounded by the selected dates; clear the filter and verify all records return.
- Verify email-confirmed and phone-confirmed tick icons only appear when the referee has confirmed those contact details.
- Verify "Completed" and "Expired" date columns only populate when those events have occurred.
- Click a referee name — verify navigation to the usage detail page.

---

## 11. Admin — Referral Link Usage Detail (`/admin/referrals/[id]/links/[linkId]/usage/[usageId]/info`)

Purpose: Full detail view for a single referee's claim record.

Notable features to test:
- Verify the Status badge (Completed / Pending / Expired) matches the actual status.
- Verify the progress bar and `percentComplete` value are accurate.
- For a programme with Proof of Personhood: verify "✓ Completed (method)" when POP is done; "Not completed" when it is not.
- Verify "All Requirements Met" shows "✓ Yes" only when status is Completed; otherwise shows explanation text.
- For a programme without a pathway: verify the Pathway Progress section is not rendered.
- For a programme with a pathway: verify the ReferralTasksCard shows each step and task with correct completion state.
- Verify Date Claimed, Date Completed, and Date Expired fields are accurate; verify "Not completed" / "Not expired" when those events have not occurred.
- Verify Referee and Referrer information sections display name, email, and phone.
- Click "View Program" — verify navigation to the correct programme info page.
- Click "Back to Usages" — verify return to the usage list, respecting the `returnUrl` if present.
