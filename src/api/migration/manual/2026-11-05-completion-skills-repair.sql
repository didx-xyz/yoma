-- YOM-1313: reviewed, additive Production repair AFTER deployment of the code fix.
-- Run the audit first; fill the four approval values below from the reviewed audit.
-- Defaults deliberately refuse to write. This script ends with ROLLBACK for a dry run.
-- Run the WHOLE script. On any error immediately execute ROLLBACK.
-- Locks briefly block completion/mapping/skill writers; run during a quiet window.
-- NOWAIT aborts if incompatible writers are already active. Do not remove it to force repair.
-- No replay, reward, counter, treasury, credential, user profile or existing skill row is updated.
BEGIN;
SET LOCAL statement_timeout = '120s';
SET LOCAL lock_timeout = '3s';
SET LOCAL idle_in_transaction_session_timeout = '60s';
SET LOCAL TIME ZONE 'UTC';

CREATE TEMP TABLE yom1313_approval ON COMMIT DROP AS
SELECT
    false::boolean AS "CurrentMappingsApproved", -- Set true ONLY after reviewing audit/history limitations.
    NULL::bigint AS "ExpectedMissingUserSkills",
    NULL::bigint AS "ExpectedMissingOrganizationLinks",
    NULL::text AS "ExpectedCandidateFingerprint";

DO $guard$
BEGIN
    IF current_database() <> 'yoma_v3_prod' THEN
        RAISE EXCEPTION 'Wrong database: %. Production repair stopped.', current_database();
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM yom1313_approval
        WHERE "CurrentMappingsApproved"
            AND "ExpectedMissingUserSkills" >= 0
            AND "ExpectedMissingOrganizationLinks" >= 0
            AND "ExpectedCandidateFingerprint" ~ '^[0-9a-f]{32}$'
    ) THEN
        RAISE EXCEPTION 'Review audit, approve current mappings, and supply expected counts/fingerprint first.';
    END IF;
    IF (SELECT count(*) FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification') <> 1
        OR (SELECT count(*) FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed') <> 1
        OR (SELECT count(*) FROM "Opportunity"."OpportunityType" WHERE "Name" = 'Job') <> 1 THEN
        RAISE EXCEPTION 'Expected Verification/Completed/Job lookups not found.';
    END IF;
END
$guard$;

-- Freeze source mappings and completion status before deriving the reviewed candidate set.
LOCK TABLE "Opportunity"."MyOpportunity", "Opportunity"."Opportunity", "Opportunity"."OpportunitySkills"
    IN SHARE MODE NOWAIT;
LOCK TABLE "Entity"."UserSkills", "Entity"."UserSkillOrganizations"
    IN SHARE ROW EXCLUSIVE MODE NOWAIT;

CREATE TEMP TABLE yom1313_missing ON COMMIT DROP AS
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
)
SELECT * FROM missing;

CREATE TEMP TABLE yom1313_result (
    "InsertedUserSkills" bigint,
    "InsertedOrganizationLinks" bigint,
    "RemainingMissingOrganizationLinks" bigint
) ON COMMIT DROP;

DO $repair$
DECLARE
    v_skills bigint;
    v_links bigint;
    v_fingerprint text;
    v_inserted_skills bigint;
    v_inserted_links bigint;
    v_remaining bigint;
BEGIN
    SELECT count(*) INTO v_skills
    FROM (SELECT DISTINCT "UserId", "SkillId" FROM yom1313_missing WHERE "ExistingUserSkillId" IS NULL) q;
    SELECT count(*), md5(COALESCE(string_agg(
            md5(concat_ws('|', "UserId"::text, "SkillId"::text, "OrganizationId"::text,
                COALESCE("ExistingUserSkillId"::text, 'missing'))),
            '' ORDER BY "UserId", "SkillId", "OrganizationId"), ''))
    INTO v_links, v_fingerprint FROM yom1313_missing;

    IF NOT EXISTS (
        SELECT 1 FROM yom1313_approval
        WHERE "ExpectedMissingUserSkills" = v_skills
            AND "ExpectedMissingOrganizationLinks" = v_links
            AND "ExpectedCandidateFingerprint" = v_fingerprint
    ) THEN
        RAISE EXCEPTION 'Candidates changed since audit (skills %, links %, fingerprint %). ROLLBACK and re-audit.',
            v_skills, v_links, v_fingerprint;
    END IF;

    INSERT INTO "Entity"."UserSkills" ("Id", "UserId", "SkillId", "DateCreated")
    SELECT gen_random_uuid(), q."UserId", q."SkillId", transaction_timestamp()
    FROM (
        SELECT DISTINCT "UserId", "SkillId" FROM yom1313_missing WHERE "ExistingUserSkillId" IS NULL
    ) q
    ON CONFLICT ("UserId", "SkillId") DO NOTHING;
    GET DIAGNOSTICS v_inserted_skills = ROW_COUNT;

    INSERT INTO "Entity"."UserSkillOrganizations" ("Id", "UserSkillId", "OrganizationId", "DateCreated")
    SELECT gen_random_uuid(), us."Id", m."OrganizationId", transaction_timestamp()
    FROM yom1313_missing m
    JOIN "Entity"."UserSkills" us ON us."UserId" = m."UserId" AND us."SkillId" = m."SkillId"
    ON CONFLICT ("UserSkillId", "OrganizationId") DO NOTHING;
    GET DIAGNOSTICS v_inserted_links = ROW_COUNT;

    SELECT count(*) INTO v_remaining
    FROM yom1313_missing m
    LEFT JOIN "Entity"."UserSkills" us ON us."UserId" = m."UserId" AND us."SkillId" = m."SkillId"
    LEFT JOIN "Entity"."UserSkillOrganizations" uso
        ON uso."UserSkillId" = us."Id" AND uso."OrganizationId" = m."OrganizationId"
    WHERE uso."Id" IS NULL;

    IF v_inserted_skills <> v_skills OR v_inserted_links <> v_links OR v_remaining <> 0 THEN
        RAISE EXCEPTION 'Repair validation failed (inserted skills %, links %, remaining %). ROLLBACK.',
            v_inserted_skills, v_inserted_links, v_remaining;
    END IF;
    INSERT INTO yom1313_result VALUES (v_inserted_skills, v_inserted_links, v_remaining);
END
$repair$;

SELECT current_database() AS "Database", transaction_timestamp() AS "RepairAt", * FROM yom1313_result;
ROLLBACK; -- After reviewing the dry run, replace ONLY this final ROLLBACK with COMMIT.
