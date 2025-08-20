# Opportunities CSV Import — README

This document defines the **exact** structure, formatting, reference data, and validation rules for importing **Opportunities** via CSV.  
It is written for our **custom GPT** to follow deterministically (no guessing; reference-data only).

---

## 0) Inputs & Artifacts

- **Reference JSON files** (bundled):
  - `opportunities_categories.json`
  - `opportunities_difficulty.json`
  - `opportunities_effortInterval.json`
  - `opportunities_engagement.json`
  - `opportunities_languages.json` *(ISO alpha-2 codes)*
  - `opportunities_locations.json` *(ISO alpha-2 codes; includes `WW` for Worldwide)*
  - `opportunities_skills.json`
  - `opportunities_types.json`

- **C# CSV DTO model**: `OpportunityInfoCsvImport.cs`  
  The CSV is deserialized into this model. Notable mappings:
  - **Location (CSV)** → `Countries` (model) *(list of ISO alpha-2 codes)*
  - **EffortCount (CSV)** → `CommitmentIntervalCount` (model)
  - **EffortInterval (CSV)** → `CommitmentInterval` (model)
  - **Hidden (CSV)** → `Hidden` (model `bool`), with:
    ```csharp
    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool Hidden { get; set; }
    ```
- **Sample CSV**: `OpportunityInfoCsvImport_Sample.csv`  
  Use this as the canonical column order and formatting example.

---

## 1) Required Headers

These headers **must exist** in the file. Values must comply with the rules below.

- **Title** — required; **1–150** characters
- **Type** — required; must exist in `opportunities_types.json` (**name**)
- **Categories** — required; ≥1; values from `opportunities_categories.json` (**name**); **`|`-delimited**
- **Summary** — required; **1–150** characters
- **Description** — required
- **Languages** — required; **ISO alpha-2** codes; must exist in `opportunities_languages.json`; **`|`-delimited**
- **Location** — required; **ISO alpha-2** codes; must exist in `opportunities_locations.json`; may include **`WW`** (Worldwide); **`|`-delimited** (e.g., `WW|ZA|GB`)
- **Difficulty** — required; must exist in `opportunities_difficulty.json` (**name**)
- **EffortCount** — required; integer; **> 0**
- **EffortInterval** — required; must exist in `opportunities_effortInterval.json` (**name**; one of **Minute | Hour | Day | Week | Month**)
- **DateStart** — required; valid date; formats: **`YYYY-MM-DD`** or **`YYYY/MM/DD`**
- **Skills** — required; one or more from `opportunities_skills.json` (**exact `name`**); **`|`-delimited**
- **Keywords** — required; **`|`-delimited**; **no empty entries**, **no commas (`,`)**; combined length **1–500**
- **Hidden** — required; **Yes** / **No**
- **ExternalId** — required; **1–50** characters; unique per organisation

Headers are case-sensitive.** Unknown or missing headers are rejected.
Header order must exactly match OpportunityInfoCsvImport_Sample.csv.

---

## 2) Optional Headers (headers present; values may be empty)

- **Engagement** — Online | Offline | Hybrid (from `opportunities_engagement.json`, **name**)
- **Link** — if present: valid URL, **1–2048** characters
- **DateEnd** — if present: **`YYYY-MM-DD`** or **`YYYY/MM/DD`**, and **≥ DateStart**
- **ParticipantLimit** — if present: integer **> 0** (**not supported** when verification is disabled)
- **ZltoReward** — if present: **integer** > 0 and **≤ 2000** (**no decimals**)
- **ZltoRewardPool** — if present: **integer** > 0, **≥ ZltoReward**, and **≤ 10,000,000** (**no decimals**)
- **YomaReward** — if present: number > 0 and **≤ 2000**
- **YomaRewardPool** — if present: number > 0, **≥ YomaReward**, and **≤ 10,000,000**

> Notes:  
> • `Link` is the CSV header mapped to the URL field in validation.  
> • ZLTO rewards/pools are **integer-only**. Yoma rewards/pools **may** include decimals.

---

## 3) Defaults (not settable in CSV)

- **VerificationEnabled**: Enabled  
- **VerificationMethod**: Automatic  
- **CredentialIssuanceEnabled**: Enabled  
- **SSISchemaName**: `Opportunity|Default`  
- **Instructions**: Deprecated / not used  
- **ShareWithPartners**: `null` or `false`

---

## 4) Formatting Rules

