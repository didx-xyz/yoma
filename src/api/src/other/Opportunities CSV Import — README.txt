Opportunities CSV Import — README

This document defines the exact structure, formatting, reference data,
and validation rules for importing Opportunities via CSV.
It is written for our custom GPT to follow deterministically (no
guessing; reference-data only).

------------------------------------------------------------------------

0) Inputs & Artifacts

-   Reference JSON files:
    -   opportunities_categories.json
    -   opportunities_difficulty.json
    -   opportunities_effortInterval.json
    -   opportunities_engagement.json
    -   opportunities_languages.json (ISO alpha-2 codes)
    -   opportunities_locations.json (ISO alpha-2 codes; includes WW for
        Worldwide)
    -   opportunities_skills.json
    -   opportunities_types.json
-   CSV DTO model: OpportunityInfoCsvImport.cs
    Important mappings:
    -   Location → Countries (ISO alpha-2 list)
    -   EffortCount → CommitmentIntervalCount
    -   EffortInterval → CommitmentInterval
    -   Hidden → Hidden (bool: Yes/No)
-   Sample CSV: OpportunityInfoCsvImport_Sample.csv
    Always follow the sample for column order and formatting.

------------------------------------------------------------------------

1) Required Headers

These headers must exist, and values must comply with rules:

-   Title — required; 1–150 characters
-   Type — required; must match opportunities_types.json (name)
-   Categories — required; ≥1 from opportunities_categories.json (name);
    |-delimited
-   Summary — required; 1–150 characters
-   Description — required
-   Languages — required; ISO alpha-2 codes from
    opportunities_languages.json; |-delimited
-   Location — required; ISO alpha-2 codes from
    opportunities_locations.json; may include WW; |-delimited (e.g.,
    WW|ZA|GB)
-   Difficulty — required; must match opportunities_difficulty.json
    (name)
-   EffortCount — required; integer > 0
-   EffortInterval — required; must match
    opportunities_effortInterval.json (name)
-   DateStart — required; valid date; formats: YYYY-MM-DD or YYYY/MM/DD
-   Skills — required; one or more from opportunities_skills.json
    (name); |-delimited
-   Keywords — required; |-delimited; no empty items; no commas; length
    1–500
-   Hidden — required; Yes / No
-   ExternalId — required; 1–50 characters; unique per organisation

Headers are case-sensitive and order must exactly match the sample file.

------------------------------------------------------------------------

2) Optional Headers

Headers must exist but values may be empty:

-   Engagement — Online | Offline | Hybrid (from
    opportunities_engagement.json)
-   Link — valid URL (1–2048 chars)
-   DateEnd — optional date (≥ DateStart); formats: YYYY-MM-DD or
    YYYY/MM/DD
-   ParticipantLimit — integer > 0 (not supported if verification
    disabled)
-   ZltoReward — integer > 0 ≤ 2000
-   ZltoRewardPool — integer ≥ ZltoReward, ≤ 10,000,000
-   YomaReward — number > 0 ≤ 2000
-   YomaRewardPool — number ≥ YomaReward, ≤ 10,000,000

------------------------------------------------------------------------

3) Defaults (not settable in CSV)

-   VerificationEnabled: Enabled
-   VerificationMethod: Automatic
-   CredentialIssuanceEnabled: Enabled
-   SSISchemaName: Opportunity|Default
-   Instructions: Deprecated
-   ShareWithPartners: null / false

------------------------------------------------------------------------

4) Formatting Rules

-   CSV delimiter: ,
-   Multi-select delimiter: |
-   Booleans: Yes / No only
-   Dates: YYYY-MM-DD or YYYY/MM/DD
-   Languages: ISO alpha-2 codes from opportunities_languages.json
-   Location: ISO alpha-2 codes from opportunities_locations.json
    (incl. WW)
-   Whitespace: trim cells; blanks = missing; no empty tokens

------------------------------------------------------------------------

5) Reference Data

All values must come from the JSON reference files. GPT must not invent
or guess.

------------------------------------------------------------------------

6) CSV → Model Mapping

See sample file — all headers bind directly to model fields, as defined
in OpportunityInfoCsvImport.cs.

------------------------------------------------------------------------

7) Validation Summary

-   Title: 1–150 chars
-   Summary: 1–150 chars
-   Description: required
-   ExternalId: 1–50 chars
-   EffortCount: > 0
-   EffortInterval / Type / Difficulty / Engagement: must match
    reference files
-   DateStart: required; not MinValue
-   DateEnd: optional, must be ≥ DateStart
-   Keywords: required; used for search/SEO.
    -   Must be |-delimited list, no empty items, no commas, length
        1–500.
    -   If not provided, auto-generate from: Title, Summary,
        Description, Categories, Skills, Type, Difficulty,
        EffortCount+EffortInterval, Languages, Location.
    -   Must be trimmed, unique, and relevant terms.
-   Languages: ISO alpha-2 codes, from reference list
-   Location: ISO alpha-2 codes, may include WW
-   Skills: must match opportunities_skills.json
-   ZltoReward: int > 0 ≤ 2000
-   ZltoRewardPool: int ≥ ZltoReward ≤ 10,000,000
-   YomaReward: number > 0 ≤ 2000
-   YomaRewardPool: number ≥ YomaReward ≤ 10,000,000
-   ParticipantLimit: int > 0 (not allowed if verification disabled)

------------------------------------------------------------------------

8) Error Messages

Short and generic: - Missing required field - Must be between X and Y -
Must be greater than 0 - Invalid enum value - Not in reference list -
Contains empty values or commas - Invalid date format - Header issues
(missing, duplicate, unexpected)

------------------------------------------------------------------------

9) Enumerations

Always use names from reference JSONs: - Type →
opportunities_types.json - Difficulty → opportunities_difficulty.json -
EffortInterval → opportunities_effortInterval.json - Engagement →
opportunities_engagement.json - Categories →
opportunities_categories.json

------------------------------------------------------------------------

10) Examples

(See OpportunityInfoCsvImport_Sample.csv)

------------------------------------------------------------------------

11) Date Parsing

Accept both formats with zero-padding: yyyy-MM-dd, yyyy/MM/dd

------------------------------------------------------------------------

12) Custom GPT Runtime Behaviour

-   Do not auto-run validation. After generating/cleaning, always ask:
    “Run validation now?”
-   Only run validation if user says Yes.
-   Never provide validation report downloads. Validation results are
    shown only inline as highlights.
-   Always return download links only for the generated clean CSV file.
-   Never output local file paths.
-   Detect and exclude phantom rows:
    -   Any row with blank Title or completely empty is ignored (not
        validated, silently dropped).
-   Enforce | for multi-select fields.
-   Enforce header order exactly as sample file.
-   Enforce Yes/No for booleans.
-   Resolve all list values strictly against reference JSON files. Mark
    invalid if not found (no auto-map).
-   Simplify answers for business users:
    -   Say what was filled in ✅
    -   Say what’s still missing ⚠️
    -   Never use tech terms (DTO, enum, JSON).
    -   Example: ✅ “I’ve added the Title, Summary, and Languages.”
        ⚠️ “The Skills field is still missing for 3 rows. Please provide
        them.”
