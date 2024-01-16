USE [yoma-stage]
GO
/*****user & organization*****/
INSERT INTO [Entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],
			[PhotoId],[GenderId],[DateOfBirth],[DateLastLogin],[ExternalId],[YoIDOnboarded],[DateYoIDOnboarded],[DateCreated],[DateModified])
VALUES(NEWID(),'{test_user}',1,'Sam','Henderson','Sam Henderson',null,(SELECT [Id] FROM [Lookup].[Country] WHERE CodeAlpha2 = 'ZA'),(SELECT [Id] FROM [Lookup].[Country] WHERE CodeAlpha2 = 'ZA'),
		NULL,(SELECT TOP 1 [Id] FROM [Lookup].[Gender] WHERE [Name] = 'Male'),NULL,NULL,NULL,1,GETDATE(),GETDATE(),GETDATE())
GO

INSERT INTO [Entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],
			[PhotoId],[GenderId],[DateOfBirth],[DateLastLogin],[ExternalId],,[YoIDOnboarded],[DateYoIDOnboarded],[DateCreated],[DateModified])
VALUES(NEWID(),'{org_admin_user}',1,'Sam','Henderson','Sam Henderson',null,(SELECT [Id] FROM [Lookup].[Country] WHERE CodeAlpha2 = 'ZA'),(SELECT [Id] FROM [Lookup].[Country] WHERE CodeAlpha2 = 'ZA'),
		NULL,(SELECT TOP 1 [Id] FROM [Lookup].[Gender] WHERE [Name] = 'Male'),NULL,NULL,NULL,1,GETDATE(),GETDATE(),GETDATE())
GO

INSERT INTO [Entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],
			[PhotoId],[GenderId],[DateOfBirth],[DateLastLogin],[ExternalId],[YoIDOnboarded],[DateYoIDOnboarded],[DateCreated],[DateModified])
VALUES(NEWID(),'{admin_user}',1,'Sam','Henderson','Sam Henderson',null,(SELECT [Id] FROM [Lookup].[Country] WHERE CodeAlpha2 = 'ZA'),(SELECT [Id] FROM [Lookup].[Country] WHERE CodeAlpha2 = 'ZA'),
		NULL,(SELECT TOP 1 [Id] FROM [Lookup].[Gender] WHERE [Name] = 'Male'),NULL,NULL,NULL,1,GETDATE(),GETDATE(),GETDATE())
GO

--ssi credential issuance (pending) for YOID onboarded users
INSERT INTO [SSI].[CredentialIssuance]([Id],[SchemaTypeId],[ArtifactType],[SchemaName],[SchemaVersion],[StatusId],[UserId],[OrganizationId]
           ,[MyOpportunityId],[CredentialId],[ErrorReason],[RetryCount],[DateCreated],[DateModified])
SELECT NEWID(),(SELECT [Id] FROM [SSI].[SchemaType] WHERE [Name] = 'YoID'),'Indy','YoID|Default','1.0',(SELECT [Id] FROM [SSI].[CredentialIssuanceStatus] WHERE [Name] = 'Pending'),
	U.[Id],NULL,NULL,NULL,NULL,NULL,GETDATE(),GETDATE()
FROM [Entity].[User] U
WHERE U.[YoIDOnboarded] = 1
GO

--Yoma (Youth Agency Marketplace) organization
DECLARE @Name varchar(255) = 'Yoma (Youth Agency Marketplace)'

INSERT INTO [Entity].[Organization]([Id],[Name],[NameHashValue],[WebsiteURL],[PrimaryContactName],[PrimaryContactEmail],[PrimaryContactPhone],[VATIN],[TaxNumber],[RegistrationNumber]
           ,[City],[CountryId],[StreetAddress],[Province],[PostalCode],[Tagline],[Biography],[StatusId],[CommentApproval],[DateStatusModified],[LogoId],[DateCreated],[CreatedByUserId],[DateModified],[ModifiedByUserId])
VALUES(NEWID(),@Name,CONVERT(NVARCHAR(128), HASHBYTES('SHA2_256', @Name), 2),'https://www.yoma.world/','Primary Contact','primarycontact@gmail.com','+27125555555', 'GB123456789', '0123456789', '12345/28/14',
		'My City',(SELECT [Id] FROM [Lookup].[Country] WHERE CodeAlpha2 = 'ZA'),'My Street Address 1000', 'My Province', '12345-1234','Unlock your future','The yoma platform enables you to build and transform your future by unlocking your hidden potential.',
		(SELECT [Id] FROM [Entity].[OrganizationStatus] WHERE [Name] = 'Active'),'Approved',GETDATE(),NULL,
		GETDATE(),
		(SELECT [Id] FROM [Entity].[User] WHERE [Email] = '{org_admin_user}'),
		GETDATE(),
		(SELECT [Id] FROM [Entity].[User] WHERE [Email] = '{org_admin_user}'))
GO

--organization admins
INSERT INTO [Entity].[OrganizationUsers]([Id],[OrganizationId],[UserId],[DateCreated])
SELECT NEWID(), [Id], (SELECT [Id] FROM [Entity].[User] WHERE [Email] = '{org_admin_user}'), GETDATE()
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

/****opportunity****/
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
	[CreatedByUserId],
	[DateModified],
	[ModifiedByUserId])
VALUES(NEWID(),
	N'HEY YOMA USERS 🌟 Your input matters! How does Yoma impact you? Share your thoughts! 🚀(15-30mins)',
	N'Curious about how Yoma is impacting your social groove? 😃📈 We''re on a quest to understand just that, and we need YOUR voice to uncover the magic! 🎉✨ Take our Relational Wellbeing Impact Survey and let''s dig into the details. 🚀📋 Ready to share your thoughts? Dive in! 👇🤗 i) Click on "Go to Opportuntiy" and you will be redirected to our Google Form. ii) Complete the Survey by answering the questions provided. iii) Don''t forget to Submit Your Responses by clicking on "Submit". Your insights will help us create a Yoma that boosts your connections and happiness! 🚀🤗 iii) Once submitted, take a screenshot and upload the screenshot to earn Zltos',
	(SELECT [Id] FROM [Opportunity].[OpportunityType] WHERE [Name] = 'Task'),
	(SELECT [Id] FROM [Entity].[Organization] WHERE [Name] = 'Yoma (Youth Agency Marketplace)'),
	NULL,
	NULL,
	' https://go.yoma.world/impactevaluationsurve',
	25,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	1,
	'Manual',
	(SELECT TOP 1 [Id] FROM [Opportunity].[OpportunityDifficulty] ORDER BY NEWID()),
	(SELECT TOP 1 [Id] FROM [Lookup].[TimeInterval] ORDER BY NEWID()),
	(SELECT 1 + ABS(CHECKSUM(NEWID()) % 10)),
    (SELECT 100 + ABS(CHECKSUM(NEWID()) % 901)),
	NULL,
	(SELECT [Id] FROM [Opportunity].[OpportunityStatus] WHERE [Name] = 'Active'),
	'YOMA,input,your thoughts,impacting,social,groove,magic',
	'2023-10-01',
	'2023-12-31',
	1,
	'Opportunity|Default',
	GETDATE(),
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = '{org_admin_user}'),
	GETDATE(),
	(SELECT [Id] FROM [Entity].[User] WHERE [Email] = '{org_admin_user}'))
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
