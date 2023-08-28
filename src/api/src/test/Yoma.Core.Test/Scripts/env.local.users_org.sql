USE [yoma-dev]
GO

--testuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO [entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],
			[PhotoId],[GenderId],[DateOfBirth],[DateLastLogin],[ExternalId],[ZltoWalletId],[ZltoWalletCountryId],[TenantId],[DateCreated],[DateModified])
VALUES(NEWID(),'testuser@gmail.com',1,'Test','User','Test User','+275555555',(SELECT TOP 1 [Id] FROM [lookup].[Country] ORDER BY NEWID()),(SELECT TOP 1 [Id] FROM [lookup].[Country] ORDER BY NEWID()),
		NULL,(SELECT TOP 1 [Id] FROM [lookup].[Gender] ORDER BY NEWID()),CAST(DATEADD(YEAR, 20, GETDATE()) AS DATE),NULL,NULL,NULL,NULL,NULL,GETDATE(),GETDATE())
GO

--testadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO [entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],
			[PhotoId],[GenderId],[DateOfBirth],[DateLastLogin],[ExternalId],[ZltoWalletId],[ZltoWalletCountryId],[TenantId],[DateCreated],[DateModified])
VALUES(NEWID(),'testadminuser@gmail.com',1,'Test Admin','User','Test Admin User','+275555555',(SELECT TOP 1 [Id] FROM [lookup].[Country] ORDER BY NEWID()),(SELECT TOP 1 [Id] FROM [lookup].[Country] ORDER BY NEWID()),
		NULL,(SELECT TOP 1 [Id] FROM [lookup].[Gender] ORDER BY NEWID()),CAST(DATEADD(YEAR, 21, GETDATE()) AS DATE),NULL,NULL,NULL,NULL,NULL,GETDATE(),GETDATE())
GO

--testorgadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO [entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],
			[PhotoId],[GenderId],[DateOfBirth],[DateLastLogin],[ExternalId],[ZltoWalletId],[ZltoWalletCountryId],[TenantId],[DateCreated],[DateModified])
VALUES(NEWID(),'testorgadminuser@gmail.com',1,'Test Organization Admin','User','Test Organization Admin User','+275555555',(SELECT TOP 1 [Id] FROM [lookup].[Country] ORDER BY NEWID()),(SELECT TOP 1 [Id] FROM [lookup].[Country] ORDER BY NEWID()),
		NULL,(SELECT TOP 1 [Id] FROM [lookup].[Gender] ORDER BY NEWID()),CAST(DATEADD(YEAR, 22, GETDATE()) AS DATE),NULL,NULL,NULL,NULL,NULL,GETDATE(),GETDATE())
GO

DECLARE @Words VARCHAR(500) = 'The,A,An,Awesome,Incredible,Fantastic,Amazing,Wonderful,Exciting,Unbelievable,Great,Marvelous,Stunning,Impressive,Captivating,Extraordinary,Superb,Epic,Spectacular,Magnificent,Phenomenal,Outstanding,Brilliant,Enthralling,Enchanting,Mesmerizing,Riveting,Spellbinding,Unforgettable,Sublime';
DECLARE @RandomLengthName INT = ABS(CHECKSUM(NEWID()) % 10) + 5;
DECLARE @RandomLengthOther INT = ABS(CHECKSUM(NEWID()) % 101) + 100;

DECLARE @RowCount INT = 0;

WHILE @RowCount < 10
BEGIN
    --organizations
    INSERT INTO [entity].[Organization]([Id],
			    [Name],
			    [WebsiteURL],[PrimaryContactName],[PrimaryContactEmail],[PrimaryContactPhone],[VATIN],[TaxNumber],[RegistrationNumber],
			    [City],[CountryId],[StreetAddress],[Province],[PostalCode],
			    [Tagline],
			    [Biography],
			    [StatusId],[DateStatusModified],[LogoId],[DateCreated],[DateModified])
    SELECT TOP 1 NEWID(),
            (SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (@RandomLengthName) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords) + ' ' + CAST(ABS(CHECKSUM(NEWID())) % 2147483647 AS VARCHAR(10)),
		    'https://www.google.com/','Primary Contact','primarycontact@gmail.com','+275555555', 'GB123456789', '0123456789', '12345/28/14', 
		    'My City',(SELECT TOP 1 [Id] FROM [lookup].[Country] ORDER BY NEWID()),'My Street Address 1000', 'My Province', '12345-1234', 
		    (SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (@RandomLengthOther) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords),
		    (SELECT TOP 1 STRING_AGG(Word, ' ') WITHIN GROUP (ORDER BY NEWID()) FROM (SELECT TOP (@RandomLengthOther) value AS Word FROM STRING_SPLIT(@Words, ',')) AS RandomWords),
		    (SELECT [Id] FROM [entity].[OrganizationStatus] WHERE [Name] = 'Active'), GETDATE(), NULL,GETDATE(),GETDATE()
    FROM sys.all_columns
  	SET @RowCount = @RowCount + 1;
END;
GO

--organization admins
INSERT INTO [entity].[OrganizationUsers]([Id],[OrganizationId],[UserId],[DateCreated])
SELECT NEWID(), [Id], (SELECT [Id] FROM [Entity].[User] WHERE [Email] = 'testorgadminuser@gmail.com'), GETDATE()
FROM [Entity].[Organization]
GO

--organization provider types
INSERT INTO [entity].[OrganizationProviderTypes]([Id],[OrganizationId],[ProviderTypeId],[DateCreated])
SELECT NEWID(),O.[Id] AS [OrganizationId],PT.[Id] AS [ProviderTypeId],GETDATE() FROM [entity].[Organization] O CROSS JOIN [entity].[OrganizationProviderType] PT
GO
