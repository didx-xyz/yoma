USE [yoma-dev]
GO

/******!!!This script has been desinged to be applied to an empty database!!!*****/

/****users & organizations****/

--testuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO [Entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],
			[PhotoId],[GenderId],[DateOfBirth],[DateLastLogin],[ExternalId],[ZltoWalletId],[DateZltoWalletCreated],[YoIDOnboarded],[DateYoIDOnboarded],[DateCreated],[DateModified])
VALUES(NEWID(),'testuser@gmail.com',1,'Test','User','Test User','+27125555555',(SELECT TOP 1 [Id] FROM [Lookup].[Country] ORDER BY NEWID()),(SELECT TOP 1 [Id] FROM [Lookup].[Country] ORDER BY NEWID()),
		NULL,(SELECT TOP 1 [Id] FROM [Lookup].[Gender] ORDER BY NEWID()),CAST(DATEADD(YEAR, -20, GETDATE()) AS DATE),NULL,NULL,NULL,NULL,1,GETDATE(),GETDATE(),GETDATE())
GO

--testadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO [Entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],
			[PhotoId],[GenderId],[DateOfBirth],[DateLastLogin],[ExternalId],[ZltoWalletId],[DateZltoWalletCreated],[YoIDOnboarded],[DateYoIDOnboarded],[DateCreated],[DateModified])
VALUES(NEWID(),'testadminuser@gmail.com',1,'Test Admin','User','Test Admin User','+27125555555',(SELECT TOP 1 [Id] FROM [Lookup].[Country] ORDER BY NEWID()),(SELECT TOP 1 [Id] FROM [Lookup].[Country] ORDER BY NEWID()),
		NULL,(SELECT TOP 1 [Id] FROM [Lookup].[Gender] ORDER BY NEWID()),CAST(DATEADD(YEAR, -21, GETDATE()) AS DATE),NULL,NULL,NULL,NULL,1,GETDATE(),GETDATE(),GETDATE())
GO

--testorgadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO [Entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],
			[PhotoId],[GenderId],[DateOfBirth],[DateLastLogin],[ExternalId],[ZltoWalletId],[DateZltoWalletCreated],[YoIDOnboarded],[DateYoIDOnboarded],[DateCreated],[DateModified])
VALUES(NEWID(),'testorgadminuser@gmail.com',1,'Test Organization Admin','User','Test Organization Admin User','+27125555555',(SELECT TOP 1 [Id] FROM [Lookup].[Country] ORDER BY NEWID()),(SELECT TOP 1 [Id] FROM [Lookup].[Country] ORDER BY NEWID()),
		NULL,(SELECT TOP 1 [Id] FROM [Lookup].[Gender] ORDER BY NEWID()),CAST(DATEADD(YEAR, -22, GETDATE()) AS DATE),NULL,NULL,NULL,NULL,1,GETDATE(),GETDATE(),GETDATE())
GO

--ssi tenant creation (pending) for YOID onboarded users
INSERT INTO [SSI].[TenantCreation]([Id],[EntityType],[StatusId],[UserId],[OrganizationId],[TenantId],[ErrorReason],[RetryCount],[DateCreated],[DateModified])
SELECT NEWID(),'User',(SELECT [Id] FROM [SSI].[TenantCreationStatus] WHERE [Name] = 'Pending'),[Id],NULL,NULL,NULL,NULL,GETDATE(),GETDATE()
FROM [Entity].[User]
WHERE [YoIDOnboarded] = 1
GO

--ssi credential issuance (pending) for YOID onboarded users
INSERT INTO [SSI].[CredentialIssuance]([Id],[SchemaTypeId],[ArtifactType],[SchemaName],[SchemaVersion],[StatusId],[UserId],[OrganizationId]
           ,[MyOpportunityId],[CredentialId],[ErrorReason],[RetryCount],[DateCreated],[DateModified])
