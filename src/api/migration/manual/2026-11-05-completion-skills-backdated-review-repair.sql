-- ARCHIVED MANUAL PROCEDURE: incident repair completed; not a deployment migration.
-- Replace __APPROVED_DATABASE__ only in a private operator copy after verifying the target.
-- YOM-1313: ONLY the reviewed 365 backdated associations.
-- Same repair connection. Run the entire script. Default is ROLLBACK.
-- Does not relax eligibility or change the original batch procedures.
BEGIN;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '2s';
SET LOCAL idle_in_transaction_session_timeout = '60s';

DO $guard$
BEGIN
    IF current_database() <> '__APPROVED_DATABASE__' THEN
        RAISE EXCEPTION 'Wrong database. Stopped.';
    END IF;
    IF (SELECT count(*) FROM pg_temp.yom1313_progress
        WHERE "Database" = current_database() AND "ReadyRemaining" = 0
            AND "Deferred" = 0 AND "HeldForReview" = 61163) <> 1 THEN
        RAISE EXCEPTION 'Expected completed first pass with 61163 held rows. Stopped.';
    END IF;
END $guard$;

LOCK TABLE "Opportunity"."MyOpportunity", "Opportunity"."Opportunity",
    "Opportunity"."OpportunitySkills" IN SHARE MODE NOWAIT;
LOCK TABLE "Entity"."UserSkills", "Entity"."UserSkillOrganizations"
    IN SHARE ROW EXCLUSIVE MODE NOWAIT;

CREATE TEMP TABLE yom1313_backdated ON COMMIT DROP AS
SELECT q.*
FROM pg_temp.yom1313_queue q
JOIN "Opportunity"."MyOpportunity" m
    ON m."Id" = q."MyOpportunityId" AND m."UserId" = q."UserId"
JOIN "Opportunity"."Opportunity" o
    ON o."Id" = m."OpportunityId" AND o."OrganizationId" = q."OrganizationId"
JOIN "Opportunity"."OpportunitySkills" os
    ON os."Id" = q."OpportunitySkillId" AND os."OpportunityId" = o."Id"
        AND os."SkillId" = q."SkillId"
JOIN "Opportunity"."MyOpportunityAction" a ON a."Id" = m."ActionId"
JOIN "Opportunity"."MyOpportunityVerificationStatus" s ON s."Id" = m."VerificationStatusId"
JOIN "Opportunity"."OpportunityType" t ON t."Id" = o."TypeId"
WHERE q."State" = 'Review'
    AND a."Name" = 'Verification' AND s."Name" = 'Completed' AND t."Name" <> 'Job'
    AND m."DateCompleted" IS NOT NULL
    AND os."DateCreated" > m."DateCompleted"
    AND os."DateCreated" <= m."DateCreated";

DO $repair$
DECLARE
    v_skills integer;
    v_links integer;
    v_removed integer;
    v_started timestamptz := clock_timestamp();
BEGIN
    IF (SELECT count(*) FROM pg_temp.yom1313_backdated) <> 365
        OR (SELECT count(DISTINCT "UserId") FROM pg_temp.yom1313_backdated) <> 92
        OR (SELECT count(DISTINCT "OrganizationId") FROM pg_temp.yom1313_backdated) <> 3 THEN
        RAISE EXCEPTION 'Reviewed backdated cohort changed; expected 365 associations, 92 users, 3 organisations.';
    END IF;

    INSERT INTO "Entity"."UserSkills" ("Id", "UserId", "SkillId", "DateCreated")
    SELECT gen_random_uuid(), x."UserId", x."SkillId", transaction_timestamp()
    FROM (SELECT DISTINCT "UserId", "SkillId" FROM pg_temp.yom1313_backdated) x
    WHERE NOT EXISTS (
        SELECT 1 FROM "Entity"."UserSkills" us
        WHERE us."UserId" = x."UserId" AND us."SkillId" = x."SkillId"
    )
    ON CONFLICT ("UserId", "SkillId") DO NOTHING;
    GET DIAGNOSTICS v_skills = ROW_COUNT;

    INSERT INTO "Entity"."UserSkillOrganizations" ("Id", "UserSkillId", "OrganizationId", "DateCreated")
    SELECT gen_random_uuid(), us."Id", q."OrganizationId", transaction_timestamp()
    FROM pg_temp.yom1313_backdated q
    JOIN "Entity"."UserSkills" us ON us."UserId" = q."UserId" AND us."SkillId" = q."SkillId"
    WHERE NOT EXISTS (
        SELECT 1 FROM "Entity"."UserSkillOrganizations" uso
        WHERE uso."UserSkillId" = us."Id" AND uso."OrganizationId" = q."OrganizationId"
    )
    ON CONFLICT ("UserSkillId", "OrganizationId") DO NOTHING;
    GET DIAGNOSTICS v_links = ROW_COUNT;

    IF EXISTS (
        SELECT 1 FROM pg_temp.yom1313_backdated q
        LEFT JOIN "Entity"."UserSkills" us ON us."UserId" = q."UserId" AND us."SkillId" = q."SkillId"
        LEFT JOIN "Entity"."UserSkillOrganizations" uso
            ON uso."UserSkillId" = us."Id" AND uso."OrganizationId" = q."OrganizationId"
        WHERE uso."Id" IS NULL
    ) THEN
        RAISE EXCEPTION 'Not all approved associations exist. Roll back.';
    END IF;

    DELETE FROM pg_temp.yom1313_queue q USING pg_temp.yom1313_backdated b
    WHERE q."Sequence" = b."Sequence" AND q."State" = 'Review';
    GET DIAGNOSTICS v_removed = ROW_COUNT;
    IF v_removed <> 365 THEN
        RAISE EXCEPTION 'Unexpected queue change. Roll back.';
    END IF;

    UPDATE pg_temp.yom1313_progress SET
        "HeldForReview" = "HeldForReview" - v_removed,
        "CommittedBatches" = "CommittedBatches" + 1,
        "InsertedUserSkills" = "InsertedUserSkills" + v_skills,
        "InsertedOrganizationLinks" = "InsertedOrganizationLinks" + v_links;
    INSERT INTO pg_temp.yom1313_log VALUES (
        clock_timestamp(), false, v_removed, v_removed, 0, v_skills, v_links,
        round(extract(epoch FROM clock_timestamp() - v_started) * 1000)
    );
    RAISE NOTICE 'Backdated cohort: % user skills, % organisation links inserted; % reviewed queue entries resolved.',
        v_skills, v_links, v_removed;
END $repair$;

-- These are PROPOSED values when ending with ROLLBACK.
SELECT * FROM pg_temp.yom1313_progress;
SELECT * FROM pg_temp.yom1313_log ORDER BY "At" DESC LIMIT 1;

ROLLBACK; -- First run: review results. Replace ONLY this with COMMIT after approval.
