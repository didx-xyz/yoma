USE [yoma-dev]
GO

/****opportunities****/
DECLARE @Words VARCHAR(500) = 'The,A,An,Awesome,Incredible,Fantastic,Amazing,Wonderful,Exciting,Unbelievable,Great,Marvelous,Stunning,Impressive,Captivating,Extraordinary,Superb,Epic,Spectacular,Magnificent,Phenomenal,Outstanding,Brilliant,Enthralling,Enchanting,Mesmerizing,Riveting,Spellbinding,Unforgettable,Sublime';
DECLARE @RowCount INT = 0;

--opportunities
WHILE @RowCount < 5000
BEGIN
  DECLARE @DateStart DateTimeOffset(7) =
    CASE
        WHEN ABS(CHECKSUM(NEWID()) % 10) >= 2 -- Adjust the threshold (e.g., 2 out of 10)
        THEN DATEADD(DAY, ABS(CHECKSUM(NEWID()) % (5 * 365)) + 365, GETDATE())
        ELSE DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % (5 * 365)), GETDATE())
    END;

  INSERT INTO [opportunity].[Opportunity]([Id],
		[Title],
		[Description],
		[TypeId],
		[OrganizationId],
		[Instructions],
		[URL],
		[ZltoReward],
		[ZltoRewardPool],
		[ZltoRewardCumulative],
		[YomaReward],
		[YomaRewardPool],
		[YomaRewardCumulative],
		[VerificationSupported],
		[DifficultyId],
		[CommitmentIntervalId],
		[CommitmentIntervalCount],
		[ParticipantLimit],
		[ParticipantCount],
		[StatusId],
		[Keywords],
		[DateStart],
		[DateEnd],
		[DateCreated],
		[CreatedBy],
		[DateModified],
		[ModifiedBy])
  SELECT TOP 1 NEWID(),
		(SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (ABS(CHECKSUM(NEWID()) % 10) + 5) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) + ' ' + CAST(ABS(CHECKSUM(NEWID())) % 2147483647 AS VARCHAR(10)) as [Title],
		(SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (ABS(CHECKSUM(NEWID()) % 101) + 100) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) as [Description],
		(SELECT TOP 1 [Id] FROM [opportunity].[OpportunityType] ORDER BY NEWID()) as [TypeId],
		(SELECT TOP 1 [Id] FROM [entity].[Organization] ORDER BY NEWID()) as [OrganizationId],
		(SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (ABS(CHECKSUM(NEWID()) % 101) + 100) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) as [Instructions],
		'www.google.com',
		(SELECT ROUND(100 + (350 - 100) * RAND(), 2)) as [ZltoReward],
		(SELECT ROUND(1000 + (3500 - 1000) * RAND(), 2)) as [ZltoRewardPool],
		NULL,
		(SELECT ROUND(100 + (350 - 100) * RAND(), 2)) as [YomaReward],
		(SELECT ROUND(1000 + (3500 - 1000) * RAND(), 2)) as [YomaRewardPool],
		NULL,
		(SELECT CAST(CHECKSUM(NEWID()) % 2 AS BIT)) as [VerificationSupported],
		(SELECT TOP 1 [Id] FROM [opportunity].[OpportunityDifficulty] ORDER BY NEWID()) as [DifficultyId],
		(SELECT TOP 1 [Id] FROM [lookup].[TimeInterval] ORDER BY NEWID()) as [CommitmentIntervalId],
		(SELECT 1 + ABS(CHECKSUM(NEWID()) % 10)) as [CommitmentIntervalCount],
		(SELECT 100 + ABS(CHECKSUM(NEWID()) % 901)) as [ParticipantLimit],
		NULL,
		(SELECT TOP 1 [Id] FROM [opportunity].[OpportunityStatus] WHERE [Name] in ('Active','Inactive') ORDER BY NEWID()) as [StatusId],
		(SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (ABS(CHECKSUM(NEWID()) % 101) + 100) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) as [Keywords],
		@DateStart,
		CAST(DATEADD(DAY, 2, @DateStart) AS DATE),
		GETDATE(),
		'testuser@gmail.com',
		GETDATE(),
		'testuser@gmail.com'
  FROM sys.all_columns
	SET @RowCount = @RowCount + 1;
END;

--categories
INSERT INTO [opportunity].[OpportunityCategories]([Id],[OpportunityId],[CategoryId],[DateCreated])
SELECT NEWID(),O.[Id] AS [OpportunityId],OC.[Id] AS [CategoryId],GETDATE() FROM [opportunity].[Opportunity] O CROSS JOIN [opportunity].[OpportunityCategory] OC
GO

--countries
INSERT INTO [opportunity].[OpportunityCountries]([Id], [OpportunityId], [CountryID], [DateCreated])
SELECT NEWID(), O.[Id] AS [OpportunityId], R.CountryID, GETDATE()
FROM [opportunity].[Opportunity] O
CROSS JOIN (
    SELECT TOP 10 [Id] AS CountryID
    FROM [lookup].[Country]
    ORDER BY NEWID()
) AS R;
GO