SELECT NEWID(),(SELECT [Id] FROM [SSI].[SchemaType] WHERE [Name] = 'YoID'),'Indy','YoID|Default','1.0',(SELECT [Id] FROM [SSI].[CredentialIssuanceStatus] WHERE [Name] = 'Pending'),
	U.[Id],NULL,NULL,NULL,NULL,NULL,GETDATE(),GETDATE()
FROM [Entity].[User] U
WHERE U.[YoIDOnboarded] = 1
GO

DECLARE @Words VARCHAR(500) = 'The,A,An,Awesome,Incredible,Fantastic,Amazing,Wonderful,Exciting,Unbelievable,Great,Marvelous,Stunning,Impressive,Captivating,Extraordinary,Superb,Epic,Spectacular,Magnificent,Phenomenal,Outstanding,Brilliant,Enthralling,Enchanting,Mesmerizing,Riveting,Spellbinding,Unforgettable,Sublime';
DECLARE @RandomLengthName INT = ABS(CHECKSUM(NEWID()) % 5) + 5;
DECLARE @RandomLengthOther INT = ABS(CHECKSUM(NEWID()) % 101) + 100;

DECLARE @RowCount INT = 0;
--organizations
WHILE @RowCount < 10
BEGIN
    INSERT INTO [Entity].[Organization]([Id],
			    [Name],
			    [WebsiteURL],[PrimaryContactName],[PrimaryContactEmail],[PrimaryContactPhone],[VATIN],[TaxNumber],[RegistrationNumber],
			    [City],[CountryId],[StreetAddress],[Province],[PostalCode],
			    [Tagline],
			    [Biography],
			    [StatusId],[CommentApproval],[DateStatusModified],[LogoId],[DateCreated],[DateModified])
    SELECT TOP 1 NEWID(),
            (SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (@RandomLengthName) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) + ' ' + CAST(ABS(CHECKSUM(NEWID())) % 2147483647 AS VARCHAR(10)),
		    'https://www.google.com/','Primary Contact','primarycontact@gmail.com','+27125555555', 'GB123456789', '0123456789', '12345/28/14',
		    'My City',(SELECT TOP 1 [Id] FROM [Lookup].[Country] ORDER BY NEWID()),'My Street Address 1000', 'My Province', '12345-1234',
		    (SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (@RandomLengthOther) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords),
		    (SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (@RandomLengthOther) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords),
		    (SELECT [Id] FROM [Entity].[OrganizationStatus] WHERE [Name] = 'Active'),'Approved',GETDATE(), NULL,GETDATE(),GETDATE()
    FROM sys.all_columns
  	SET @RowCount = @RowCount + 1;
END;
GO

--Yoma (Youth Agency Marketplace) organization
INSERT INTO [Entity].[Organization]([Id],[Name],[WebsiteURL],[PrimaryContactName],[PrimaryContactEmail],[PrimaryContactPhone],[VATIN],[TaxNumber],[RegistrationNumber]
           ,[City],[CountryId],[StreetAddress],[Province],[PostalCode],[Tagline],[Biography],[StatusId],[CommentApproval],[DateStatusModified],[LogoId],[DateCreated],[DateModified])
VALUES(NEWID(),'Yoma (Youth Agency Marketplace)','https://www.yoma.world/','Primary Contact','primarycontact@gmail.com','+27125555555', 'GB123456789', '0123456789', '12345/28/14',
		'My City',(SELECT [Id] FROM [Lookup].[Country] WHERE CodeAlpha2 = 'ZA'),'My Street Address 1000', 'My Province', '12345-1234','Tag Line','Biography',
		(SELECT [Id] FROM [Entity].[OrganizationStatus] WHERE [Name] = 'Active'),'Approved',GETDATE(), NULL,GETDATE(),GETDATE())
GO

