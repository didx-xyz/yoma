# Feature: Opportunity Credential Schemas by Type and Custom Fields

## Meta

- **Feature**: Opportunity credential schemas by type
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1277](https://linear.app/didx/issue/YOM-1277/opportunity-credential-schemas-by-type-and-custom-fields)
- **Owner**: Adrian and Jason
- **Areas**: both
- **Status**: in-progress
- **Started**: 2026-08-06

## Problem / Goal

Allow multiple generic and Opportunity-type-specific credential schemas, expose custom fields as
schema attributes, require an applicable schema on credential-enabled opportunities, and issue and
render credentials from the schema identity committed at scheduling and exact version used at issuance.

## Out of Scope

- A cross-framework skill identifier; structured Skills carry names only for now.
- Implementing the didx:me adapter, federation, wallet provisioning or production cutover in this phase.
- Production credential replay before the combined schema/provider migration plan is agreed.
- New venture-location capture, actual placement terms, sustained-employment follow-up or KYC.
- Later attestations, enrichment or follow-up outcomes attached to already-issued credentials; these belong to a future phase, not completion issuance in this delivery.

## Plan

The shared naming, context and protection contract is in the [epic README](../README.md). Delivery
is split across admin schema management (YOM-1278), Opportunity selection (YOM-1279), issuance
(YOM-1280), and three Web tickets (YOM-1281–1283). The current final-composition assessment and
proposed implementation sequence are below. Adrian subsequently authorized **stage 1: schema
configuration**, followed on 2026-10-08 by **stage 2: canonical default assignment**, and on
2026-10-09 by **stage 3: exact-attempt schema identity and successful retry recovery**. All changes
remain uncommitted for his review. This authorizes implementation and isolated testing, not live
provider publication, shared-environment data changes or replay by itself. Adrian subsequently
authorized the non-production Local provider-backed smoke pass on 2026-10-09: all six Opportunity
types and their wallet attributes passed. YoID live issuance failed and its cause remains unconfirmed.
Manual explicit selection remains. Detailed results are in the existing consolidated handoff.

## Stage 1 — Schema Configuration Implemented for Review

This stage implements the attribute catalogue and startup configuration on ACA-Py, not the full
credential rollout. Provider writes were mocked in tests; no live schemas or credentials were
created. All changes remain uncommitted pending Adrian's review.

### Schema Composition

- Learning and Other reuse `Opportunity|Default`.
- Impact Action, Event, Job and Entrepreneurship each get `Opportunity|<TypeContext>|Default`.
- The base set retains issuer name/logo, title, summary, type, non-Job skills and youth display
  name. It adds opportunity location, engagement, recorded participation commitment and submitted
  evidence types. It excludes youth DOB, Completion Date and legacy Difficulty.
- The scoped additions are the exact CF keys in the map below: two for Impact Action, one for
  Event, twelve for Job and fourteen for Entrepreneurship. They resolve labels/options through
  the existing CF services, not hardcoded domain option lists.
- Job excludes both Opportunity and MyOpportunity skill selections: advertised requirements
  must not be signed as skills earned. Job remains Job in type codes and credential presentation.
- YoID retains its existing ten attributes and ACR format. No presets, coordinates, mobile,
  region/city or invented trust/KYC claim is added. Its existing optional-value `n/a` handling stays.

### Core Projections and Presentation

| Schema attribute | Source and meaning | Presentation |
| --- | --- | --- |
| `Opportunity_Countries` | `Countries.LocationDisplayName`: city, region and country together per mapping; coordinates excluded. | Structured items, Opportunity Details, order 10. |
| `Opportunity_EngagementType` | Existing core engagement enum; separate from location. | Opportunity Details, order 20; enum descriptions supply labels such as On-site. |
| `MyOpportunity_CommitmentIntervalDescription` | Recorded MyOpportunity count/unit, not advertised Opportunity effort or independently verified time spent. | Participation commitment, Participation, order 20. |
| `MyOpportunity_Verifications` | Actual submitted verification item types; duplicate types collapse. No file URL, geometry or unused configured evidence is included. | Structured items, Evidence types submitted, Verification, order 10. |

The computed projections are JSON-ignored. They add no request/response property or database
column. The existing generic wallet formatter now reads enum descriptions for display while
keeping signed technical values intact; unknown historical enum values remain readable.
CF presentation continues to use its configured one-level group/order with null subgroups.

### Wallet Card Type Context

Wallet list (`SSICredentialInfo`) and detail (`SSICredential`) responses now include nullable
`typeContext` as a string, using the existing Opportunity Type enum codes: `Learning`, `Other`,
`ImpactAction`, `Event`, `Job` and `Entrepreneurship`. Jason should use this field for the
design's type-specific card colours alongside `schemaType`, not parse a schema name or a display
label. The shared credential base stays generic: `schemaType: "Opportunity"` with
`typeContext: "Job"` identifies a Job card; `schemaType: "YoID"` with `typeContext: null`
identifies a YoID card. The Opportunity enum remains in the signed-value mapper, not on the base.

The existing `Opportunity_Type` catalogue property is now a required system property, using
the existing `System`/`SystemType` mechanism used for Title and issuer/logo attributes. No new
system flag or protection mechanism is introduced. Schema create/update automatically includes
it even when the administrator omits it, so schema management cannot remove it. Its existing property ID
and signed attribute name are retained; no second internal claim or new table/column is added.

The mapper reads **only the signed attribute value** through the issued schema's mapped system
property. There is no schema-name/context fallback and no current Opportunity read. This
distinguishes Learning and Other even when both use the generic Default. Existing credentials
with this claim work without replay; historical schemas lacking it remain readable with a null
`typeContext`. YoID has no subtype context; unsupported historical Opportunity values also return
null and need neutral Opportunity styling. The wallet context is not copied from `SSISchema.TypeContext`.
There is no additional provider request. List items still omit detail-only attributes, and Type
now supplies the common card header rather than appearing again in the detail attribute list.

Historical names are maintained centrally in `SSICredentialOpportunityTypeMapper`, used only
when reading credential values. The verified rename is `Task` → `ImpactAction`, retaining the
same Opportunity Type lookup ID. The original signed `Task` value is not rewritten. Current
codes resolve through the enum; future renames require an explicit historical alias and test.
This does not add aliases to CSV/API lookup inputs. Job remains Job in type codes and credential
presentation. Tests tie the historical alias to the actual migration.

### Issuance Optionality, History and Seeding

- Core value requiredness comes from `SSI.SchemaEntityProperty.Required`, not capture validators.
  Following Adrian's review on 2026-10-08, only these six essential catalogue properties are true:
  `User.DisplayName`, `Organization.Name`, `Opportunity.Title`, `Opportunity.Type`,
  `Opportunity.OrganizationName` and `MyOpportunity.UserDisplayName`. Logos and other business
  attributes remain optional. A system property is automatically included in schemas, but its
  value is only mandatory when `Required` is true; system logos demonstrate the distinction.
- CF `IsRequired` still governs the existing manual admin/youth capture paths. SSI discovery
  exposes mapped CF claims as optional, so valid CSV/partner/link outcomes may omit them.
  Core and CF optional claims use the same existing mapper policy: include populated selected
  values, omit absent values for JWS, and emit `n/a` for ACR. False and zero remain supplied values.
  Essential missing/blank core strings still block issuance for both artifacts.
- Schema startup compares the full public attribute set, including automatically selected
  compatible system properties. Additions and removals create a version; ordering-only changes
  and identical restarts do not. Internal attributes remain managed by the schema service.
- Original DOB, Completion Date and Difficulty metadata is retained for historical/custom/queued
  schemas. New defaults do not select those attributes. The Difficulty compatibility bridge is
  not removed until remaining schema/queued-work inventory makes removal safe. Difficulty capture
  is CF; the retained legacy `Opportunity.Difficulty` mapping now has `Required = false`, so old
  custom/queued schemas consume its resolved CF value when present and artifact optionality when
  absent. Its ID and historical signed data are retained, not backfilled or rewritten.
- Four core catalogue rows are added to the existing **undeployed CF configuration migration**.
  The existing Opportunity Type row is also classified through its existing `SystemType` column
  in the same metadata seed, and the legacy Difficulty row's `Required` is set to false.
  Provider seeding stays outside EF migrations. There is no new fabricated outcome/test-data seed.
- Default attribute selections remain inline in each `SeedSchema` call, following the established
  startup seeding pattern. These are seed inputs, not private runtime schema collections or a new
  DB configuration layer. Schema discovery and issuance continue through the existing schema
  services, DB-backed attribute catalogue and CF metadata.
- Because that migration was edited in place, Jason must **down/reset and recreate his Local
  database** before starting the updated API. Local/Dev environments already on that migration
  need the same reset. Do not assume a restart applies the added metadata rows.

### Validation and Stage Boundary

The consolidated [2026-10-07 handoff](handoffs/2026-10-07-a.md) records commands and actual results.
Tests cover catalogue compatibility, optional claims, historical attribute retention, stable
restarts/removals, provider-failure retry, location/evidence privacy and scalar/list values.

Stage 2 below implements default assignment and existing-Default migration. Stage 3 closes
exact provider schema identity per issuance attempt and provider-success retry recovery. Live
API/provider/wallet checks remain pending; no durable verification-method claim is added. The Job
salary map uses the selected optional-value policy per claim: supplied salary claims are included and missing
JWS claims are omitted. There is no additional salary-tuple suppression in the credential mapper.
Provider and YoID region/city remain excluded from the configured defaults.
Do not describe this stage as a completed credential rollout or production regression sign-off.

## Stage 2 — Canonical Default Assignment Implemented for Review, 2026-10-08

- `SSISSchemaHelper.ToDefaultFullName` is the common naming policy used by startup seeds,
  CSV and Alison/IXO/Umuzi mappings. Learning/Other intentionally share the generic Default;
  the other four types select their scoped Default. Unknown future types fail explicitly.
  This is naming policy, not a second schema store: actual existence and applicability still use
  the existing schema service. Missing scoped schemas do not fall back silently.
- CSV has no schema-selection column. New/schema-less imports and existing managed Default
  assignments follow the imported type. Explicit custom names are retained; existing validation
  rejects missing/incompatible custom selections rather than silently replacing them.
- Partner mappers supply the canonical name for types their existing feed supports. Pull updates
  preserve an administrator's custom schema when the mapper supplies the canonical default.
  Explicit non-default schema names still go through normal applicability validation.
  JobJack/Jobberman verification/issuance remains disabled; no new partner outcome is invented.
- Manual create/update still requires an explicit compatible schema. There is no omitted-schema
  fallback, new selection endpoint or recommendation flag. Web can recommend the returned
  `displayName: "Default"` with matching `typeContext`, using the generic Default for Learning/Other.
  Bind the returned full `name` as the request value and preserve deliberate custom selections.
- The **existing undeployed CF configuration migration** reassigns credential-enabled Opportunities
  on generic Default to the four scoped Defaults. Learning/Other, disabled issuance, null assignments,
  already-scoped assignments and named custom schemas are untouched. Comparison tolerates case and
  surrounding spaces; it does not match custom names containing Default. Only `SSISchemaName` and
  `DateModified` change, within the normal migration transaction. There is no new repository
  interface/method, DI registration, runtime bulk update or post-startup reassignment loop.
  The focused `ApplicationDb_CF_Configuration_Seeding_OpportunitySchemaAssignments` helper owns
  this SQL; the main migration only invokes the seeder after the SSI catalogue seeder.
- Schema names are provider references stored as strings, with no schema foreign key. The migration
  can therefore store their canonical names before the existing startup background job publishes
  them. **Wait for successful schema seeding before release sign-off or scoped-schema testing.**
  A provider outage leaves the names assigned, not invalid relational data; missing schemas follow
  existing validation/issuance error and retry behaviour rather than silently using another schema.
- Queued issuance stores **name, schema type and artifact**, not a pinned schema version. The migration
  changes no Pending/Error/Issued schedule. Processing still resolves the latest version of its
  stored name: an old generic queue stays generic but can use the revised generic version. It does
  not gain scoped CFs or Job-specific skill exclusion merely because its Opportunity is reassigned.
  Already-issued credentials remain tied to their issued schema and are not replayed.
- Local/Dev `post.sql` assigns the same canonical names **before** inserting local issuance schedules.
  Stage/Production do not run that example-data script. They receive the one-time migration and
  normal provider schema seeding. No new table/column or separate migration was introduced.
- Because the original migration is amended, Local/Dev databases already on it need a reset. A
  simple restart does not rerun the reassignment. Subsequent startup seeding never rewrites manual
  schema choices; later CSV/pull updates normalize managed defaults through the common helper.

The consolidated handoff records isolated PostgreSQL migration/default-assignment tests, fresh
migrations/local seeding and current regression evidence. Full authenticated issuance/provider
retry validation remains separate, not an inferred result from assignment tests.

## Stage 3 — Exact Issuance Identity and Retry Recovery, 2026-10-09

- Processing still resolves the latest version of the **scheduled name** for each attempt. It now
  passes that immutable `SchemaId` in the provider request after mapping the claims. The ACA-Py
  adapter retrieves that exact schema by ID, validates its name/artifact and never resolves latest
  again. A concurrent schema update cannot change the schema used to sign the prepared claims.
- The provider interface now returns its existing `Credential` model, including actual `Id`,
  `SchemaId` and signed attributes, rather than only a nullable ID. No new response model or DB
  column is introduced, and the public API/Web contract is unchanged.
- Client-referent recovery runs before the adapter's current-attempt schema/attribute validation.
  JWS uses the existing stored wallet record; AnonCreds uses the holder's existing credential. It
  returns the existing credential unchanged, without a new signature or another wallet record.
- On a recovered older schema ID, processing uses the existing exact-schema service to obtain its
  version. Scheduled name, schema type and artifact must still match before marking the schedule
  Issued. Missing/unknown/mismatched returned identities follow existing error/retry handling,
  rather than recording the newly resolved latest version against an older credential.
- Failed attempts still clear the success-only `SchemaVersion` and retain their scheduled name,
  artifact, referent and retry policy. There is no schedule-time version pin, queue rewrite, replay,
  new transaction, lookup table, reward change or new business-requiredness rule.
- Regression cases exercise all six Opportunity types and YoID, a schema change during an attempt,
  provider success followed by a local-save failure, version drift on retry and malformed recovery.
  Adapter tests exercise real ACA-Py client code with intercepted SDK HTTP traffic, including exact
  JWS selection and historical JWS/AnonCreds recovery. No real provider was called.

The approved configuration/assignment and these issuance fixes are implemented for review.
Authenticated Local API/provider/wallet testing is the next delivery gate, not yet a completed
live-provider sign-off. Additional claim choices in the original assessment are not invented here.

### Final Review and Jason's Rendering Contract, 2026-10-09

Adrian has reviewed stages 1–3 and accepted the configured claim sets and implementation, subject
to the final regression pass and Local smoke tests. The original assessment below remains a record
of the proposal; it does not introduce additional claims or salary-specific mapper rules.

The consolidated handoff contains the [per-type rendering matrix and Web instructions](handoffs/2026-10-07-a.md#handoff-to-jason).
Jason uses `schemaType` plus the signed-value-derived `typeContext` for the BA design's card
colour/icon treatment. Detail fields are one API-ordered core/CF collection; render supplied labels,
values, structured items and consecutive group runs without hardcoded per-type field lists.
The final review adds an all-six-type configured-claims-to-wallet regression, using real migration
presentation metadata. Provider writes remain intercepted/mocked until the Local smoke pass.

## Final Credential Phase — Assessment and Proposal, 2026-10-07

> The assessment below is the original plan. Stages 1–3 above record the implemented
> boundary; suggested additional claims are not silently part of the configured defaults.

### Scope and Evidence

Work on `feature/cf-implementation`. Finish the domain mappings and end-to-end credentials on the
existing ACA-Py/AriesCloud provider first; implement the didx:me replacement afterwards against the
same domain contracts. Include **YoID** as well as all six Opportunity types.

Confirmed with Adrian on 2026-10-07: this phase concerns the credential issued upon completed
verification for each Opportunity type. **Job stays Job**, including credential presentation;
the BA/client's alternative naming proposal is not adopted. No later employment attestation or
additional issuance flow is introduced.

Ship the revised base Default and type-specific defaults where their approved claim sets differ;
types with the same claim set reuse the base Default. Existing schema management remains.
YoID stays ACR/AnonCreds on ACA-Py: every declared schema attribute needs a value, so the existing
`n/a` handling remains for missing optional source values. Opportunity credentials stay JWS/JWT:
omit missing optional claims instead of introducing placeholders. YoID excludes user presets,
coordinates and an invented ID/KYC verification-level claim. The didx:me preset optional-field
capability will be validated when implementing that provider; it does not change ACA-Py rules now.

Sources reviewed:

- [BA Consideratons workbook](https://docs.google.com/spreadsheets/d/16p2ZsxcI3nwSQwTGtDmIxO0IagHzbRcePl7buaduOXw/edit), read live on 2026-10-07: Yoma Credentials; All Opportunities; Jobs; Impact Action & Event; MyOpportunity Completion Custom Fields; Entrepreneurship; User. The sheet was not edited.
- The final-implementation columns, not only the original recommendations or Required columns.
- [Entrepreneurship decisions](../YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-09-29-b.md) and [current CF groups / reference contracts](../YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-10-05-a.md).
- Existing YOM-1278/1279/1280 feature docs and handoffs; [Jason's wallet contract](../YOM-1283-ui-youth-opportunity-credential-display/feature.md).
- Current SSI schema discovery, startup seeding, issuance, provider adapter and wallet code; core Opportunity/MyOpportunity models; the actual CF configuration migrations and CSV/partner assignment paths.

Precedence: Adrian's later decisions and implemented capture semantics supersede stale BA cells.
The credential sheet expresses desired claims, but cannot make unavailable data mandatory or
turn programme metadata into a youth-specific achieved outcome. Capture fields are not
automatically all credential attributes. The approved map must explicitly include or exclude each.

### What Is Already Built

- Generic `Opportunity|Name` and scoped `Opportunity|TypeContext|Name` schemas. Context uses the stable Opportunity Type name, not its display label.
- Static and CF attribute discovery, compatibility checks, immutable schema identity and provider-created versions.
- Opportunity-selected schema names, queued issuance, tenant dependencies, retry handling and duplicate prevention.
- CF mapping by definition key, lookup/option display resolution, invariant scalar values and structured multi-select values.
- Exact provider schema-ID lookup for historical wallet reads, legacy comma-delimited Skills support and one API-owned grouped attribute response.
- `IsSchemaMapped` protection and repair after provider success/local persistence failure.

This is a final configuration/mapping pass with a few necessary gaps to close, not another CF
framework or a new credential engine.

### Baseline Gaps and Progress

| Area | Current fact | Planned treatment |
| --- | --- | --- |
| Startup composition | Previously only generic Opportunity and YoID were seeded, with youth DOB and Completion Date on Opportunity. | Stage 1 configures the revised base/four scoped defaults and retains historical versions; live publication is not run. |
| Seed comparison | Previously addition-only, so removals did not update a schema. | Stage 1 compares the complete public set plus compatible automatic system properties; removals and stable restarts are tested. Internal attributes remain managed by the schema service. |
| Capture vs issuance | Previously `Required = definition.IsRequired` could reject legitimate incomplete external outcomes. | Stage 1 makes CF issuance claims optional without changing capture definitions/validators. |
| New core claims | Location, commitment and actual submitted evidence needed deliberate projections. | Stage 1 extends the existing catalogue/reflection path; no separate CF resolver or new persistence columns. |
| Job skills | Both Opportunity.Skills and MyOpportunity.Skills expose the advertised requirement list. | Stage 1 excludes both from the scoped Job default; stage 2 assigns that default for future managed-default completions. Existing generic queues/custom schemas are not redirected. |
| Schema assignment | CSV and partner mappings formerly selected generic Default; manual management requires a compatible selection. | Stage 2 uses common canonical naming, preserves custom choices and migrates existing generic Defaults. No manual omitted-schema fallback or startup reassignment. |
| Processing version | The original adapter resolved latest by name again after the domain had mapped against a version. | Stage 3 pins the resolved immutable schema identity for the attempt, so mapping, signing and recorded version cannot diverge under a concurrent schema update. |
| Provider-success retry | The original provider returned only an already-issued ID, allowing the domain to record its newly resolved version. | Stage 3 returns the actual credential/schema identity and records its historical version. Preserve idempotency. |
| Difficulty cleanup | Old SSI metadata still reflects `Opportunity.Difficulty`; a temporary CF-to-Difficulty projection remains. | Remove use from new approved schemas. Retain historical metadata/read compatibility and any needed pending-custom-schema bridge until an inventory proves removal safe. |
| Verification facts | Persisted MyOpportunity contains evidence items and sync state, but not a durable snapshot of every actual verification route; Opportunity method/types are editable configuration. | Capture the minimal actual verification provenance on completion where needed. Never label the current configured method/types as proven historical evidence. |
| Wallet card type | Wallet responses previously exposed schema type Opportunity, title and attributes, but not the underlying Opportunity type for card styling. | Stage 1 returns generic nullable `typeContext` from the signed system claim, including the historical Task alias. Use it alongside `schemaType`; YoID context is null. Job stays Job; no schema-name inference or replay requirement. |
| Historical metadata | Exact provider schema ID fixes the attribute set, while property/CF labels, requiredness and grouping are resolved from current application metadata. | Preserve old mappings/types and signed values. Keep layout changes explicitly unsigned/retroactive; do not claim that today's metadata is a versioned snapshot. |

### Rules Carried Forward

1. Issue an Opportunity credential only from a successfully completed verification. Creating an Opportunity, clicking Apply or supplying CFs is not issuance.
2. Manual admin capture and manual youth completion enforce the existing configured CF requirements. CSV/import and partner paths may omit CFs; supplied values still validate. Instant/action links intentionally skip completion CF capture.
3. Missing optional JWS claims are omitted, not signed as `not available`, `not applicable`, zero or a guessed default. Explicit `false`, zero jobs created and Pre-revenue remain real values.
4. YoID currently uses ACR. Its existing `n/a` handling is a provider requirement for declared optional attributes, not a reason to introduce placeholders into new Opportunity JWS credentials. Do not silently switch the artifact type in this phase.
5. Date of Issuance comes from the existing system issuance metadata. It is not MyOpportunity.DateCompleted, employment start date or a separately entered CF.
6. DOB belongs on YoID, not Opportunity credentials. No preferences or self-attested skills become verified identity/achievement claims.
7. An owning Organisation remains the issuer. Core Provider is informational and cannot change signing identity, permissions or tenant ownership.
8. Opportunity location describes where the programme/opportunity is offered. It is not proof of the youth's physical participation or their venture address. Engagement remains a separate concept.
9. Programme targeting, tools, qualifications, job experience expectations, accessibility and required/preferred skills do not attest achievement. Do not include them indiscriminately because they are configured CFs/core fields.
10. The selected schema name/type/artifact remain committed at scheduling. Later Opportunity changes do not redirect queued work. Current processing-time data semantics remain an explicit constraint; this phase does not quietly introduce a complete historical outcome snapshot.

### Seeded Schema Catalogue — Stage 1

Names below are configured in startup seeding, not published to a live provider in this session.
Existing names/history remain accessible. The base attribute set is shared in code/configuration,
but each provider schema has a concrete attribute list; there is no provider-level inheritance.

| Opportunity type | Configured schema | Difference from the revised generic default |
| --- | --- | --- |
| Learning | `Opportunity\|Default` | No extra credential claim approved in the current sheet. Difficulty is explicitly marked No for credentials. |
| Other | `Opportunity\|Default` | Same approved claim set; do not duplicate a schema just to repeat its attributes. |
| ImpactAction | `Opportunity\|ImpactAction\|Default` | Actual Impact achieved, plus optional Verified activity type as activity context. |
| Event | `Opportunity\|Event\|Default` | Optional Event role; no inferred Participant default. |
| Job | `Opportunity\|Job\|Default` | Job classification, advertised employment/compensation terms and actual placement start when known. Excludes Skills Earned. Job remains the type and presentation name. |
| Entrepreneurship | `Opportunity\|Entrepreneurship\|Default` | Individual venture/outcome CFs, with programme context clearly separated. |

If Learning/Other Difficulty is subsequently approved as a credential claim, each has a different
context-specific CF key and will need an explicit mapped schema; it cannot be added to the generic
default by treating the two definitions as one. Likewise, a missing expected configured type schema
is a deployment error, not permission to silently fall back and lose approved claims. Fallback is
for types deliberately mapped to the generic set.

### Revised Generic Opportunity Attribute Map

R = essential issuance identity; O = optional claim when actual source data exists. Requiredness
here is for credential issuance, not manual capture. Core display-label/group proposals are
configuration to approve; existing attribute names must remain stable where reused.

| Claim | Source / representation | Requiredness and qualification |
| --- | --- | --- |
| Opportunity title | Opportunity.Title; existing fixed header | R. Text, not a mutable Opportunity URL. |
| Issuer | Owning Organisation name/tenant; optional issuer logo | R name/identity; O logo. Provider does not replace issuer. |
| Opportunity type | Stable Opportunity type, with readable presentation | R. Required system claim; schema management cannot remove it. Job remains Job in platform data and credential presentation. |
| Summary | Opportunity.Summary | O at issuance for incomplete/historical imports, even though manual capture requires it. |
| Youth display name | MyOpportunity.UserDisplayName | R under the existing identity contract. |
| Date of Issuance | `_Date_Issued` / wallet DateIssued | R system metadata, displayed once in the header. No Completion Date masquerading as issuance. |
| Skills earned | Existing Opportunity skill selection for applicable non-Job completions | O; keep structured items. Excluded entirely from Job credentials. Self-attested user selections are never a source. |
| Opportunity location | Country mappings with country, optional region/city, formatted as structured readable items | O. One item per country, no country-to-city flattening that loses associations. Proposed default excludes coordinates; country/region/city suffice for this claim. |
| Engagement | Core Remote / On-site / Hybrid display value | O across types; no inference from location. |
| Participation commitment | MyOpportunity commitment interval/count when known, retaining units | O. Recorded commitment, not independently verified time spent; no new Duration CF or substitution from advertised Opportunity effort. |
| Verification method | Actual completed-verification provenance | O when reliably known, not the current Opportunity configuration. Not included in stage 1; route detail must be durable before signing it. |
| Evidence types used | Actual MyOpportunity.Verifications, named types | O. Do not issue the configured list of permitted evidence as though every type was submitted. |
| Informational provider | Opportunity.Provider | Proposed O, clearly labelled Provider, separate from issuer. Not included in stage 1; needs approval because the credential column is blank. |

Recommendation: keep completion date out of the new default, following the client distinction
between verified/issued and true completion. Retain the old field mapping for old schemas. Do not
sign temporary file URLs, photo contents, private storage keys, user contact details or geometry as
evidence. Existing evidence remains stored in Yoma; stable authorized evidence references/hashes
can be a later explicit design, not a public expiring link embedded in an immutable credential.

The following new/retained core fields are **not** proposed as default claims: incentive preference,
advertised reward/pool/payment configuration, accessibility support/accommodations, age bounds,
targeted groups, categories, languages, SDGs, keywords, status/visibility and sync identifiers.
They describe availability, discovery or programme intent rather than attained facts. SDGs could
later be an explicitly labelled programme-context claim, not an assertion of achieved impact.

### Type-Specific CF Map

Every field below is O for issuance. Keep `IsRequired` and conditional validation on the existing
manual capture routes; missing data from trusted/import/link routes must not strand credentials.
Only mapped definitions acquire schema-mapped protection. No mapping uses a display label as a key.

| Type | Entity / key | Credential treatment |
| --- | --- | --- |
| Impact Action | MyOpportunity `impactActionImpactAchieved` | Actual outcome text; never substituted with planned Opportunity summary. |
| Impact Action | Opportunity `impactActionVerifiedActivityType` | Optional activity classification/context; does not choose a separate schema or itself prove completion. |
| Event | MyOpportunity `eventRole` | Optional selected role, resolved through its configured options. Blank stays absent. |
| Job | Opportunity `jobIndustry`, `jobCategory` | ISIC/ISCO labels for the advertised role, keeping the classification identity clear. |
| Job | Opportunity `jobEmploymentType`, `jobWorkSchedule` | Separate advertised terms; Employment type is structured multi-select. Do not claim different actual placement terms were captured. |
| Job | Opportunity `jobEmploymentDuration`, `jobEmploymentDurationUnit` | Advertised contract duration/unit, separate from actual participation duration. Permanent does not imply a fabricated numeric duration. |
| Job | Opportunity `jobSalaryDisclosed`, `jobSalaryMinimum`, `jobSalaryMaximum`, `jobSalaryCurrency`, `jobPayInterval` | Advertised-compensation context, not salary earned/paid. The original proposal to suppress incomplete tuples was not implemented: the agreed generic optional-claim policy includes populated selected claims and omits absent JWS claims. Manual capture validates the tuple; permitted partial external data remains partial. |
| Job | MyOpportunity `jobEmploymentStartDate` | Actual optional placement start, date-only. Not application deadline or generic participation start. |
| Entrepreneurship | Opportunity `entrepreneurshipProgrammeType`, `entrepreneurshipProgrammeOtherDescription` | Optional programme context, using the approved Other relationship. |
| Entrepreneurship | MyOpportunity `entrepreneurshipBusinessName`, `entrepreneurshipBusinessSummary` | Youth's venture/trading name and summary. Keep the programme title/summary distinct; do not replace one with the other. |
| Entrepreneurship | MyOpportunity `entrepreneurshipBusinessRegistered`, `entrepreneurshipRegistrationReference` | Reported registered status and optional reference. False is valid; do not invent a registration number or claim registry verification. |
| Entrepreneurship | MyOpportunity `entrepreneurshipSector` | Venture sector, resolved through the ISIC options; not programme category. |
| Entrepreneurship | MyOpportunity `entrepreneurshipJobsCreated` | Count excluding founder. Zero differs from missing. |
| Entrepreneurship | MyOpportunity `entrepreneurshipRevenueBand`, `entrepreneurshipRevenueCurrency` | Monthly USD-equivalent band plus separately labelled reported revenue currency. Currency does not redefine the band's USD thresholds. |
| Entrepreneurship | MyOpportunity `entrepreneurshipFundingTypes`, `entrepreneurshipFundingAmountBand`, `entrepreneurshipFunder` | Funding actually reported as secured: structured types, aggregate band and optional funder. Not repeatable transactions. |
| Entrepreneurship | MyOpportunity `entrepreneurshipClientLocation` | Customer reach; not physical venture location. |

Explicit exclusions: Learning/Other/Impact/Event Difficulty, Job experience level/minimum
qualification/preferred skills, Impact tools/Other tool description, and Entrepreneurship venture
stage targeted. These are requirements/targeting, not earned outcomes. Venture physical location
was deferred and is not silently filled from the programme or user profile. No placement/probation
status CF, combined Position Type or sustained-employment CF was added; completed verification is
the qualifying outcome. The advertised Job terms need approval as credential context because the
sheet does not distinguish them clearly from actual placement terms.

### YoID Review and Proposed Map

YoID is a profile/identity credential, not a discovery-preference credential. Its current schema
also predates the latest profile/location changes. The User tab explicitly excludes User Goal and
self-attested skills from credentials, and treats accessibility preferences as private.

| Item | Recommendation |
| --- | --- |
| Issuer and display-name header | Retain Yoma organisation issuer/logo and User.DisplayName. |
| First name / surname | Retain existing profile claims; do not make historical optional metadata globally required just because today's form requires it. |
| DOB | Retain on YoID only. Clearly self-declared, not independently verified age. |
| Country | Retain named profile country, not its GUID as youth-facing value. |
| Region / city | Proposed optional profile-location extension, separate from country. Needs privacy/sign-off decision below. |
| Coordinates / LocationSource | Exclude by default: search/provenance mechanics, not needed for a portable identity claim. No precise device fix exists in this model. |
| Gender | Retain existing declared value. Required in today's profile form does not make old credentials or historical users suddenly corrupt. |
| Education | Retain optional value; use the expanded lookup label on new issuance, never rewrite old signed values or turn it into proof of qualification. |
| Email / mobile | Recommend preserve the existing optional Email claim for compatibility; do not add mobile by default. Both are contact details and may change. Phone-only users must still issue successfully. |
| ID verification level | Not added, confirmed by Adrian. No Yoma-wide KYC level exists; do not substitute an invented Self-declared level. Contact OTP and payout KYC remain separate flows, not YoID identity-verification claims. |
| Date of Issuance | Existing system issuance metadata, displayed once. Not onboarding date. |
| User presets | Exclude goal, category preferences, engagement preferences, maximum commitment, incentive preference, languages, accessibility needs/Other text and self-attested skills. |
| Verified skills | Keep separate achievement credentials/Passport relationship; do not copy a changing accumulated skill list into the identity credential. |
| Internal fields | Exclude external IDs, login dates, settings, onboarding booleans, photos/storage metadata and reward/payout state. |

A profile/preference update does not currently reissue YoID. The one-issuance-per-user rule and
old issued credentials remain unchanged during this implementation. A deliberate replacement/replay
strategy is part of the later migration, not an extra credential on every profile save.

### Grouping, Ordering and Rendering

- Preserve the existing API-owned `group`, `subGroup`, `sortOrder`, `nameDisplay`, `valueDisplay` and `itemsDisplay` response. Jason renders it verbatim, without resolving keys/IDs or resorting it.
- Use one configured group level, consistent with the 39 final CF definitions; configured `SubGroup` stays null. The framework's optional subgroup capability is not removed.
- Retain each mapped CF's configured group/order: Classification, Compensation, Employment, Placement, Activity, Impact, Participation, Programme, Venture and Outcomes as applicable.
- Configure new core claims into coherent shared groups such as Opportunity Details, Participation, Verification and Youth Details, with collision-free within-group order. Fixed issuer/title/date headers stay outside detail groups.
- The existing helper sorts group names before within-group sort order. Do not claim that a numeric field order also orders the groups. Keep that default unless a deliberate group-order requirement is agreed; no new grouping engine is proposed.
- Complex lists remain structured `itemsDisplay`; labels containing commas, slashes or punctuation must not be split. Locations need a defined projection, not `.ToString()` on country objects or several unassociated lists.
- Layout is unsigned application metadata and can change how old credentials are arranged without altering signed claims. Old signed values remain authoritative; historical schema mappings must remain resolvable.

### Schema Selection and Data Transition

Boundary approved and implemented for stage 2 on 2026-10-08:

1. One canonical seeded catalogue selects the approved type-specific schema or the intentionally shared Default. Do not choose the first schema matching a context: admins may create several.
2. Manual management retains explicit schema selection and compatibility validation. Expose/identify the recommended schema so Web can preselect it; do not overwrite a valid custom choice. This provides the requested default/type fallback without silently changing the established admin contract.
3. CSV/new partner Opportunities use the same resolver, not repeated provider-specific Default literals. On update preserve a compatible explicit custom selection; handle a type change deliberately, not by retaining an incompatible context.
4. The existing CF migration reassigns credential-enabled Opportunities on generic Default by type for future completions. Schema names are not foreign keys; normal startup provider seeding follows. Preserve named custom schemas, their histories and unrelated Opportunity fields.
5. Existing queued Pending/Error issuance names are not repointed. Processing uses the latest version of their stored name, not a version frozen at scheduling. Retain exact historical discovery for issued credentials. Inventory pending/custom schemas before removing the Difficulty bridge.
6. Alison remains Learning and can use the revised Default. IXO Impact Actions need the canonical Impact Action schema where issuance is already enabled. Do not turn JobJack/Jobberman verification/issuance on solely because a scoped Job default is configured; their current feeds do not establish a confirmed placement outcome. Future partner completion mappings require actual supplied outcomes.
7. Seed application metadata through the established EF migration pattern, and provider schemas through idempotent SSI seeding. Provider calls do not belong inside a DB migration transaction. Local/Dev examples stay Local/Dev; shared environments receive configuration, not fabricated outcomes.
8. Apply the CF migration, then let the existing startup seed publish provider configuration. Validate successful seeding and tenant/provider prerequisites before release sign-off; provider failure does not undo the assigned reference strings or justify fallback to another schema.

Historical issued credentials are not modified, deleted or silently replaced. The existing issuance
uniqueness key means reissue cannot be implemented by simply scheduling the same entity again.
Prepare a separate resumable replay/replacement design for the didx:me transition, including old
wallet/credential IDs, source data gaps, issued-version provenance and partial failure recovery.
Do not perform a production-wide replay on ACA-Py and then repeat it on didx:me.

### Implementation Sequence After Approval

1. **Freeze the map.** Resolve the decision list below and record final claim labels, sources, requiredness, grouping/order and exclusions. Update the BA final-implementation column only after the map is approved, not during this assessment.
2. **Close framework gaps surgically.** Separate CF capture-requiredness from issuance-requiredness; normalize complete schema comparisons; pin provider schema identity/actual success metadata; make historical metadata survive retirement of old capture properties. Keep existing services, injected validators, common CF resolution and readable Yoma grouping/ordering patterns.
3. **Add core claim projections.** Named country locations, readable engagement, unit-preserving participation duration and reliable completed-verification provenance. Persist the minimal new provenance only if needed to tell the truth about the route; older unknown values stay unknown. Avoid a new public endpoint or a hardcoded per-field CF helper.
4. **Configure schemas and presentation.** Revised Default and YoID, then Impact Action, Event, Job and Entrepreneurship. Seed explicit approved attribute sets, not every active CF automatically. Mark mappings/protection after provider success and prove repeated startup is a no-op.
5. **Integrate assignment.** Shared resolver for CSV/partners, recommendation for manual selection, controlled existing-Default reassignment and queued-issuance safeguards. Leave unrelated import, verification, referral, reward and wallet behaviours alone.
6. **Verify end to end.** Focused tests, full regression suite, fresh migration and upgrade rehearsal, then authenticated API completion/issuance/wallet tests with the existing provider. Ask Jason to verify the real grouped wallet views and any schema-display/recommended-selection additions.
7. **Handover and migration readiness.** Consolidate API/Web handoffs and BA expected behaviour. Record production preflight and replay requirements. Then move to the separately planned didx:me adapter/proof/cutover phase.

### Required Test Evidence Before Calling This Complete

- All six Opportunity types plus YoID: full supplied data and legitimate missing optional data; Learning/Other share Default and every distinct claim set resolves the canonical scoped schema.
- Manual create/update/completion remains strict where intended; CSV and partner incomplete CFs issue; instant/action-link completion issues without completion CFs. Supplied invalid data still fails before persistence/issuance.
- Job credentials contain no earned required/preferred skills; non-Job skills still award/sign correctly. User preferences/self-attested skills are absent from all credentials.
- Actual versus programme data: no invented Job start/duration, no venture location inferred from country/profile, no advertised salary asserted as paid salary and no planned impact asserted as achieved impact.
- Explicit false/zero, Pre-revenue, missing values, date-only/UTC, decimal and currency/interval tuples, Other pairs, long Unicode labels and multi-select labels containing commas.
- Multiple country locations keep their associations; Worldwide stays Worldwide and does not become a guessed Digital location. Radius/distance is never signed.
- Optional JWS omission and ACR placeholder requirements; phone-only YoID, absent Education and historical incomplete profile fields.
- Only Completed verification schedules issuance; Pending/Rejected/duplicate requests do not produce credentials or additional rewards. Existing tenant-pending and retry flows remain safe.
- Full-set schema changes: addition, removal, mixed changes, normalized duplicates and identical startup; provider/local failure recovery, no spurious schema-version churn.
- Schema update during an issuance attempt and provider-success/local-failure retry: signed schema ID, domain recorded version and wallet result agree; one credential per client referent.
- Existing compatible custom schema, incompatible type change, missing expected configured schema and existing-Default reassignment; no silent custom-choice overwrite or pending-work redirection.
- Historical Default/YoID versions, old DOB/Completion Date/Difficulty fields, legacy comma Skills and `n/a`: wallet list/detail continue to resolve after new schemas ship. New optional metadata must not break old credentials.
- One-level group-contiguous ordering, core/CF interleaving and fixed header dates; Jason's component does not need raw JSON parsing or hardcoded field branches.
- Fresh Local/Dev seed plus an existing-database migration rehearsal. Test data must not seed Stage/Production. Runtime provider tests require confirmed isolated wallets/schema storage, not merely local environment settings against an unverified shared provider.

This is the full-phase test target, not a claim that every scenario has run. Stage-1/2 evidence is
recorded separately in the consolidated handoff, including isolated PostgreSQL migration/seed
and default-assignment tests. No live provider publication or end-to-end issuance smoke test had
run at that stage. Subsequent 2026-10-09 Local provider-backed Opportunity issuance and wallet
readback are recorded in the consolidated handoff; YoID live issuance remains failed/unverified.

### Review Outcome — Configured Scope

| Decision | Current implementation accepted for Local testing |
| --- | --- |
| Scope of CF inclusion | Use the explicit map above, not every configured CF. Learning/Other reuse Default because Difficulty is marked non-credential in the sheet. |
| Job terms and salary | Included as advertised context; actual start stays optional. Generic optionality applies per claim; no inferred actual placement terms or salary-tuple suppression. |
| Core Provider | Not selected by the defaults. The earlier informational-provider suggestion was not implemented; it never replaces issuer. |
| YoID privacy/content | Keep the existing ten-attribute ACR set, including optional Email/Education. No region/city, coordinates/source, mobile, presets or invented KYC level is added. |

The original BA Mandatory cells are not proposed as new completion/issuance gates. In particular,
Job start/location/engagement and Entrepreneurship registration-reference/location cannot become
mandatory when the final capture implementation permits them to be absent or did not add them.

## Tasks

- [x] Establish type-context naming, parsing and validation groundwork.
- [x] Add Opportunity Type stable names and separate display names.
- [x] Expose type-aware static and custom-field schema attributes.
- [x] Persist and self-heal schema-mapped custom-field protection.
- [x] Complete explicit Opportunity schema selection and compatibility rules.
- [x] Assign canonical defaults in Alison/IXO/Umuzi mappings without enabling Jobberman/JobJack verification or issuance.
- [x] Resolve approved type-compatible defaults for CSV imports and retain custom selections for applicability validation.
- [x] Resolve and persist the latest version of the scheduled schema when issuance is processed.
- [x] Map custom-field values and structured Skills into issued credentials.
- [x] Render scalar and structured attributes from the exact issued schema version through an API-prepared wallet contract.
- [ ] Complete the three Web surfaces.
- [x] Configure revised base and type-specific startup seeds for Adrian's stage-1 review; retain YoID ACR attributes.
- [x] Assess the live BA workbook against final core/CF implementation, historical SSI contracts and YoID.
- [x] Review and accept the configured stage-1–3 map, exclusions, privacy choices and resolver boundary; distinguish unimplemented assessment suggestions.
- [x] Close seed-removal and CF issuance-requiredness gaps without changing manual capture.
- [x] Add core location/commitment/submitted-evidence projections and generic readable enum presentation.
- [x] Protect the signed Opportunity Type through the existing system-property mechanism and expose it on wallet cards, with tested historical Task compatibility.
- [x] Audit core issuance requiredness, retain the six essential claims and make the legacy Difficulty mapping optional without changing CF/manual capture rules.
- [x] Bring across the master referral test repairs only and rerun regression with referral tests included.
- [x] Close exact-attempt schema and provider-success retry/version gaps.
- [x] Migrate existing generic Default assignments by type, preserving custom choices and existing queues; no runtime reassignment.
- [x] Consolidate Jason's per-type rendering instructions and final API regression evidence before Local smoke testing.
- [x] Normalize Local/Dev search-fixture dates in `post.sql` to UTC day boundaries; leave existing DB data and validation unchanged.
- [x] Prepare and API-confirm Completed Local test-user records covering all six Opportunity types, using normal issuance scheduling; Adrian runs Hangfire jobs.
- [x] Retrieve provider-issued Local wallet list/details for all six selected types; verify basic metadata, supplied CF labels, structured items and optional omissions.
- [x] Complete the independent live schema/source attribute comparison for all six issued Opportunity types: 377 assertions passed across 46 returned attributes.
- [ ] Capture and assess the YoID live issuance error separately; do not mark ACR issuance passed or infer an environment cause.
- [ ] Verify complete historical metadata/queued-work compatibility through authenticated provider issuance and wallet checks.
- [ ] Execute the complete credential-phase test matrix and record actual evidence.
- [ ] Prepare the later didx:me cutover/replay plan without executing a production replay in this phase.

## Decisions

- 2026-10-09: Adrian authorized authenticated Local API completion/scheduling against his recreated DB, followed by him triggering tenant/issuance jobs and read-only DB checks. Six-type Completed coverage and successful provider-backed wallet list/detail readback are confirmed. After an API restart, all 377 independent schema/source attribute assertions passed across 46 returned attributes. Reused seeded submissions omit completion CF values, so this live pass must not be described as full populated-CF coverage. YoID issuance failed according to Adrian and its cause is not confirmed. Exact disposable Local IDs, issued IDs and observed results are recorded in the consolidated handoff. No direct DB writes, replay, agent-triggered jobs or commits.
- 2026-10-09: Adrian requested a script-only correction for Local pending-verification seeding: new search fixtures had retained start times while normal verification removes them. `post.sql` now uses UTC midnight starts and end-of-day ends, preserving expired/future/open-ended scenarios. No current database repair or further test execution was requested; prior test evidence predates this correction.
- 2026-08-06: Opportunity Type `Name` is a fixed technical code; `DisplayName` may change.
- 2026-08-06: Generic `Opportunity|Default` is an explicit selectable schema, not an automatic fallback.
- 2026-08-06: Changing an Opportunity type requires explicit schema reselection.
- 2026-08-13: The schema full name, type and artifact are committed at scheduling. Processing resolves
  the latest version of that scheduled schema, and wallet retrieval renders the exact issued version.
- 2026-08-12: Alison and IXO retain `Opportunity|Default` temporarily; Jobberman and JobJack intentionally keep verification and issuance disabled while their scope remains Opportunity sync only.
- 2026-10-07: Adrian first requested assessment/plan before implementation on `feature/cf-implementation`, using the live Yoma Credentials tab and other credential columns reconciled with final CF decisions. YoID is explicitly in scope. The initial assessment did not change API code or publish schemas.
- 2026-10-07: The earlier exclusion of final schema composition is superseded by this planning phase. Automatic/manual fallback policy remains a decision to approve, not an already implemented change.
- 2026-10-07: Adrian confirmed completion-only Opportunity credentials, retaining schema management with a revised base Default and type-specific defaults where applicable. Job remains Job in both type codes and credential presentation; the alternative BA/client naming proposal is not adopted. YoID excludes presets, coordinates and invented ID/KYC claims; its existing ACR missing-value placeholders remain. Opportunity JWS/JWT issuance omits missing optional claims. Other proposed claim-map and assignment choices still require review before development.
- 2026-10-07: The wallet card type comes only from the signed claim through the exact issued schema's system-property mapping. No schema/context fallback or current Opportunity lookup is used. Historical Task maps centrally to ImpactAction without rewriting the credential; missing/unsupported signed types remain null and need neutral styling. Existing credentials do not require replay. The initial response-property name is superseded by the generic `typeContext` decision below.
- 2026-10-07: Adrian authorized stage-1 schema configuration, explicitly uncommitted and subject to review. Scoped defaults use `Opportunity|<TypeContext>|Default`; Learning/Other share the generic Default. CF capture requirements remain intact while issuance claims are optional. No live provider calls, assignment transition or production replay were authorized or executed in this stage.
- 2026-10-07: The old referral-fixture callback failure was initially deferred while completing schema configuration. Adrian then explicitly requested the master fixture repair. Only test/helper hunks from verified master commits `38808173c` and `40ad184c5` were brought across, without a full merge or production referral/Keycloak changes. All forty referral tests pass; the broader run now includes them (452 passed, 11 DB-dependent cases skipped). Everything remains uncommitted for review.
- 2026-10-08: Adrian confirmed that issuance requiredness is reserved for essential core claims in `SSI.SchemaEntityProperty.Required`; CF issuance claims stay optional regardless of capture `IsRequired`. The core audit retains six required identity/header/recipient properties and changes the retained legacy Difficulty mapping to optional. Populated optional core/CF values are included, missing JWS values are omitted, and missing ACR values use the established `n/a`. Tests read the actual migration updates and guard both the six-field allowlist and legacy CF-to-Difficulty compatibility. No capture validator or historical signed credential was changed.
- 2026-10-08: Adrian approved generic nullable `SSICredentialBase.TypeContext` instead of an Opportunity-specific property on the shared base. Wallet list/detail expose a canonical string alongside `SchemaType`; the existing Opportunity enum mapper validates and normalizes only the signed claim. YoID context remains null. No schema-context fallback, new signed claim, persistence change or credential replay is introduced.
- 2026-10-08: Adrian authorized stage-2 assignment work and approved moving existing generic Default assignments for future completions. Following review, this is one-time SQL in the existing undeployed CF migration, not a repository extension or post-startup job. Schema names have no provider-schema foreign key; normal startup seeding follows the migration. Manual selection stays explicit; CSV/pull mappings share canonical naming and preserve custom names. Queued names/type/artifact and issued credentials are untouched; queue processing remains latest-version-by-stored-name. All changes remain uncommitted.
- 2026-10-09: Adrian requested the default-assignment SQL follow the existing migration-seeding structure. It now lives in the focused Opportunity schema-assignment seeder, called from the same SSI region and operation position. SQL, transaction handling and scope are unchanged; provider schemas still publish through the existing startup job, not this DB seeder.
- 2026-10-09: Adrian requested code completion before the Local ACA-Py smoke pass. Exact-attempt schema identity and provider-success/local-failure recovery are now implemented through the existing provider request/credential models, without DB changes. Latest-at-processing scheduling semantics remain; recovered credentials keep their actual old version. Adapter HTTP is intercepted in tests, not sent to a live provider. All work remains uncommitted for review.
- 2026-10-09: Adrian accepted the reviewed stages 1–3 and requested one comprehensive final pass before guided Local testing. The configured claim sets are the implementation boundary, not every suggestion in the original assessment. Jason's handoff now distinguishes type styling from metadata-driven field rendering and records the agreed differences from the raw BA cells. All changes remain uncommitted.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1277](https://linear.app/didx/issue/YOM-1277/opportunity-credential-schemas-by-type-and-custom-fields)
- API children: [YOM-1278](../YOM-1278-api-admin-credential-schema-management-by-type/feature.md) · [YOM-1279](../YOM-1279-api-opportunity-management-credential-schema-selection/feature.md) · [YOM-1280](https://linear.app/didx/issue/YOM-1280)
