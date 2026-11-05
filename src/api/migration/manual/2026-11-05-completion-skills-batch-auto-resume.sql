-- ARCHIVED MANUAL PROCEDURE: incident repair completed; not a deployment migration.
-- Replace __APPROVED_DATABASE__ only in a private operator copy after verifying the target.
-- YOM-1313: resume the EXISTING session queue. Do NOT reconnect or rerun preparation.
-- This archived file installs only the session procedure; apply commands are commented out.
-- Script Commit type: After each query (autocommit). Error handling: Stop + rollback.
-- Do not use Ctrl+Enter on the entire file or wrap it in BEGIN/COMMIT.
-- Installation does not write application data. Explicit apply flag required.
-- 1000 rows/batch maximum; pause 1s between commits; retry busy locks every 5s.
-- Stop after 24 consecutive busy attempts, slow batch, deferred records or other error.
-- Held-for-review rows remain untouched. Prior commits survive cancellation/errors.
CREATE OR REPLACE PROCEDURE pg_temp.yom1313_run_auto(
    p_batch_size integer DEFAULT 1000,
    p_max_batches integer DEFAULT 2000,
    p_apply boolean DEFAULT false
)
LANGUAGE plpgsql
AS $procedure$
DECLARE
    v_iteration integer;
    v_lock_attempts integer;
    v_locks_acquired boolean;
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
        OR p_max_batches IS NULL OR p_max_batches NOT BETWEEN 1 AND 2000 THEN
        RAISE EXCEPTION 'Use batch size 1..1000, batch count 1..2000 and an explicit apply flag.';
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
        v_lock_attempts := 0;
        LOOP
            v_locks_acquired := false;
            -- Failed acquisition releases partially acquired locks before sleeping.
            -- Transaction control remains OUTSIDE this exception subtransaction.
            BEGIN
                LOCK TABLE "Opportunity"."MyOpportunity", "Opportunity"."Opportunity", "Opportunity"."OpportunitySkills"
                    IN SHARE MODE NOWAIT;
                LOCK TABLE "Entity"."UserSkills", "Entity"."UserSkillOrganizations"
                    IN SHARE ROW EXCLUSIVE MODE NOWAIT;
                v_locks_acquired := true;
            EXCEPTION WHEN lock_not_available THEN
                v_lock_attempts := v_lock_attempts + 1;
            END;
            EXIT WHEN v_locks_acquired;
            IF v_lock_attempts >= 24 THEN
                ROLLBACK;
                RAISE NOTICE 'Paused after 24 busy-lock attempts. Previous batches are committed; resume later.';
                RETURN;
            END IF;
            RAISE NOTICE 'Database busy: waiting 5 seconds before lock retry % of 24.', v_lock_attempts + 1;
            PERFORM pg_sleep(5);
        END LOOP;
        -- Measure work under acquired locks, excluding contention backoff.
        v_started := clock_timestamp();

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
        IF v_selected <> v_eligible THEN
            RAISE NOTICE 'Paused: changed source records were deferred. Review before resuming.';
            RETURN;
        END IF;
        -- All batch locks are released before this pause.
        PERFORM pg_sleep(1);
    END LOOP;
END
$procedure$;
-- Only after fresh approval: uncomment in a private operator copy and execute sequentially.
-- Whole-run safety ceiling, NOT a 30-minute lock wait.
-- SET statement_timeout = '30min';
-- CALL pg_temp.yom1313_run_auto(1000, 2000, true);
-- SELECT * FROM pg_temp.yom1313_progress;
-- RESET statement_timeout;
-- On error: ROLLBACK; then inspect progress without reconnecting.
-- Also RESET statement_timeout after an error when the script stops before RESET.
