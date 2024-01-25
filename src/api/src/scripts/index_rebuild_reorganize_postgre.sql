DO $$
DECLARE 
    v_SchemaName VARCHAR(128);
    v_TableName VARCHAR(128);
    v_IndexName VARCHAR(128);
    v_HitRate FLOAT;
    v_SQLQuery VARCHAR(1000);
BEGIN
    FOR v_SchemaName, v_TableName, v_IndexName, v_HitRate IN (
        SELECT
            schemaname,
            relname,
            indexrelname,
            pg_stat_get_blocks_fetched(indexrelid) / (pg_stat_get_blocks_fetched(indexrelid) + 1) AS HitRate
        FROM pg_stat_all_indexes
        WHERE pg_stat_get_blocks_fetched(indexrelid) > 0
    ) 
    LOOP
        -- Quote schema and table names to handle case sensitivity and special characters
        v_SchemaName := QUOTE_IDENT(v_SchemaName);
        v_TableName := QUOTE_IDENT(v_TableName);

        -- Your existing logic for deciding whether to REINDEX or not
        IF v_HitRate >= 0.3 THEN
            v_SQLQuery := 'REINDEX TABLE ' || v_SchemaName || '.' || v_TableName || ';';
        ELSE
            v_SQLQuery := 'REINDEX TABLE ' || v_SchemaName || '.' || v_TableName || ';';
        END IF;

        EXECUTE v_SQLQuery;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