--organization admins
INSERT INTO [Entity].[OrganizationUsers]([Id],[OrganizationId],[UserId],[DateCreated])
SELECT NEWID(), [Id], (SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testorgadminuser@gmail.com'), GETDATE()
FROM [Entity].[Organization]
GO

--ssi tenant creation (pending) for active organizations
INSERT INTO [SSI].[TenantCreation]([Id],[EntityType],[StatusId],[UserId],[OrganizationId],[TenantId],[ErrorReason],[RetryCount],[DateCreated],[DateModified])
SELECT NEWID(),'Organization',(SELECT [Id] FROM [SSI].[TenantCreationStatus] WHERE [Name] = 'Pending'),NULL,[Id],NULL,NULL,NULL,GETDATE(),GETDATE()
FROM [Entity].[Organization]
WHERE [StatusId] = (SELECT [Id] FROM [Entity].[OrganizationStatus] WHERE [Name] = 'Active')
GO

--organization provider types
INSERT INTO [Entity].[OrganizationProviderTypes]([Id],[OrganizationId],[ProviderTypeId],[DateCreated])
SELECT NEWID(),O.[Id] AS [OrganizationId],PT.[Id] AS [ProviderTypeId],GETDATE() FROM [Entity].[Organization] O CROSS JOIN [Entity].[OrganizationProviderType] PT
GO

/****opportunities****/
DECLARE @Words VARCHAR(500) = 'The,A,An,Awesome,Incredible,Fantastic,Amazing,Wonderful,Exciting,Unbelievable,Great,Marvelous,Stunning,Impressive,Captivating,Extraordinary,Superb,Epic,Spectacular,Magnificent,Phenomenal,Outstanding,Brilliant,Enthralling,Enchanting,Mesmerizing,Riveting,Spellbinding,Unforgettable,Sublime';
DECLARE @RowCount INT = 0;

DECLARE @DateCreated DATETIMEOFFSET(7) = DATEADD(MONTH, -1 , GETDATE())
DECLARE @DateStart DATETIMEOFFSET(7) = DATEADD(MONTH, -2 , GETDATE())
DECLARE @TotalSecondsIn2Months BIGINT = 2 * 30.44 * 24 * 60 * 60
DECLARE @Iterations INT = 5000
DECLARE @SecondsPerIteration BIGINT = @TotalSecondsIn2Months / @Iterations

--opportunities
WHILE @RowCount < @Iterations
BEGIN
  DECLARE @VerificationEnabled BIT = CAST(CHECKSUM(NEWID()) % 2 AS BIT);

  INSERT INTO [Opportunity].[Opportunity]([Id],
		[Title],
		[Description],
		[TypeId],
		[OrganizationId],
		[Summary],
		[Instructions],
		[URL],
		[ZltoReward],
		[ZltoRewardPool],
		[ZltoRewardCumulative],
		[YomaReward],
		[YomaRewardPool],
		[YomaRewardCumulative],
		[VerificationEnabled],
		[VerificationMethod],
		[DifficultyId],
		[CommitmentIntervalId],
		[CommitmentIntervalCount],
		[ParticipantLimit],
		[ParticipantCount],
		[StatusId],
		[Keywords],
		[DateStart],
		[DateEnd],
		[CredentialIssuanceEnabled],
		[SSISchemaName],
		[DateCreated],
		[CreatedBy],
		[DateModified],
		[ModifiedBy])
  SELECT TOP 1 NEWID(),
		(SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (ABS(CHECKSUM(NEWID()) % 10) + 5) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) + ' ' + CAST(ABS(CHECKSUM(NEWID())) % 2147483647 AS VARCHAR(10)) as [Title],
		(SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (ABS(CHECKSUM(NEWID()) % 101) + 100) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) as [Description],
		(SELECT TOP 1 [Id] FROM [Opportunity].[OpportunityType] ORDER BY NEWID()) as [TypeId],
		(SELECT TOP 1 [Id] FROM [Entity].[Organization] ORDER BY NEWID()) as [OrganizationId],
		NULL,
		(SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (ABS(CHECKSUM(NEWID()) % 101) + 100) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) as [Instructions],
		'https://www.google.com/',
		(SELECT ROUND(100 + (350 - 100) * RAND(), 2)) as [ZltoReward],
		(SELECT ROUND(1000 + (3500 - 1000) * RAND(), 2)) as [ZltoRewardPool],
		NULL,
		(SELECT ROUND(100 + (350 - 100) * RAND(), 2)) as [YomaReward],
		(SELECT ROUND(1000 + (3500 - 1000) * RAND(), 2)) as [YomaRewardPool],
		NULL,
		@VerificationEnabled,
    CASE WHEN @VerificationEnabled = 1 THEN 'Manual' ELSE NULL END,
		(SELECT TOP 1 [Id] FROM [Opportunity].[OpportunityDifficulty] ORDER BY NEWID()) as [DifficultyId],
		(SELECT TOP 1 [Id] FROM [Lookup].[TimeInterval] ORDER BY NEWID()) as [CommitmentIntervalId],
		(SELECT 1 + ABS(CHECKSUM(NEWID()) % 10)) as [CommitmentIntervalCount],
		(SELECT 100 + ABS(CHECKSUM(NEWID()) % 901)) as [ParticipantLimit],
		NULL,
		(SELECT TOP 1 [Id] FROM [Opportunity].[OpportunityStatus] WHERE [Name] in ('Active','Inactive') ORDER BY NEWID()) as [StatusId],
		(SELECT TOP 1 STRING_AGG(Word, ',') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (ABS(CHECKSUM(NEWID()) % 101) + 100) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) as [Keywords],
		CAST(@DateStart AS DATE),
		CAST(DATEADD(DAY, 7, @DateStart) AS DATE),
   	CASE WHEN @VerificationEnabled = 1 THEN 1 ELSE 0 END,
		NULL,
		@DateCreated,
		'testuser@gmail.com',
		GETDATE(),
		'testuser@gmail.com'
  FROM sys.all_columns

  SET @RowCount = @RowCount + 1;
  SET @DateCreated = DATEADD(SECOND, 1, @DateCreated)
  SET @DateStart = DATEADD(SECOND, @SecondsPerIteration, @DateStart)
END;

--ssi schema definitions
WITH CTE AS (
  SELECT O.[SSISchemaName]
  FROM [Opportunity].[Opportunity] AS O
  WHERE O.[CredentialIssuanceEnabled] = 1
)
UPDATE CTE
SET [SSISchemaName] = 'Opportunity|Default';
GO

IF EXISTS (SELECT 1 FROM [Opportunity].[Opportunity] WHERE [CredentialIssuanceEnabled] = 1 AND [SSISchemaName] = 'ERROR')
BEGIN
  THROW 50000, 'Unsupported SSISchemaName: ERROR', 1;
END
GO

--categories
INSERT INTO [Opportunity].[OpportunityCategories]([Id],[OpportunityId],[CategoryId],[DateCreated])
SELECT NEWID(),O.[Id] AS [OpportunityId],OC.[Id] AS [CategoryId],GETDATE() FROM [Opportunity].[Opportunity] O CROSS JOIN [Opportunity].[OpportunityCategory] OC
GO

--countries
INSERT INTO [Opportunity].[OpportunityCountries]([Id], [OpportunityId], [CountryID], [DateCreated])
SELECT NEWID(), O.[Id] AS [OpportunityId], R.CountryID, GETDATE()
FROM [Opportunity].[Opportunity] O
CROSS JOIN (
    SELECT TOP 10 [Id] AS CountryID
    FROM [Lookup].[Country]
    ORDER BY NEWID()
) AS R;
GO

--languages
INSERT INTO [Opportunity].[OpportunityLanguages]([Id],[OpportunityId],[LanguageId],[DateCreated])
SELECT NEWID(), O.[Id] AS [OpportunityId], R.LanguageId, GETDATE()
FROM [Opportunity].[Opportunity] O
CROSS JOIN (
    SELECT TOP 10 [Id] AS LanguageId
    FROM [Lookup].[Language]
    ORDER BY NEWID()
) AS R;
GO

--skills
INSERT INTO [Opportunity].[OpportunitySkills]([Id],[OpportunityId],[SkillId],[DateCreated])
SELECT NEWID(), O.[Id] AS [OpportunityId], R.SkillId, GETDATE()
FROM [Opportunity].[Opportunity] O
CROSS JOIN (
    SELECT TOP 10 [Id] AS SkillId
    FROM [Lookup].[Skill]
    ORDER BY NEWID()
) AS R;
GO

--verification types
INSERT INTO [Opportunity].[OpportunityVerificationTypes]([Id],[OpportunityId],[VerificationTypeId],[Description],[DateCreated],[DateModified])
SELECT NEWID(), O.[Id] AS [OpportunityId], R.[VerificationTypeId], NULL, GETDATE(), GETDATE()
FROM [Opportunity].[Opportunity] O
CROSS JOIN (
    SELECT TOP 10 [Id] AS [VerificationTypeId]
    FROM [Opportunity].[OpportunityVerificationType]
    ORDER BY NEWID()
) AS R
WHERE O.VerificationEnabled = 1
GO

/****myOpportunities****/
--viewed
INSERT INTO [Opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CommentVerification],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [Opportunity].[MyOpportunityAction] WHERE [Name] = 'Viewed'),
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	GETDATE(),
	GETDATE()