- **CSV delimiter**: `,` (REQUIRED / NO OTHER DELIMITER ACCEPTED). 
- **Multi-select delimiter**: always **`|`** for list fields (no spaces around it).
- **Booleans**: **`Yes`** / **`No`** only (see model attributes above).
- **Dates**: **`YYYY-MM-DD`** or **`YYYY/MM/DD`** (zero-padded month/day).
- **Languages**: **ISO alpha-2** codes from `opportunities_languages.json`.
- **Location**: **ISO alpha-2** codes from `opportunities_locations.json`, including **`WW`**; `WW` may be **combined** with countries (e.g., `WW|ZA|GB`).
- **Whitespace**: trim cells; treat blank after trim as **missing**. In `|` lists, trim each token; **empty tokens are invalid**.

---

## 5) Reference Data (authoritative)

All reference values must come from the bundled JSON files:

- **Skills** → `opportunities_skills.json` (**use `name`**, join multiples with `|`)
- **Categories / Type / Difficulty / EffortInterval / Engagement** → their respective files (**name** fields)
- **Languages** → `opportunities_languages.json` (**ISO alpha-2** codes)
- **Countries** → `opportunities_locations.json` (**ISO alpha-2** codes, includes **`WW`**)

> If a value is not in these files, it is **invalid**. The GPT must not invent or “closest-match” unless the user supplies an explicit mapping.

---

## 6) CSV → Model Mapping (key fields)

| CSV Header        | Model Property                | Notes |
|-------------------|--------------------------------|-------|
| Title             | `Title`                        | string (1–150) |
| Type              | `Type`                         | name from reference; later resolved to ID |
| Categories        | `Categories`                   | list of names (from reference) |
| Summary           | `Summary`                      | string (1–150) |
| Description       | `Description`                  | string |
| Languages         | `Languages`                    | list of ISO alpha-2 codes |
| Location          | `Countries`                    | list of ISO alpha-2 codes (incl. `WW`) |
| Difficulty        | `Difficulty`                   | name from reference; later resolved to ID |
| EffortCount       | `CommitmentIntervalCount`      | integer > 0 |
| EffortInterval    | `CommitmentInterval`           | name from reference |
| DateStart         | `DateStart`                    | `DateOnly` |
| DateEnd           | `DateEnd`                      | `DateOnly?` |
| Skills            | `Skills`                       | list of names from skills reference |
| Keywords          | `Keywords`                     | list (split by `|`) |
| Hidden            | `Hidden`                       | `Yes`/`No` → bool via model attributes |
| ExternalId        | `ExternalId`                   | string (1–50) |
| Engagement        | `Engagement`                   | name from reference |
| Link              | `URL` / `Link` (per DTO)       | valid URL (1–2048) |
| ParticipantLimit  | `ParticipantLimit`             | int? (> 0) |
| ZltoReward        | `ZltoReward`                   | integer only |
| ZltoRewardPool    | `ZltoRewardPool`               | integer only |
| YomaReward        | `YomaReward`                   | decimal allowed |
| YomaRewardPool    | `YomaRewardPool`               | decimal allowed |

*(If your DTO uses slightly different property names, the binding attributes in `OpportunityInfoCsvImport.cs` handle them; rules above still apply.)*

---

## 7) Validation Summary (aligned with code/validators)

- **Title**: required; **1–150**
- **Summary**: required; **1–150**
- **Description**: required
- **ExternalId**: required; **1–50**
- **EffortCount**: **> 0**
- **EffortInterval / Type / Difficulty / Engagement**: must exist in their reference files (by **name**)
- **DateStart**: required; not default/min; valid date
- **DateEnd**: if present, **≥ DateStart**
- **Keywords**: required; |-delimited list; no empty items; no commas (,); combined length 1–500.
  Used for searching and discovery (SEO).
  If not provided, must be auto-generated from available metadata fields: Title, Summary, Description, Categories, Skills, Type, Difficulty, EffortCount + EffortInterval, Languages, Location.
  Auto-generation must produce trimmed, unique, and relevant terms, delimited with |.
