# Text-search index hotfix

Status: review — isolated migration checks passed; deployed workload validation pending

## Scope

Preserve existing search semantics while adding substring index coverage to the production-based branch. No CF/cash-out code, old migration edits, provider calls or production data changes.

## Tasks

- [x] Audit repository ILIKE/full-text predicates and physical columns.
- [x] Add 17 ApplicationDb trigram indexes and one Substack title index, retaining existing B-tree/full-text indexes.
- [x] Register pg_trgm in both EF models and provision via migrations.
- [x] Concurrent create/drop with recovery for interrupted builds; retain shared extension on rollback.
- [x] Remove redundant computed display-name matching from action-link usage/referral-link searches while retaining email/phone matching.
- [x] Exercise baseline upgrade, repeat, rollback/reapply, valid partial-build and invalid-index recovery in disposable PostgreSQL.
- [x] Test extension provisioning without superuser privileges as database owner.
- [x] Check synthetic search result equivalence and before/after plans; verify altered repository predicates execute.
- [ ] Validate real full endpoint plans/count queries and workload on Stage, including cross-table OR predicates.
- [ ] Review deployment account permissions/provider extension restrictions in each environment by actual migration.

## Decisions

- 2026-09-16: Separate raw-column GIN trigram indexes match existing ILIKE expressions. Existing full-text and unique indexes are retained.
- 2026-09-16: Concurrent migration retry recreates only the newly introduced index names. Already-applied migration remains a no-op. Do not wrap deployment SQL in an outer transaction.
- 2026-09-16: Keep extension on Down because other context indexes can depend on it.
- 2026-09-16: Distribution-list search over dynamically unnested identifiers and lower/computed username is not fixed by physical-column indexes. No behaviour-changing rewrite included; profile this separately if it is slow. Cached type/category/skill lookup filtering is not a PostgreSQL text scan.

## Coverage

Second-pass audit covered all seven EF contexts: ApplicationDb, Substack, AriesCloud, Alison, Jobberman, JobJack and IXOPartnerSync. Database-backed substring repositories exist in ApplicationDb and Substack; no corresponding text-search predicates were found in the other five contexts. Collection `Contains` membership filters, provider parsing and cached lookup searches are not substring-index candidates.

Executed all ten IRepositoryValueContains implementations against isolated PostgreSQL, both expression and IQueryable overloads, with nine terms (ordinary, mixed case, short, wildcard, underscore, apostrophe, accent and backslash). Counts, ordered ID pages and entity projections translated and executed; both overloads agreed. This uses baseline/seed data and is a translation/consistency check, not representative production load or exhaustive Unicode equivalence proof.

### Referral eligibility fix (separate intentional behaviour change)

The referral picker and computed eligibility excluded Automatic verification. Both now accept explicitly Manual or Automatic; invalid/null methods and existing hidden/status/date/organization restrictions remain. Job and country pathway restrictions remain. Manual submission authorization still independently requires Manual. Partner completion already emits referral progress events.

Disposable domain harness passed 1,560 eligibility/pathway assertions. Manual submission and partner event handling were code-traced, not end-to-end exercised. Creating a Sustainable Environmental Footprint remains hidden and excluded; the other supplied records still need organization status and program-country compatibility checked against live data. No opportunity data was changed.

Opportunity: Title/Summary/Keywords. User: Email/FirstName/Surname/DisplayName/PhoneNumber. Organization: Name. Referral Program: Name/Summary. Referral Link: Name/Description. ActionLink Link: Name/Description. Marketplace StoreAccessControlRule: Name. Lookup Skill: Name. Substack NewsArticle: Title.

MyOpportunity reuses Opportunity/User matching. Cross-table OR predicates may still favor scans; index availability is not a guarantee of planner choice. Short/nonselective/wildcard searches remain possible. Additional indexes incur storage/write costs.
