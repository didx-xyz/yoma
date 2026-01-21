-- This script is designed to be applied to an empty database

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

SET TIMEZONE='UTC';

-- Users & Organizations

-- testuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "PhoneNumberConfirmed", "CountryId", "EducationId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), 'testuser@gmail.com', TRUE, 'Test', 'User', 'Test User', '+27821234567', TRUE,
        (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2"='ZA'), (SELECT "Id" FROM "Lookup"."Education" ORDER BY RANDOM() LIMIT 1),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" ORDER BY RANDOM() LIMIT 1), CURRENT_DATE - INTERVAL '20 years', NULL, NULL, TRUE,
        (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'));

-- testadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "PhoneNumberConfirmed", "CountryId", "EducationId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), 'testadminuser@gmail.com', TRUE, 'Test Admin', 'User', 'Test Admin User', NULL, NULL,
        (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2"='ZA'), (SELECT "Id" FROM "Lookup"."Education" ORDER BY RANDOM() LIMIT 1),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" ORDER BY RANDOM() LIMIT 1), CURRENT_DATE - INTERVAL '21 years', NULL, NULL, TRUE,
        (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'));

-- testorgadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "PhoneNumberConfirmed", "CountryId", "EducationId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), 'testorgadminuser@gmail.com', TRUE, 'Test Organization Admin', 'User', 'Test Organization Admin User', NULL, NULL,
        (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2"='ZA'), (SELECT "Id" FROM "Lookup"."Education" ORDER BY RANDOM() LIMIT 1),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" ORDER BY RANDOM() LIMIT 1), CURRENT_DATE - INTERVAL '22 years', NULL, NULL, TRUE,
        (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'));

-- SSI Tenant Creation (Pending) for YOID onboarded users
INSERT INTO "SSI"."TenantCreation"("Id", "EntityType", "StatusId", "UserId", "OrganizationId", "TenantId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), 'User', SCS."Id" AS "StatusId", U."Id" AS "UserId", NULL AS "OrganizationId", NULL AS "TenantId", NULL AS "ErrorReason", NULL AS "RetryCount", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateCreated", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateModified"
FROM "Entity"."User" U
JOIN "SSI"."TenantCreationStatus" SCS ON SCS."Name" = 'Pending'
WHERE U."YoIDOnboarded" = true;

-- SSI Credential Issuance (Pending) for YOID onboarded users
INSERT INTO "SSI"."CredentialIssuance"("Id", "SchemaTypeId", "ArtifactType", "SchemaName", "SchemaVersion", "StatusId", "UserId", "OrganizationId",
                                       "MyOpportunityId", "CredentialId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), ST."Id" AS "SchemaTypeId", 'ACR' AS "ArtifactType", 'YoID|Default' AS "SchemaName", '1.0' AS "SchemaVersion",
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

-- Countries (ensure ZA or WW always present; cover WW-only / ZA-only / ZA+random)
INSERT INTO "Opportunity"."OpportunityCountries"("Id", "OpportunityId", "CountryId", "DateCreated")
SELECT gen_random_uuid(), O."Id", C."CountryId", (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN LATERAL (
  -- 40%: WW only
  SELECT (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2"='WW' LIMIT 1) AS "CountryId"
  WHERE (mod(abs(hashtext(O."Id"::text)), 10) < 4)

  UNION ALL

  -- 40%: ZA only
  SELECT (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2"='ZA' LIMIT 1) AS "CountryId"
  WHERE (mod(abs(hashtext(O."Id"::text)), 10) >= 4 AND mod(abs(hashtext(O."Id"::text)), 10) < 8)

  UNION ALL

  -- 20%: ZA + 2 random (excluding ZA/WW)
  SELECT (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2"='ZA' LIMIT 1) AS "CountryId"
  WHERE (mod(abs(hashtext(O."Id"::text)), 10) >= 8)

  UNION ALL

  SELECT X."CountryId"
  FROM (
    SELECT R."Id" AS "CountryId"
    FROM "Lookup"."Country" R
    WHERE R."CodeAlpha2" NOT IN ('ZA','WW')
    ORDER BY RANDOM()
    LIMIT 2
  ) X
  WHERE (mod(abs(hashtext(O."Id"::text)), 10) >= 8)
) C;

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
INSERT INTO "Opportunity"."OpportunityVerificationTypes"
(
    "Id",
    "OpportunityId",
    "VerificationTypeId",
    "Description",
    "DateCreated",
    "DateModified"
)
SELECT
    gen_random_uuid(),
    O."Id",
    R."Id",
    NULL,
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id"
    FROM "Opportunity"."OpportunityVerificationType"
    WHERE "Name" <> 'Video'
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

-- ============================================================
-- Referral Programs (50) — valid combos & server rules enforced
-- Author: testadminuser@gmail.com
-- ============================================================
DO $$
DECLARE
  v_admin_user_id        uuid := (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testadminuser@gmail.com');
  v_now                  timestamptz := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

  v_status_active_id     uuid := (SELECT "Id" FROM "Referral"."ProgramStatus" WHERE "Name" = 'Active');
  v_status_inactive_id   uuid := (SELECT "Id" FROM "Referral"."ProgramStatus" WHERE "Name" = 'Inactive');
  v_status_deleted_id    uuid := (SELECT "Id" FROM "Referral"."ProgramStatus" WHERE "Name" = 'Deleted');

  -- Countries (for program-country mapping + ensuring task opp selection overlaps)
  v_country_ww_id        uuid := (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2"='WW');
  v_country_za_id        uuid := (SELECT "Id" FROM "Lookup"."Country" WHERE "CodeAlpha2"='ZA');

  v_words                text := 'Youth,Referral,Learn,Apply,Round,Flow,Onboard,Capstone,Community,Engage,Pathway,Skills,Program,Launch,Venture,Starter,Pro,Advanced,Scholar,Track,Journey';

  v_is_default_assigned  boolean := false;
  v_make_default_index   int := 1 + floor(random()*50)::int; -- random default among the 50

  v_i int := 0;

  -- program fields
  v_program_id uuid;
  v_program_name varchar(255);
  v_program_desc varchar(500);
  v_status_id uuid;
  v_is_default boolean;
  v_pop boolean;
  v_pathway_required boolean;
  v_multiple_links boolean;
  v_z_referrer numeric(8,2);
  v_z_referee  numeric(8,2);
  v_z_pool     numeric(12,2);
  v_comp_window int;
  v_cap_per_ref int;
  v_cap_program int;
  v_date_start timestamptz;
  v_date_end   timestamptz;

  -- pathway fields
  v_pathway_id uuid;
  v_pathway_name varchar(255);
  v_pathway_desc varchar(500);
  v_pathway_rule varchar(10);        -- 'All' | 'Any'
  v_pathway_order_mode varchar(10);  -- 'Sequential' | 'AnyOrder'

  -- step/task
  v_steps_count int;
  v_tasks_count int;
  v_step_id uuid;
  v_step_name varchar(255);
  v_step_desc varchar(500);
  v_step_rule varchar(10);
  v_step_order_mode varchar(10);
  v_step_order_display smallint;
  v_step_order smallint;

  v_task_order_display smallint;
  v_task_order smallint;
  v_task_id uuid;

  -- random name helpers
  v_arr text[];
  v_cnt int;

  -- opportunity for tasks (must be active + verification enabled + method present)
  v_opp_id uuid;

BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found: %', 'testadminuser@gmail.com';
  END IF;

  IF v_country_ww_id IS NULL THEN
    RAISE EXCEPTION 'Country not found: %', 'WW';
  END IF;

  IF v_country_za_id IS NULL THEN
    RAISE EXCEPTION 'Country not found: %', 'ZA';
  END IF;

  WHILE v_i < 50 LOOP
    -- -------------------------
    -- Random state bucket
    -- 1=Active, 2=Inactive, 3=Expired(Active+past end), 4=Deleted
    -- -------------------------
    CASE 1 + floor(random()*4)::int
      WHEN 1 THEN v_status_id := v_status_active_id;    -- Active window (not expired)
      WHEN 2 THEN v_status_id := v_status_inactive_id;  -- Inactive
      WHEN 3 THEN v_status_id := v_status_active_id;    -- Expired shape (Active + past end)
      WHEN 4 THEN v_status_id := v_status_deleted_id;   -- Deleted
    END CASE;

    -- -------------------------
    -- Program name/desc (unique, concise ~50–80 chars)
    -- -------------------------
    v_cnt := 2 + floor(random()*3)::int; -- 2..4 words
    SELECT array_agg(w ORDER BY random()) INTO v_arr
    FROM regexp_split_to_table(v_words, ',') AS w
    LIMIT v_cnt;

    v_program_name :=
      left(trim(both ' ' from array_to_string(v_arr, ' ')), 70)
      || ' ' || (100 + floor(random()*900))::text; -- 100..999

    v_program_desc := 'Seeded program for QA automation and manual testing';

    -- -------------------------
    -- Dates to match state
    -- -------------------------
    IF v_status_id = v_status_deleted_id THEN
      -- Deleted: dates irrelevant; keep sane window
      v_date_start := date_trunc('day', v_now - interval '5 days');
      v_date_end   := NULL;

    ELSIF v_status_id = v_status_inactive_id THEN
      -- Inactive but current/future window (not enforced by status)
      v_date_start := date_trunc('day', v_now - interval '2 days');
      v_date_end   := CASE WHEN random() < 0.5
                       THEN date_trunc('day', v_now + interval '20 days') + interval '1 day' - interval '1 millisecond'
                       ELSE NULL
                     END;

    ELSE
      -- Active or Expired:
      IF random() < 0.5 THEN
        -- bounded window (likely active)
        v_date_start := date_trunc('day', v_now - interval '3 days');
        v_date_end   := date_trunc('day', v_now + interval '10 days') + interval '1 day' - interval '1 millisecond';
      ELSE
        -- open-ended (active)
        v_date_start := date_trunc('day', v_now - interval '7 days');
        v_date_end   := NULL;
      END IF;

      -- For variety, force some "expired" shape (Active status but end in the past)
      IF v_i % 4 = 0 THEN
        v_date_start := date_trunc('day', v_now - interval '30 days');
        v_date_end   := date_trunc('day', v_now - interval '5 days') + interval '1 day' - interval '1 millisecond';
      END IF;
    END IF;

    -- -------------------------
    -- Random flags (then correct to satisfy rules)
    -- -------------------------
    v_is_default       := (v_i + 1 = v_make_default_index);  -- exactly one default
    v_pop              := (random() < 0.5);                  -- ProofOfPersonhoodRequired
    v_pathway_required := (random() < 0.5);                  -- allow some without pathway
    v_multiple_links   := (random() < 0.5);

    -- -------------------------
    -- Default program must always be Active
    -- -------------------------
    IF v_is_default THEN
      v_status_id := v_status_active_id;
      v_date_start := date_trunc('day', v_now - interval '3 days');
      v_date_end := NULL;
    END IF;

    -- -------------------------
    -- Rewards & caps (respect limits)
    -- 30% no rewards; else pick integers 1..2000 and pool ≥ sum, ≤ 10M
    -- -------------------------
    IF random() < 0.30 THEN
      v_z_referrer := NULL;
      v_z_referee  := NULL;
      v_z_pool     := NULL;
      v_comp_window := NULL;
      v_cap_per_ref := NULL;
      v_cap_program := NULL;
    ELSE
      -- integer rewards within [1..2000]
      v_z_referrer := (1 + floor(random()*2000)::int)::numeric;
      v_z_referee  := (1 + floor(random()*2000)::int)::numeric;

      -- pool >= sum and ≤ 10M (integer)
      v_z_pool := (v_z_referrer + v_z_referee) + (floor(random()*5000)::int);
      IF v_z_pool > 10000000 THEN v_z_pool := 10000000; END IF;

      -- at least one cap
      IF random() < 0.5 THEN
        v_cap_per_ref := 1 + floor(random()*5)::int;
        v_cap_program := NULL;
      ELSE
        v_cap_per_ref := NULL;
        v_cap_program := 10 + floor(random()*200)::int;
      END IF;

      -- reasonable completion window (days)
      v_comp_window := 7 + floor(random()*30)::int;
    END IF;

    -- -------------------------
    -- Enforce global rules
    -- -------------------------
    -- If rewards set → require POP or Pathway
    IF (coalesce(v_z_referrer,0) + coalesce(v_z_referee,0)) > 0 THEN
      IF NOT (v_pop OR v_pathway_required) THEN
        IF random() < 0.5 THEN v_pop := true; ELSE v_pathway_required := true; END IF;
      END IF;
      -- require at least one cap
      IF coalesce(v_cap_per_ref,0) = 0 AND coalesce(v_cap_program,0) = 0 THEN
        IF random() < 0.5 THEN
          v_cap_per_ref := 1 + floor(random()*5)::int;
        ELSE
          v_cap_program := 10 + floor(random()*200)::int;
        END IF;
      END IF;
    END IF;

    -- If default → require POP or Pathway
    IF v_is_default AND NOT (v_pop OR v_pathway_required) THEN
      IF random() < 0.5 THEN v_pop := true; ELSE v_pathway_required := true; END IF;
    END IF;

    -- If multiple links → require POP or per-ref cap or Pathway
    IF v_multiple_links AND NOT (v_pop OR v_pathway_required OR (coalesce(v_cap_per_ref,0) > 0)) THEN
      v_cap_per_ref := 1 + floor(random()*5)::int;
    END IF;

    -- -------------------------
    -- INSERT Program
    -- -------------------------
    v_program_id := gen_random_uuid();

    INSERT INTO "Referral"."Program"(
      "Id","Name","Description","ImageId",
      "CompletionWindowInDays","CompletionLimitReferee","CompletionLimit",
      "CompletionTotal",
      "ZltoRewardReferrer","ZltoRewardReferee","ZltoRewardPool","ZltoRewardCumulative",
      "ProofOfPersonhoodRequired","PathwayRequired","MultipleLinksAllowed",
      "StatusId","IsDefault","DateStart","DateEnd",
      "DateCreated","CreatedByUserId","DateModified","ModifiedByUserId")
    VALUES(
      v_program_id, v_program_name, v_program_desc, NULL,
      v_comp_window, v_cap_per_ref, v_cap_program,
      NULL,
      v_z_referrer, v_z_referee, v_z_pool, NULL,
      v_pop, v_pathway_required, v_multiple_links,
      v_status_id, v_is_default, v_date_start, v_date_end,
      v_now, v_admin_user_id, v_now, v_admin_user_id
    );

    -- -------------------------
    -- Program Countries
    -- Default => WW only
    -- Others  => ZA + 0..2 random (excluding ZA/WW)
    -- -------------------------
    IF v_is_default THEN
      INSERT INTO "Referral"."ProgramCountries"("Id","ProgramId","CountryId","DateCreated")
      VALUES (gen_random_uuid(), v_program_id, v_country_ww_id, v_now);
    ELSE
      INSERT INTO "Referral"."ProgramCountries"("Id","ProgramId","CountryId","DateCreated")
      VALUES (gen_random_uuid(), v_program_id, v_country_za_id, v_now);

      INSERT INTO "Referral"."ProgramCountries"("Id","ProgramId","CountryId","DateCreated")
      SELECT gen_random_uuid(), v_program_id, C."Id", v_now
      FROM "Lookup"."Country" C
      WHERE C."CodeAlpha2" NOT IN ('ZA','WW')
      ORDER BY RANDOM()
      LIMIT (floor(random()*3)::int); -- 0..2
    END IF;

    -- -------------------------
    -- Pathway (only if required)
    -- -------------------------
    IF v_pathway_required THEN
      v_pathway_id := gen_random_uuid();

      -- Pathway name (concise)
      v_cnt := 2 + floor(random()*3)::int; -- 2..4 words
      SELECT array_agg(w ORDER BY random()) INTO v_arr
      FROM regexp_split_to_table(v_words, ',') AS w
      LIMIT v_cnt;

      v_pathway_name := left(trim(both ' ' from array_to_string(v_arr, ' ')), 55) || ' Pathway';
      v_pathway_desc := 'Seeded pathway (minimal valid structure)';

      -- pathway rule/order mode (if Sequential → must be All)
      v_pathway_rule := CASE WHEN random() < 0.5 THEN 'All' ELSE 'Any' END;
      v_pathway_order_mode := CASE WHEN random() < 0.5 THEN 'Sequential' ELSE 'AnyOrder' END;
      IF v_pathway_order_mode = 'Sequential' AND v_pathway_rule = 'Any' THEN
        v_pathway_rule := 'All';
      END IF;

      INSERT INTO "Referral"."ProgramPathway"(
        "Id","ProgramId","Name","Description","Rule","OrderMode",
        "DateCreated","DateModified")
      VALUES(
        v_pathway_id, v_program_id, v_pathway_name, v_pathway_desc, v_pathway_rule, v_pathway_order_mode,
        v_now, v_now
      );

      -- 1..3 steps
      v_steps_count := 1 + floor(random()*3)::int;
      v_step_order_display := 1;

      FOR s IN 1..v_steps_count LOOP
        v_step_id := gen_random_uuid();

        -- Step name (concise)
        v_cnt := 2 + floor(random()*3)::int; -- 2..4 words
        SELECT array_agg(w ORDER BY random()) INTO v_arr
        FROM regexp_split_to_table(v_words, ',') AS w
        LIMIT v_cnt;

        v_step_name := left(trim(both ' ' from array_to_string(v_arr, ' ')), 45);
        v_step_desc := 'Seeded step';

        v_step_rule := CASE WHEN random() < 0.5 THEN 'All' ELSE 'Any' END;
        v_step_order_mode := CASE WHEN random() < 0.5 THEN 'Sequential' ELSE 'AnyOrder' END;
        -- sequential steps must be All
        IF v_step_order_mode = 'Sequential' AND v_step_rule = 'Any' THEN
          v_step_rule := 'All';
        END IF;

        v_step_order := CASE WHEN v_pathway_order_mode = 'Sequential' THEN v_step_order_display ELSE NULL END;

        INSERT INTO "Referral"."ProgramPathwayStep"(
          "Id","PathwayId","Name","Description","Rule","OrderMode","Order","OrderDisplay",
          "DateCreated","DateModified")
        VALUES(
          v_step_id, v_pathway_id, v_step_name, v_step_desc, v_step_rule, v_step_order_mode, v_step_order, v_step_order_display,
          v_now, v_now
        );

        -- 1..3 tasks per step
        v_tasks_count := 1 + floor(random()*3)::int;
        v_task_order_display := 1;

        FOR t IN 1..v_tasks_count LOOP
          -- choose a valid opportunity (must overlap program countries)
          SELECT O."Id"
          INTO v_opp_id
          FROM "Opportunity"."Opportunity" O
          WHERE O."VerificationEnabled" = TRUE
            AND O."VerificationMethod" IS NOT NULL
            AND O."StatusId" = (SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name"='Active')
            AND EXISTS (
              SELECT 1
              FROM "Opportunity"."OpportunityCountries" OC
              JOIN "Referral"."ProgramCountries" PC
                ON PC."ProgramId" = v_program_id
               AND PC."CountryId" = OC."CountryId"
              WHERE OC."OpportunityId" = O."Id"
            )
          ORDER BY random()
          LIMIT 1;

          IF v_opp_id IS NULL THEN
            -- if none found, skip task create (keeps schema valid; unlikely given seed)
            CONTINUE;
          END IF;

          v_task_id := gen_random_uuid();
          v_task_order := CASE WHEN v_step_order_mode = 'Sequential' THEN v_task_order_display ELSE NULL END;

          INSERT INTO "Referral"."ProgramPathwayTask"(
            "Id","StepId","EntityType","OpportunityId","Order","OrderDisplay","DateCreated","DateModified")
          VALUES(
            v_task_id, v_step_id, 'Opportunity', v_opp_id, v_task_order, v_task_order_display, v_now, v_now
          );

          v_task_order_display := v_task_order_display + 1;
        END LOOP;

        v_step_order_display := v_step_order_display + 1;
      END LOOP;
    END IF;

    v_i := v_i + 1;
  END LOOP;

  -- Safety: ensure exactly one default exists (if random pick missed)
  IF NOT EXISTS (SELECT 1 FROM "Referral"."Program" WHERE "IsDefault" = TRUE) THEN
    UPDATE "Referral"."Program"
    SET "IsDefault" = TRUE,
        "StatusId" = v_status_active_id,
        "ProofOfPersonhoodRequired" = TRUE
    WHERE "Id" = (
      SELECT "Id"
      FROM "Referral"."Program"
      WHERE "StatusId" <> v_status_deleted_id
      ORDER BY random()
      LIMIT 1
    );
  END IF;

END $$ LANGUAGE plpgsql;

-- ============================================================
-- Referral Links (100) for testuser@gmail.com
-- States: Active, Cancelled, Expired (only on truly expired programs)
-- NOTE: LimitReached will be set later after we add usages
-- ============================================================

DO $$
DECLARE
  v_ref_user_id         uuid := (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testuser@gmail.com');
  v_now                 timestamptz := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

  v_status_active_id    uuid := (SELECT "Id" FROM "Referral"."LinkStatus" WHERE "Name" = 'Active');
  v_status_cancelled_id uuid := (SELECT "Id" FROM "Referral"."LinkStatus" WHERE "Name" = 'Cancelled');
  v_status_expired_id   uuid := (SELECT "Id" FROM "Referral"."LinkStatus" WHERE "Name" = 'Expired');

  v_words               text := 'Spark,Route,Growth,Engage,Pulse,Loop,Edge,Flow,Track,Boost,Orbit,Bridge,Lift,Peak,Stride,Signal,Anchor,Path,Trail,Link';
  v_arr                 text[];
  v_cnt                 int;

  v_link_id             uuid;
  v_state_pick          int;
  v_program_id          uuid;
  v_status_id           uuid;
  v_link_name           varchar(255);
  v_url                 varchar(2048);
  v_shorturl            varchar(2048);

  v_i int := 0;
BEGIN
  IF v_ref_user_id IS NULL THEN
    RAISE EXCEPTION 'Referrer user not found: %', 'testuser@gmail.com';
  END IF;

  -- Ensure we have at least one active and one expired program
  IF NOT EXISTS (
    SELECT 1 FROM "Referral"."Program" p
    WHERE p."StatusId" = (SELECT "Id" FROM "Referral"."ProgramStatus" WHERE "Name"='Active')
      AND p."DateStart" <= v_now
      AND (p."DateEnd" IS NULL OR p."DateEnd" > v_now)
  ) THEN
    RAISE EXCEPTION 'No active program found to attach Active/Cancelled links';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "Referral"."Program" p
    WHERE p."DateEnd" IS NOT NULL AND p."DateEnd" < v_now
  ) THEN
    RAISE EXCEPTION 'No expired program found to attach Expired links';
  END IF;

  WHILE v_i < 100 LOOP
    -- Distribution: 60% Active, 25% Cancelled, 15% Expired
    v_state_pick := 1 + floor(random()*100)::int;

    IF v_state_pick <= 60 THEN
      v_status_id := v_status_active_id;
      SELECT p."Id" INTO v_program_id
      FROM "Referral"."Program" p
      WHERE p."StatusId" = (SELECT "Id" FROM "Referral"."ProgramStatus" WHERE "Name"='Active')
        AND p."DateStart" <= v_now
        AND (p."DateEnd" IS NULL OR p."DateEnd" > v_now)
      ORDER BY random() LIMIT 1;

    ELSIF v_state_pick <= 85 THEN
      v_status_id := v_status_cancelled_id;
      SELECT p."Id" INTO v_program_id
      FROM "Referral"."Program" p
      WHERE p."StatusId" = (SELECT "Id" FROM "Referral"."ProgramStatus" WHERE "Name"='Active')
        AND p."DateStart" <= v_now
        AND (p."DateEnd" IS NULL OR p."DateEnd" > v_now)
      ORDER BY random() LIMIT 1;

    ELSE
      v_status_id := v_status_expired_id;
      SELECT p."Id" INTO v_program_id
      FROM "Referral"."Program" p
      WHERE p."DateEnd" IS NOT NULL AND p."DateEnd" < v_now
      ORDER BY random() LIMIT 1;
    END IF;

    IF v_program_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Short, usable name: 2..4 words (trimmed) + compact suffix
    v_cnt := 2 + floor(random()*3)::int; -- 2..4
    SELECT array_agg(w ORDER BY random()) INTO v_arr
    FROM regexp_split_to_table(v_words, ',') AS w
    LIMIT v_cnt;

    v_link_name :=
      left(trim(both ' ' from array_to_string(v_arr, ' ')), 40) || ' Lk ' || (v_i + 1)::text;

    -- Unique URLs (respect unique constraints)
    v_link_id := gen_random_uuid();
    v_url := 'https://www.yoma.world/ref/' || v_link_id::text;
    v_shorturl := 'https://y.w/' || substring(v_link_id::text from 1 for 8);

    INSERT INTO "Referral"."Link"(
      "Id","Name","Description","ProgramId","UserId","StatusId","URL","ShortURL",
      "CompletionTotal","ZltoRewardCumulative","DateCreated","DateModified"
    )
    VALUES(
      v_link_id, v_link_name, 'Seeded referral link', v_program_id, v_ref_user_id, v_status_id, v_url, v_shorturl,
      NULL, NULL, v_now, v_now
    );

    v_i := v_i + 1;
  END LOOP;
END $$ LANGUAGE plpgsql;

-- ==========================================================================================
-- Referral Link Usages (seed) for testuser@gmail.com AS REFEREE
-- NOTE: This intentionally BREAKS the "you cannot claim your own link" rule for seed data.
-- Adds per-usage reward snapshots when status = Completed:
--   LinkUsage."ZltoRewardReferrer" and LinkUsage."ZltoRewardReferee"
-- ==========================================================================================

DO $$
DECLARE
  v_user_id                uuid := (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testuser@gmail.com');
  v_now                    timestamptz := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

  -- LinkUsage statuses
  v_usage_pending_id       uuid := (SELECT "Id" FROM "Referral"."LinkUsageStatus" WHERE "Name" = 'Pending');
  v_usage_completed_id     uuid := (SELECT "Id" FROM "Referral"."LinkUsageStatus" WHERE "Name" = 'Completed');
  v_usage_expired_id       uuid := (SELECT "Id" FROM "Referral"."LinkUsageStatus" WHERE "Name" = 'Expired');

  -- MyOpportunity enums
  v_mo_action_verif_id     uuid := (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification');
  v_mo_status_completed_id uuid := (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed');

  rec RECORD;
  v_status_id uuid;

  -- reward snapshots (from Program at seed-time)
  v_prog_reward_referrer numeric;
  v_prog_reward_referee  numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Seed referee user not found: %', 'testuser@gmail.com';
  END IF;
  IF v_usage_pending_id IS NULL OR v_usage_completed_id IS NULL OR v_usage_expired_id IS NULL THEN
    RAISE EXCEPTION 'LinkUsageStatus rows missing (Pending/Completed/Expired)';
  END IF;
  IF v_mo_action_verif_id IS NULL OR v_mo_status_completed_id IS NULL THEN
    RAISE EXCEPTION 'MyOpportunity enums missing (Action=Verification or Status=Completed)';
  END IF;

  FOR rec IN
    SELECT DISTINCT ON (l."ProgramId")
           l."Id"        AS link_id,
           l."ProgramId" AS program_id
    FROM "Referral"."Link" l
    WHERE l."UserId" = v_user_id
    ORDER BY l."ProgramId", random()
  LOOP
    -- skip if usage already exists for this user & program
    IF EXISTS (
      SELECT 1
      FROM "Referral"."LinkUsage" u
      WHERE u."UserId" = v_user_id
        AND u."ProgramId" = rec.program_id
    ) THEN
      CONTINUE;
    END IF;

    -- compute status (Expired > Completed > Pending)
    WITH prog AS (
      SELECT
        p."Id",
        p."ProofOfPersonhoodRequired"  AS pop_required,
        p."PathwayRequired"            AS pathway_required,
        p."DateStart",
        p."DateEnd",
        CASE WHEN p."DateEnd" IS NOT NULL AND p."DateEnd" < v_now THEN TRUE ELSE FALSE END AS is_expired
      FROM "Referral"."Program" p
      WHERE p."Id" = rec.program_id
    ),
    pw AS (
      SELECT pw."Id", pw."Rule" AS pathway_rule, pw."OrderMode" AS pathway_order_mode
      FROM "Referral"."ProgramPathway" pw
      WHERE pw."ProgramId" = rec.program_id
    ),
    steps AS (
      SELECT s."Id", s."Rule" AS step_rule
      FROM "Referral"."ProgramPathwayStep" s
      JOIN pw ON pw."Id" = s."PathwayId"
    ),
    step_task AS (
      SELECT
        s."Id" AS step_id,
        COUNT(t."Id") AS total_tasks,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM "Opportunity"."MyOpportunity" mo
            WHERE mo."UserId" = v_user_id
              AND mo."OpportunityId" = t."OpportunityId"
              AND mo."ActionId" = v_mo_action_verif_id
              AND mo."VerificationStatusId" = v_mo_status_completed_id
          )
        ) AS completed_tasks
      FROM steps s
      JOIN "Referral"."ProgramPathwayTask" t ON t."StepId" = s."Id"
      GROUP BY s."Id"
    ),
    step_satisfied AS (
      SELECT
        s."Id" AS step_id,
        CASE
          WHEN s.step_rule = 'All' THEN (st.completed_tasks = st.total_tasks)
          WHEN s.step_rule = 'Any' THEN (st.completed_tasks >= 1)
          ELSE FALSE
        END AS is_satisfied
      FROM (
        SELECT s."Id", s."Rule" AS step_rule
        FROM "Referral"."ProgramPathwayStep" s
        JOIN pw ON pw."Id" = s."PathwayId"
      ) s
      JOIN step_task st ON st.step_id = s."Id"
    ),
    pathway_eval AS (
      SELECT
        pw."Id" AS pathway_id,
        CASE
          WHEN pw."Id" IS NULL THEN FALSE
          WHEN pw.pathway_rule = 'All'
            THEN NOT EXISTS (
                   SELECT 1 FROM "Referral"."ProgramPathwayStep" s
                   WHERE s."PathwayId" = pw."Id"
                     AND NOT EXISTS (
                       SELECT 1 FROM step_satisfied ss WHERE ss.step_id = s."Id" AND ss.is_satisfied = TRUE
                     )
                 )
          WHEN pw.pathway_rule = 'Any'
            THEN EXISTS (SELECT 1 FROM step_satisfied ss WHERE ss.is_satisfied = TRUE)
          ELSE FALSE
        END AS pathway_satisfied
      FROM pw
    )
    SELECT
      CASE
        WHEN (SELECT is_expired FROM prog) = TRUE
          THEN v_usage_expired_id
        WHEN (SELECT pop_required FROM prog) = TRUE
          THEN v_usage_pending_id
        WHEN (SELECT pathway_required FROM prog) = TRUE
          THEN CASE WHEN COALESCE((SELECT pathway_satisfied FROM pathway_eval), FALSE)
                    THEN v_usage_completed_id
                    ELSE v_usage_pending_id
               END
        ELSE
          v_usage_pending_id
      END
    INTO v_status_id;

    -- load program reward snapshots (for insert)
    SELECT p."ZltoRewardReferrer", p."ZltoRewardReferee"
    INTO   v_prog_reward_referrer,  v_prog_reward_referee
    FROM "Referral"."Program" p
    WHERE p."Id" = rec.program_id;

    INSERT INTO "Referral"."LinkUsage"(
      "Id","ProgramId","LinkId","UserId","StatusId",
      "ZltoRewardReferrer","ZltoRewardReferee",
      "DateCreated","DateModified"
    )
    VALUES (
      gen_random_uuid(), rec.program_id, rec.link_id, v_user_id, v_status_id,
      CASE WHEN v_status_id = v_usage_completed_id THEN v_prog_reward_referrer ELSE NULL END,
      CASE WHEN v_status_id = v_usage_completed_id THEN v_prog_reward_referee  ELSE NULL END,
      v_now, v_now
    );
  END LOOP;
END $$ LANGUAGE plpgsql;

-- ============================================================
-- Referral Running Totals & Computed States
-- - Program: CompletionTotal, ZltoRewardCumulative
-- - Link:    CompletionTotal, ZltoRewardCumulative, Status=LimitReached
-- ============================================================

DO $$
DECLARE
  v_now                   timestamptz := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
  v_status_active_id      uuid := (SELECT "Id" FROM "Referral"."LinkStatus" WHERE "Name"='Active');
  v_status_limit_id       uuid := (SELECT "Id" FROM "Referral"."LinkStatus" WHERE "Name"='LimitReached');
BEGIN
  -- Safety
  IF v_status_active_id IS NULL OR v_status_limit_id IS NULL THEN
    RAISE EXCEPTION 'Missing LinkStatus rows (Active/LimitReached)';
  END IF;

  -- ===========================================
  -- PROGRAM: CompletionTotal & ZltoRewardCumulative
  -- ===========================================
  WITH usage_completed AS (
    SELECT u."ProgramId", COUNT(*)::int AS completed_cnt
    FROM "Referral"."LinkUsage" u
    JOIN "Referral"."LinkUsageStatus" s ON s."Id" = u."StatusId" AND s."Name" = 'Completed'
    GROUP BY u."ProgramId"
  ),
  rewards AS (
    SELECT p."Id" AS program_id,
           COALESCE(p."ZltoRewardReferrer", 0)::numeric +
           COALESCE(p."ZltoRewardReferee", 0)::numeric AS reward_per_completion,
           p."ZltoRewardPool" AS pool
    FROM "Referral"."Program" p
  ),
  agg AS (
    SELECT r.program_id,
           COALESCE(uc.completed_cnt, 0) AS completed_cnt,
           r.reward_per_completion,
           r.pool,
           CASE
             WHEN r.reward_per_completion IS NULL OR r.reward_per_completion = 0 THEN NULL
             WHEN COALESCE(uc.completed_cnt,0) = 0 THEN NULL
             ELSE (r.reward_per_completion * COALESCE(uc.completed_cnt,0))
           END AS raw_cumulative
    FROM rewards r
    LEFT JOIN usage_completed uc ON uc."ProgramId" = r.program_id
  ),
  capped AS (
    SELECT program_id,
           completed_cnt,
           CASE
             WHEN raw_cumulative IS NULL THEN NULL
             WHEN pool IS NULL THEN raw_cumulative
             ELSE LEAST(raw_cumulative, pool)
           END AS zlto_cumulative
    FROM agg
  )
  UPDATE "Referral"."Program" p
  SET "CompletionTotal"      = c.completed_cnt,
      "ZltoRewardCumulative" = c.zlto_cumulative,
      "DateModified"         = v_now
  FROM capped c
  WHERE p."Id" = c.program_id;

  -- ===========================================
  -- LINK: CompletionTotal & ZltoRewardCumulative
  --  (per-link cumulative computed from program reward-per-completion;
  --   not capped here to avoid double pool application across many links)
  -- ===========================================
  WITH usage_completed AS (
    SELECT u."LinkId", COUNT(*)::int AS completed_cnt
    FROM "Referral"."LinkUsage" u
    JOIN "Referral"."LinkUsageStatus" s ON s."Id" = u."StatusId" AND s."Name"='Completed'
    GROUP BY u."LinkId"
  ),
  reward_map AS (
    SELECT l."Id" AS link_id,
           COALESCE(p."ZltoRewardReferrer",0)::numeric +
           COALESCE(p."ZltoRewardReferee",0)::numeric AS reward_per_completion
    FROM "Referral"."Link" l
    JOIN "Referral"."Program" p ON p."Id" = l."ProgramId"
  ),
  agg AS (
    SELECT rm.link_id,
           COALESCE(uc.completed_cnt, 0) AS completed_cnt,
           CASE
             WHEN rm.reward_per_completion IS NULL OR rm.reward_per_completion = 0 THEN NULL
             WHEN COALESCE(uc.completed_cnt,0) = 0 THEN NULL
             ELSE (rm.reward_per_completion * COALESCE(uc.completed_cnt,0))
           END AS zlto_cumulative
    FROM reward_map rm
    LEFT JOIN usage_completed uc ON uc."LinkId" = rm.link_id
  )
  UPDATE "Referral"."Link" l
  SET "CompletionTotal"      = a.completed_cnt,
      "ZltoRewardCumulative" = a.zlto_cumulative,
      "DateModified"         = v_now
  FROM agg a
  WHERE l."Id" = a.link_id;

  -- ===========================================
  -- LINK: flip Active -> LimitReached
  --  Rule: if program has per-referrer cap AND
  --        link.CompletionTotal >= cap
  -- ===========================================
  UPDATE "Referral"."Link" l
  SET "StatusId"    = v_status_limit_id,
      "DateModified" = v_now
  FROM "Referral"."Program" p
  WHERE l."ProgramId" = p."Id"
    AND p."CompletionLimitReferee" IS NOT NULL
    AND l."CompletionTotal" IS NOT NULL
    AND l."CompletionTotal" >= p."CompletionLimitReferee"
    AND l."StatusId" = v_status_active_id;  -- only flip Active

END $$ LANGUAGE plpgsql;
