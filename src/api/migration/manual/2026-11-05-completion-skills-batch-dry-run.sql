-- SAME editor/connection as preparation; Auto-commit ON.
-- Select and execute each statement separately. Never wrap CALL in BEGIN.
SET statement_timeout = '30s';
CALL pg_temp.yom1313_run(1000, 1, false);
SELECT * FROM pg_temp.yom1313_log ORDER BY "At" DESC LIMIT 1;
SELECT * FROM pg_temp.yom1313_progress;
RESET statement_timeout;
-- DryRun=true describes proposed inserts that were ROLLED BACK.
-- Send both result grids for review before running the apply script.
