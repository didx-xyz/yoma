SELECT
    schemaname AS SchemaName,
    relname AS TableName,
    indexrelname AS IndexName,
    pg_stat_get_blocks_fetched(indexrelid) AS BlocksFetched,
    pg_stat_get_blocks_hit(indexrelid) AS BlocksHit,
    pg_stat_get_blocks_hit(indexrelid) / (pg_stat_get_blocks_fetched(indexrelid) + 1) AS HitRate
FROM pg_stat_all_indexes
WHERE pg_stat_get_blocks_fetched(indexrelid) > 0
ORDER BY HitRate ASC;
