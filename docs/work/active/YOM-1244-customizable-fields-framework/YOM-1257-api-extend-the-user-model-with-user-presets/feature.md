# Feature: User-owned preferences

## Meta

- **Feature**: User-owned preferences
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1257](https://linear.app/didx/issue/YOM-1257)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-09-28

## Problem / Goal

Give youth one editable set of User-owned preferences: self-attested EMSI skills, Opportunity Categories, a single User Goal, maximum time commitment, accessibility requirements, engagement, incentive and preferred languages. Preferences have dedicated authenticated read and write endpoints, separate from the frequently loaded and UI-cached profile response and its Keycloak-synchronized update path.

## Out of Scope

- No new preference fields in Keycloak or YoID credentials.
- No arbitrary JSON, Keycloak profile field, or automatic opportunity matching in this feature.
- Opportunity location storage and region/city/radius search are owned by YOM-1254; see its consolidated 2026-09-28-a handover, Country and location section.

## Plan

- Keep User as the owner, but persist optional scalar selections in a one-to-one `Entity.UserPreferences` row (`UserId` primary/foreign key). Its multi-select links are `Entity.UserPreferenceEngagementTypes`, `Entity.UserPreferenceCategories`, `Entity.UserPreferenceAccessibilityRequirements` and `Entity.UserPreferenceLanguages`, all foreign-keyed to that row. A user with no row reads as empty preferences; the first PATCH creates it. Skills remain in `Entity.UserSkills`. Do not add these fields to `Entity.User` or a JSON column.
- Add `UserSkillType` (`SelfAttested`, `Verified`) to existing `UserSkills`. Existing rows become Verified without changing their IDs or awarding-organisation links.
- Add non-null `DateModified` to `UserSkills`. Existing rows receive their `DateCreated` value; new rows set both to creation time, and type promotion updates `DateModified`.
- Store the optional `Categories` selection using the existing Opportunity Category lookup, with a unique preference/category pair. No new taxonomy or migration of existing users is needed.
- Store optional single-select `GoalId` on UserPreferences, referencing the new controlled `Entity.UserGoal` lookup. Seed Get a job, Learn new skills, Start a business, Volunteer / make an impact and Attend events. Expose `goalId` and `goal` on preferences, not the User or UserProfile wire contracts.
- Reuse Opportunity's commitment shape on UserPreferences: nullable `CommitmentIntervalId` FK to `Lookup.TimeInterval` and nullable `CommitmentIntervalCount` smallint. This means maximum total time per Opportunity; both values must be present or absent.
- Add shared `Lookup.Accessibility` (16 approved values, including Other and Flexible Hours). Store optional requirements in the preference link table and conditional `AccessibilityRequirementOtherDescription` on UserPreferences. These sensitive values are not sent to providers or credentials by default; per-application disclosure requires separate consent.
- Reuse `Lookup.EngagementType` for optional multi-select `UserPreferences.EngagementTypes`, stored in `Entity.UserPreferenceEngagementTypes`. Preserve the three existing IDs and Opportunity links with keys `Remote`, `OnSite`, `Hybrid` and display names `Remote`, `On-site`, `Hybrid`. The forward migration retains the old scalar choice as one link without inventing a choice for null.
- Store nullable `UserPreferences.Incentivized`: true prefers an incentive, false prefers none, null means no preference. This is not a reward-type selection; Opportunity-side filtering/ranking is separate.
- Add optional multi-select `Languages` using the existing `Lookup.Language` reference list. The preference links have unique user/language pairs; null or empty on PATCH clears the selection.
- Allow youth to replace their complete self-attested skill selection through a dedicated authenticated User Preferences PATCH endpoint. Missing, null or empty selection clears it. Validate supplied EMSI IDs and deduplicate; never remove or downgrade verified rows. Follow opportunity update orchestration: the profile service wraps removal and assignment in one execution strategy and transaction; UserService has focused assign/remove methods.
- On non-Job opportunity completion, promote the same UserSkill row from SelfAttested to Verified and add the awarding organisation. Repeated awards may add more organisations. Job skills are role requirements and are never awarded merely because a placement completes.
- Read and upsert the full `UserPreferences` through dedicated self-service endpoints, using the authenticated user context. The complete PATCH includes `goalId`, `commitmentIntervalId`, `commitmentIntervalCount`, `engagementTypes`, `incentivized`, `categories`, `accessibilityRequirements`, `accessibilityRequirementOtherDescription`, `languages` and `skillsSelfAttested`; omitting a selection clears it. PATCH engagement entries are IDs; responses contain lookup objects. `GET /user` and admin User reads do not embed preferences. `GET /user/skills` returns all skills, optionally filtered by `type` (`SelfAttested` or `Verified`); earned-skills UI should request/filter Verified.
- Handoff to Jason: his existing preference mock is a UI prototype, not the API contract. It suggests returning skill names for re-editing while persisting IDs; the final API shape follows the User model and existing service patterns. Skipping skills for one discovery search must not clear persisted preferences.

## Tasks

- [x] Replace scalar engagement with a validated/deduplicated multi-select, preference-owned link repository and lossless forward migration. Verify complete replacement, validation rollback and old-choice preservation; see the [2026-10-01 handoff](../handoffs/2026-10-01-c.md).
- [x] Add Yoma-only user location to profile create/update/read, without a separate location endpoint; use flat fields and shared user request validation.
- [x] Extend the existing profile country with region, city, source and a city-centre coordinate pair in one PostGIS geography(point,4326) column on User.

- [x] Add type and modification date to the UserSkill model, database mapping and consolidated CF migration.
- [x] Add self-attested skill validation and transactional replacement/update behavior.
- [x] Promote a self-attested skill on verified completion; preserve multiple awarding organisations.
- [x] Exclude Job-required skills from completion-time awards and cover the exclusion with a regression test.
- [x] Expose separate authenticated preferences GET and PATCH endpoints without modifying the youth profile contract.
- [x] Add the User/Opportunity Category mapping, validation, full-update replacement and read models.
- [x] Make the unfiltered Opportunity Category lookup available to authenticated users for the preferences picker.
- [x] Add optional single-select User Goal lookup, nullable User mapping, preferences update/read contract and authenticated reference endpoint.
- [x] Add optional commitment interval/count pair to User and preferences, with shared interval lookup and pair validation.
- [x] Add shared Accessibility lookup, User-owned requirements multi-select, conditional Other text and full preferences replacement.
- [x] Standardise shared Engagement Type keys/display names without changing IDs; use canonical names for CSV export/import, explicitly map legacy wire names in each applicable partner sync, and add single-select User engagement preference.
- [x] Add nullable, all-Opportunity incentive preference to UserPreferences, the complete preferences contract and the consolidated CF migration.
- [x] Move preferences to a one-to-one UserPreferences table, with preference-owned category/accommodation/language links and no User-column duplication.
- [x] Add optional preferred languages using the existing Language lookup and complete replacement semantics.
- [x] Cover duplicate, verified-conflict, removal and promotion cases with tests.
- [x] Document Jason's API contract.
- [ ] Apply the consolidated migration and validate the API/UI on Stage after the branch is merged.

## Decisions

- 2026-10-01: Adrian approved multi-select engagement, superseding the historical single-select decision below. `engagementTypes` replaces preference `engagementTypeId`/`engagementType`; Opportunity engagement remains single-select. Remote plus On-site is valid and Hybrid remains a distinct option, not an alias for the pair. All supplied IDs are validated and deduplicated; omitted/null/empty clears on the complete PATCH. Web owns inheritance, skips and effective search criteria; no API preference mapper is added. See the [current breaking contract](../handoffs/2026-10-01-c.md).
- 2026-09-28: Keep location capture provider-neutral. `LocationSource` uses `Lookup`, `Device`, `Manual`, following the API's enum-name convention. Persist LocationSource for the UI's manual-entry hint after reload. Do not persist or expose a provider place ID; Jason's code only needs that identifier while resolving a new selection. His current `places` maps to `Lookup`, `device` to `Device`, and `manual` to `Manual`.

- 2026-09-29: Location is a core User extension, not preferences. Shared UserRequestBase carries Region, City, Coordinates and LocationSource for user/profile upserts. Profile create/update validates these fields directly through UserRequestValidatorBase; no standalone location endpoint, request or validator remains. User and UserProfile responses expose the flat fields. Location stays Yoma-only; country identity synchronization is unchanged.
- 2026-09-28: Use the globally applicable name `Region`. Coordinates are a nullable `double[]` in Geometry's order `[longitude, latitude]`, with exactly two finite in-range values and no elevation. No separate coordinate model. User stores coordinates in one nullable PostGIS geography(point,4326) column; the API still uses the array. No shared Location model/interface remains. Coordinate validation is now shared with Opportunity location under YOM-1254.
- 2026-09-28: The existing profile country is authoritative and is extended by location; no second country ID is stored or returned. Full profile create/update can save the selected country and location together. Omitted/null flat location fields clear the saved values. Profile update requires a valid non-Worldwide `countryId`, even when no optional place details are supplied. Jason must clear/reselect the place when changing country. Internal user upserts assign country and location directly under the existing new/unlinked-user guard; omitted/null details clear them. ToUserRequest carries all location fields when constructing a full update from an existing user. Radius is a per-search choice, not persisted user data.

- 2026-09-28: Canonical name is **User Preferences**. “Personalization” names Jason's UI experience; the Linear ticket retains its existing “User Presets” title.
- 2026-09-28: Superseding the initial User-column approach, use a one-to-one `Entity.UserPreferences` row for scalar choices and preference-owned relational links for multi-select choices. This preserves referential integrity and querying without cluttering the User table or bloating routine User reads. The row is created on first PATCH; existing users need no backfill. `UserSkills` remains separate because verified skills and awarding organisations predate preferences.
- 2026-09-28: New preferences do not go to Keycloak. Their write endpoint is separate from the current profile update, which synchronizes identity data to Keycloak.
- 2026-09-28: A user-skill pair cannot be both self-attested and verified. Existing rows are verified; completion promotes a self-attested row rather than duplicating it.
- 2026-09-28: Job skills describe requirements, not attainment. Completion of a Job placement must not add or promote them to Verified. The existing unconditional completion path violated this rule; the CF branch now guards it centrally in skill assignment. A separate Production hotfix remains necessary before the CF branch ships.
- 2026-09-28: Final read contract: `GET/PATCH /user/preferences` is the sole youth-facing preferences API; no user ID route parameter. `GET /user` does not embed preferences or expose an inclusion flag because it is frequently loaded and cached in the UI. Earlier optional profile-inclusion designs, both partial and full, were superseded. `GET /user/skills` accepts nullable `type`; omitted returns both types, and the existing YoID UI must filter Verified.
- 2026-09-28: Opportunity Categories are the first non-skill preference. The canonical lookup remains in the Opportunity domain, while `Entity.UserPreferenceCategories` owns the selection. The API property is `categories` under UserPreferences; no `Preferred` or `Opportunity` prefix is needed there. The sheet's TargetCareerCategories means this selection, not Job Industry.
- 2026-09-28: User Goal is an optional single-select User-domain lookup, not an Opportunity Type or Industry. Add Attend events alongside Get a job, Learn new skills, Start a business and Volunteer / make an impact. Use sentence case for all goal and accessibility lookup names. Store the goal ID on UserPreferences; the complete PATCH clears it when null/omitted. No goal-to-opportunity filtering or credential issuance is implemented here.
- 2026-09-28: Follow existing User lookup shape: one human-readable `Name`, no redundant `DisplayName` or Goal enum. The preferences response flattens the selected lookup to `goalId` and `goal` (name). Routine and admin User responses do not embed preferences; future matching should use the selected Goal ID.
- 2026-09-28: Time commitment is a **maximum**, but its API fields deliberately mirror Opportunity's `CommitmentIntervalId` and `CommitmentIntervalCount` without a Maximum prefix. The preferences response also returns the same `CommitmentInterval` enum. Interval and count must both be specified or both null; matching is deferred to YOM-1258.
- 2026-09-28: `Accessibility` is the common Lookup-domain reference list; `AccessibilityRequirements` names the youth's optional selection. Selecting Other requires a non-empty description up to 500 characters; description without Other is invalid. No Opportunity CF, matching, credential, partner disclosure or per-application consent implementation is included in this step.
- 2026-09-28: Superseded the initial `AccessibilityAccommodation` / `AccessibilityNeeds` names before release. The shared lookup is `Accessibility`; the youth preference is `AccessibilityRequirements`, with `AccessibilityRequirementOtherDescription` for Other. The lookup route is `/api/v3/lookup/accessibility`.
- 2026-09-28: User Engagement Preference is a single-select nullable `EngagementTypeId`. Jason's prototype also uses a multi-select *Opportunity search filter*, which does not change the stored preference's cardinality. `Lookup.EngagementType.Name` is the enum-compatible key (`Remote`, `OnSite`, `Hybrid`); `DisplayName` supplies the UI label (`On-site`). CSV export writes the canonical enum name and CSV import accepts that same lookup name; no legacy or display-name aliases are accepted there. Each partner with incoming engagement data declares its own legacy mapping: IXO and Umuzi map `Online`→`Remote` and `Offline`→`OnSite` before resolving the canonical lookup. Missing values default to `Remote`; unknown values fail. Alison has a fixed Remote mapping. No generic lookup or sync extension accepts legacy aliases. Opportunity matching remains deferred.
- 2026-09-28: The approved sheet proposes a saved incentive preference. Use `UserPreferences.Incentivized` (`bool?`), not the prototype's removed `paidWork`: true prefers any incentive (ZLTO, money, voucher or another benefit), false prefers none, null is no preference. It applies to all Opportunity types. Reward Type remains separate. Opportunity-side `IsIncentivized` and preference-driven ordering are later work.
- 2026-09-28: The optional `/user/skills` filter runs on the already loaded, name-ordered user skill collection. The repository parses the database string to `UserSkillType`; no hidden raw string field is maintained without a current database-filtering use.
- 2026-09-28: PATCH represents the complete preferences model, not a partial merge. A missing, null or empty `SkillsSelfAttested` list clears that selection, matching opportunity request update semantics.
- 2026-09-28: The external requirement calls them self-reported skills; the API contract uses `SkillsSelfAttested` and `UserSkillType.SelfAttested`. This is unverified self-assertion, not a verifiable credential or award.
- 2026-09-28: Prefer proactive UI prevention of selecting an already verified skill: obtain the user's verified IDs from `GET /user/skills?type=Verified`, show matching search results as already verified/disabled, and retain API rejection as the race/stale-data safeguard. Do not hide the skill from search without explanation.
- 2026-09-28: Domain logic selects only self-attested rows for removal. The repository additionally uses an atomic conditional delete on stored Type, not as a second policy layer but to prevent a concurrent completion from promoting a row between the domain check and deletion.
- 2026-09-28: Preferred Languages is an optional multi-select using the existing `Lookup.Language`; `Entity.UserPreferenceLanguages` owns the links and the API property is `languages`. Null/missing/empty on the complete PATCH clears the selection. Country/location and preference-to-search mappings remain separate follow-up work.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1257](https://linear.app/didx/issue/YOM-1257)
- PRs:
- Designs:
- Related: [YOM-1261](../YOM-1261-ui-manage-user-presets/feature.md)
