-- ARCHIVED MANUAL PROCEDURE: incident repair completed; do not rerun without a fresh review.
-- Replace __APPROVED_DATABASE__ only in a private operator copy after verifying the target.
-- YOM-1313 LARGE BACKFILL: session-only preparation; no permanent data is changed.
-- Supersedes the single-transaction repair for this incident.
-- Use ONE DBeaver SQL editor/connection throughout, with Auto-commit ON.
-- Run this entire file once. Do not wrap subsequent CALL statements in BEGIN/COMMIT.
-- Requires the v3.13.10 hotfix to be deployed before applying batches.
-- Current mappings are NOT historical snapshots. First pass excludes late-mapping pairs.
-- Reconnecting discards this queue; rerun preparation to resume from remaining missing links.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SET LOCAL statement_timeout = '120s';
SET LOCAL lock_timeout = '2s';
SET LOCAL TIME ZONE 'UTC';

DO $guard$
BEGIN
    IF current_database() <> '__APPROVED_DATABASE__' THEN
        RAISE EXCEPTION 'Wrong database: %. Stopped.', current_database();
    END IF;
    IF to_regclass('pg_temp.yom1313_queue') IS NOT NULL THEN
        RAISE EXCEPTION 'A repair queue already exists in this session. Use progress/resume; do not overwrite it.';
    END IF;
    IF (SELECT count(*) FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification') <> 1
        OR (SELECT count(*) FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed') <> 1
        OR (SELECT count(*) FROM "Opportunity"."OpportunityType" WHERE "Name" = 'Job') <> 1 THEN
        RAISE EXCEPTION 'Expected Verification/Completed/Job lookups not found.';
    END IF;
END
$guard$;

CREATE TEMP TABLE yom1313_queue (
    "Sequence" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "SkillId" uuid NOT NULL,
    "OrganizationId" uuid NOT NULL,
    "MyOpportunityId" uuid NOT NULL,
    "OpportunitySkillId" uuid NOT NULL,
    "State" text NOT NULL CHECK ("State" IN ('Ready', 'Review', 'Deferred')),
    "MissingUserSkillAtPreparation" boolean NOT NULL
) ON COMMIT PRESERVE ROWS;

-- Choose one supporting completion per user/skill/organisation.
-- Prefer a mapping present by the completion date. If none exists, hold for review.
INSERT INTO yom1313_queue (
    "UserId", "SkillId", "OrganizationId", "MyOpportunityId", "OpportunitySkillId",
    "State", "MissingUserSkillAtPreparation"
)
SELECT DISTINCT ON (m."UserId", os."SkillId", o."OrganizationId")
    m."UserId", os."SkillId", o."OrganizationId", m."Id", os."Id",
    CASE WHEN os."DateCreated" <= m."DateCompleted" THEN 'Ready' ELSE 'Review' END,
    us."Id" IS NULL
FROM "Opportunity"."MyOpportunity" m
JOIN "Opportunity"."MyOpportunityAction" a ON a."Id" = m."ActionId"
JOIN "Opportunity"."MyOpportunityVerificationStatus" s ON s."Id" = m."VerificationStatusId"
JOIN "Opportunity"."Opportunity" o ON o."Id" = m."OpportunityId"
JOIN "Opportunity"."OpportunityType" t ON t."Id" = o."TypeId"
JOIN "Opportunity"."OpportunitySkills" os ON os."OpportunityId" = o."Id"
LEFT JOIN "Entity"."UserSkills" us ON us."UserId" = m."UserId" AND us."SkillId" = os."SkillId"
LEFT JOIN "Entity"."UserSkillOrganizations" uso
    ON uso."UserSkillId" = us."Id" AND uso."OrganizationId" = o."OrganizationId"
WHERE a."Name" = 'Verification' AND s."Name" = 'Completed'
    AND t."Name" <> 'Job' AND m."DateCompleted" IS NOT NULL AND uso."Id" IS NULL
ORDER BY m."UserId", os."SkillId", o."OrganizationId",
    (os."DateCreated" <= m."DateCompleted") DESC, m."Id", os."Id";

CREATE INDEX ON yom1313_queue ("Sequence") WHERE "State" = 'Ready';
ANALYZE yom1313_queue;

CREATE TEMP TABLE yom1313_progress ON COMMIT PRESERVE ROWS AS
SELECT current_database()::text AS "Database", transaction_timestamp() AS "PreparedAt",
    count(*) AS "InitialMissingLinks",
    count(*) FILTER (WHERE "State" = 'Ready') AS "InitialReadyLinks",
    count(*) FILTER (WHERE "State" = 'Ready') AS "ReadyRemaining",
    count(*) FILTER (WHERE "State" = 'Review') AS "HeldForReview",
    0::bigint AS "Deferred",
    0::bigint AS "CommittedBatches",
    0::bigint AS "InsertedUserSkills",
    0::bigint AS "InsertedOrganizationLinks"
FROM yom1313_queue;

CREATE TEMP TABLE yom1313_batch (
    "Sequence" bigint PRIMARY KEY
) ON COMMIT DELETE ROWS;
CREATE TEMP TABLE yom1313_eligible (
    "Sequence" bigint PRIMARY KEY
) ON COMMIT DELETE ROWS;
CREATE TEMP TABLE yom1313_log (
    "At" timestamptz NOT NULL,
    "DryRun" boolean NOT NULL,
    "Selected" integer NOT NULL,
    "Eligible" integer NOT NULL,
    "Deferred" integer NOT NULL,
    "InsertedUserSkills" integer NOT NULL,
    "InsertedOrganizationLinks" integer NOT NULL,
    "ElapsedMilliseconds" bigint NOT NULL
) ON COMMIT PRESERVE ROWS;

-- This procedure exists ONLY in this database session.
CREATE PROCEDURE pg_temp.yom1313_run(
    p_batch_size integer DEFAULT 1000,
    p_max_batches integer DEFAULT 1,
    p_apply boolean DEFAULT false
)
LANGUAGE plpgsql
AS $procedure$
DECLARE
    v_iteration integer;
    v_selected integer;
    v_eligible integer;
    v_skills integer;
    v_links integer;
    v_started timestamptz;
    v_elapsed bigint;
BEGIN
    IF current_database() <> '__APPROVED_DATABASE__'
        OR NOT EXISTS (SELECT 1 FROM pg_temp.yom1313_progress WHERE "Database" = current_database()) THEN
        RAISE EXCEPTION 'Wrong database or missing preparation. Stopped.';
    END IF;
    IF p_apply IS NULL OR p_batch_size IS NULL OR p_batch_size NOT BETWEEN 1 AND 1000
        OR p_max_batches IS NULL OR p_max_batches NOT BETWEEN 1 AND 100 THEN
        RAISE EXCEPTION 'Use batch size 1..1000, batch count 1..100 and an explicit apply flag.';
    END IF;
    IF NOT p_apply AND p_max_batches <> 1 THEN
        RAISE EXCEPTION 'Dry run must be exactly one batch.';
    END IF;

    -- Ensures top-level Auto-commit execution BEFORE any permanent writes.
    -- Inside an explicit transaction this fails; do not work around that restriction.
    COMMIT;

    FOR v_iteration IN 1..p_max_batches LOOP
        PERFORM set_config('lock_timeout', '2s', true);
        v_started := clock_timestamp();
        INSERT INTO pg_temp.yom1313_batch
        SELECT "Sequence" FROM pg_temp.yom1313_queue
        WHERE "State" = 'Ready' ORDER BY "Sequence" LIMIT p_batch_size;
        GET DIAGNOSTICS v_selected = ROW_COUNT;
        IF v_selected = 0 THEN
            COMMIT;
            RAISE NOTICE 'No ready rows remain. Review held/deferred rows separately and rerun the read-only audit.';
            RETURN;
        END IF;
        ANALYZE pg_temp.yom1313_batch;

        -- Short, per-batch writer exclusion; readers remain allowed.
        -- NOWAIT fails rather than queueing behind active writers.
        -- Run in a quiet window: this briefly blocks completion/mapping/skill writes.
        LOCK TABLE "Opportunity"."MyOpportunity", "Opportunity"."Opportunity", "Opportunity"."OpportunitySkills"
            IN SHARE MODE NOWAIT;
        LOCK TABLE "Entity"."UserSkills", "Entity"."UserSkillOrganizations"
            IN SHARE ROW EXCLUSIVE MODE NOWAIT;

        -- Revalidate the actual supporting records under the locks.
        INSERT INTO pg_temp.yom1313_eligible
        SELECT q."Sequence"
        FROM pg_temp.yom1313_batch b
        JOIN pg_temp.yom1313_queue q ON q."Sequence" = b."Sequence"
        JOIN "Opportunity"."MyOpportunity" m ON m."Id" = q."MyOpportunityId" AND m."UserId" = q."UserId"
        JOIN "Opportunity"."MyOpportunityAction" a ON a."Id" = m."ActionId"
        JOIN "Opportunity"."MyOpportunityVerificationStatus" s ON s."Id" = m."VerificationStatusId"
        JOIN "Opportunity"."Opportunity" o ON o."Id" = m."OpportunityId" AND o."OrganizationId" = q."OrganizationId"
        JOIN "Opportunity"."OpportunityType" t ON t."Id" = o."TypeId"
        JOIN "Opportunity"."OpportunitySkills" os ON os."Id" = q."OpportunitySkillId"
            AND os."OpportunityId" = o."Id" AND os."SkillId" = q."SkillId"
        WHERE a."Name" = 'Verification' AND s."Name" = 'Completed' AND t."Name" <> 'Job'
            AND m."DateCompleted" IS NOT NULL AND os."DateCreated" <= m."DateCompleted";
        GET DIAGNOSTICS v_eligible = ROW_COUNT;
        ANALYZE pg_temp.yom1313_eligible;

        INSERT INTO "Entity"."UserSkills" ("Id", "UserId", "SkillId", "DateCreated")
        SELECT gen_random_uuid(), x."UserId", x."SkillId", transaction_timestamp()
        FROM (
            SELECT DISTINCT q."UserId", q."SkillId"
            FROM pg_temp.yom1313_eligible e JOIN pg_temp.yom1313_queue q USING ("Sequence")
        ) x
        WHERE NOT EXISTS (
            SELECT 1 FROM "Entity"."UserSkills" us WHERE us."UserId" = x."UserId" AND us."SkillId" = x."SkillId"
        )
        ON CONFLICT ("UserId", "SkillId") DO NOTHING;
        GET DIAGNOSTICS v_skills = ROW_COUNT;

        INSERT INTO "Entity"."UserSkillOrganizations" ("Id", "UserSkillId", "OrganizationId", "DateCreated")
        SELECT gen_random_uuid(), us."Id", q."OrganizationId", transaction_timestamp()
        FROM pg_temp.yom1313_eligible e
        JOIN pg_temp.yom1313_queue q USING ("Sequence")
        JOIN "Entity"."UserSkills" us ON us."UserId" = q."UserId" AND us."SkillId" = q."SkillId"
        WHERE NOT EXISTS (
            SELECT 1 FROM "Entity"."UserSkillOrganizations" uso
            WHERE uso."UserSkillId" = us."Id" AND uso."OrganizationId" = q."OrganizationId"
        )
        ON CONFLICT ("UserSkillId", "OrganizationId") DO NOTHING;
        GET DIAGNOSTICS v_links = ROW_COUNT;

        IF EXISTS (
            SELECT 1 FROM pg_temp.yom1313_eligible e
            JOIN pg_temp.yom1313_queue q USING ("Sequence")
            LEFT JOIN "Entity"."UserSkills" us ON us."UserId" = q."UserId" AND us."SkillId" = q."SkillId"
            LEFT JOIN "Entity"."UserSkillOrganizations" uso
                ON uso."UserSkillId" = us."Id" AND uso."OrganizationId" = q."OrganizationId"
            WHERE uso."Id" IS NULL
        ) THEN
            RAISE EXCEPTION 'Incomplete batch: current transaction must roll back.';
        END IF;

        v_elapsed := round(extract(epoch FROM clock_timestamp() - v_started) * 1000);
        IF NOT p_apply THEN
            ROLLBACK;
            INSERT INTO pg_temp.yom1313_log
            VALUES (clock_timestamp(), true, v_selected, v_eligible, v_selected - v_eligible, v_skills, v_links, v_elapsed);
            COMMIT;
            RAISE NOTICE 'DRY RUN rolled back: % skills, % organisation links. Queue unchanged.', v_skills, v_links;
            RETURN;
        END IF;

        UPDATE pg_temp.yom1313_queue q SET "State" = 'Deferred'
        FROM pg_temp.yom1313_batch b
        WHERE b."Sequence" = q."Sequence"
            AND NOT EXISTS (SELECT 1 FROM pg_temp.yom1313_eligible e WHERE e."Sequence" = q."Sequence");
        DELETE FROM pg_temp.yom1313_queue q
        USING pg_temp.yom1313_eligible e WHERE e."Sequence" = q."Sequence";
        UPDATE pg_temp.yom1313_progress SET
            "ReadyRemaining" = "ReadyRemaining" - v_selected,
            "Deferred" = "Deferred" + v_selected - v_eligible,
            "CommittedBatches" = "CommittedBatches" + 1,
            "InsertedUserSkills" = "InsertedUserSkills" + v_skills,
            "InsertedOrganizationLinks" = "InsertedOrganizationLinks" + v_links;
        INSERT INTO pg_temp.yom1313_log
        VALUES (clock_timestamp(), false, v_selected, v_eligible, v_selected - v_eligible, v_skills, v_links, v_elapsed);
        COMMIT;
        RAISE NOTICE 'Batch % committed: % skills, % organisation links, % deferred (% ms).',
            v_iteration, v_skills, v_links, v_selected - v_eligible, v_elapsed;
        IF v_elapsed > 2000 THEN
            RAISE NOTICE 'Paused after a slow batch. Review database load and reduce batch size before resuming.';
            RETURN;
        END IF;
        -- All batch locks are released before this pause.
        PERFORM pg_sleep(0.2);
    END LOOP;
END
$procedure$;
COMMIT;

SELECT * FROM pg_temp.yom1313_progress;
SELECT "State", count(*) AS "MissingOrganizationLinks",
    count(DISTINCT ("UserId", "SkillId")) FILTER (WHERE "MissingUserSkillAtPreparation") AS "MissingUserSkills"
FROM pg_temp.yom1313_queue GROUP BY "State" ORDER BY "State";
-- The same user/skill can occur under more than one state/organisation: do not add skill counts across states.