--languages
INSERT INTO [opportunity].[OpportunityLanguages]([Id],[OpportunityId],[LanguageId],[DateCreated])
SELECT NEWID(), O.[Id] AS [OpportunityId], R.LanguageId, GETDATE()
FROM [opportunity].[Opportunity] O
CROSS JOIN (
    SELECT TOP 10 [Id] AS LanguageId
    FROM [lookup].[Language]
    ORDER BY NEWID()
) AS R;
GO

--skills
INSERT INTO [opportunity].[OpportunitySkills]([Id],[OpportunityId],[SkillId],[DateCreated])
SELECT NEWID(), O.[Id] AS [OpportunityId], R.SkillId, GETDATE()
FROM [opportunity].[Opportunity] O
CROSS JOIN (
    SELECT TOP 10 [Id] AS SkillId
    FROM [lookup].[Skill]
    ORDER BY NEWID()
) AS R;
GO

/****myOpportunities****/
--viewed
INSERT INTO [opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CertificateId],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [opportunity].[MyOpportunityAction] WHERE [Name] = 'Viewed'),
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	GETDATE(),
	GETDATE()
FROM [opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [opportunity].[OpportunityStatus] WHERE [Name] = 'Active')
ORDER BY [DateCreated]
OFFSET 0 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--saved
INSERT INTO [opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CertificateId],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [opportunity].[MyOpportunityAction] WHERE [Name] = 'Saved'),
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	GETDATE(),
	GETDATE()
FROM [opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [opportunity].[OpportunityStatus] WHERE [Name] = 'Active')
ORDER BY [DateCreated]
OFFSET 30 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--verification (pending)
INSERT INTO [opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CertificateId],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification'),
	(SELECT [Id] FROM [opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Pending'),
	NULL,
	CAST(DATEADD(DAY, 1, O.[DateStart]) AS DATE),
	CAST(DATEADD(DAY, 2, O.[DateStart]) AS DATE),
	NULL,
	NULL,
	NULL,
	GETDATE(),
	GETDATE()
FROM [opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [opportunity].[OpportunityStatus] WHERE [Name] = 'Active') AND O.[DateStart] <= GETDATE() AND O.[DateEnd] > GETDATE()
ORDER BY [DateCreated]
OFFSET 60 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--verification (rejected)
INSERT INTO [opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CertificateId],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification'),
	(SELECT [Id] FROM [opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Rejected'),
	NULL,
	CAST(DATEADD(DAY, 1, O.[DateStart]) AS DATE),
	CAST(DATEADD(DAY, 2, O.[DateStart]) AS DATE),
	NULL,
	NULL,
	NULL,
	GETDATE(),
	GETDATE()
FROM [opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [opportunity].[OpportunityStatus] WHERE [Name] = 'Active') AND O.[DateStart] <= GETDATE() AND O.[DateEnd] > GETDATE()
ORDER BY [DateCreated]
OFFSET 90 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--verification (completed)
INSERT INTO [opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CertificateId],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification'),
	(SELECT [Id] FROM [opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Completed'),
	NULL,
	CAST(DATEADD(DAY, 1, O.[DateStart]) AS DATE),
	CAST(DATEADD(DAY, 2, O.[DateStart]) AS DATE),
	GETDATE(),
	O.[ZltoReward],
	O.[YomaReward],
	GETDATE(),
	GETDATE()
FROM [opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [opportunity].[OpportunityStatus] WHERE [Name] = 'Active') AND O.[DateStart] <= GETDATE() AND O.[DateEnd] > GETDATE()
ORDER BY [DateCreated]
OFFSET 120 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--opporutnity: update running totals
WITH AggregatedData AS (
    SELECT
        O.[Id] AS OpportunityId,
        COUNT(MO.[Id]) AS [Count],
        SUM(MO.[ZltoReward]) AS [ZltoRewardTotal],
        SUM(MO.[YomaReward]) AS [YomaRewardTotal]
    FROM [opportunity].[Opportunity] O
    LEFT JOIN [opportunity].[MyOpportunity] MO ON O.[Id] = MO.[OpportunityId]
    WHERE MO.[ActionId] = (SELECT [Id] FROM [opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification')
        AND MO.[VerificationStatusId] = (SELECT [Id] FROM [opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Completed')
    GROUP BY O.[Id]
)
UPDATE O
SET
    O.[ParticipantCount] = A.[Count],
    O.[ZltoRewardCumulative] = A.[ZltoRewardTotal],
    O.[YomaRewardCumulative] = A.[YomaRewardTotal]
FROM [opportunity].[Opportunity] O
INNER JOIN AggregatedData A ON O.[Id] = A.OpportunityId;
GO
