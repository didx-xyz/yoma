Opportunities CSV Import - README

This document defines the exact structure, formatting, reference data,
and validation rules for importing Opportunities via CSV.
It is written for our custom GPT to follow deterministically (no
guessing; reference-data only).

------------------------------------------------------------------------

0) Job Opportunity Type

The platform supports a special opportunity type called **Job**.

Job opportunities represent employment listings imported from external
providers (e.g. Jobberman) or manual job imports.

Because employment listings do not use the same classification system
as learning or activity opportunities, certain fields are **optional
for Job opportunities**.

For **Type = Job**, the following fields are optional:

- Engagement
- Skills
- EffortCount
- EffortInterval

These fields may be left blank in the CSV.

For **all other opportunity types**, Engagement and Skills remain optional.
Effort fields must still comply with the reference data lists.
Difficulty is now a type-specific custom field; see the custom-field section below.

------------------------------------------------------------------------

1) Inputs & Artifacts

Reference JSON files:

- opportunities_categories.json
- opportunities_effortInterval.json
- opportunities_engagement.json
- opportunities_languages.json (ISO alpha-2 codes)
- opportunities_locations.json (ISO alpha-2 codes; includes WW for Worldwide)
- opportunities_skills.json
- opportunities_types.json

CSV DTO model:

OpportunityInfoCsvImport.cs

Important mappings:

- Location → Countries (ISO alpha-2 list)
- EffortCount → CommitmentIntervalCount
- EffortInterval → CommitmentInterval
- Hidden → Hidden (bool: Yes/No)

Sample CSV:

OpportunityInfoCsvImport_Sample.csv

Always follow the sample for column order and formatting.

------------------------------------------------------------------------

2) Required Headers

These headers must exist, and values must comply with rules.

The following fields are always required:

- Title — required; 1–150 characters
- Type — required; use a name from opportunities_types.json (ImpactAction for the displayed Impact Action type).
- Categories — required; ≥1 from opportunities_categories.json (name); `|`-delimited
- Summary — required; 1–150 characters
- Description — required
- Languages — required; ISO alpha-2 codes from opportunities_languages.json; `|`-delimited
- Location — required; ISO alpha-2 codes from opportunities_locations.json; may include `WW`; `|`-delimited (e.g. `WW|ZA|GB`)
- DateStart — required; valid date; formats: `YYYY-MM-DD` or `YYYY/MM/DD`
- Keywords — required; `|`-delimited; no empty items; no commas; length 1–500
- Hidden — required; `Yes` / `No`
- ExternalId — required; 1–50 characters; unique per organisation

Additional rules depending on opportunity type:

For all opportunity types **except Job**:

- Engagement — optional; must match opportunities_engagement.json if specified
- Skills — optional; must match opportunities_skills.json if specified
- EffortCount — required; integer > 0
- EffortInterval — required; must match opportunities_effortInterval.json (name)

For **Type = Job**:

- Engagement — optional
- Skills — optional
- EffortCount — optional
- EffortInterval — optional

If **EffortCount** or **EffortInterval** is provided for a Job opportunity,
**both fields must be provided together**.

------------------------------------------------------------------------

3) Optional Headers

Headers must exist but values may be empty.

- Link — valid URL (1–2048 chars)
- DateEnd — optional date (≥ DateStart); formats: YYYY-MM-DD or YYYY/MM/DD
- ParticipantLimit — integer > 0 (not supported if verification disabled)
- ZltoReward — integer > 0 ≤ 2000
- ZltoRewardPool — integer ≥ ZltoReward, ≤ 10,000,000
- YomaReward — number > 0 ≤ 2000
- YomaRewardPool — number ≥ YomaReward, ≤ 10,000,000

------------------------------------------------------------------------

4) Defaults (not settable in CSV)

- VerificationEnabled: Enabled
- VerificationMethod: Automatic
- CredentialIssuanceEnabled: Enabled
- SSISchemaName: Opportunity|Default
- Instructions: Deprecated
- ShareWithPartners: null / false

------------------------------------------------------------------------

5) Formatting Rules

- CSV delimiter: `,`
- Multi-select delimiter: `|`
- Enclose the entire CSV cell in double quotes when it contains commas, double quotes, or line breaks. Escape an embedded double quote by doubling it.
- Category names can contain commas. Keep the complete name intact and use `|` between categories, e.g. `"Technology, AI & Data|Other"`. Commas inside a category name are not multi-select separators.
- Booleans: `Yes` / `No` only
- Dates: `YYYY-MM-DD` or `YYYY/MM/DD`
- Languages: ISO alpha-2 codes from opportunities_languages.json
- Location: ISO alpha-2 codes from opportunities_locations.json (incl. `WW`)
- Whitespace: trim cells; blanks = missing; no empty tokens

------------------------------------------------------------------------

6) Reference Data

All values must come from the JSON reference files.

