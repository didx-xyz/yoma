-- This script is designed to be applied to an empty database

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

SET TIMEZONE='UTC';

-- Users & Organizations

-- testuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", "EducationId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), 'testuser@gmail.com', TRUE, 'Test', 'User', 'Test User', NULL, (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1), (SELECT "Id" FROM "Lookup"."Education" ORDER BY RANDOM() LIMIT 1),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" ORDER BY RANDOM() LIMIT 1), CURRENT_DATE - INTERVAL '20 years', NULL, NULL, TRUE, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'));

-- testadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", "EducationId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), 'testadminuser@gmail.com', TRUE, 'Test Admin', 'User', 'Test Admin User', NULL, (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1), (SELECT "Id" FROM "Lookup"."Education" ORDER BY RANDOM() LIMIT 1),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" ORDER BY RANDOM() LIMIT 1), CURRENT_DATE - INTERVAL '21 years', NULL, NULL, TRUE, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'));

-- testorgadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", "EducationId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), 'testorgadminuser@gmail.com', TRUE, 'Test Organization Admin', 'User', 'Test Organization Admin User', NULL, (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1), (SELECT "Id" FROM "Lookup"."Education" ORDER BY RANDOM() LIMIT 1),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" ORDER BY RANDOM() LIMIT 1), CURRENT_DATE - INTERVAL '22 years', NULL, NULL, TRUE, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'));

