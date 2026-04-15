Opportunities CSV Import — README

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
- Difficulty
- EffortCount
- EffortInterval

These fields may be left blank in the CSV.

For **all other opportunity types**, Engagement and Skills remain optional.
Difficulty and effort fields must still comply with the reference data lists.

------------------------------------------------------------------------

1) Inputs & Artifacts

Reference JSON files:

- opportunities_categories.json
- opportunities_difficulty.json
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
- Type — required; must match opportunities_types.json (name)
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
- Difficulty — required; must match opportunities_difficulty.json (name)
- EffortCount — required; integer > 0
- EffortInterval — required; must match opportunities_effortInterval.json (name)

For **Type = Job**:

- Engagement — optional
- Skills — optional
- Difficulty — optional
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
- Booleans: `Yes` / `No` only
- Dates: `YYYY-MM-DD` or `YYYY/MM/DD`
- Languages: ISO alpha-2 codes from opportunities_languages.json
- Location: ISO alpha-2 codes from opportunities_locations.json (incl. `WW`)
- Whitespace: trim cells; blanks = missing; no empty tokens

------------------------------------------------------------------------

6) Reference Data

All values must come from the JSON reference files.

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
- Difficulty: required
- EffortCount: > 0
- EffortInterval: must match opportunities_effortInterval.json

For **Type = Job**:

- Skills: optional
- Difficulty: optional
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
- Difficulty
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
- Difficulty → opportunities_difficulty.json
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