After the category taxonomy migration, refresh opportunities_categories.json
from the target environment's migrated category lookup before generating imports.
Use only the current approved category names; legacy names are not accepted as
CSV aliases. Partner-specific legacy category mappings do not apply to CSV imports.
Retain Other where appropriate; it remains a valid category.

Values must match **exactly**.

GPT must **not invent or guess values**.

------------------------------------------------------------------------

7) CSV → Model Mapping

All headers bind directly to model fields as defined in
OpportunityInfoCsvImport.cs.

Key mappings:

- Location → Countries
- EffortCount → CommitmentIntervalCount
- EffortInterval → CommitmentInterval
- Hidden → Hidden

------------------------------------------------------------------------

8) Validation Summary

General validation:

- Title: 1–150 chars
- Summary: 1–150 chars
- Description: required
- ExternalId: 1–50 chars
- DateStart: required; not MinValue
- DateEnd: optional, must be ≥ DateStart

Type-specific validation:

For **all types except Job**:

- Skills: optional (must exist if specified)
- EffortCount: > 0
- EffortInterval: must match opportunities_effortInterval.json

For **Type = Job**:

- Skills: optional
- EffortCount: optional
- EffortInterval: optional

Other validations:

Keywords:

- Required
- `|`-delimited list
- No empty items
- No commas
- Length 1–500

If Keywords are not provided, auto-generate from:

- Title
- Summary
- Description
- Categories
- Skills
- Type
- EffortCount + EffortInterval
- Languages
- Location

Keywords must be trimmed, unique, and relevant terms.

Additional validations:

- Languages: ISO alpha-2 codes, from reference list
- Location: ISO alpha-2 codes, may include `WW`
- Skills: must match opportunities_skills.json
- ZltoReward: int > 0 ≤ 2000
- ZltoRewardPool: int ≥ ZltoReward ≤ 10,000,000
- YomaReward: number > 0 ≤ 2000
- YomaRewardPool: number ≥ YomaReward ≤ 10,000,000
- ParticipantLimit: int > 0 (not allowed if verification disabled)

------------------------------------------------------------------------

9) Error Messages

Error messages must be **short and generic**.

Examples:

- Missing required field
- Must be between X and Y
- Must be greater than 0
- Invalid enum value
- Not in reference list
- Contains empty values or commas
- Invalid date format
- Header issues (missing, duplicate, unexpected)

------------------------------------------------------------------------

10) Enumerations

Always use names from reference JSON files.

- Type → opportunities_types.json
- EffortInterval → opportunities_effortInterval.json
- Engagement → opportunities_engagement.json
- Categories → opportunities_categories.json

------------------------------------------------------------------------

11) Examples

See:

OpportunityInfoCsvImport_Sample.csv

------------------------------------------------------------------------

12) Date Parsing

Accept both formats with zero-padding:

- yyyy-MM-dd
- yyyy/MM/dd

------------------------------------------------------------------------

13) Custom GPT Runtime Behaviour

Do not auto-run validation.

After generating or cleaning a file, always ask:

“Run validation now?”

Only run validation if the user explicitly confirms.

Never provide validation report downloads.

Validation results are shown only inline as highlights.

File behaviour:

- Always return download links only for the generated clean CSV file
- Never output local file paths

Data cleaning rules:

- Detect and exclude phantom rows
- Any row with blank Title or empty is ignored
- These rows are silently dropped

Formatting enforcement:

- Multi-select fields must use `|`
- Header order must match the sample file exactly
- Booleans must be `Yes` / `No`

Reference enforcement:

- Resolve list values strictly against reference JSON files
- If a value is not found, mark as invalid
- Never auto-map unknown values

User communication rules:

Simplify responses for business users.

Always explain:

✅ What was filled in  
⚠️ What is still missing

Avoid technical terminology.

Example:

✅ “I’ve added the Title, Summary, and Languages.”  
⚠️ “The Skills field is still missing for 3 rows. Please provide them.”

------------------------------------------------------------------------

Core metadata additions (CF implementation)

The new columns are optional in CSV. When updating an existing opportunity,
an omitted new column preserves its stored value. A present blank cell clears
the corresponding optional value or selection. Manual API capture additionally
requires an explicit Incentivized selection.

- Provider: informational provider name, maximum 255 characters. This does not
  change the organisation that owns the opportunity.
- Incentivized: Yes / No / blank (not specified). Not restricted to jobs.
- RewardType: None / ZLTO / PartnerIncentive (use the exact enum names).
- PartnerIncentiveAmount: positive amount, up to four decimal places, only for
  PartnerIncentive.
- PartnerIncentiveCurrency: current ISO 4217 code from GET /api/v3/lookup/currency,
  required together with PartnerIncentiveAmount. ZLTO is not a currency code.
- AccessibilitySupport: Yes / No / AvailableOnRequest / blank.
- Accommodations: approved names from GET /api/v3/lookup/accessibility, separated
  by |. Yes requires at least one; No/blank cannot carry accommodations.
- AccommodationOtherDescription: required only when Other is selected, maximum
  500 characters.