FROM [Opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [Opportunity].[OpportunityStatus] WHERE [Name] = 'Active')
ORDER BY [DateCreated]
OFFSET 0 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--saved
INSERT INTO [Opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CommentVerification],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [Opportunity].[MyOpportunityAction] WHERE [Name] = 'Saved'),
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	GETDATE(),
	GETDATE()
FROM [Opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [Opportunity].[OpportunityStatus] WHERE [Name] = 'Active')
ORDER BY [DateCreated]
OFFSET 30 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--verification (pending)
INSERT INTO [Opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CommentVerification],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [Opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification'),
	(SELECT [Id] FROM [Opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Pending'),
	NULL,
	CAST(DATEADD(DAY, 1, O.[DateStart]) AS DATE),
	CAST(DATEADD(DAY, 2, O.[DateStart]) AS DATE),
	NULL,
	NULL,
	NULL,
	GETDATE(),
	GETDATE()
FROM [Opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [Opportunity].[OpportunityStatus] WHERE [Name] = 'Active') AND O.[DateStart] <= GETDATE() AND O.[DateEnd] > GETDATE()
ORDER BY [DateCreated]
OFFSET 60 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--verification (rejected)
INSERT INTO [Opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CommentVerification],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [Opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification'),
	(SELECT [Id] FROM [Opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Rejected'),
	'Rejection Comment',
	CAST(DATEADD(DAY, 1, O.[DateStart]) AS DATE),
	CAST(DATEADD(DAY, 2, O.[DateStart]) AS DATE),
	NULL,
	NULL,
	NULL,
	GETDATE(),
	GETDATE()
FROM [Opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [Opportunity].[OpportunityStatus] WHERE [Name] = 'Active') AND O.[DateStart] <= GETDATE() AND O.[DateEnd] > GETDATE()
ORDER BY [DateCreated]
OFFSET 90 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--verification (completed)
INSERT INTO [Opportunity].[MyOpportunity]([Id],[UserId],[OpportunityId],[ActionId],[VerificationStatusId],[CommentVerification],[DateStart]
           ,[DateEnd],[DateCompleted],[ZltoReward],[YomaReward],[DateCreated],[DateModified])
SELECT
	NEWID() ,
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	O.[Id],
	(SELECT [Id] FROM [Opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification'),
	(SELECT [Id] FROM [Opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Completed'),
	'Approved Comment',
	CAST(DATEADD(DAY, 1, O.[DateStart]) AS DATE),
	CAST(DATEADD(DAY, 2, O.[DateStart]) AS DATE),
	GETDATE(),
	O.[ZltoReward],
	O.[YomaReward],
	GETDATE(),
	GETDATE()
FROM [Opportunity].[Opportunity] O
WHERE O.StatusId = (SELECT [Id] FROM [Opportunity].[OpportunityStatus] WHERE [Name] = 'Active') AND O.[DateStart] <= GETDATE() AND O.[DateEnd] > GETDATE()
ORDER BY [DateCreated]
OFFSET 120 ROWS
FETCH NEXT 30 ROWS ONLY;
GO

--ssi credential issuance (pending) for verification (completed) mapped to opportunities with CredentialIssuanceEnabled
INSERT INTO [SSI].[CredentialIssuance]([Id],[SchemaTypeId],[ArtifactType],[SchemaName],[SchemaVersion],[StatusId],[UserId],[OrganizationId]
           ,[MyOpportunityId],[CredentialId],[ErrorReason],[RetryCount],[DateCreated],[DateModified])
SELECT NEWID(),(SELECT [Id] FROM [SSI].[SchemaType] WHERE [Name] = 'Opportunity'),'Indy',O.SSISchemaName,'1.5',(SELECT [Id] FROM [SSI].[CredentialIssuanceStatus] WHERE [Name] = 'Pending'), --TODO: Ld_proof
	NULL,NULL,MO.Id,NULL,NULL,NULL,GETDATE(),GETDATE()
FROM [Opportunity].[MyOpportunity] MO
INNER JOIN [Opportunity].[Opportunity] O ON MO.OpportunityId = O.Id
WHERE MO.[ActionId] = (SELECT [Id] FROM [Opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification')
		AND MO.[VerificationStatusId] = (SELECT [Id] FROM [Opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Completed')
		AND O.CredentialIssuanceEnabled = 1
GO

--verification (completed): assign user skills
INSERT INTO [Entity].[UserSkills]([Id],[UserId],[SkillId],[DateCreated])
SELECT NEWID(),
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testuser@gmail.com'),
	[Skills].[SkillId],
	GETDATE()
FROM
	(SELECT DISTINCT(OS.[SkillId])
	FROM [Opportunity].[MyOpportunity] MO
	INNER JOIN [Opportunity].[OpportunitySkills] OS
	ON MO.[OpportunityId] = OS.[opportunityId]
	WHERE MO.[ActionId] = (SELECT [Id] FROM [Opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification')
		AND MO.[VerificationStatusId] = (SELECT [Id] FROM [Opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Completed')) AS [Skills]
GO

--opporutnity: update running totals
WITH AggregatedData AS (
    SELECT
        O.[Id] AS OpportunityId,
        COUNT(MO.[Id]) AS [Count],
        SUM(MO.[ZltoReward]) AS [ZltoRewardTotal],
        SUM(MO.[YomaReward]) AS [YomaRewardTotal]
    FROM [Opportunity].[Opportunity] O
    LEFT JOIN [Opportunity].[MyOpportunity] MO ON O.[Id] = MO.[OpportunityId]
    WHERE MO.[ActionId] = (SELECT [Id] FROM [Opportunity].[MyOpportunityAction] WHERE [Name] = 'Verification')
        AND MO.[VerificationStatusId] = (SELECT [Id] FROM [Opportunity].[MyOpportunityVerificationStatus] WHERE [Name] = 'Completed')
    GROUP BY O.[Id]
)
UPDATE O
SET
    O.[ParticipantCount] = A.[Count],
    O.[ZltoRewardCumulative] = A.[ZltoRewardTotal],
    O.[YomaRewardCumulative] = A.[YomaRewardTotal]
FROM [Opportunity].[Opportunity] O
INNER JOIN AggregatedData A ON O.[Id] = A.OpportunityId;
GO
