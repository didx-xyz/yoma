USE [yoma-dev]
GO

--testuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO [entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],[PhotoId],[GenderId]
           ,[DateOfBirth],[DateLastLogin],[ExternalId],[ZltoWalletId],[ZltoWalletCountryId],[TenantId],[DateCreated],[DateModified])
VALUES('e2b31501-0cb4-4fc1-bf43-fe6d097255c2','testuser@gmail.com',1,'Test','User','Test User',NULL,NULL,NULL,NULL,NULL,
        NULL,NULL,NULL,NULL,NULL,NULL,GETDATE(),GETDATE())
GO

--testadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO [entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],[PhotoId],[GenderId]
           ,[DateOfBirth],[DateLastLogin],[ExternalId],[ZltoWalletId],[ZltoWalletCountryId],[TenantId],[DateCreated],[DateModified])
VALUES('617D00BE-F3AA-4DD5-B5C1-6044EBB6AA0C','testadminuser@gmail.com',1,'Test Admin','User','Test Admin User',NULL,NULL,NULL,NULL,NULL,
        NULL,NULL,NULL,NULL,NULL,NULL,GETDATE(),GETDATE())
GO

--testorgadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO [entity].[User]([Id],[Email],[EmailConfirmed],[FirstName],[Surname],[DisplayName],[PhoneNumber],[CountryId],[CountryOfResidenceId],[PhotoId],[GenderId]
           ,[DateOfBirth],[DateLastLogin],[ExternalId],[ZltoWalletId],[ZltoWalletCountryId],[TenantId],[DateCreated],[DateModified])
VALUES('F3265285-8819-4161-9D8F-22B41567D3A0','testorgadminuser@gmail.com',1,'Test Organization Admin','User','Test Organization Admin User',NULL,NULL,NULL,NULL,NULL,
        NULL,NULL,NULL,NULL,NULL,NULL,GETDATE(),GETDATE())
GO

--test organization
INSERT INTO [entity].[Organization]([Id],[Name],[WebsiteURL],[PrimaryContactName],[PrimaryContactEmail],[PrimaryContactPhone],[VATIN],[TaxNumber]
           ,[RegistrationNumber],[City],[CountryId],[StreetAddress],[Province],[PostalCode],[Tagline],[Biography],[StatusId],[DateStatusModified],[LogoId],[CompanyRegistrationDocumentId],[DateCreated],[DateModified])
VALUES('8724d05b-1f29-4aa6-31c0-08d81d248b8a','Test Organization','https://app.yoma.world/','Test Organization Admin','testorgadminuser@gmail.com',NULL,NULL,NULL,
NULL,NULL,'0EFB07E6-6634-46DE-A98D-A85BF331C20E',NULL,NULL,NULL,NULL,NULL,'5C381E21-9EB9-4F0E-8548-847E537BB61E',GETDATE(),NULL,NULL,GETDATE(),GETDATE())
GO

--test org admin
INSERT INTO [entity].[OrganizationUsers]([Id],[OrganizationId],[UserId],[DateCreated])
VALUES(NewId(),'8724d05b-1f29-4aa6-31c0-08d81d248b8a','F3265285-8819-4161-9D8F-22B41567D3A0',GETDATE())
GO

--test org provider types
INSERT INTO [entity].[OrganizationProviderTypes]
           ([Id]
           ,[OrganizationId]
           ,[ProviderTypeId]
           ,[DateCreated])
     VALUES(NewID(),'8724d05b-1f29-4aa6-31c0-08d81d248b8a','a3bcaa03-b31c-4830-aae8-06bba701d3f0',GETDATE()),
	 (NewID(),'8724d05b-1f29-4aa6-31c0-08d81d248b8a','6fb02f6f-34fe-4e6e-9094-2e3b54115235',GETDATE()),
	 (NewID(),'8724d05b-1f29-4aa6-31c0-08d81d248b8a','d2987f9f-8cc8-4576-af09-c01213a1435e',GETDATE())
GO
