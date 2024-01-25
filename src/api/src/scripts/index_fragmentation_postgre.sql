USE [yoma-dev];
GO

SELECT 
	SCHEMA_NAME(t.schema_id) AS SchemaName,
    t.name AS TableName,
    ix.name AS IndexName,
    ps.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, NULL) AS ps
INNER JOIN sys.tables AS t ON ps.object_id = t.object_id
INNER JOIN sys.indexes AS ix ON ps.object_id = ix.object_id AND ps.index_id = ix.index_id
WHERE ps.avg_fragmentation_in_percent > 10; -- You can adjust the fragmentation threshold as needed
