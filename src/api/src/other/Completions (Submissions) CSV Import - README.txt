# Completions (Submissions) CSV Import - README

This document defines the exact CSV structure, formatting, reference data, and validations for importing **Completions / Submissions**.  
It is written for our custom GPT to follow deterministically (no guessing; reference-data only).

------------------------------------------------------------------------------

## 0) Inputs & Artifacts

- Reference JSON files (bundled):
  - completions_countries.json  (ISO alpha-2 codes; **WW (Worldwide) is NOT allowed**)
  - completions_genders.json    (use the `name` values exactly, e.g., Male, Female, Prefer not to say)

- C# CSV DTO model: `MyOpportunityInfoCsvImport.cs`

- Sample CSV: `MyOpportunityInfoCsvImport_Sample.csv`  
  ➜ The core header row and order must match the sample. Optional custom-field columns follow the core columns.

**Sample headers (core columns first, then optional custom fields):**
Email,PhoneNumber,FirstName,Surname,Gender,Country,DateCompleted,OpportunityExternalId,CF:jobEmploymentStartDate,CF:impactActionImpactAchieved,CF:eventRole,CF:entrepreneurshipBusinessName,CF:entrepreneurshipBusinessSummary,CF:entrepreneurshipBusinessRegistered,CF:entrepreneurshipRegistrationReference,CF:entrepreneurshipSector,CF:entrepreneurshipJobsCreated,CF:entrepreneurshipRevenueBand,CF:entrepreneurshipRevenueCurrency,CF:entrepreneurshipFundingTypes,CF:entrepreneurshipFundingAmountBand,CF:entrepreneurshipFunder,CF:entrepreneurshipClientLocation

------------------------------------------------------------------------------

## 1) File & Formatting Rules

- File type: CSV
- CSV delimiter: **comma (`,` only)**
- Core headers are **case-sensitive** and must match the sample file order. Custom-field headers must use `CF:<definition key>` (case-sensitive), never bare keys or display titles. Use only active definitions for the matching Opportunity type; irrelevant types remain blank.
- **All custom fields are optional for CSV imports and Partner Sync**, including definitions marked required for manual capture. Missing values remain unspecified; supplied values must satisfy their metadata and applicable cross-field rules. Do not invent values to make an import look complete.
- Manual youth submissions enforce the applicable required CF definitions. Instant/action-link completions intentionally bypass CF processing; they must not be treated as manual submissions or given invented defaults.
- Whitespace: trim all cells; an empty cell after trim is treated as **missing**
- Dates: **two accepted formats** (zero-padded):
  - `YYYY-MM-DD`  (e.g., 2025-09-01)
  - `YYYY/MM/DD`  (e.g., 2025/09/01)

------------------------------------------------------------------------------

## 2) Field Requirements & Constraints

At least **one** of **Email** or **PhoneNumber** must be provided (the “Username” requirement).  
**OpportunityExternalId** is always required.

- **Email**
  - Optional if PhoneNumber is provided
  - If present: must be a valid email address

- **PhoneNumber**
  - Optional if Email is provided
  - If present: must be a valid international number (E.164), e.g. **+27831234567**

- **FirstName**
  - Optional; if present: **1–125** characters

- **Surname**
  - Optional; if present: **1–125** characters

- **Gender**
  - Optional; if present: value must exist in **completions_genders.json** (`name` field exactly)

- **Country**
  - Optional; if present: ISO alpha-2 code from **completions_countries.json**
  - **`WW` (Worldwide) is NOT allowed** for user country

- **DateCompleted**
  - Optional
  - If present: must parse as **`YYYY-MM-DD`** or **`YYYY/MM/DD`**
  - If **omitted**, the system **defaults to current date/time (now)**

- **OpportunityExternalId**
  - **Required**
  - Length: **1–50** characters
  - Must match an existing Opportunity’s ExternalId

- **CF:jobEmploymentStartDate** (Job completions only)
  - Optional actual placement start date, strictly `YYYY-MM-DD`; not the application deadline
- **CF:impactActionImpactAchieved** (Impact Action completions only)
  - Optional outcome description, up to 1000 characters
- **CF:eventRole** (Event completions only)
  - Optional role: `Participant`, `Speaker`, `Panelist`, `FacilitatorTrainer`, `CoOrganiser`, or `Volunteer`
  - If omitted or blank, the role remains unspecified

- **Entrepreneurship completion custom fields**
  - All Entrepreneurship columns in this CSV are optional. Business name, summary and registered status are required only for manual youth submissions, not CSV or Partner Sync.
  - Registration reference applies only when registered. Other conditional companions can be absent on imports, but supplied values must not contradict each other.
  - Resolve active options through the API definitions and use their stable keys, not display titles. Multi-select values are separated with `|`.
  - CSV shared lookups use readable external values: Country/Language alpha-2 codes, Currency ISO code (for example `USD`), and full Education/Skill names. This differs from JSON API requests, which use lookup IDs.
  - Boolean values are `true`/`false` (the established CSV Yes/No values are also accepted); integer/decimal values use invariant formatting.
  - The API validates metadata and cross-field rules; never substitute `not available` for a missing value.
  - Actual completion fields do not populate advertised Opportunity CFs or infer business achievements.

------------------------------------------------------------------------------

## 3) Reference Data (authoritative)

