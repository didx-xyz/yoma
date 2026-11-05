-- ARCHIVED MANUAL PROCEDURE: incident repair completed; do not rerun without a fresh review.
-- Replace __APPROVED_DATABASE__ only in a private operator copy after verifying the target.
-- YOM-1313: Production READ ONLY audit. Execute the entire script.
-- The current mapping is not a historical skill snapshot. Review this limitation before repair.
-- Jobs and anomalous completed records without DateCompleted are reported but not backfilled.
-- No account contact details, tokens, rewards or credentials are returned.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '120s';
SET LOCAL TIME ZONE 'UTC';

DO $guard$
BEGIN
    IF current_database() <> '__APPROVED_DATABASE__' THEN
        RAISE EXCEPTION 'Wrong database: %. Production audit stopped.', current_database();
    END IF;
    IF (SELECT count(*) FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification') <> 1
        OR (SELECT count(*) FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed') <> 1
        OR (SELECT count(*) FROM "Opportunity"."OpportunityType" WHERE "Name" = 'Job') <> 1 THEN
        RAISE EXCEPTION 'Expected Verification/Completed/Job lookups not found.';
    END IF;
END
$guard$;

WITH completed AS MATERIALIZED (
    SELECT m."Id", m."UserId", m."OpportunityId", m."DateCompleted",
        o."OrganizationId", o."Title", t."Name" AS "OpportunityType"
    FROM "Opportunity"."MyOpportunity" m
    JOIN "Opportunity"."MyOpportunityAction" a ON a."Id" = m."ActionId"
    JOIN "Opportunity"."MyOpportunityVerificationStatus" s ON s."Id" = m."VerificationStatusId"
    JOIN "Opportunity"."Opportunity" o ON o."Id" = m."OpportunityId"
    JOIN "Opportunity"."OpportunityType" t ON t."Id" = o."TypeId"
    WHERE a."Name" = 'Verification' AND s."Name" = 'Completed'
),
expected AS MATERIALIZED (
    SELECT c."UserId", os."SkillId", c."OrganizationId",
        min(c."DateCompleted") AS "EarliestCompletion",
        bool_and(os."DateCreated" > c."DateCompleted") AS "MappingOnlySeenAfterCompletion"
    FROM completed c
    JOIN "Opportunity"."OpportunitySkills" os ON os."OpportunityId" = c."OpportunityId"
    WHERE c."OpportunityType" <> 'Job' AND c."DateCompleted" IS NOT NULL
    GROUP BY c."UserId", os."SkillId", c."OrganizationId"
),
missing AS MATERIALIZED (
    SELECT e.*, us."Id" AS "ExistingUserSkillId"
    FROM expected e
    LEFT JOIN "Entity"."UserSkills" us ON us."UserId" = e."UserId" AND us."SkillId" = e."SkillId"
    LEFT JOIN "Entity"."UserSkillOrganizations" uso
        ON uso."UserSkillId" = us."Id" AND uso."OrganizationId" = e."OrganizationId"
    WHERE uso."Id" IS NULL
),
summary AS (
    SELECT
        (SELECT count(*) FROM (SELECT DISTINCT "UserId", "SkillId" FROM missing WHERE "ExistingUserSkillId" IS NULL) q) AS "MissingUserSkills",
        count(*) AS "MissingOrganizationLinks",
        count(DISTINCT "UserId") AS "AffectedUsers",
        count(*) FILTER (WHERE "MappingOnlySeenAfterCompletion") AS "PairsWithMappingOnlySeenAfterCompletion",
        md5(COALESCE(string_agg(
            md5(concat_ws('|', "UserId"::text, "SkillId"::text, "OrganizationId"::text,
                COALESCE("ExistingUserSkillId"::text, 'missing'))),
            '' ORDER BY "UserId", "SkillId", "OrganizationId"), '')) AS "CandidateFingerprint"
    FROM missing
),
per_opportunity AS (
    SELECT c."OpportunityId", c."Title", c."OrganizationId",
        count(DISTINCT c."UserId") AS "AffectedUsers",
        count(DISTINCT (c."UserId", os."SkillId")) AS "MissingSkillOrganizationPairs"
    FROM completed c
    JOIN "Opportunity"."OpportunitySkills" os ON os."OpportunityId" = c."OpportunityId"
    JOIN missing m ON m."UserId" = c."UserId" AND m."SkillId" = os."SkillId" AND m."OrganizationId" = c."OrganizationId"
    WHERE c."OpportunityType" <> 'Job' AND c."DateCompleted" IS NOT NULL
    GROUP BY c."OpportunityId", c."Title", c."OrganizationId"
)
SELECT jsonb_build_object(
    'Database', current_database(),
    'SnapshotAt', transaction_timestamp(),
    'ReadOnly', current_setting('transaction_read_only'),
    'Summary', (SELECT to_jsonb(s) FROM summary s),
    'CompletedRecords', (SELECT count(*) FROM completed),
    'ExcludedJobCompletions', (SELECT count(*) FROM completed WHERE "OpportunityType" = 'Job'),
    'CompletedWithoutDate', (SELECT count(*) FROM completed WHERE "DateCompleted" IS NULL),
    'OpportunityBreakdownFirst100', COALESCE((SELECT jsonb_agg(to_jsonb(q)) FROM (
        SELECT * FROM per_opportunity ORDER BY "MissingSkillOrganizationPairs" DESC, "OpportunityId" LIMIT 100
    ) q), '[]'::jsonb),
    'MissingSampleFirst50', COALESCE((SELECT jsonb_agg(to_jsonb(q)) FROM (
        SELECT * FROM missing ORDER BY "UserId", "SkillId", "OrganizationId" LIMIT 50
    ) q), '[]'::jsonb),
    'Warning', 'Candidates use CURRENT opportunity skill and organisation mappings, not historical snapshots. Mapping dates can be later than imported/backdated completion dates. Review before approval; no reliable Production deployment cutoff is inferred from a git commit date.'
) AS "CompletionSkillsAudit";
COMMIT;