-- SSI Tenant Creation (Pending) for YOID onboarded users
INSERT INTO "SSI"."TenantCreation"("Id", "EntityType", "StatusId", "UserId", "OrganizationId", "TenantId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), 'User', SCS."Id" AS "StatusId", U."Id" AS "UserId", NULL AS "OrganizationId", NULL AS "TenantId", NULL AS "ErrorReason", NULL AS "RetryCount", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateCreated", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateModified"
FROM "Entity"."User" U
JOIN "SSI"."TenantCreationStatus" SCS ON SCS."Name" = 'Pending'
WHERE U."YoIDOnboarded" = true;

-- SSI Credential Issuance (Pending) for YOID onboarded users
INSERT INTO "SSI"."CredentialIssuance"("Id", "SchemaTypeId", "ArtifactType", "SchemaName", "SchemaVersion", "StatusId", "UserId", "OrganizationId",
                                       "MyOpportunityId", "CredentialId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), ST."Id" AS "SchemaTypeId", 'AnonCreds' AS "ArtifactType", 'YoID|Default' AS "SchemaName", '1.0' AS "SchemaVersion",
       CIS."Id" AS "StatusId", U."Id" AS "UserId", NULL AS "OrganizationId", NULL AS "MyOpportunityId", NULL AS "CredentialId",
       NULL AS "ErrorReason", NULL AS "RetryCount", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateCreated", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateModified"
FROM "Entity"."User" U
JOIN "SSI"."SchemaType" ST ON ST."Name" = 'YoID'
JOIN "SSI"."CredentialIssuanceStatus" CIS ON CIS."Name" = 'Pending'
WHERE U."YoIDOnboarded" = true;

-- Reward Wallet Creation (Rewards for completed 'my' opportunities to be awarded; only scheduled for 'testuser@gmail.com')
INSERT INTO "Reward"."WalletCreation"("Id", "StatusId", "UserId", "WalletId", "Balance", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), WCStatus."Id" AS "StatusId", U."Id" AS "UserId", NULL AS "WalletId", NULL AS "Balance", NULL AS "ErrorReason", NULL AS "RetryCount",
       (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateCreated", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateModified"
FROM "Entity"."User" U
JOIN "Reward"."WalletCreationStatus" WCStatus ON WCStatus."Name" = 'Pending'
WHERE U."Email" = 'testuser@gmail.com';

-- Set up random words
DO $$
DECLARE
    V_Words VARCHAR(500) := 'FutureTech,Global Innovators,Alpha Enterprises,BlueSky Ventures,Catalyst,Synergy Corp,Nexus Industries,Horizon Group,Dynamic Networks,Quantum Tech,Pinnacle Partners,Apex Solutions,Infinity Systems,Legacy Builders,Visionary Labs,Vanguard Services,Stellar Innovations,NextGen Enterprises,Prodigy Solutions,VentureWorks,Summit Strategies,Elevate Holdings,Titan Resources,Horizon Dynamics,Impact Ventures,Fusion Enterprises,Keystone Projects,Zenith Development,Insight Analytics,Bright Future';
    V_OrgName VARCHAR(150);
BEGIN
    -- Organizations
    FOR RowCount IN 1..10 LOOP
        -- Generate the organization name
        SELECT INTO V_OrgName (
            SELECT STRING_AGG(Word, ' ')
            FROM (
                SELECT word
                FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                ORDER BY RANDOM()
                LIMIT 2 + FLOOR(RANDOM() * 3)  -- Generates a number between 2 and 4
            ) AS RandomNameWords
        ) || ' ' || CAST(ABS(FLOOR(RANDOM() * 2147483647)) AS VARCHAR(10));

        -- Insert into the Organization table
        INSERT INTO "Entity"."Organization"(
            "Id", "Name", "NameHashValue", "WebsiteURL", "PrimaryContactName", "PrimaryContactEmail", "PrimaryContactPhone",
            "VATIN", "TaxNumber", "RegistrationNumber", "City", "CountryId", "StreetAddress", "Province", "PostalCode",
            "Tagline", "Biography", "StatusId", "CommentApproval", "DateStatusModified", "LogoId", "DateCreated",
            "CreatedByUserId", "DateModified", "ModifiedByUserId"
        )
        SELECT
            gen_random_uuid(),
            V_OrgName,
            (ENCODE(DIGEST(V_OrgName, 'sha256'), 'hex')),
            'https://www.google.com/',
            'Primary Contact',
            'primarycontact@gmail.com',
            '+27125555555',
            'GB123456789',
            '0123456789',
            '12345/28/14',
            'My City',
            (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1),
            'My Street Address 1000',
            'My Province',
            '12345-1234',
            (
                SELECT LEFT(STRING_AGG(Word, ' '), 160)
                FROM (
                    SELECT word
                    FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                    ORDER BY RANDOM()
                    LIMIT 3 + FLOOR(RANDOM() * 7)
                ) AS RandomTaglineWords
            ),
            (
                SELECT LEFT(STRING_AGG(Word, ' '), 480)
                FROM (
                    SELECT word
                    FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                    ORDER BY RANDOM()
                    LIMIT 10 + FLOOR(RANDOM() * 21)
                ) AS RandomBiographyWords
            ),
            (SELECT "Id" FROM "Entity"."OrganizationStatus" WHERE "Name" = 'Active'),
            'Approved',
            (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
            NULL,
            (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
            (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'),
            (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
            (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com')
        FROM pg_tables
        LIMIT 1;
    END LOOP;
END $$ LANGUAGE plpgsql;

--Yoma (Youth Agency Marketplace) organization
INSERT INTO "Entity"."Organization"("Id", "Name", "NameHashValue", "WebsiteURL", "PrimaryContactName", "PrimaryContactEmail", "PrimaryContactPhone", "VATIN", "TaxNumber", "RegistrationNumber",
           "City", "CountryId", "StreetAddress", "Province", "PostalCode", "Tagline", "Biography", "StatusId", "CommentApproval", "DateStatusModified", "LogoId", "DateCreated", "CreatedByUserId", "DateModified", "ModifiedByUserId")
VALUES(gen_random_uuid(), 'Yoma (Youth Agency Marketplace)', ENCODE(DIGEST('Yoma (Youth Agency Marketplace)', 'SHA256'), 'hex'), 'https://www.yoma.world/', 'Primary Contact', 'primarycontact@gmail.com', '+27125555555', 'GB123456789', '0123456789', '12345/28/14',
		'My City', (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2" = 'ZA'), 'My Street Address 1000', 'My Province', '12345-1234', 'Tag Line', 'Biography',
		(SELECT "Id" FROM "Entity"."OrganizationStatus" WHERE "Name" = 'Active'), 'Approved', (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), NULL,
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'));

--organization admins
INSERT INTO "Entity"."OrganizationUsers"("Id", "OrganizationId", "UserId", "DateCreated")
SELECT gen_random_uuid(), "Id", (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Entity"."Organization";

--ssi tenant creation (pending) for active organizations
INSERT INTO "SSI"."TenantCreation"("Id", "EntityType", "StatusId", "UserId", "OrganizationId", "TenantId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), 'Organization', (SELECT "Id" FROM "SSI"."TenantCreationStatus" WHERE "Name" = 'Pending'), NULL, "Id", NULL, NULL, NULL, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Entity"."Organization"
WHERE "StatusId" = (SELECT "Id" FROM "Entity"."OrganizationStatus" WHERE "Name" = 'Active');

--organization provider types
INSERT INTO "Entity"."OrganizationProviderTypes"("Id", "OrganizationId", "ProviderTypeId", "DateCreated")
SELECT gen_random_uuid(), O."Id" AS "OrganizationId", PT."Id" AS "ProviderTypeId", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') FROM "Entity"."Organization" O CROSS JOIN "Entity"."OrganizationProviderType" PT;

/****opportunities****/
DO $$
DECLARE
    V_Words VARCHAR(500) := 'STEM,Internship,Digital,Transformation,Entrepreneurship,Skills,Scholarship,Employ,Paid,Work,Experience,Sales,Route-to-Market,Merchandising,Business,Development,Leadership,Analytics,Problem Solving,Collaboration,Technology,Creativity,Education,Training,Innovation,Management,Strategy,Marketing,Opportunity,Course,Program';
    V_OppTitle VARCHAR(150);
    V_OppDesc VARCHAR(2000);
    V_OppSummary VARCHAR(150);
    V_OppInstructions VARCHAR(2000);
    V_OppKeywords VARCHAR(500);
    V_DateCreated TIMESTAMP := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    V_DateStartRunning TIMESTAMP := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '2 day';
    V_Iterations INT := 5000;
    V_RowCount INT := 0;
    V_VerificationEnabled BOOLEAN := false;
    V_CommitmentIntervalId UUID;
    V_CommitmentIntervalName VARCHAR(100);
    V_CommitmentIntervalCount INT;
    V_CommitmentIntervalDays INT;
    V_DateStart TIMESTAMP;
    V_DateEnd TIMESTAMP;
BEGIN
    -- Opportunities
	WHILE V_RowCount < V_Iterations LOOP
        -- Generate Opportunity Title (3 to 9 words, max 150 characters)
        SELECT INTO V_OppTitle (
            SELECT STRING_AGG(Word, ' ')
            FROM (
                SELECT word
                FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                ORDER BY RANDOM()
                LIMIT 3 + FLOOR(RANDOM() * 7)  -- Generates a number between 3 and 9
            ) AS RandomTitleWords
        ) || ' ' || CAST(ABS(FLOOR(RANDOM() * 2147483647)) AS VARCHAR(10));

        -- Generate Opportunity Description (100 to 200 words, max 1000 characters)
        SELECT INTO V_OppDesc (
            SELECT STRING_AGG(Word, ' ')
            FROM (
                SELECT word
                FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                ORDER BY RANDOM()
                LIMIT 100 + FLOOR(RANDOM() * 101)  -- Generates a number between 100 and 200
            ) AS RandomDescWords
        );

        -- Generate Opportunity Summary (3 to 9 words, max 150 characters)
        SELECT INTO V_OppSummary (
            SELECT STRING_AGG(Word, ' ')
            FROM (
                SELECT word
                FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                ORDER BY RANDOM()
                LIMIT 3 + FLOOR(RANDOM() * 7)  -- Generates a number between 3 and 9
            ) AS RandomTitleWords
        );

        -- Generate Opportunity Instructions (100 to 200 words, max 1000 characters)
        SELECT INTO V_OppInstructions (
            SELECT STRING_AGG(Word, ' ')
            FROM (
                SELECT word
                FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                ORDER BY RANDOM()
                LIMIT 100 + FLOOR(RANDOM() * 101)  -- Generates a number between 100 and 200
            ) AS RandomDescWords
        );

        -- Generate Opportunity Keywords (20 to 50 words, max 500 characters)
        SELECT INTO V_OppKeywords (
            SELECT ARRAY_TO_STRING(ARRAY_AGG(Word), ',')
            FROM (
                SELECT word
                FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                ORDER BY RANDOM()
                LIMIT 20 + FLOOR(RANDOM() * 31)  -- Generates a number between 20 and 50
            ) AS RandomKeywordsWords
        );

        V_VerificationEnabled := CAST(RANDOM() < 0.5 AS BOOLEAN);

        --commitment interval, count and end date
        SELECT "Id" FROM "Lookup"."TimeInterval" ORDER BY RANDOM() LIMIT 1 INTO V_CommitmentIntervalId;

        --determine CommitmentIntervalCount for this iteration
        V_CommitmentIntervalCount := 1 + ABS(FLOOR(RANDOM() * 10));

        --lookup CommitmentIntervalName based on CommitmentIntervalId
        SELECT "Name" FROM "Lookup"."TimeInterval" WHERE "Id" = V_CommitmentIntervalId INTO V_CommitmentIntervalName;

        --calculate CommitmentIntervalDays based on CommitmentIntervalName
        V_CommitmentIntervalDays := CASE
            WHEN V_CommitmentIntervalName = 'Minute' THEN CEIL(V_CommitmentIntervalCount / (60.0 * 24))
            WHEN V_CommitmentIntervalName = 'Hour' THEN CEIL(V_CommitmentIntervalCount / 24.0)
            WHEN V_CommitmentIntervalName = 'Day' THEN V_CommitmentIntervalCount
            WHEN V_CommitmentIntervalName = 'Week' THEN V_CommitmentIntervalCount * 7
            WHEN V_CommitmentIntervalName = 'Month' THEN V_CommitmentIntervalCount * 30
            ELSE NULL -- Placeholder for unsupported intervals
        END;

         -- Check if the interval was unsupported
        IF V_CommitmentIntervalDays IS NULL THEN
            RAISE EXCEPTION 'Unsupported TimeInterval: %', V_CommitmentIntervalName;
        END IF;

        --start date
        V_DateStart := date_trunc('day', V_DateStartRunning);

        --calculate DateEnd based on CommitmentIntervalDays
        V_DateEnd := V_DateStart + INTERVAL '1 DAY' * (V_CommitmentIntervalDays - 1);
        V_DateEnd := date_trunc('day', V_DateEnd) + INTERVAL '1 DAY' - INTERVAL '1 millisecond';

	    -- Insert into the Opportunity table
	    INSERT INTO "Opportunity"."Opportunity"(
	        "Id", "Title", "Description", "TypeId", "OrganizationId", "Summary", "Instructions", "URL", "ZltoReward", "ZltoRewardPool",
	        "ZltoRewardCumulative", "YomaReward", "YomaRewardPool", "YomaRewardCumulative", "VerificationEnabled", "VerificationMethod",
	        "DifficultyId", "CommitmentIntervalId", "CommitmentIntervalCount", "ParticipantLimit", "ParticipantCount", "StatusId",
	        "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "SSISchemaName", "Featured", "EngagementTypeId", "DateCreated", "CreatedByUserId",
	        "DateModified", "ModifiedByUserId"
	    )
	    SELECT
	        gen_random_uuid() as "Id",
          V_OppTitle as "Title",
          V_OppDesc as "Description",
	        (SELECT "Id" FROM "Opportunity"."OpportunityType" ORDER BY RANDOM() LIMIT 1) as "TypeId",
	        (SELECT "Id" FROM "Entity"."Organization" ORDER BY RANDOM() LIMIT 1) as "OrganizationId",
	        V_OppSummary as "Summary",
	        V_OppInstructions as "Instructions",
	        'https://www.google.com/' as "URL",
            (SELECT ROUND((100 + (350 - 100) * RANDOM()))::numeric) as "ZltoReward",
            (SELECT ROUND((1000 + (3500 - 1000) * RANDOM()))::numeric) as "ZltoRewardPool",
	        NULL as "ZltoRewardCumulative",
	        NULL as "YomaReward",
	        NULL as "YomaRewardPool",
	        NULL as "YomaRewardCumulative",
	        V_VerificationEnabled as "VerificationEnabled",
	        CASE WHEN V_VerificationEnabled = true THEN 'Manual' ELSE NULL END as "VerificationMethod",
	        (SELECT "Id" FROM "Opportunity"."OpportunityDifficulty" ORDER BY RANDOM() LIMIT 1) as "DifficultyId",
	        V_CommitmentIntervalId as "CommitmentIntervalId",
	        V_CommitmentIntervalCount as "CommitmentIntervalCount",
            CASE WHEN V_VerificationEnabled = true THEN 100 + ABS(FLOOR(RANDOM() * 901)) ELSE NULL END as "ParticipantLimit",
	        NULL as "ParticipantCount",
	        (SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" IN ('Active', 'Inactive') ORDER BY RANDOM() LIMIT 1) as "StatusId",
	        V_OppKeywords as "Keywords",
	        (V_DateStart::timestamp AT TIME ZONE 'UTC') as "DateStart",
	        (V_DateEnd::timestamp AT TIME ZONE 'UTC') as "DateEnd",
            CASE
            WHEN V_VerificationEnabled = true THEN
                CAST(CASE WHEN RANDOM() < 0.5 THEN 1 ELSE 0 END AS BOOLEAN)
            ELSE
                FALSE
            END as "CredentialIssuanceEnabled",
	        NULL as "SSISchemaName",
            CAST(CASE WHEN RANDOM() < 0.5 THEN 1 ELSE 0 END AS BOOLEAN) as "Featured",
            (SELECT "Id" FROM "Lookup"."EngagementType" ORDER BY RANDOM() LIMIT 1) as "EngagementTypeId",
	        V_DateCreated as "DateCreated",
	        (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com') as "CreatedByUserId",
	        (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') as "DateModified",
	        (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com') as "ModifiedByUserId"
	    FROM pg_tables
	    LIMIT 1;

	    V_RowCount := V_RowCount + 1;
	    V_DateCreated := V_DateCreated + INTERVAL '1 second';
	    V_DateStartRunning := V_DateStartRunning + INTERVAL '8.64 second';
	END LOOP;
END $$ LANGUAGE plpgsql;

-- SSI schema definitions
WITH CTE AS (
    SELECT "SSISchemaName", "Id"
    FROM "Opportunity"."Opportunity"
    WHERE "CredentialIssuanceEnabled" = true
)
-- Update statement
UPDATE "Opportunity"."Opportunity" AS O
SET "SSISchemaName" = 'Opportunity|Default'
FROM CTE
WHERE O."Id" = CTE."Id";

-- Check for unsupported SSISchemaName
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Opportunity"."Opportunity"
        WHERE "CredentialIssuanceEnabled" = true AND "SSISchemaName" = 'ERROR'
    ) THEN
        RAISE EXCEPTION 'Unsupported SSISchemaName: ERROR';
    END IF;
END $$;

-- Categories
INSERT INTO "Opportunity"."OpportunityCategories"("Id", "OpportunityId", "CategoryId", "DateCreated")
SELECT
    gen_random_uuid(),
    O."Id" AS "OpportunityId",
    OC."Id" AS "CategoryId",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN "Opportunity"."OpportunityCategory" OC;

-- Countries
INSERT INTO "Opportunity"."OpportunityCountries"("Id", "OpportunityId", "CountryId", "DateCreated")
SELECT
    gen_random_uuid(),
    O."Id" AS "OpportunityId",
    R."CountryID",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id" AS "CountryID"
    FROM "Lookup"."Country"
    ORDER BY RANDOM()
    LIMIT 10
) AS R;

-- Languages
INSERT INTO "Opportunity"."OpportunityLanguages"("Id", "OpportunityId", "LanguageId", "DateCreated")
SELECT
    gen_random_uuid(),
    O."Id" AS "OpportunityId",
    R."LanguageId",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id" AS "LanguageId"
    FROM "Lookup"."Language"
    ORDER BY RANDOM()
    LIMIT 10
) AS R;

-- Skills
INSERT INTO "Opportunity"."OpportunitySkills"("Id", "OpportunityId", "SkillId", "DateCreated")
SELECT
    gen_random_uuid(),
    O."Id" AS "OpportunityId",
    R."SkillId",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id" AS "SkillId"
    FROM "Lookup"."Skill"
    ORDER BY RANDOM()
    LIMIT 10
) AS R;

-- Verification types
INSERT INTO "Opportunity"."OpportunityVerificationTypes"("Id", "OpportunityId", "VerificationTypeId", "Description", "DateCreated", "DateModified")
SELECT
    gen_random_uuid(),
    O."Id" AS "OpportunityId",
    R."VerificationTypeId",
    NULL,
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id" AS "VerificationTypeId"
    FROM "Opportunity"."OpportunityVerificationType"
    ORDER BY RANDOM()
    LIMIT 10
) AS R
WHERE O."VerificationEnabled" = TRUE;

/****myOpportunities****/
-- Viewed
INSERT INTO "Opportunity"."MyOpportunity"("Id", "UserId", "OpportunityId", "ActionId", "VerificationStatusId", "CommentVerification", "DateStart",
           "DateEnd", "DateCompleted", "ZltoReward", "YomaReward", "DateCreated", "DateModified")
SELECT
	gen_random_uuid(),
	(SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testuser@gmail.com'),
	O."Id",
	(SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Viewed'),
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
WHERE O."StatusId" = (SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" = 'Active');

-- NavigatedExternalLink
INSERT INTO "Opportunity"."MyOpportunity"("Id", "UserId", "OpportunityId", "ActionId", "VerificationStatusId", "CommentVerification", "DateStart",
           "DateEnd", "DateCompleted", "ZltoReward", "YomaReward", "DateCreated", "DateModified")
SELECT
	gen_random_uuid(),
	(SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testuser@gmail.com'),
	O."Id",
	(SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'NavigatedExternalLink'),
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
WHERE O."StatusId" = (SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" = 'Active');

-- Saved
INSERT INTO "Opportunity"."MyOpportunity"("Id", "UserId", "OpportunityId", "ActionId", "VerificationStatusId", "CommentVerification", "DateStart",
           "DateEnd", "DateCompleted", "ZltoReward", "YomaReward", "DateCreated", "DateModified")
SELECT
	gen_random_uuid(),
	(SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testuser@gmail.com'),
	O."Id",
	(SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Saved'),
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
WHERE O."StatusId" = (SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" = 'Active')
ORDER BY "DateCreated"
OFFSET 0 ROWS
FETCH NEXT 30 ROWS ONLY;

-- Verification (Pending)
INSERT INTO "Opportunity"."MyOpportunity"("Id", "UserId", "OpportunityId", "ActionId", "VerificationStatusId", "CommentVerification", "DateStart",
           "DateEnd", "DateCompleted", "ZltoReward", "YomaReward", "DateCreated", "DateModified")
SELECT
	gen_random_uuid(),
	(SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testuser@gmail.com'),
	O."Id",
	(SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification'),
	(SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Pending'),
	NULL,
	O."DateStart",
	O."DateEnd",
	NULL,
	NULL,
	NULL,
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
WHERE O."StatusId" = (SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" = 'Active') AND O."DateStart" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AND O."DateEnd" > (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
ORDER BY "DateCreated"
OFFSET 30 ROWS
FETCH NEXT 30 ROWS ONLY;

-- Verification (Rejected)
INSERT INTO "Opportunity"."MyOpportunity"("Id", "UserId", "OpportunityId", "ActionId", "VerificationStatusId", "CommentVerification", "DateStart",
           "DateEnd", "DateCompleted", "ZltoReward", "YomaReward", "DateCreated", "DateModified")
SELECT
	gen_random_uuid(),
	(SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testuser@gmail.com'),
	O."Id",
	(SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification'),
	(SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Rejected'),
	'Rejection Comment',
	O."DateStart",
	O."DateEnd",
	NULL,
	NULL,
	NULL,
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
WHERE O."StatusId" = (SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" = 'Active') AND O."DateStart" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AND O."DateEnd" > (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
ORDER BY "DateCreated"
OFFSET 60 ROWS
FETCH NEXT 30 ROWS ONLY;

-- Verification (Completed)
INSERT INTO "Opportunity"."MyOpportunity"("Id", "UserId", "OpportunityId", "ActionId", "VerificationStatusId", "CommentVerification", "DateStart",
           "DateEnd", "DateCompleted", "ZltoReward", "YomaReward", "DateCreated", "DateModified")
SELECT
	gen_random_uuid(),
	(SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testuser@gmail.com'),
	O."Id",
	(SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification'),
	(SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed'),
	'Approved Comment',
	O."DateStart",
	O."DateEnd",
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
	O."ZltoReward",
	O."YomaReward",
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
	(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
WHERE O."StatusId" = (SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" = 'Active') AND O."DateStart" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AND O."DateEnd" > (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
ORDER BY "DateCreated"
OFFSET 90 ROWS
FETCH NEXT 30 ROWS ONLY;

-- SSI Credential Issuance (Pending) for Verification (Completed) mapped to opportunities with CredentialIssuanceEnabled
INSERT INTO "SSI"."CredentialIssuance"("Id", "SchemaTypeId", "ArtifactType", "SchemaName", "SchemaVersion", "StatusId", "UserId", "OrganizationId",
           "MyOpportunityId", "CredentialId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), (SELECT "Id" FROM "SSI"."SchemaType" WHERE "Name" = 'Opportunity'), 'JWS', O."SSISchemaName", '1.0', (SELECT "Id" FROM "SSI"."CredentialIssuanceStatus" WHERE "Name" = 'Pending'),
	NULL, NULL, MO."Id", NULL, NULL, NULL, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."MyOpportunity" MO
INNER JOIN "Opportunity"."Opportunity" O ON MO."OpportunityId" = O."Id"
WHERE MO."ActionId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification')
		AND MO."VerificationStatusId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed')
		AND O."CredentialIssuanceEnabled" = true;

-- Reward Transaction (Pending) for Verification (Completed) for 'testuser@gmail.com'
INSERT INTO "Reward"."Transaction"("Id", "UserId", "StatusId", "SourceEntityType", "MyOpportunityId", "Amount", "TransactionId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), MO."UserId", (SELECT "Id" FROM "Reward"."TransactionStatus" WHERE "Name" = 'Pending'), 'MyOpportunity', MO."Id", MO."ZltoReward", NULL, NULL, NULL, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."MyOpportunity" MO
WHERE MO."ActionId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification')
		AND MO."VerificationStatusId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed')
		AND MO."ZltoReward" > 0;

-- Verification (Completed): Assign User Skills
INSERT INTO "Entity"."UserSkills"("Id", "UserId", "SkillId", "DateCreated")
SELECT gen_random_uuid(),
    (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testuser@gmail.com'),
    "Skills"."SkillId",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM (
    SELECT DISTINCT OS."SkillId"
    FROM "Opportunity"."MyOpportunity" MO
    INNER JOIN "Opportunity"."OpportunitySkills" OS ON MO."OpportunityId" = OS."OpportunityId"
    WHERE MO."ActionId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification')
        AND MO."VerificationStatusId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed')
) AS "Skills";

-- Verification (Completed): Assign User Skill Organizations
INSERT INTO "Entity"."UserSkillOrganizations"("Id", "UserSkillId", "OrganizationId", "DateCreated")
SELECT
    gen_random_uuid() AS "Id",
    "UserSkills"."Id" AS "UserSkillId",
    OP."OrganizationId" AS "OrganizationId",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateCreated"
FROM
    "Entity"."UserSkills" AS "UserSkills"
INNER JOIN "Opportunity"."OpportunitySkills" OS ON "UserSkills"."SkillId" = OS."SkillId"
INNER JOIN "Opportunity"."Opportunity" OP ON OP."Id" = OS."OpportunityId"
INNER JOIN "Opportunity"."MyOpportunity" MO ON MO."OpportunityId" = OS."OpportunityId"
    AND MO."ActionId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification')
    AND MO."VerificationStatusId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed')
GROUP BY
    "UserSkills"."Id",
    OP."OrganizationId";

-- Opportunity: Update Running Totals
WITH AggregatedData AS (
    SELECT
        O."Id" AS "OpportunityId",
        COUNT(MO."Id") AS "Count",
        SUM(MO."ZltoReward") AS "ZltoRewardTotal",
        SUM(MO."YomaReward") AS "YomaRewardTotal"
    FROM "Opportunity"."Opportunity" O
    LEFT JOIN "Opportunity"."MyOpportunity" MO ON O."Id" = MO."OpportunityId"
    WHERE MO."ActionId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification')
        AND MO."VerificationStatusId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed')
    GROUP BY O."Id"
)
UPDATE "Opportunity"."Opportunity" O
SET
    "ParticipantCount" = A."Count",
    "ZltoRewardCumulative" = A."ZltoRewardTotal",
    "YomaRewardCumulative" = A."YomaRewardTotal"
FROM AggregatedData A
WHERE O."Id" = A."OpportunityId";

-- Organization: Update Running Totals
WITH rewardsums AS (
    SELECT
        O."OrganizationId" AS "OrganizationId",
        CASE
            WHEN COUNT(O."ZltoRewardCumulative") = 0 THEN NULL
            ELSE SUM(O."ZltoRewardCumulative")
        END AS "ZltoRewardCumulative",
        CASE
            WHEN COUNT(O."YomaRewardCumulative") = 0 THEN NULL
            ELSE SUM(O."YomaRewardCumulative")
        END AS "YomaRewardCumulative",
        SUM(O."ZltoRewardPool") AS "TotalZltoRewardPool",
        SUM(O."YomaRewardPool") AS "TotalYomaRewardPool"
    FROM
        "Opportunity"."Opportunity" O
    GROUP BY
        O."OrganizationId"
)
UPDATE
    "Entity"."Organization" org
SET
    "ZltoRewardCumulative" = rewardsums."ZltoRewardCumulative",
    "YomaRewardCumulative" = rewardsums."YomaRewardCumulative",
    "ZltoRewardPool" = rewardsums."TotalZltoRewardPool",
    "YomaRewardPool" = rewardsums."TotalYomaRewardPool"
FROM
    rewardsums
WHERE
    org."Id" = rewardsums."OrganizationId";