All reference values must come from the bundled JSON files:
- **Genders** → completions_genders.json (use the `name` value exactly)
- **Countries** → completions_countries.json (ISO alpha-2; **no `WW`**)

If a value is not present in these files, it is **invalid**. Do not invent, guess, or “closest-match”.

------------------------------------------------------------------------------

## 4) CSV → Model Mapping (key fields)

Email                 → Email  
PhoneNumber           → PhoneNumber  
FirstName             → FirstName  
Surname               → Surname  
Gender                → Gender           (name from completions_genders.json)  
Country               → Country          (ISO alpha-2 from completions_countries.json; **no WW**)  
DateCompleted         → DateCompleted    (nullable DateOnly; optional; defaults to now if missing)  
OpportunityExternalId → OpportunityExternalId  (required; 1–50; must match existing)

------------------------------------------------------------------------------

## 5) Validation Summary (aligned with validators)

- Username: **Email or PhoneNumber required** (at least one)
- Email: valid email format when provided
- PhoneNumber: valid international format when provided (e.g., +27831234567)
- FirstName: 1–125 chars when provided
- Surname: 1–125 chars when provided
- Gender: must exist in completions_genders.json when provided
- Country: must exist in completions_countries.json when provided; **WW not allowed**
- DateCompleted: valid date in one of the two accepted formats; defaults to now if missing
- OpportunityExternalId: **required**; 1–50 chars; must map to an existing Opportunity
- Custom fields: optional on CSV/Partner Sync; supplied fields must use active matching definitions and valid values. Manual requiredness does not change CSV requiredness.

------------------------------------------------------------------------------

## 6) Error Messages (concise style)

Human-readable messages remain short; the field name and offending value are supplied separately in structured error data.

- HeaderMissing — “The header row is missing”
- HeaderColumnMissing — “Required header is missing”
- HeaderUnexpectedColumn — “Unexpected header”
- HeaderDuplicateColumn — “Duplicate header”
- RequiredFieldMissing — “Missing required field”
- InvalidFieldValue — examples:
  - “Invalid email address”
  - “Invalid phone number”
  - “Must be between 1 and 125 characters”
  - “Must be between 1 and 50 characters”
  - “Not in reference list”
  - “Invalid date format”
  - “Worldwide is not allowed for user country”
- ProcessingError — “Processing error”

------------------------------------------------------------------------------

## 7) Examples

**Headers:**  
Email,PhoneNumber,FirstName,Surname,Gender,Country,DateCompleted,OpportunityExternalId,CF:jobEmploymentStartDate,CF:impactActionImpactAchieved,CF:eventRole,CF:entrepreneurshipBusinessName,CF:entrepreneurshipBusinessSummary,CF:entrepreneurshipBusinessRegistered,CF:entrepreneurshipRegistrationReference,CF:entrepreneurshipSector,CF:entrepreneurshipJobsCreated,CF:entrepreneurshipRevenueBand,CF:entrepreneurshipRevenueCurrency,CF:entrepreneurshipFundingTypes,CF:entrepreneurshipFundingAmountBand,CF:entrepreneurshipFunder,CF:entrepreneurshipClientLocation

**Valid (email given, date in `YYYY-MM-DD`):**
```csv
jane.doe@example.com,,Jane,Doe,Female,ZA,2025-08-01,OPP-12345
```

**Valid (phone only, date in `YYYY/MM/DD`, DateCompleted present):**
```csv
,+27831234567,John,Smith,Male,NG,2025/08/15,OPP-54321
```

**Valid (no DateCompleted → defaults to now):**
```csv
ali.khan@example.com,,Ali,Khan,Prefer not to say,GB,,EXT-0001
```

**Invalid (WW not allowed as user country):**
```csv
test.user@example.com,,Test,User,Male,WW,2025-08-01,EXT-9999
```

------------------------------------------------------------------------------

## 8) Parsing Note (DateOnly)

To accept both formats deterministically:
- `yyyy-MM-dd`
- `yyyy/MM/dd`

(Zero-padded month and day are required.)

Example:
```csharp
var formats = new[] { "yyyy-MM-dd", "yyyy/MM/dd" };
if (!DateOnly.TryParseExact(input, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
{
    // add error: InvalidFieldValue ("Invalid date format")
}
```

------------------------------------------------------------------------------

## 9) Custom GPT Runtime Behaviour

- Do not auto-run validation. After generating/cleaning a CSV, always ask: “Run validation now?”
- Only run full validation when the user explicitly says Yes.
- Validation is background-only: highlight issues in the response; never provide or offer validation report downloads.
- Always return download links only for the generated clean CSV files.
- Never output non-downloadable local file paths.
- Enforce the core header order shown in the sample; include applicable optional custom-field columns after it.
- Trim whitespace; reject empty tokens.
- Detect and exclude phantom rows:
  - Rows that are completely blank must be ignored (not validated, silently dropped).
- Resolve Gender and Country strictly against the reference JSON files. Reject WW for Country.
- Simplify answers for business users:
  * Clearly state what was filled in and what is still needed.
  * Do not include technical jargon or internal system names.
  * Example style of output:
    - ✅ “The file has Email, Phone, and Opportunity ID filled in for all rows.”
    - ⚠️ “The Country is missing for 2 users, and Gender needs to be specified for 1 user.”
