-- This script is designed to be applied to an empty database

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- user & organization
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", "CountryOfResidenceId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), '{test_user}', true, 'Sam', 'Henderson', 'Sam Henderson', null, (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2" = 'ZA'), (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2" = 'ZA'),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" WHERE "Name" = 'Male'), NULL, NULL, NULL, true, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'));

INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", "CountryOfResidenceId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), '{org_admin_user}', true, 'Sam', 'Henderson', 'Sam Henderson', null, (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2" = 'ZA'), (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2" = 'ZA'),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" WHERE "Name" = 'Male'), NULL, NULL, NULL, true, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'));

INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", "CountryOfResidenceId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), '{admin_user}', true, 'Sam', 'Henderson', 'Sam Henderson', null, (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2" = 'ZA'), (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2" = 'ZA'),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" WHERE "Name" = 'Male'), NULL, NULL, NULL, true, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'));

-- ssi credential issuance (pending) for YOID onboarded users
INSERT INTO "SSI"."CredentialIssuance"("Id", "SchemaTypeId", "ArtifactType", "SchemaName", "SchemaVersion", "StatusId", "UserId", "OrganizationId",
           "MyOpportunityId", "CredentialId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), (SELECT "Id" FROM "SSI"."SchemaType" WHERE "Name" = 'YoID'), 'Indy', 'YoID|Default', '1.0', (SELECT "Id" FROM "SSI"."CredentialIssuanceStatus" WHERE "Name" = 'Pending'),
    U."Id", NULL, NULL, NULL, NULL, NULL, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Entity"."User" U
WHERE U."YoIDOnboarded" = true;

-- Yoma (Youth Agency Marketplace) organization
DO $$
DECLARE
    Name VARCHAR(255) := 'Yoma (Youth Agency Marketplace)';
BEGIN
    INSERT INTO "Entity"."Organization"("Id", "Name", "NameHashValue", "WebsiteURL", "PrimaryContactName", "PrimaryContactEmail", "PrimaryContactPhone", "VATIN", "TaxNumber", "RegistrationNumber",
               "City", "CountryId", "StreetAddress", "Province", "PostalCode", "Tagline", "Biography", "StatusId", "CommentApproval", "DateStatusModified", "LogoId", "DateCreated", "CreatedByUserId", "DateModified", "ModifiedByUserId")
    VALUES(gen_random_uuid(), Name, ENCODE(DIGEST(Name, 'sha256'), 'hex'), 'https://www.yoma.world/', 'Primary Contact', 'primarycontact@gmail.com', '+27125555555', 'GB123456789', '0123456789', '12345/28/14',
            'My City', (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2" = 'ZA'), 'My Street Address 1000', 'My Province', '12345-1234', 'Unlock your future', 'The yoma platform enables you to build and transform your future by unlocking your hidden potential.',
            (SELECT "Id" FROM "Entity"."OrganizationStatus" WHERE "Name" = 'Active'), 'Approved', (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), NULL,
            (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
            (SELECT "Id" FROM "Entity"."User" WHERE "Email" = '{org_admin_user}'),
            (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
            (SELECT "Id" FROM "Entity"."User" WHERE "Email" = '{org_admin_user}'));
END $$;

-- organization admins
INSERT INTO "Entity"."OrganizationUsers"("Id", "OrganizationId", "UserId", "DateCreated")
SELECT gen_random_uuid(), "Id", (SELECT "Id" FROM "Entity"."User" WHERE "Email" = '{org_admin_user}'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Entity"."Organization";

-- ssi tenant creation (pending) for active organizations
INSERT INTO "SSI"."TenantCreation"("Id", "EntityType", "StatusId", "UserId", "OrganizationId", "TenantId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), 'Organization', (SELECT "Id" FROM "SSI"."TenantCreationStatus" WHERE "Name" = 'Pending'), NULL, "Id", NULL, NULL, NULL, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Entity"."Organization"
WHERE "StatusId" = (SELECT "Id" FROM "Entity"."OrganizationStatus" WHERE "Name" = 'Active');

-- organization provider types
INSERT INTO "Entity"."OrganizationProviderTypes"("Id", "OrganizationId", "ProviderTypeId", "DateCreated")
SELECT gen_random_uuid(), O."Id" AS "OrganizationId", PT."Id" AS "ProviderTypeId", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') FROM "Entity"."Organization" O CROSS JOIN "Entity"."OrganizationProviderType" PT;

-- opportunity
INSERT INTO "Opportunity"."Opportunity"("Id",
    "Title",
    "Description",
    "TypeId",
    "OrganizationId",
    "Summary",
    "Instructions",
    "URL",
    "ZltoReward",
    "ZltoRewardPool",
    "ZltoRewardCumulative",
    "YomaReward",
    "YomaRewardPool",
    "YomaRewardCumulative",
    "VerificationEnabled",
    "VerificationMethod",
    "DifficultyId",
    "CommitmentIntervalId",
    "CommitmentIntervalCount",
    "ParticipantLimit",
    "ParticipantCount",
    "StatusId",
    "Keywords",
    "DateStart",
    "DateEnd",
    "CredentialIssuanceEnabled",
    "SSISchemaName",
    "DateCreated",
    "CreatedByUserId",
    "DateModified",
    "ModifiedByUserId")
VALUES(gen_random_uuid(),
    'HEY YOMA USERS 🌟 Your input matters! How does Yoma impact you? Share your thoughts! 🚀(15-30mins)',
    'Curious about how Yoma is impacting your social groove? 😃📈 We''re on a quest to understand just that, and we need YOUR voice to uncover the magic! 🎉✨ Take our Relational Wellbeing Impact Survey and let''s dig into the details. 🚀📋 Ready to share your thoughts? Dive in! 👇🤗 i) Click on "Go to Opportunity" and you will be redirected to our Google Form. ii) Complete the Survey by answering the questions provided. iii) Don''t forget to Submit Your Responses by clicking on "Submit". Your insights will help us create a Yoma that boosts your connections and happiness! 🚀🤗 iii) Once submitted, take a screenshot and upload the screenshot to earn Zltos',
    (SELECT "Id" FROM "Opportunity"."OpportunityType" WHERE "Name" = 'Task'),
    (SELECT "Id" FROM "Entity"."Organization" WHERE "Name" = 'Yoma (Youth Agency Marketplace)'),
    NULL,
    NULL,
    ' https://go.yoma.world/impactevaluationsurve',
    25,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    'Manual',
    (SELECT "Id" FROM "Opportunity"."OpportunityDifficulty" ORDER BY RANDOM() LIMIT 1),
    (SELECT "Id" FROM "Lookup"."TimeInterval" ORDER BY RANDOM() LIMIT 1),
    (1 + ABS(FLOOR(RANDOM() * 10))),
    (100 + ABS(FLOOR(RANDOM() * 901))),
    NULL,
    (SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" = 'Active'),
    'YOMA,input,your thoughts,impacting,social,groove,magic',
    '2023-10-01',
    '2023-12-31',
    true,
    'Opportunity|Default',
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    (SELECT "Id" FROM "Entity"."User" WHERE "Email" = '{org_admin_user}'),
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    (SELECT "Id" FROM "Entity"."User" WHERE "Email" = '{org_admin_user}'));

-- categories
INSERT INTO "Opportunity"."OpportunityCategories"("Id","OpportunityId","CategoryId","DateCreated")
SELECT gen_random_uuid(), O."Id" AS "OpportunityId", OC."Id" AS "CategoryId", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN "Opportunity"."OpportunityCategory" OC;

-- countries
INSERT INTO "Opportunity"."OpportunityCountries"("Id", "OpportunityId", "CountryId", "DateCreated")
SELECT gen_random_uuid(), O."Id" AS "OpportunityId", R."CountryId", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id" AS "CountryId"
    FROM "Lookup"."Country"
    ORDER BY RANDOM()
    LIMIT 10
) AS R;

-- languages
INSERT INTO "Opportunity"."OpportunityLanguages"("Id","OpportunityId","LanguageId","DateCreated")
SELECT gen_random_uuid(), O."Id" AS "OpportunityId", R."LanguageId", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id" AS "LanguageId"
    FROM "Lookup"."Language"
    ORDER BY RANDOM()
    LIMIT 10
) AS R;

-- skills
INSERT INTO "Opportunity"."OpportunitySkills"("Id","OpportunityId","SkillId","DateCreated")
SELECT gen_random_uuid(), O."Id" AS "OpportunityId", R."SkillId", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id" AS "SkillId"
    FROM "Lookup"."Skill"
    ORDER BY RANDOM()
    LIMIT 10
) AS R;

-- verification types
INSERT INTO "Opportunity"."OpportunityVerificationTypes"("Id","OpportunityId","VerificationTypeId","Description","DateCreated","DateModified")
SELECT gen_random_uuid(), O."Id" AS "OpportunityId", R."VerificationTypeId", NULL, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id" AS "VerificationTypeId"
    FROM "Opportunity"."OpportunityVerificationType"
    ORDER BY RANDOM()
    LIMIT 10
) AS R
WHERE O."VerificationEnabled" = true;
