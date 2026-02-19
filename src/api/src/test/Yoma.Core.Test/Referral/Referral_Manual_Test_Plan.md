# Referral System — Manual UI Test Plan

| Field | Value |
|-------|-------|
| **Module** | Referral System |
| **Version** | 1.0 |
| **Date** | 2026-02-10 |
| **Author** | Sam Henderson |
| **Environment** | Staging / QA |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Test Data Setup](#3-test-data-setup)
4. [Test Cases — Anonymous / Public](#4-test-cases--anonymous--public)
5. [Test Cases — Referee (Link Claiming)](#5-test-cases--referee-link-claiming)
6. [Test Cases — Referrer (Link Management)](#6-test-cases--referrer-link-management)
7. [Test Cases — Referrer Analytics](#7-test-cases--referrer-analytics)
8. [Test Cases — Program Management (Admin)](#8-test-cases--program-management-admin)
9. [Test Cases — Block / Unblock (Admin)](#9-test-cases--block--unblock-admin)
10. [Test Cases — Admin Search & Analytics](#10-test-cases--admin-search--analytics)
11. [Test Cases — Completion & Rewards](#11-test-cases--completion--rewards)
12. [Test Cases — Edge Cases & Negative Paths](#12-test-cases--edge-cases--negative-paths)
13. [Test Execution Log](#13-test-execution-log)

---

## 1. Introduction

This document provides step-by-step manual test cases for the Referral System UI. It covers all user roles (Anonymous, Referee, Referrer, Admin) and validates the core workflows: program discovery, link creation, link claiming, progress tracking, rewards, blocking, and analytics.

### Roles

| Role | Description |
|------|-------------|
| **Anonymous** | Unauthenticated visitor. Can view programs but cannot claim links. |
| **Referee** | Authenticated user who claims a referral link shared by a referrer. |
| **Referrer** | Authenticated user who creates and shares referral links. |
| **Admin** | Platform administrator who manages programs, blocks users, and views system-wide analytics. |

---

## 2. Prerequisites

Before executing test cases, ensure:

- [ ] Access to the QA/staging environment with a valid URL
- [ ] At least **3 test user accounts**: one Admin, one Referrer, one Referee
- [ ] All test users have completed YoID onboarding (profile setup, country selected)
- [ ] The Referee account was onboarded **recently** (within the configured `ReferralFirstClaimSinceYoIDOnboardedTimeoutInHours` window)
- [ ] At least one active referral program exists (or Admin will create one in Section 8)
- [ ] Browser dev tools available for inspecting network requests if needed

---

## 3. Test Data Setup

Create or confirm the following test data before running test cases:

| Item | Details |
|------|---------|
| **Admin user** | Has Admin role. Username: `admin-test@example.com` |
| **Referrer user** | Has User role. Username: `referrer-test@example.com`, Country: South Africa |
| **Referee user** | Has User role, recently onboarded. Username: `referee-test@example.com`, Country: South Africa |
| **Referee user 2** | Has User role, recently onboarded. Username: `referee2-test@example.com`, Country: Kenya |
| **Test Program A** | Active, Worldwide, no completion limits, ZLTO rewards configured |
| **Test Program B** | Active, South Africa only, CompletionLimit=2, CompletionLimitReferee=1 |
| **Test Program C** | Inactive, Worldwide |

---

## 4. Test Cases — Anonymous / Public

### TC-PUB-001: View available programs (anonymous)

| Field | Value |
|-------|-------|
| **Objective** | Verify an unauthenticated user can browse available referral programs |
| **Preconditions** | User is not logged in. At least one active program exists. |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open the application URL without logging in | Landing page loads |
| 2 | Navigate to the referral programs section | Active referral programs are displayed |
| 3 | Verify program cards show: name, description, image, start date | Program details are visible without login |
| 4 | Verify programs with status Inactive, Expired, Deleted are NOT shown | Only Active and not-yet-started programs appear |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PUB-002: View program details via shared link (anonymous)

| Field | Value |
|-------|-------|
| **Objective** | Verify a referral link URL shows program info to unauthenticated visitors |
| **Preconditions** | A referral link exists with a valid short URL |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open a referral link URL in an incognito/private browser window | The referral landing page loads |
| 2 | Verify program name and description are displayed | Program info is shown to the anonymous visitor |
| 3 | Look for a "Sign Up" or "Register" call-to-action | The page prompts the user to register/login to claim |
| 4 | Verify there is no way to claim the link without authentication | Claim button is disabled or redirects to login |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PUB-003: Search programs with country filter (anonymous)

| Field | Value |
|-------|-------|
| **Objective** | Verify anonymous program search respects country filtering |
| **Preconditions** | Program A is Worldwide, Program B is South Africa only |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Search programs without any country filter | Worldwide programs are shown (Program A) |
| 2 | Apply country filter for "South Africa" | Both Program A (Worldwide) and Program B (SA only) appear |
| 3 | Apply country filter for "Kenya" | Only Program A (Worldwide) appears; Program B does not |
| 4 | Apply country filter for a country with no programs | No programs shown, appropriate empty state displayed |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PUB-004: Default program info (anonymous)

| Field | Value |
|-------|-------|
| **Objective** | Verify the default referral program is accessible anonymously |
| **Preconditions** | An admin has set a Worldwide program as the default |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to the default referral program page/widget | Default program info loads |
| 2 | Verify name, description, and start date are visible | Correct program details displayed |
| 3 | Verify sensitive fields (reward pool, balance) are NOT shown | Only public-facing fields are displayed |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

## 5. Test Cases — Referee (Link Claiming)

### TC-REF-001: Claim a referral link — happy path

| Field | Value |
|-------|-------|
| **Objective** | Verify a referee can successfully claim a referral link |
| **Preconditions** | Referee is logged in and onboarded. An active referral link exists (created by a different user). Program is Active and started. |
| **Priority** | Critical |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as the Referee user | Dashboard loads |
| 2 | Navigate to the referral link URL (shared link or short URL) | Referral landing page loads with program details |
| 3 | Click "Claim" / "Join" button | Claim is processed successfully |
| 4 | Verify a success confirmation is shown | Message indicates the referral was claimed |
| 5 | Navigate to "My Referrals" or equivalent section | The claimed referral appears with status "Pending" |
| 6 | Verify program name, referrer info, and claim date are shown | Correct details displayed |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-002: Claim own referral link (self-referral)

| Field | Value |
|-------|-------|
| **Objective** | Verify a user cannot claim their own referral link |
| **Preconditions** | User is logged in and has an active referral link |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as the Referrer user who owns the link | Dashboard loads |
| 2 | Navigate to own referral link URL | Referral landing page loads |
| 3 | Attempt to click "Claim" | Error displayed: "cannot claim your own referral link" |
| 4 | Verify no usage record was created | No entry appears in My Referrals (as referee) |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-003: Claim link — user not onboarded

| Field | Value |
|-------|-------|
| **Objective** | Verify a user who hasn't completed their profile cannot claim a link |
| **Preconditions** | A user account exists without completed YoID onboarding |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as the non-onboarded user | Dashboard loads (possibly with profile completion prompt) |
| 2 | Navigate to a referral link URL | Referral page loads |
| 3 | Attempt to claim the link | Error displayed: "must complete your profile" or redirect to profile completion |
| 4 | Complete profile/onboarding | Profile completion succeeds |
| 5 | Return to referral link and attempt claim again | Claim succeeds |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-004: Claim link — already claimed (pending)

| Field | Value |
|-------|-------|
| **Objective** | Verify a referee cannot claim the same program twice while a claim is pending |
| **Preconditions** | Referee has already claimed a link for this program (status: Pending) |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee | Dashboard loads |
| 2 | Navigate to a referral link for the same program | Referral page loads |
| 3 | Attempt to claim the link | Error displayed indicating a claim is already pending |
| 4 | Verify the existing pending claim is unchanged | Original claim still shows in My Referrals with Pending status |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-005: Claim link — already completed

| Field | Value |
|-------|-------|
| **Objective** | Verify a referee cannot re-claim a program they've already completed |
| **Preconditions** | Referee has a Completed usage for this program |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee | Dashboard loads |
| 2 | Navigate to a referral link for the already-completed program | Referral page loads |
| 3 | Attempt to claim | Error displayed indicating already completed |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-006: Claim link — program not active

| Field | Value |
|-------|-------|
| **Objective** | Verify a referee cannot claim a link for an inactive program |
| **Preconditions** | Program C is Inactive. A link exists for Program C (created when it was active). |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee | Dashboard loads |
| 2 | Navigate to the referral link for Program C | Referral page loads (may show program is inactive) |
| 3 | Attempt to claim | Error displayed indicating program is not active |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-007: Claim link — program completion limit reached

| Field | Value |
|-------|-------|
| **Objective** | Verify claims are blocked when the program's global completion limit is reached |
| **Preconditions** | Program B has CompletionLimit=2 and already has 2 completed usages |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as a new Referee user | Dashboard loads |
| 2 | Navigate to a referral link for Program B | Referral page loads |
| 3 | Attempt to claim | Error displayed indicating completion limit reached |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-008: Claim link — country mismatch

| Field | Value |
|-------|-------|
| **Objective** | Verify a referee in a non-matching country cannot claim a country-restricted program |
| **Preconditions** | Program B is South Africa only. Referee user 2 is in Kenya. |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee user 2 (Kenya) | Dashboard loads |
| 2 | Navigate to a referral link for Program B (SA only) | Referral page loads |
| 3 | Attempt to claim | Error displayed: "not available in your country" |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-009: Claim link — cancelled link

| Field | Value |
|-------|-------|
| **Objective** | Verify a referee cannot claim a cancelled referral link |
| **Preconditions** | The referral link has been cancelled by the referrer or admin |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee | Dashboard loads |
| 2 | Navigate to the cancelled link's URL | Page loads (may show link is no longer active) |
| 3 | Attempt to claim | Error displayed indicating link is not active |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-010: View claim progress

| Field | Value |
|-------|-------|
| **Objective** | Verify a referee can track their referral completion progress |
| **Preconditions** | Referee has a pending claim. Program has a pathway configured. |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee | Dashboard loads |
| 2 | Navigate to "My Referrals" or referral progress section | Pending claim is listed |
| 3 | Click on the pending claim to view details | Detail view shows: completion percentage, time remaining, date to complete by |
| 4 | If pathway is configured, verify step-by-step progress is shown | Pathway steps and tasks listed with completion status |
| 5 | Verify tasks link to the relevant opportunities | Clicking a task navigates to the opportunity |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-REF-011: View referee analytics

| Field | Value |
|-------|-------|
| **Objective** | Verify a referee can view their own analytics |
| **Preconditions** | Referee has at least one claim |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee | Dashboard loads |
| 2 | Navigate to referral analytics section | Analytics view loads |
| 3 | Select "Referee" role/tab | Referee analytics displayed |
| 4 | Verify displayed metrics: total usages, completed, pending, expired, ZLTO earned | Values match expected data |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

## 6. Test Cases — Referrer (Link Management)

### TC-LNK-001: Create a referral link — happy path

| Field | Value |
|-------|-------|
| **Objective** | Verify a referrer can create a new referral link |
| **Preconditions** | Referrer is logged in. An active program exists. User's country matches the program. |
| **Priority** | Critical |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as the Referrer user | Dashboard loads |
| 2 | Navigate to the referral section | Referral management page loads |
| 3 | Click "Create Link" or equivalent | Link creation form appears |
| 4 | Select Program A from the program dropdown | Program selected |
| 5 | Enter a name: "My First Link" | Name field populated |
| 6 | Optionally enter a description | Description field populated |
| 7 | Optionally enable QR code generation | QR code checkbox/toggle selected |
| 8 | Submit the form | Link created successfully |
| 9 | Verify the new link appears in the list with status "Active" | Link displayed with correct name, program, Active status |
| 10 | Verify Short URL is displayed and copyable | Short URL is clickable and can be copied to clipboard |
| 11 | If QR code was enabled, verify it is displayed | QR code image is visible |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-LNK-002: Create link — program not started

| Field | Value |
|-------|-------|
| **Objective** | Verify a link cannot be created for a program that hasn't started yet |
| **Preconditions** | An active program exists with DateStart in the future |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer | Dashboard loads |
| 2 | Attempt to create a link for the not-yet-started program | Error displayed: program has not started |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-LNK-003: Create link — multiple links not allowed

| Field | Value |
|-------|-------|
| **Objective** | Verify duplicate active links are blocked when MultipleLinksAllowed=false |
| **Preconditions** | Program has MultipleLinksAllowed=false. Referrer already has an active link. |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer | Dashboard loads |
| 2 | Navigate to create a new link for the same program | Form appears |
| 3 | Enter a different name and submit | Error displayed: "Multiple active referral links are not allowed" |
| 4 | Verify the existing link is unchanged | Original link still Active |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-LNK-004: Create link — multiple links allowed

| Field | Value |
|-------|-------|
| **Objective** | Verify multiple links can be created when MultipleLinksAllowed=true |
| **Preconditions** | Program has MultipleLinksAllowed=true. Referrer already has an active link. |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer | Dashboard loads |
| 2 | Create a second link with a different name | Link created successfully |
| 3 | Verify both links appear in the list, both Active | Two active links visible for the same program |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-LNK-005: Create link — duplicate name

| Field | Value |
|-------|-------|
| **Objective** | Verify duplicate link names are rejected |
| **Preconditions** | Program has MultipleLinksAllowed=true. An active link named "My Link" exists. |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer | Dashboard loads |
| 2 | Attempt to create a new link with name "My Link" (same as existing) | Error displayed: link name already exists |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-LNK-006: Update a referral link

| Field | Value |
|-------|-------|
| **Objective** | Verify a referrer can update their link's name and description |
| **Preconditions** | Referrer has an active link |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer | Dashboard loads |
| 2 | Navigate to the link detail/edit page | Link details shown |
| 3 | Change the name to "Updated Link Name" | Name field updated |
| 4 | Change or add a description | Description field updated |
| 5 | Save changes | Changes saved successfully |
| 6 | Verify the updated name and description are reflected | New values displayed |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-LNK-007: Cancel a referral link

| Field | Value |
|-------|-------|
| **Objective** | Verify a referrer can cancel their own active link |
| **Preconditions** | Referrer has an active link |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer | Dashboard loads |
| 2 | Navigate to the active link | Link details shown |
| 3 | Click "Cancel Link" or equivalent | Confirmation prompt appears |
| 4 | Confirm cancellation | Link status changes to "Cancelled" |
| 5 | Verify the link can no longer be claimed | Attempting to use the link URL shows it's inactive |
| 6 | Verify existing pending usages for this link are NOT affected | Pending claims remain Pending (they can still complete) |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-LNK-008: Cancel an already-cancelled link

| Field | Value |
|-------|-------|
| **Objective** | Verify cancelling an already-cancelled link is handled gracefully |
| **Preconditions** | Referrer has a cancelled link |
| **Priority** | Low |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer | Dashboard loads |
| 2 | Navigate to the cancelled link | Link details shown with Cancelled status |
| 3 | Verify the "Cancel" action is either hidden or disabled | No option to cancel again, OR action returns without error |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-LNK-009: Search referral links with filters

| Field | Value |
|-------|-------|
| **Objective** | Verify the referrer can filter and search their links |
| **Preconditions** | Referrer has multiple links in different statuses |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer | Dashboard loads |
| 2 | Navigate to referral links list | All links displayed |
| 3 | Filter by status "Active" | Only active links shown |
| 4 | Filter by status "Cancelled" | Only cancelled links shown |
| 5 | Search by text (link name) | Matching links shown |
| 6 | Filter by program | Only links for selected program shown |
| 7 | Filter by date range | Only links created within the range shown |
| 8 | Clear all filters | All links displayed again |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-LNK-010: View link usage details (as referrer)

| Field | Value |
|-------|-------|
| **Objective** | Verify a referrer can see who has claimed their links and their progress |
| **Preconditions** | Referrer has a link with at least one claim |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer | Dashboard loads |
| 2 | Navigate to the link with claims | Link details shown |
| 3 | View the list of usages/claims | Each claim shows: referee display name, status (Pending/Completed/Expired), date claimed |
| 4 | Click on a specific usage | Usage detail shows: completion %, time remaining, ZLTO rewards (if completed) |
| 5 | If pathway is configured, verify referee's step progress is visible | Step-by-step completion shown |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

## 7. Test Cases — Referrer Analytics

### TC-ANA-001: View referrer analytics — no data

| Field | Value |
|-------|-------|
| **Objective** | Verify analytics show zero values when referrer has no activity |
| **Preconditions** | New referrer user with no links or claims |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as a new user with no referral activity | Dashboard loads |
| 2 | Navigate to referral analytics | Analytics page loads |
| 3 | Select "Referrer" view | Referrer analytics displayed |
| 4 | Verify all metrics show 0 | Link count=0, Active links=0, Completed=0, Pending=0, Expired=0, ZLTO=0 |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-ANA-002: View referrer analytics — with data

| Field | Value |
|-------|-------|
| **Objective** | Verify analytics correctly aggregate referrer activity |
| **Preconditions** | Referrer has links with completed and pending claims |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer with activity | Dashboard loads |
| 2 | Navigate to referral analytics | Analytics page loads |
| 3 | Verify link count matches actual number of links | Correct count displayed |
| 4 | Verify active link count matches links with Active status | Correct count |
| 5 | Verify completed/pending/expired usage counts are accurate | Counts match actual data |
| 6 | Verify total ZLTO earned is correct | Sum of referrer rewards from completed usages |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-ANA-003: View leaderboard

| Field | Value |
|-------|-------|
| **Objective** | Verify the analytics leaderboard displays correctly with privacy |
| **Preconditions** | Multiple users have referral activity |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as a regular user | Dashboard loads |
| 2 | Navigate to the referral leaderboard / analytics search | Leaderboard displayed |
| 3 | Verify your own entry shows your display name | Own name visible |
| 4 | Verify other users' names are redacted/anonymised | Other users shown with masked display names |
| 5 | Log in as Admin and view the same leaderboard | All display names are visible (not redacted) |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

## 8. Test Cases — Program Management (Admin)

### TC-PRG-001: Create a referral program

| Field | Value |
|-------|-------|
| **Objective** | Verify an admin can create a new referral program with full configuration |
| **Preconditions** | Logged in as Admin |
| **Priority** | Critical |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to Referral Program management | Program list displayed |
| 3 | Click "Create Program" | Creation form appears |
| 4 | Fill in required fields: Name="Test Program", DateStart=today | Fields populated |
| 5 | Set optional fields: Description, CompletionWindowInDays=30, CompletionLimit=100, CompletionLimitReferee=10 | Fields populated |
| 6 | Set ZLTO rewards: Referrer=10, Referee=20, Pool=1000 | Reward fields populated |
| 7 | Set countries: select "Worldwide" (or leave empty) | Country selection set |
| 8 | Toggle MultipleLinksAllowed=true | Toggle enabled |
| 9 | Submit the form | Program created successfully |
| 10 | Verify the program appears in the list with status "Active" | Program listed correctly |
| 11 | Verify all configured values are saved correctly | Edit view shows correct values |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PRG-002: Update a referral program

| Field | Value |
|-------|-------|
| **Objective** | Verify an admin can update an existing program's configuration |
| **Preconditions** | An active program exists |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to the program's detail/edit page | Program details shown |
| 3 | Change the name to "Updated Program Name" | Name field updated |
| 4 | Change CompletionLimit from 100 to 50 | Limit field updated |
| 5 | Save changes | Changes saved successfully |
| 6 | Verify updated values are reflected | New values displayed correctly |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PRG-003: Upload program image

| Field | Value |
|-------|-------|
| **Objective** | Verify an admin can upload/update a program's image |
| **Preconditions** | An active program exists |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to the program edit page | Program details shown |
| 3 | Click image upload area | File picker opens |
| 4 | Select a valid image file (PNG/JPG) | Image selected |
| 5 | Upload the image | Image uploads and displays as the program image |
| 6 | Verify the image appears on the public program page | Anonymous users see the uploaded image |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PRG-004: Transition program status — Active to Inactive

| Field | Value |
|-------|-------|
| **Objective** | Verify an admin can deactivate a program |
| **Preconditions** | An active program exists with active links |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to the active program | Program details shown |
| 3 | Change status to "Inactive" | Confirmation prompt may appear |
| 4 | Confirm the status change | Status changes to Inactive |
| 5 | Verify existing links remain valid (not cancelled) | Links still show in referrer's list but no new claims accepted |
| 6 | Attempt to claim a link for this program as Referee | Error: program is not active |
| 7 | Verify program no longer appears in public program search | Program hidden from anonymous users |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PRG-005: Transition program status — Inactive to Active

| Field | Value |
|-------|-------|
| **Objective** | Verify an admin can reactivate a program |
| **Preconditions** | An inactive program exists |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to the inactive program | Program details shown with Inactive status |
| 3 | Change status to "Active" | Status changes to Active |
| 4 | Verify the program appears in public program search again | Program visible to anonymous users |
| 5 | Attempt to claim a link for this program as Referee | Claim succeeds |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PRG-006: Transition program status — Active to Deleted

| Field | Value |
|-------|-------|
| **Objective** | Verify deleting a program cancels all its links |
| **Preconditions** | An active program with active links exists |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to the active program | Program details shown |
| 3 | Change status to "Deleted" | Confirmation prompt appears |
| 4 | Confirm deletion | Status changes to Deleted |
| 5 | Verify all links for this program are now Cancelled | Referrer's links show Cancelled status |
| 6 | Verify existing pending usages are NOT cancelled | Pending claims remain Pending (can still complete) |
| 7 | Verify the program is no longer visible in public search | Program removed from public listing |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PRG-007: Invalid status transition — Expired to Active

| Field | Value |
|-------|-------|
| **Objective** | Verify invalid status transitions are blocked |
| **Preconditions** | A program has expired (DateEnd in the past, status Expired) |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to the expired program | Program shows Expired status |
| 3 | Attempt to change status directly to Active | Error: invalid transition. Must go Inactive first (if allowed) |
| 4 | Verify status remains Expired | No change applied |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PRG-008: Set program as default — Worldwide

| Field | Value |
|-------|-------|
| **Objective** | Verify a Worldwide program can be set as the default |
| **Preconditions** | A Worldwide active program exists |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to the Worldwide program | Program details shown |
| 3 | Click "Set as Default" | Program marked as default |
| 4 | Verify the default program API/page returns this program | Default program endpoint returns the correct program |
| 5 | If another program was previously default, verify it is no longer default | Previous default flag cleared |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PRG-009: Set program as default — non-Worldwide (should fail)

| Field | Value |
|-------|-------|
| **Objective** | Verify a country-restricted program cannot be set as default |
| **Preconditions** | A program restricted to South Africa only exists |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to the SA-only program | Program details shown |
| 3 | Attempt to set as default | Error displayed: program must be Worldwide to be default |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-PRG-010: Configure program pathway

| Field | Value |
|-------|-------|
| **Objective** | Verify an admin can configure a completion pathway with steps and tasks |
| **Preconditions** | Active program exists. Opportunities exist in the system. |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to program edit page | Program configuration shown |
| 3 | Enable "Pathway Required" | Pathway section appears |
| 4 | Add a pathway with name and description | Pathway created |
| 5 | Set completion rule to "All" and order mode to "Sequential" | Rules configured |
| 6 | Add Step 1 with a task linked to an Opportunity | Step and task added |
| 7 | Add Step 2 with another task | Second step added |
| 8 | Save the program | Changes saved successfully |
| 9 | Verify pathway structure is displayed correctly | Steps and tasks shown in order |
| 10 | As Referee, claim the link and verify pathway progress is visible | Progress shows both steps with uncompleted status |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

## 9. Test Cases — Block / Unblock (Admin)

### TC-BLK-001: Block a referrer

| Field | Value |
|-------|-------|
| **Objective** | Verify an admin can block a referrer |
| **Preconditions** | Referrer user exists and is not currently blocked |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to user management / block section | Block management UI displayed |
| 3 | Search for the Referrer user | User found |
| 4 | Click "Block" | Block form appears |
| 5 | Select reason: "Other" | Reason selected |
| 6 | Enter comment: "Testing block functionality" | Comment entered |
| 7 | Set CancelLinks = false | Toggle set |
| 8 | Submit the block | Block applied successfully |
| 9 | Verify the user's profile shows blocked status | User marked as blocked |
| 10 | Verify the referrer's links are still Active (CancelLinks was false) | Links remain Active |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-BLK-002: Block a referrer with CancelLinks=true

| Field | Value |
|-------|-------|
| **Objective** | Verify blocking with CancelLinks cancels all the user's active links |
| **Preconditions** | Referrer has active links and is not blocked |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Block the Referrer with CancelLinks=true | Block applied |
| 3 | Verify all the referrer's active links are now Cancelled | Links status changed to Cancelled |
| 4 | Log in as Referee and try to claim one of those links | Error: link is not active |
| 5 | Verify existing pending usages are NOT affected | Pending claims can still complete |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-BLK-003: Block an already-blocked user (idempotent)

| Field | Value |
|-------|-------|
| **Objective** | Verify blocking an already-blocked user is handled gracefully |
| **Preconditions** | Referrer is already blocked |
| **Priority** | Low |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Attempt to block the already-blocked referrer | Returns existing block (no error, no duplicate created) |
| 3 | Verify only one block record exists | Single block entry in the system |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-BLK-004: Unblock a referrer

| Field | Value |
|-------|-------|
| **Objective** | Verify an admin can unblock a previously blocked referrer |
| **Preconditions** | Referrer is currently blocked |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to the blocked referrer | Block details shown |
| 3 | Click "Unblock" | Unblock form appears |
| 4 | Enter comment: "Unblocking for testing" | Comment entered |
| 5 | Submit the unblock | Unblock applied successfully |
| 6 | Verify the user's profile no longer shows blocked status | Block removed |
| 7 | Log in as the unblocked referrer and create a new link | Link creation succeeds |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-BLK-005: Unblock a user who is not blocked

| Field | Value |
|-------|-------|
| **Objective** | Verify unblocking a non-blocked user is handled gracefully |
| **Preconditions** | User is not blocked |
| **Priority** | Low |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Attempt to unblock a user who is not blocked | Operation completes without error (no-op) |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

## 10. Test Cases — Admin Search & Analytics

### TC-ADM-001: Search all referral links (admin)

| Field | Value |
|-------|-------|
| **Objective** | Verify admin can search across all users' referral links |
| **Preconditions** | Multiple users have referral links |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to admin link search | Search interface displayed |
| 3 | Search without filters | All links across all users displayed |
| 4 | Filter by specific user ID | Only that user's links shown |
| 5 | Filter by status "Active" | Only active links shown |
| 6 | Filter by program | Only links for that program shown |
| 7 | Verify pagination works correctly | Pages load with correct items |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-ADM-002: Search all link usages (admin)

| Field | Value |
|-------|-------|
| **Objective** | Verify admin can search across all link usages |
| **Preconditions** | Multiple claims exist across different users and programs |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to admin usage search | Search interface displayed |
| 3 | Search without filters | All usages displayed |
| 4 | Filter by referee user ID | Only that referee's usages shown |
| 5 | Filter by referrer user ID | Only usages for that referrer's links shown |
| 6 | Filter by status "Completed" | Only completed usages shown |
| 7 | Filter by program | Only usages for that program shown |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-ADM-003: Admin analytics with filters

| Field | Value |
|-------|-------|
| **Objective** | Verify admin can view system-wide analytics with program and date filters |
| **Preconditions** | Referral activity exists across multiple programs |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Navigate to admin analytics | Analytics page loads |
| 3 | View unfiltered analytics | System-wide totals displayed |
| 4 | Filter by specific program | Analytics scoped to that program |
| 5 | Filter by date range | Analytics scoped to that period |
| 6 | Verify user display names are fully visible (not redacted) | Full names shown (admin privilege) |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-ADM-004: Admin can cancel any user's link

| Field | Value |
|-------|-------|
| **Objective** | Verify admin can cancel links belonging to other users |
| **Preconditions** | Another user has an active referral link |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Admin | Admin dashboard loads |
| 2 | Search for the user's active link | Link found |
| 3 | Cancel the link | Link status changes to Cancelled |
| 4 | Log in as the link owner | Link shows as Cancelled |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

## 11. Test Cases — Completion & Rewards

### TC-CMP-001: Referee completes referral — rewards allocated

| Field | Value |
|-------|-------|
| **Objective** | Verify rewards are allocated when a referee completes all requirements |
| **Preconditions** | Referee has a pending claim. Program has ZLTO rewards configured and pool available. Pathway tasks (if any) are completable. |
| **Priority** | Critical |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee with a pending claim | Dashboard loads |
| 2 | Complete the proof-of-personhood requirement (if required) | POP status updates to completed |
| 3 | Complete all pathway tasks (complete the linked opportunities) | Each task shows as completed in progress view |
| 4 | Verify usage status transitions to "Completed" | Usage now shows Completed status |
| 5 | Verify ZLTO reward for referee is allocated | Referee reward amount shown in usage details |
| 6 | Log in as the Referrer | Dashboard loads |
| 7 | Verify ZLTO reward for referrer is allocated | Referrer reward shown in link usage details |
| 8 | Verify program's CompletionTotal has incremented | Program stats updated |
| 9 | Verify both users' analytics reflect the new rewards | ZLTO totals updated |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-CMP-002: Completion with pool exhaustion

| Field | Value |
|-------|-------|
| **Objective** | Verify partial/zero rewards when ZLTO pool is exhausted |
| **Preconditions** | Program has a small ZLTO pool that will be exhausted |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set up a program with ZltoRewardPool=30, Referrer=10, Referee=20 | Program configured |
| 2 | First referee completes — pool has 30 available | Referee gets 20, Referrer gets 10, pool balance=0 |
| 3 | Second referee completes — pool is now 0 | Referee gets 0, Referrer gets 0 (pool exhausted) |
| 4 | Verify usage still marked Completed despite 0 rewards | Status is Completed, reward amounts are 0 |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-CMP-003: Usage expires due to completion window

| Field | Value |
|-------|-------|
| **Objective** | Verify a pending usage expires when the completion window elapses |
| **Preconditions** | Program has CompletionWindowInDays=1. Referee claimed more than 1 day ago. |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Verify a pending claim exists that is past the completion window | Claim shows in the system |
| 2 | Wait for the system's background job to process expirations (or trigger manually) | Expiration processing runs |
| 3 | Verify the usage status is now "Expired" | Status changed to Expired |
| 4 | Verify no rewards were allocated | Reward amounts are null/0 |
| 5 | Verify the referee's analytics reflect the expired usage | Expired count incremented |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-CMP-004: Program completion limit triggers LimitReached

| Field | Value |
|-------|-------|
| **Objective** | Verify program auto-transitions to LimitReached when the global cap is hit |
| **Preconditions** | Program has CompletionLimit=1 and no completions yet |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Referee claims and completes the referral | Completion succeeds, CompletionTotal becomes 1 |
| 2 | Verify program status changes to "LimitReached" | Program status is now LimitReached |
| 3 | Verify all active links for this program are marked LimitReached | Links status changed to LimitReached |
| 4 | Attempt to claim another link for this program | Error: completion limit reached |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-CMP-005: Per-referrer completion limit

| Field | Value |
|-------|-------|
| **Objective** | Verify the per-referrer cap is enforced |
| **Preconditions** | Program has CompletionLimitReferee=1. Referrer has one completed usage. |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | First referee claims and completes through the referrer's link | Completion succeeds |
| 2 | Second referee attempts to claim the same referrer's link | Error: per-referrer completion limit reached |
| 3 | Verify another referrer's link for the same program is still claimable | Different referrer's link can be claimed |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

## 12. Test Cases — Edge Cases & Negative Paths

### TC-EDGE-001: Claim link after program end date

| Field | Value |
|-------|-------|
| **Objective** | Verify claims are blocked after the program's end date |
| **Preconditions** | Program was active but DateEnd has passed |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee | Dashboard loads |
| 2 | Attempt to claim a link for the expired program | Error: program has expired |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-EDGE-002: Referee restricted to single program

| Field | Value |
|-------|-------|
| **Objective** | Verify single-program restriction when enabled |
| **Preconditions** | `ReferralRestrictRefereeToSingleProgram=true`. Referee has claimed in Program A. |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referee who has claimed in Program A | Dashboard loads |
| 2 | Attempt to claim a link for Program B | Error: already participated in another program |
| 3 | Verify the claim for Program A is unaffected | Original claim still present |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-EDGE-003: First claim timeout (retroactive claim prevention)

| Field | Value |
|-------|-------|
| **Objective** | Verify old accounts cannot retroactively claim referrals |
| **Preconditions** | `ReferralFirstClaimSinceYoIDOnboardedTimeoutInHours` is set (e.g., 72 hours). User onboarded more than 72 hours ago with no prior claims. |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as the old-onboarded user | Dashboard loads |
| 2 | Attempt to claim a referral link (first ever claim) | Error: "You are already registered. Registration with a referral link only applies to new registrations" |
| 3 | Log in as a recently-onboarded user (within window) | Dashboard loads |
| 4 | Claim the same referral link | Claim succeeds |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-EDGE-004: Concurrent claims on the same link

| Field | Value |
|-------|-------|
| **Objective** | Verify the system handles concurrent claims without data corruption |
| **Preconditions** | Two referee users ready to claim the same link simultaneously |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open the referral link in two different browser sessions (two different referee users) | Both pages loaded |
| 2 | Click "Claim" in both browsers as simultaneously as possible | Both requests sent |
| 3 | Verify each user gets their own independent usage record | Two separate Pending usages created (one per user) |
| 4 | Verify no duplicate usages exist for either user | Exactly one usage per user per program |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-EDGE-005: Non-admin user cannot access admin endpoints

| Field | Value |
|-------|-------|
| **Objective** | Verify role-based access control for admin functionality |
| **Preconditions** | Logged in as regular User (not Admin) |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as regular user | Dashboard loads |
| 2 | Attempt to navigate to admin program management | Access denied or page not visible |
| 3 | Attempt to navigate to block/unblock management | Access denied or page not visible |
| 4 | Attempt to navigate to admin link/usage search | Access denied or page not visible |
| 5 | Verify admin analytics are not accessible | Access denied or page not visible |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

### TC-EDGE-006: User cannot access another user's links

| Field | Value |
|-------|-------|
| **Objective** | Verify referrers can only manage their own links |
| **Preconditions** | Two referrer users exist, each with their own links |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Referrer A | Dashboard loads |
| 2 | View link list | Only Referrer A's links displayed |
| 3 | Attempt to access Referrer B's link by ID (via URL manipulation) | Access denied or 404 |
| 4 | Attempt to cancel Referrer B's link | Access denied |

**Result:** ☐ Pass ☐ Fail ☐ Blocked

---

## 13. Test Execution Log

| Test Case | Tester | Date | Environment | Result | Notes |
|-----------|--------|------|-------------|--------|-------|
| TC-PUB-001 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PUB-002 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PUB-003 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PUB-004 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-001 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-002 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-003 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-004 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-005 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-006 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-007 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-008 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-009 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-010 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-REF-011 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-001 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-002 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-003 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-004 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-005 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-006 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-007 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-008 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-009 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-LNK-010 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-ANA-001 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-ANA-002 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-ANA-003 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-001 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-002 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-003 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-004 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-005 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-006 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-007 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-008 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-009 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-PRG-010 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-BLK-001 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-BLK-002 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-BLK-003 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-BLK-004 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-BLK-005 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-ADM-001 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-ADM-002 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-ADM-003 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-ADM-004 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-CMP-001 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-CMP-002 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-CMP-003 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-CMP-004 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-CMP-005 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-EDGE-001 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-EDGE-002 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-EDGE-003 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-EDGE-004 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-EDGE-005 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
| TC-EDGE-006 | | | | ☐ Pass ☐ Fail ☐ Blocked | |
