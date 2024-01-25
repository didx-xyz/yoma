-- This script is designed to be applied to an empty database

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users & Organizations

-- testuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", "CountryOfResidenceId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), 'testuser@gmail.com', TRUE, 'Test', 'User', 'Test User', '+27125555555', (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1), (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" ORDER BY RANDOM() LIMIT 1), CURRENT_DATE - INTERVAL '20 years', NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- testadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", "CountryOfResidenceId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), 'testadminuser@gmail.com', TRUE, 'Test Admin', 'User', 'Test Admin User', '+27125555555', (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1), (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" ORDER BY RANDOM() LIMIT 1), CURRENT_DATE - INTERVAL '21 years', NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- testorgadminuser@gmail.com (KeyCloak password: P@ssword1)
INSERT INTO "Entity"."User"("Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", "CountryOfResidenceId",
            "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", "DateYoIDOnboarded", "DateCreated", "DateModified")
VALUES(gen_random_uuid(), 'testorgadminuser@gmail.com', TRUE, 'Test Organization Admin', 'User', 'Test Organization Admin User', '+27125555555', (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1), (SELECT "Id" FROM "Lookup"."Country" ORDER BY RANDOM() LIMIT 1),
        NULL, (SELECT "Id" FROM "Lookup"."Gender" ORDER BY RANDOM() LIMIT 1), CURRENT_DATE - INTERVAL '22 years', NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- SSI Tenant Creation (Pending) for YOID onboarded users
INSERT INTO "SSI"."TenantCreation"("Id", "EntityType", "StatusId", "UserId", "OrganizationId", "TenantId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), 'User', SCS."Id" AS "StatusId", U."Id" AS "UserId", NULL AS "OrganizationId", NULL AS "TenantId", NULL AS "ErrorReason", NULL AS "RetryCount", CURRENT_TIMESTAMP AS "DateCreated", CURRENT_TIMESTAMP AS "DateModified"
FROM "Entity"."User" U
JOIN "SSI"."TenantCreationStatus" SCS ON SCS."Name" = 'Pending'
WHERE U."YoIDOnboarded" = true;

-- SSI Credential Issuance (Pending) for YOID onboarded users
INSERT INTO "SSI"."CredentialIssuance"("Id", "SchemaTypeId", "ArtifactType", "SchemaName", "SchemaVersion", "StatusId", "UserId", "OrganizationId",
                                       "MyOpportunityId", "CredentialId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), ST."Id" AS "SchemaTypeId", 'Indy' AS "ArtifactType", 'YoID|Default' AS "SchemaName", '1.0' AS "SchemaVersion",
       CIS."Id" AS "StatusId", U."Id" AS "UserId", NULL AS "OrganizationId", NULL AS "MyOpportunityId", NULL AS "CredentialId",
       NULL AS "ErrorReason", NULL AS "RetryCount", CURRENT_TIMESTAMP AS "DateCreated", CURRENT_TIMESTAMP AS "DateModified"
FROM "Entity"."User" U
JOIN "SSI"."SchemaType" ST ON ST."Name" = 'YoID'
JOIN "SSI"."CredentialIssuanceStatus" CIS ON CIS."Name" = 'Pending'
WHERE U."YoIDOnboarded" = true;

-- Reward Wallet Creation (Rewards for completed 'my' opportunities to be awarded; only scheduled for 'testuser@gmail.com')
INSERT INTO "Reward"."WalletCreation"("Id", "StatusId", "UserId", "WalletId", "Balance", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), WCStatus."Id" AS "StatusId", U."Id" AS "UserId", NULL AS "WalletId", NULL AS "Balance", NULL AS "ErrorReason", NULL AS "RetryCount",
       CURRENT_TIMESTAMP AS "DateCreated", CURRENT_TIMESTAMP AS "DateModified"
FROM "Entity"."User" U
JOIN "Reward"."WalletCreationStatus" WCStatus ON WCStatus."Name" = 'Pending'
WHERE U."Email" = 'testuser@gmail.com';

-- Set up random words
DO $$
DECLARE
    V_Words VARCHAR(500) := 'The,A,An,Awesome,Incredible,Fantastic,Amazing,Wonderful,Exciting,Unbelievable,Great,Marvelous,Stunning,Impressive,Captivating,Extraordinary,Superb,Epic,Spectacular,Magnificent,Phenomenal,Outstanding,Brilliant,Enthralling,Enchanting,Mesmerizing,Riveting,Spellbinding,Unforgettable,Sublime';
    V_RandomLengthName INT := ABS(FLOOR(RANDOM() * 5) + 5);
    V_RandomLengthOther INT := ABS(FLOOR(RANDOM() * 101) + 100);
BEGIN
    -- Organizations
    FOR RowCount IN 1..10 LOOP
        -- Insert into the Organization table
        INSERT INTO "Entity"."Organization"(
            "Id", "Name", "NameHashValue", "WebsiteURL", "PrimaryContactName", "PrimaryContactEmail", "PrimaryContactPhone",
            "VATIN", "TaxNumber", "RegistrationNumber", "City", "CountryId", "StreetAddress", "Province", "PostalCode",
            "Tagline", "Biography", "StatusId", "CommentApproval", "DateStatusModified", "LogoId", "DateCreated",
            "CreatedByUserId", "DateModified", "ModifiedByUserId"
        )
        SELECT
            gen_random_uuid(),
            (
                SELECT STRING_AGG(Word, ' ')
                FROM (
                    SELECT word
                    FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                    ORDER BY RANDOM()
                    LIMIT V_RandomLengthName
                ) AS RandomNameWords
            ) || ' ' || CAST(ABS(FLOOR(RANDOM() * 2147483647)) AS VARCHAR(10)),
            MD5(
                (
                    SELECT STRING_AGG(Word, ' ')
                    FROM (
                        SELECT word
                        FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                        ORDER BY RANDOM()
                        LIMIT V_RandomLengthName
                    ) AS RandomNameWords
                ) || CAST(ABS(FLOOR(RANDOM() * 2147483647)) AS VARCHAR(10))
            ),
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
                SELECT STRING_AGG(Word, ' ')
                FROM (
                    SELECT word
                    FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                    ORDER BY RANDOM()
                    LIMIT V_RandomLengthOther
                ) AS RandomTaglineWords
            ),
            (
                SELECT STRING_AGG(Word, ' ')
                FROM (
                    SELECT word
                    FROM regexp_split_to_table(V_Words, ',') AS RandomWords(word)
                    ORDER BY RANDOM()
                    LIMIT V_RandomLengthOther
                ) AS RandomBiographyWords
            ),
            (SELECT "Id" FROM "Entity"."OrganizationStatus" WHERE "Name" = 'Active'),
            'Approved',
            CURRENT_TIMESTAMP,
            NULL,
            CURRENT_TIMESTAMP,
            (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'),
            CURRENT_TIMESTAMP,
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
		(SELECT "Id" FROM "Entity"."OrganizationStatus" WHERE "Name" = 'Active'), 'Approved', CURRENT_TIMESTAMP, NULL,
    CURRENT_TIMESTAMP, (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'), CURRENT_TIMESTAMP, (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'));

--organization admins
INSERT INTO "Entity"."OrganizationUsers"("Id", "OrganizationId", "UserId", "DateCreated")
SELECT gen_random_uuid(), "Id", (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'), CURRENT_TIMESTAMP
FROM "Entity"."Organization";

--ssi tenant creation (pending) for active organizations
INSERT INTO "SSI"."TenantCreation"("Id", "EntityType", "StatusId", "UserId", "OrganizationId", "TenantId", "ErrorReason", "RetryCount", "DateCreated", "DateModified")
SELECT gen_random_uuid(), 'Organization', (SELECT "Id" FROM "SSI"."TenantCreationStatus" WHERE "Name" = 'Pending'), NULL, "Id", NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Entity"."Organization"
WHERE "StatusId" = (SELECT "Id" FROM "Entity"."OrganizationStatus" WHERE "Name" = 'Active');

--organization provider types
INSERT INTO "Entity"."OrganizationProviderTypes"("Id", "OrganizationId", "ProviderTypeId", "DateCreated")
SELECT gen_random_uuid(), O."Id" AS "OrganizationId", PT."Id" AS "ProviderTypeId", CURRENT_TIMESTAMP FROM "Entity"."Organization" O CROSS JOIN "Entity"."OrganizationProviderType" PT;

/****opportunities****/
DO $$
DECLARE
    V_Words VARCHAR(500) := 'The,A,An,Awesome,Incredible,Fantastic,Amazing,Wonderful,Exciting,Unbelievable,Great,Marvelous,Stunning,Impressive,Captivating,Extraordinary,Superb,Epic,Spectacular,Magnificent,Phenomenal,Outstanding,Brilliant,Enthralling,Enchanting,Mesmerizing,Riveting,Spellbinding,Unforgettable,Sublime';
    V_RandomLengthName INT := ABS(FLOOR(RANDOM() * 5) + 5);
    V_RandomLengthOther INT := ABS(FLOOR(RANDOM() * 101) + 100);
    V_DateCreated TIMESTAMP := CURRENT_TIMESTAMP - INTERVAL '1 month';
    V_DateStart TIMESTAMP := CURRENT_TIMESTAMP - INTERVAL '2 months';
    V_TotalSecondsIn2Months BIGINT := 2 * 30.44 * 24 * 60 * 60;
    V_Iterations INT := 5000;
    V_SecondsPerIteration BIGINT := V_TotalSecondsIn2Months / V_Iterations;
    V_RowCount INT := 0;
BEGIN
    -- Opportunities
	WHILE V_RowCount < V_Iterations LOOP
	    -- Insert into the Opportunity table
	    INSERT INTO "Opportunity"."Opportunity"(
	        "Id", "Title", "Description", "TypeId", "OrganizationId", "Summary", "Instructions", "URL", "ZltoReward", "ZltoRewardPool",
	        "ZltoRewardCumulative", "YomaReward", "YomaRewardPool", "YomaRewardCumulative", "VerificationEnabled", "VerificationMethod",
	        "DifficultyId", "CommitmentIntervalId", "CommitmentIntervalCount", "ParticipantLimit", "ParticipantCount", "StatusId",
	        "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "SSISchemaName", "DateCreated", "CreatedByUserId",
	        "DateModified", "ModifiedByUserId"
	    )
	    SELECT
	        gen_random_uuid(),
	        (
	            SELECT ARRAY_TO_STRING(ARRAY_AGG(Word), ' ')
	            FROM (
	                SELECT unnest(string_to_array(V_Words, ',')) AS Word
	                ORDER BY RANDOM()
	                LIMIT ABS(FLOOR(RANDOM() * 10) + 5)
	            ) AS RandomTitleWords
	        ) || ' ' || CAST(ABS(FLOOR(RANDOM() * 2147483647)) AS VARCHAR(10)),
	        (
	            SELECT ARRAY_TO_STRING(ARRAY_AGG(Word), ' ')
	            FROM (
	                SELECT unnest(string_to_array(V_Words, ',')) AS Word
	                ORDER BY RANDOM()
	                LIMIT ABS(FLOOR(RANDOM() * 101) + 100)
	            ) AS RandomDescriptionWords
	        ),
	        (
	            SELECT "Id" FROM "Opportunity"."OpportunityType" ORDER BY RANDOM() LIMIT 1
	        ),
	        (
	            SELECT "Id" FROM "Entity"."Organization" ORDER BY RANDOM() LIMIT 1
	        ),
	        (
	            SELECT ARRAY_TO_STRING(ARRAY_AGG(Word), ' ')
	            FROM (
	                SELECT unnest(string_to_array(V_Words, ',')) AS Word
	                ORDER BY RANDOM()
	                LIMIT ABS(FLOOR(RANDOM() * 101) + 100)
	            ) AS RandomSummaryWords
	        ),
	        (
	            SELECT ARRAY_TO_STRING(ARRAY_AGG(Word), ' ')
	            FROM (
	                SELECT unnest(string_to_array(V_Words, ',')) AS Word
	                ORDER BY RANDOM()
	                LIMIT ABS(FLOOR(RANDOM() * 101) + 100)
	            ) AS RandomInstructionsWords
	        ),
	        'https://www.google.com/',
	        (SELECT ROUND((100 + (350 - 100) * RANDOM())::numeric, 2)),
	        (SELECT ROUND((1000 + (3500 - 1000) * RANDOM())::numeric, 2)),
	        NULL,
	        (SELECT ROUND((100 + (350 - 100) * RANDOM())::numeric, 2)),
	        (SELECT ROUND((1000 + (3500 - 1000) * RANDOM())::numeric, 2)),
	        NULL,
	        CAST(RANDOM() < 0.5 AS BOOLEAN),
	        CASE WHEN RANDOM() < 0.5 THEN 'Manual' ELSE NULL END,
	        (
	            SELECT "Id" FROM "Opportunity"."OpportunityDifficulty" ORDER BY RANDOM() LIMIT 1
	        ),
	        (
	            SELECT "Id" FROM "Lookup"."TimeInterval" ORDER BY RANDOM() LIMIT 1
	        ),
	        1 + ABS(FLOOR(RANDOM() * 10)),
	        100 + ABS(FLOOR(RANDOM() * 901)),
	        NULL,
	        (
	            SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" IN ('Active', 'Inactive') ORDER BY RANDOM() LIMIT 1
	        ),
	        (
	            SELECT ARRAY_TO_STRING(ARRAY_AGG(Word), ',')
	            FROM (
	                SELECT unnest(string_to_array(V_Words, ',')) AS Word
	                ORDER BY RANDOM()
	                LIMIT ABS(FLOOR(RANDOM() * 101) + 100)
	            ) AS RandomKeywordsWords
	        ),
	        V_DateStart,
	        CAST(V_DateStart + INTERVAL '7 days' AS TIMESTAMP),
	        CAST(CASE WHEN RANDOM() < 0.5 THEN 1 ELSE 0 END AS BOOLEAN),
	        NULL,
	        V_DateCreated,
	        (
	            SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'
	        ),
	        CURRENT_TIMESTAMP,
	        (
	            SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'testorgadminuser@gmail.com'
	        )
	    FROM pg_tables
	    LIMIT 1;

	    V_RowCount := V_RowCount + 1;
	    V_DateCreated := V_DateCreated + INTERVAL '1 second';
	    V_DateStart := V_DateStart + INTERVAL '1 second';
	END LOOP;
END $$ LANGUAGE plpgsql;

-- SSI schema definitions
WITH CTE AS (
    SELECT O."SSISchemaName"
    FROM "Opportunity"."Opportunity" AS O
    WHERE O."CredentialIssuanceEnabled" = true
)
UPDATE "Opportunity"."Opportunity" AS O
SET "SSISchemaName" = 'Opportunity|Default'
FROM CTE
WHERE O."SSISchemaName" IN (SELECT "SSISchemaName" FROM CTE);

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
    CURRENT_TIMESTAMP
FROM "Opportunity"."Opportunity" O
CROSS JOIN "Opportunity"."OpportunityCategory" OC;

-- Countries
INSERT INTO "Opportunity"."OpportunityCountries"("Id", "OpportunityId", "CountryId", "DateCreated")
SELECT
    gen_random_uuid(),
    O."Id" AS "OpportunityId",
    R."CountryID",
    CURRENT_TIMESTAMP
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
    CURRENT_TIMESTAMP
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
    CURRENT_TIMESTAMP
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
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Opportunity"."Opportunity" O
CROSS JOIN (
    SELECT "Id" AS "VerificationTypeId"
    FROM "Opportunity"."OpportunityVerificationType"
    ORDER BY RANDOM()
    LIMIT 10
) AS R
WHERE O."VerificationEnabled" = TRUE;

