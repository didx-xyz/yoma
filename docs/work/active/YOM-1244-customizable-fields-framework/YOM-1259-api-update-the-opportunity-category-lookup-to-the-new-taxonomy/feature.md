# Feature: Opportunity category taxonomy

## Meta

- Feature: Approved flat Opportunity taxonomy
- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1259](https://linear.app/didx/issue/YOM-1259/api-update-the-opportunity-category-lookup-to-the-new-taxonomy)
- Owner: Adrian
- Areas: api
- Status: in-progress
- Started: 2026-09-22

## Problem / Goal

Replace ten existing categories with the sixteen approved categories supplied by Adrian, preserving multi-select Opportunity associations. Categories remain a core lookup, not custom fields.

## Out of Scope

- Taxonomy hierarchy, legacy CSV aliases, rewriting historical credentials or audit payloads.
- Uploading/deleting S3 objects automatically or deploying this branch.

## Plan

One new, undeployed ApplicationDb_CF_Configuration EF migration orchestrates focused seeding classes. Extend this migration with further CF seeders while it remains undeployed; never rewrite it after deployment. Retain IDs for renamed categories, merge Environment into Agriculture and AI/Data into Technology, and insert eight new fixed IDs. Move links before deleting retired lookups and deduplicate overlapping links. Assign Other only to existing opportunities with no category links.

## Tasks

- [x] Approve sixteen names and icon filenames; fifteen new S3 objects uploaded by Adrian, Other retained.
- [x] Seed names/icons and eight new categories.
- [x] Transactionally migrate links and verify guards/deduplication/fallback.
- [x] Verify CSV's name resolver accepts new names only (existing case/trim tolerance retained).
- [ ] End-to-end CSV import/export and UI regression on Stage.
- [x] Update API CSV samples only; quote comma-containing category fields and preserve all other cells.
- [x] Clarify CSV quoting and migrated category reference refresh in the API import README.
- [ ] Jason: copy the updated API CSV samples to the web side and replace hardcoded legacy category help in src/web/src/components/Opportunity/Admin/OpportunityImport.tsx; prefer the live lookup to avoid future drift.
- [x] Update partner mappings (Alison, Jobberman, JobJack, IXO, Umuzi); audit remaining integrations for category lookup consumers.
- [ ] Verify lookup/API/search/UI consumers and cache rollout.
- [x] Build and test migration against isolated local PostgreSQL (6 tests, all 1,024 legacy combinations); formatting verified separately before handoff.

## Decisions

- 2026-09-22: Category lookup ordering is alphabetical with Other last regardless of whether lookup caching is enabled. Regression tests cover cached initial load/cache hit and repeated uncached reads.
- 2026-09-22: API owns the two samples in src/api/src/other; Jason copies them to web. No web files changed. CSV fields containing commas are quoted; pipe remains the multi-category separator.
- 2026-09-22: Keep every recognized partner source label, but target the final taxonomy. Split explicit education, language, legal, engineering, office and food-service labels where supported. Broad ambiguous labels (for example JobJack Personal services) retain their broader mapped category rather than assuming Beauty. Resolver normalization, hierarchical fallback, deduplication and Other fallback remain unchanged. Existing stored associations follow the approved broad migration, not retroactive partner reclassification.
- 2026-09-22: Adrian confirmed CSV accepts only new taxonomy names; no legacy aliases. Partner-specific source vocabulary is mapped separately.
- 2026-09-22: Eight retained IDs include Other; two obsolete lookup IDs are merged away. Eight new categories receive fixed seeded IDs. Preserve retained row creation timestamps and link IDs wherever possible.
- 2026-09-22: Migration is transactional with NOWAIT write locks; pause writers/syncs and restart all API instances to retire in-memory lookup caches. Old API instances must not continue serving removed IDs during rollout.
- 2026-09-22: A many-to-one merge cannot be faithfully reversed without original association provenance. Down must refuse rather than fabricate old associations; recovery requires a reviewed forward fix or database backup restore.
- 2026-09-22: All nine old icons remain in shared S3 until every environment migrates and rollback no longer needs them. Other.svg remains permanently. Service TODO contains exact deletion list.

## Links

### Approved category mapping

| Legacy source | Final name | Target ID |
| --- | --- | --- |
| Agriculture | Agriculture, Food, Environment and Climate | 2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950 |
| Technology and Digitization | Technology, AI & Data | fa564c1c-591a-4a6d-8294-20165da8866b |
| Business and Entrepreneurship | Business, Finance & Marketing | c76786fd-fca9-4633-85b3-11e53486d708 |
| Creative Industry and Arts | Creative, Media & Design | 7afb66ad-164e-46a3-933f-a0bac1ca1923 |
| Health and Care | Health, Safety & Wellbeing | 6e6a5f23-6d2e-4f45-8b4d-5d9c9a6b1e71 |
| Tourism and Hospitality | Hospitality & Tourism | f36051c9-9057-4765-bc2f-9dee82ef60d6 |
| Career and Personal Development | Personal Development & Career Readiness | 89f4ab46-0767-494f-a18c-3037f698133a |
| Environment and Climate | Agriculture, Food, Environment and Climate | 2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950 |
| AI, Data and Analytics | Technology, AI & Data | fa564c1c-591a-4a6d-8294-20165da8866b |
| Other | Other | b89c5e91-9cbb-4a0e-991f-f987eebf9b70 |
| New | Engineering, Science & Mathematics | 15ba04a2-5b3d-4d40-aa20-62ea38c9769a |
| New | Beauty & Personal Care | 45a18936-5965-4ffe-b12e-beeb81a40f34 |
| New | Languages & Communication | be1c903e-87bb-41cd-8da4-1f2f286d7dc9 |
| New | History, Society & Human Rights | 1612eb90-806b-40db-bc6e-a428780581dc |
| New | Office, Admin & Professional Skills | 0529387f-b8fe-4166-ba03-54293370197f |
| New | Education & Teaching | 1e8e59ae-4009-48ef-8c09-a72d6af068c7 |
| New | Law, Governance & Compliance | 944c4b9a-8dc8-4e18-8913-2a01461a4f9b |
| New | Retail & Food Services | 8a1778eb-0cd3-434c-bfb6-15788fd0b678 |


- Input: Adrian's approved taxonomy screenshot and icon ZIP in this task.
- Branch: feature/cf-implementation.