- AgeFrom / AgeTo: optional non-negative whole years, inclusive; AgeTo must not
  be less than AgeFrom.
- TargetedGroups: approved names from GET /api/v3/lookup/targeted/group, separated
  by |. Open to all must be selected alone.
- SustainableDevelopmentGoals: official goal numbers (1–17) or exact lookup
  names from GET /api/v3/lookup/sustainable/development/goal, separated by |.
  Exports use numbers.

Jobs cannot offer ZLTO rewards or pools. A Job may be incentivized without a
reward type because its remuneration belongs to the job salary custom fields.
An incentivized non-Job requires ZLTO or PartnerIncentive. An opportunity with a
reward cannot be marked No. Partner incentives are informational: Yoma does not
pay or convert them.

For older CSVs without RewardType, a supplied ZltoReward establishes ZLTO.
For updates, an existing PartnerIncentive type is retained when its column is
omitted. An omitted Incentivized column is inferred as Yes when a reward is
explicit. Send the complete reward fields together when changing reward type.

Region, city and coordinates remain excluded from CSV. Location remains the
country-code selection; retained countries preserve their stored details.

Only the API samples are updated here. Jason must copy the approved samples
to the web application as part of the UI work.

------------------------------------------------------------------------

Difficulty / experience level custom fields

The core Difficulty column and /opportunity/difficulty lookup are removed.
Do not send Difficulty or DifficultyId. Retrieve current definitions/options from
GET /api/v3/opportunity/custom/field/definition?types=<Type>.

Use CF:<definitionKey> headers and the applicable option key:
- Learning: CF:learningDifficulty — Beginner, Intermediate, Advanced, AnyLevel.
- Other: CF:otherDifficulty — Beginner, Intermediate, Advanced, AnyLevel.
- ImpactAction: CF:impactActionDifficulty — EntryLevel, ExperienceNeeded, SkillsRequired.
- Event: CF:eventDifficulty — OpenToAll, FamiliarityNeeded, ExperiencedIndividuals.
- Job: CF:jobExperienceLevel — None, EntryJunior, Mid, Senior.

Each is a single-select. The existing CF parser also accepts the exact option
display name, but examples use stable keys. A shared template may include several
types' CF columns: leave non-applicable cells blank; populated non-applicable
values are rejected. Do not infer years of Job experience from legacy difficulty.

Manual API create/update requires the applicable field. CSV and partner sync
retain the framework's PatchAllowMissingRequired behaviour: omitted columns
preserve existing values, present blanks clear them, and supplied values must
match the current type's definition. New rows may remain unspecified when absent.
The report export carries keys and values in the existing flattened Custom Fields
column; there is no separate core Difficulty export column. Report exports are
not import templates: imports use the CF:<definitionKey> columns described above.
The flattened report retains inline option keys and lookup IDs, including Education,
Currency and Skill references. CSV imports resolve the human-facing names/codes
listed below; do not use the report as an import template.

------------------------------------------------------------------------

Job-specific custom fields

The Job sample includes the approved CF columns. All are handled by the existing
CF importer; omitted columns preserve values and present blank cells clear them.
Reference current definitions rather than inventing option values:
- CF:jobSalaryDisclosed: true / false.
- CF:jobSalaryMinimum and CF:jobSalaryMaximum: positive decimal amounts; maximum
  must not be below minimum. Either bound may be supplied independently.
- CF:jobSalaryCurrency: ISO currency code from /api/v3/lookup/currency.
- CF:jobPayInterval: PerYear / PerMonth / PerHour / PerEngagement.
- CF:jobEmploymentType: Permanent / FixedTerm / Internship / Apprenticeship /
  FreelanceConsultancy / TemporarySeasonal; separate multiple selections with |.
- CF:jobWorkSchedule: FullTime / PartTime.
- CF:jobEmploymentDuration: positive whole number.
- CF:jobEmploymentDurationUnit: Months / Years.
- CF:jobMinimumQualification: exact Education name from /api/v3/lookup/education.
- CF:jobPreferredSkills: exact skill names separated with |, resolved through
  the existing Skill lookup. These supplement core required Skills, not replace them.
- CF:jobIndustry: UN ISIC Revision 5 Section code (A-V).
- CF:jobCategory: ISCO-08 two-digit Sub-major Group code; retain leading zeroes.

Industry describes the employer's economic sector; Job category describes the
occupation. Neither replaces the core Opportunity Categories selection.

SalaryDisclosed=false excludes amounts, currency and pay interval. Salary details
cannot accompany Incentivized=No. Permanent and FixedTerm cannot be combined;
Permanent excludes employment duration and its unit. These consistency checks
also apply against stored values during partial imports: clear old dependent
values in the same row when changing their controlling value.

Manual API saves require the mandatory Job definitions plus core DateEnd and
Skills. Disclosed salary requires at least one amount, currency and interval;
non-permanent employment requires duration and unit. CSV/partner imports may
remain incomplete but supplied values must still be valid and consistent.
Existing Jobs are not backfilled with guessed qualifications, salary or industry.
