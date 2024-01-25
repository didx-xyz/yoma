USE [yoma-dev];
GO

-- Reorganize or Rebuild indexes based on fragmentation
DECLARE @SchemaName NVARCHAR(128)
DECLARE @TableName NVARCHAR(128)
DECLARE @IndexName NVARCHAR(128)
DECLARE @Fragmentation FLOAT

DECLARE IndexCursor CURSOR FOR
SELECT
    SCHEMA_NAME(t.schema_id) AS SchemaName,
    t.name AS TableName,
    ix.name AS IndexName,
    ps.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, NULL) AS ps
INNER JOIN sys.tables AS t ON ps.object_id = t.object_id
INNER JOIN sys.indexes AS ix ON ps.object_id = ix.object_id AND ps.index_id = ix.index_id
WHERE ps.avg_fragmentation_in_percent > 10; -- You can adjust the fragmentation threshold as needed

OPEN IndexCursor

FETCH NEXT FROM IndexCursor INTO @SchemaName, @TableName, @IndexName, @Fragmentation

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @SQL NVARCHAR(MAX)
    
    IF @Fragmentation >= 30
    BEGIN
        SET @SQL = 'ALTER INDEX [' + @IndexName + '] ON [' + @SchemaName + '].[' + @TableName + '] REBUILD;'
    END
    ELSE
    BEGIN
        SET @SQL = 'ALTER INDEX [' + @IndexName + '] ON [' + @SchemaName + '].[' + @TableName + '] REORGANIZE;'
    END
    
    EXEC sp_executesql @SQL
    
    FETCH NEXT FROM IndexCursor INTO @SchemaName, @TableName, @IndexName, @Fragmentation
END

CLOSE IndexCursor
DEALLOCATE IndexCursor