- **Languages**: required; each ISO alpha-2 code exists in languages reference
- **Location**: required; each entry is ISO alpha-2 code from locations reference (incl. **`WW`**); combinations allowed
- **Skills**: required in CSV; each must exist in `opportunities_skills.json` (**name**)
- **ZltoReward**: integer > 0, ≤ 2000 (**no decimals**)
- **ZltoRewardPool**: integer > 0, ≥ ZltoReward, ≤ 10,000,000 (**no decimals**)
- **YomaReward**: number > 0, ≤ 2000
- **YomaRewardPool**: number > 0, ≥ YomaReward, ≤ 10,000,000
- **ParticipantLimit**: when present, integer **> 0** and **not allowed** if verification is disabled

---

## 8) Error Messages (concise)

Messages are short/generic; the **field name** and **offending value** are in the structured error payload (not inside the message text).

- `RequiredFieldMissing`: “Missing required field”
- `InvalidFieldValue` (examples):
  - “Must be between 1 and 150 characters”
  - “Must be between 1 and 50 characters”
  - “Must be greater than 0”
  - “Invalid enum value”
  - “Not in reference list”
  - “Contains empty values or commas”
  - “Invalid date format”
- `HeaderMissing`: “The header row is missing”
- `HeaderColumnMissing`: “Required header is missing”
- `HeaderUnexpectedColumn`: “Unexpected header”
- `HeaderDuplicateColumn`: “Duplicate header”
- `ProcessingError`: “Processing error”

---

## 9) Enumerations (from reference files; use **name** exactly)

- **Type** → `opportunities_types.json`
- **Difficulty** → `opportunities_difficulty.json`  
  *(e.g., Beginner | Intermediate | Advanced | Any Level)*
- **EffortInterval** → `opportunities_effortInterval.json`  
  *(Minute | Hour | Day | Week | Month)*
- **Engagement** → `opportunities_engagement.json`  
  *(Online | Offline | Hybrid)*
- **Categories** → `opportunities_categories.json`

*(Do not hardcode lists; always read from the reference files.)*

---

## 10) Examples

**Headers (must match sample file order):
Title,Type,Engagement,Categories,Link,Summary,Description,Languages,Location,Difficulty,EffortCount,EffortInterval,DateStart,DateEnd,ParticipantLimit,ZltoReward,ZltoRewardPool,Skills,Keywords,Hidden,ExternalId

**Sample file:** `OpportunityInfoCsvImport_Sample.csv`

**Row (country-specific):**
Intro to Data Analytics,Learning,Online,"AI, Data and Analytics|Career and Personal Development",https://example.org,Short intro,Comprehensive beginner pathway,EN|AF,ZA|GB,Beginner,6,Week,2025-09-01,2025-10-31,100,250,5000,"Data Analysis|Spreadsheets","analytics|excel|beginner",No,SANOFI-DA-001

**Row (Worldwide + specific countries):**
Global Data Fundamentals,Learning,Online,"Technology and Digitization",,Short intro,Global access with focus content,EN,WW|ZA|GB,Any Level,4,Week,2025/09/01,,,,,"Data Analysis|Spreadsheets","data|global|intro",Yes,SANOFI-GD-002

## 11) DateOnly Parsing (implementation note)

Accept both formats with strict zero-padding:

```csharp
var formats = new[] { "yyyy-MM-dd", "yyyy/MM/dd" };
if (!DateOnly.TryParseExact(input, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
{
    // add error: InvalidFieldValue ("Invalid date format")
}

12) Custom GPT Runtime Behaviour (performance & UX)

- Do not auto-run validation. After generating/cleaning a CSV, always ask: “Run validation now?”
- Only run full validation when the user explicitly says Yes.
- Never provide or offer validation report downloads — validation must only be used internally to highlight issues in responses.
- Always return download links only for the generated clean CSV files.
- Never output non-downloadable local file paths.
- Detect and exclude phantom rows:
  * Any row with a blank Title or completely empty fields must be ignored and not included in the final CSV.
  * Such rows must not trigger validation errors — they are silently dropped.
- Enforce | for all multi-select fields and trim spaces around the delimiter.
- Enforce header order exactly as in the sample file.
- Enforce Yes/No booleans using plain values only.
- Resolve all list values strictly against the reference JSON files. If a value is not found, mark it invalid (do not auto-map).
- Simplify answers for business users:
  * Clearly state what was filled in and what is still missing in plain language.
  * Do not reference technical terms (e.g., “DTO model”, “reference JSON”, “enum”).
  * Do not explain internal logic or reasoning.
  * Example style of output:
    ✅ “I’ve added the Title, Summary, and Languages for each row.”
    ⚠️ “The Skills field is still missing for 3 rows. Please provide them to complete the CSV.”





