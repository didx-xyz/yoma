--!!!THIS SCRIPT IS DESIGNED TO BE APPLIED TO AN EMPTY EF MIGRATED DATABASE, POST V2 MIGRATION AND FILES CLEANUP, WITH NO POST.SQL SCRIPT EXECUTED!!!--

SET TIMEZONE='UTC';

--!!!DESTINATION ENVIRONMENT TOGGLE!!!--
--with 'staging' zlto wallets will not be migrated and subsequintly no transactions added as processed
SET SESSION "myvars.environment" = 'staging'; --staging or production

--ensure 'Yoma (Youth Agency Marketplace)' system organization exist and is active
DO $$
DECLARE
    org_name CONSTANT VARCHAR := 'Yoma (Youth Agency Marketplace)';
    org_exists BOOLEAN;
BEGIN
    -- Check if the organization exists with case-insensitive comparison
    SELECT EXISTS(
        SELECT 1
        FROM dbo.organisations
        WHERE LOWER("name") = LOWER(org_name)
    ) INTO org_exists;

    -- Raise an exception if the organization does not exist
    IF NOT org_exists THEN
        RAISE EXCEPTION '% does not exist', org_name;
    END IF;

    -- Update approvedat if it is NULL, for the existing organization
    UPDATE dbo.organisations
    SET approvedat = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    WHERE LOWER("name") = LOWER(org_name)
    AND approvedat IS NULL;

    -- Set deletedat to NULL if it is not NULL, for the existing organization
    UPDATE dbo.organisations
    SET deletedat = NULL
    WHERE LOWER("name") = LOWER(org_name)
    AND deletedat IS NOT NULL;
END $$;

--extentions
-- Drop the pgcrypto extension if it exists (gets corrupted)
DROP EXTENSION IF EXISTS pgcrypto;

-- Recreate the pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--create temporary functions
CREATE OR REPLACE FUNCTION remove_double_spacing(input_text text)
RETURNS text AS $$
BEGIN
    -- Explicitly handle NULL or empty input by returning NULL immediately
    IF input_text IS NULL OR trim(input_text) = '' THEN
        RETURN NULL;
    END IF;

    -- Trim leading and trailing spaces, then replace multiple spaces with a single space
    RETURN trim(regexp_replace(input_text, '\s+', ' ', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION title_case(str text, return_none boolean DEFAULT false)
RETURNS text AS $$
BEGIN
    IF str IS NULL OR trim(str) = '' THEN
        IF return_none THEN
            RETURN 'none';
        ELSE
            RETURN NULL;
        END IF;
    END IF;

    RETURN initcap(regexp_replace(trim(str), '\s+', ' ', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION construct_display_name(firstname text, lastname text)
RETURNS text AS $$
DECLARE
    formatted_firstname text;
    formatted_lastname text;
BEGIN
    -- Clean firstname and lastname using the modified title_case function
    formatted_firstname := title_case(firstname, true);
    formatted_lastname := title_case(lastname, true);

    -- Check conditions to decide what to return
    IF formatted_firstname = 'none' AND formatted_lastname = 'none' THEN
        -- Both are 'none', return a single 'none'
        RETURN 'none';
    ELSIF formatted_firstname = 'none' THEN
        -- Only lastname is available, return it
        RETURN formatted_lastname;
    ELSIF formatted_lastname = 'none' THEN
        -- Only firstname is available, return it
        RETURN formatted_firstname;
    ELSE
        -- Both names are present, concatenate with a space
        RETURN formatted_firstname || ' ' || formatted_lastname;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION format_phone_number(phone text)
RETURNS text AS $$
BEGIN
    -- Trim the input to remove leading and trailing spaces
    phone := trim(phone);

    -- Check if the phone number is null or effectively empty after trimming
    IF phone IS NULL OR phone = '' THEN
        RETURN NULL;
    END IF;

    -- Check if the trimmed phone number matches the regex pattern
    IF phone ~ '^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$' THEN
        RETURN phone;
    ELSE
        -- If the phone number does not match the pattern, return null
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION start_of_day(input_timestamp timestamp with time zone)
RETURNS timestamp with time zone AS $$
BEGIN
    -- Check if the input is NULL and return NULL if so
    IF input_timestamp IS NULL THEN
        RETURN NULL;
    ELSE
        -- Truncate to the start of the day in UTC
        RETURN (date_trunc('day', input_timestamp AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION end_of_day(input_timestamp timestamp with time zone)
RETURNS timestamp with time zone AS $$
BEGIN
    -- Check if the input is NULL and return NULL if so
    IF input_timestamp IS NULL THEN
        RETURN NULL;
    ELSE
        -- Set to the end of the day in UTC
        RETURN ((date_trunc('day', input_timestamp AT TIME ZONE 'UTC') + INTERVAL '1 DAY' - INTERVAL '1 millisecond') AT TIME ZONE 'UTC');
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION ensure_valid_http_url(input_url text)
RETURNS text AS $$
BEGIN
    -- If input is null or empty, immediately return null
    IF input_url IS NULL OR trim(input_url) = '' THEN
        RETURN NULL;
    END IF;

    -- Prepend 'https://' if the URL does not start with 'http://' or 'https://'
    IF NOT (input_url ~* '^(http://|https://)') THEN
        input_url := 'https://' || input_url;
    END IF;

    -- Validate the URL format; adjust the regex pattern as needed for your validation rules
    IF input_url ~* '^(http://|https://)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+.*$' THEN
        RETURN trim(input_url);  -- Trim the output before returning
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION ensure_valid_email(input_email text)
RETURNS text AS $$
BEGIN
    -- Return NULL immediately if input is NULL or empty
    IF input_email IS NULL OR trim(input_email) = '' THEN
        RETURN NULL;
    END IF;

    -- Lowercase the email address
    input_email := LOWER(input_email);

    -- Basic regex pattern for email validation; adjust as needed
    IF input_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN trim(input_email);  -- Trim the output before returning
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

/***BEGIN: User & Organizations***/
--Object.Blob (user photos)
INSERT INTO "Object"."Blob" (
    "Id",
    "StorageType",
    "FileType",
    "Key",
    "ContentType",
    "OriginalFileName",
    "ParentId",
    "DateCreated"
)
SELECT DISTINCT
    f.id AS "Id",
    'Public' AS "StorageType",
    'Photos' AS "FileType",
    f.s3objectid AS "Key",
    f.contenttype AS "ContentType",
    split_part(f.s3objectid, '/', array_length(string_to_array(f.s3objectid, '/'), 1)) AS "OriginalFileName",
    NULL::uuid AS "ParentId",
    f.createdat AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    dbo.files f
INNER JOIN
    dbo.users u ON f.id = u.photoid
WHERE
	u.email IS NOT NULL;

--Entity.User
INSERT INTO "Entity"."User" (
    "Id",
    "Email",
    "EmailConfirmed",
    "FirstName",
    "Surname",
    "DisplayName",
    "PhoneNumber",
    "CountryId",
    "EducationId",
    "PhotoId",
    "GenderId",
    "DateOfBirth",
    "DateLastLogin",
    "ExternalId",
    "YoIDOnboarded",
    "DateYoIDOnboarded",
    "DateCreated",
    "DateModified"
)
SELECT
    u.id as "Id",
    LOWER(TRIM(u.email)) AS "Email", --asume valid as migrated to or created via keycloak
    u.emailconfirmed AS "EmailConfirmed",
    title_case(u.firstname, true) AS "FirstName",
    title_case(u.lastname, true) AS "Surname",
    construct_display_name(u.firstname, u.lastname) AS "DisplayName",
    format_phone_number(u.phonenumber) AS "PhoneNumber",
    (
        SELECT lc."Id"
        FROM "Lookup"."Country" lc
        WHERE lc."CodeAlpha2" = COALESCE(u.countryofresidence, u.country)
    ) AS "CountryId",
    NULL::uuid AS "EducationId",
    u.photoid AS "PhotoId",
    CASE
        WHEN u.gender IS NULL THEN NULL
        WHEN u.gender = 'Male' THEN (SELECT "Id" FROM "Lookup"."Gender" WHERE "Name" = 'Male')
        WHEN u.gender = 'FM' THEN (SELECT "Id" FROM "Lookup"."Gender" WHERE "Name" = 'Female')
        ELSE (SELECT "Id" FROM "Lookup"."Gender" WHERE "Name" = 'Prefer not to say')
    END AS "GenderId",
    start_of_day(u.dateofbirth) AT TIME ZONE 'UTC' AS "DateOfBirth",
    u.lastlogin AT TIME ZONE 'UTC' AS "DateLastLogin",
    u.externalid AS "ExternalId",
    FALSE AS "YoIDOnboarded",
     NULL::timestamptz AS "DateYoIDOnboarded",
    u.createdat AT TIME ZONE 'UTC' AS "DateCreated",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateModified"
FROM
    dbo.users u
WHERE
    u.email IS NOT NULL;

--Reward.WalletCreation (users that were migrated to new zlto wallet)
DO $$
DECLARE
    environment TEXT;
BEGIN
    --get the current environment setting
    environment := current_setting('myvars.environment');

    --wallet migration occurs exclusively in the production environment; staging does not migrate wallets. Instead,
    --staging ensures wallet availability upon user login. This distinction is necessary because the staging environment uses a separate Zlto instance,
    --leading to differences in wallet ids between staging and production
    IF environment <> 'staging' THEN
        INSERT INTO "Reward"."WalletCreation" (
		    "Id",
		    "StatusId",
		    "UserId",
		    "WalletId",
		    "Balance",
		    "ErrorReason",
		    "RetryCount",
		    "DateCreated",
		    "DateModified"
		)
		SELECT
		    gen_random_uuid() AS "Id",
		    (SELECT WCS."Id" FROM "Reward"."WalletCreationStatus" WCS WHERE WCS."Name" = 'Created') AS "StatusId",
		    u.id AS "UserId",
		    TRIM(u.zltowalletid) AS "WalletId",
		    NULL::numeric(12, 2) AS "Balance", -- Updated after populating Reward.Transaction for VerifiedAt credentials and users not yet migrated to new zlto wallet (see 'My' Opportunities section)
		    NULL::text AS "ErrorReason",
		    NULL::int2 AS "RetryCount",
		    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateCreated",
		    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateModified"
		FROM
		    dbo.users u
		WHERE
		    u.migratedtonewzlto = true
		    AND u.zltowalletid IS NOT NULL
		    AND u.email IS NOT NULL;
		    END IF;
END $$;

--SSI.TenantCreation (scheduled upon 1st login and acceptance of YoId onboarding)

--Object.Blob (organization logos)
INSERT INTO "Object"."Blob" (
    "Id",
    "StorageType",
    "FileType",
    "Key",
    "ContentType",
    "OriginalFileName",
    "ParentId",
    "DateCreated"
)
SELECT DISTINCT
    f.id AS "Id",
    'Public' AS "StorageType",
    'Photos' AS "FileType",
    f.s3objectid AS "Key",
    f.contenttype AS "ContentType",
    split_part(f.s3objectid, '/', array_length(string_to_array(f.s3objectid, '/'), 1)) AS "OriginalFileName",
    NULL::uuid AS "ParentId",
    f.createdat AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    dbo.files f
INNER JOIN
    dbo.organisations o ON f.id = o.logoid
INNER JOIN
    dbo.opportunities opp ON o.id = opp.organisationid; -- Ensure only organizations with opportunities are included

--Enity.Organization (ensure unique names)
WITH MappedOrganisations AS (
    SELECT DISTINCT
        o.id,
        o.name,
        o.createdat
    FROM
        dbo.organisations o
    INNER JOIN
        dbo.opportunities opp ON o.id = opp.organisationid -- Ensure only organizations with opportunities are included
),
CleanedOrganisations AS (
    SELECT
        mo.id,
        mo.name,
        LOWER(remove_double_spacing(mo.name)) AS CleanName,
        ROW_NUMBER() OVER (PARTITION BY LOWER(remove_double_spacing(mo.name)) ORDER BY mo.createdat) AS DupNum
    FROM
        MappedOrganisations mo -- Use the filtered list of organizations
),
NumberedDuplicates AS (
    SELECT
        id,
        CASE
            WHEN DupNum > 1 THEN CleanName || ' - ' || CAST(DupNum - 1 AS TEXT)
            ELSE name -- Preserve original name if not a duplicate
        END AS FinalName
    FROM CleanedOrganisations
)
UPDATE dbo.organisations o
SET name = nd.FinalName
FROM NumberedDuplicates nd
WHERE o.id = nd.id AND LOWER(nd.FinalName) <> LOWER(o.name);

--Entity.Organization
INSERT INTO "Entity"."Organization" (
    "Id",
    "Name",
    "NameHashValue",
    "WebsiteURL",
    "PrimaryContactName",
    "PrimaryContactEmail",
    "PrimaryContactPhone",
    "VATIN",
    "TaxNumber",
    "RegistrationNumber",
    "City",
    "CountryId",
    "StreetAddress",
    "Province",
    "PostalCode",
    "Tagline",
    "Biography",
    "StatusId",
    "CommentApproval",
    "DateStatusModified",
    "LogoId",
    "DateCreated",
    "CreatedByUserId",
    "DateModified",
    "ModifiedByUserId"
)
SELECT
    DISTINCT(o.id),
    remove_double_spacing(o.name) AS "Name",
    ENCODE(DIGEST(remove_double_spacing(o.name), 'sha256'), 'hex') as "NameHashValue",
    ensure_valid_http_url(url) as "WebsiteURL",
    title_case(primarycontactname, false) as "PrimaryContactName",
    ensure_valid_email(primarycontactemail) as "PrimaryContactEmail",
    format_phone_number(primarycontactphone) as "PrimaryContactPhone",
    NULL::varchar(255) AS "VATIN",
    NULL::varchar(255) AS "TaxNumber",
    NULL::varchar(255) AS "RegistrationNumber",
    NULL::varchar(255) AS "City",
    NULL::uuid AS "CountryId",
    NULL::varchar(500) AS "StreetAddress",
    NULL::varchar(255) AS "Province",
    NULL::varchar(10) AS "PostalCode",
    remove_double_spacing(tagline) AS "Tagline",
    remove_double_spacing(biography) AS "Biography",
	CASE
	       WHEN o.approvedat IS NOT NULL THEN
	           (
	               SELECT "Id"
	               FROM "Entity"."OrganizationStatus"
	               WHERE "Name" = 'Active'
	               LIMIT 1
	           )
	       WHEN o.deletedat IS NOT NULL THEN
	           (
	               SELECT "Id"
	               FROM "Entity"."OrganizationStatus"
	               WHERE "Name" = 'Deleted'
	               LIMIT 1
	           )
	       ELSE
	           (
	               SELECT "Id"
	               FROM "Entity"."OrganizationStatus"
	               WHERE "Name" = 'Inactive'
	               LIMIT 1
	           ) END AS "StatusId",
	 NULL::varchar(500) as "CommentApproval",
     CASE
          WHEN o.approvedat IS NOT NULL THEN o.approvedat
          WHEN o.deletedat IS NOT NULL THEN o.deletedat
          ELSE o.createdat
      END AT TIME ZONE 'UTC' AS "DateStatusModified",
      o.logoid as "LogoId",
      o.createdat AT TIME ZONE 'UTC' as "DateCreated",
      (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'system@yoma.world') as "CreatedByUserId",
      GREATEST(
		    COALESCE(o.approvedat, '1900-01-01'::timestamp),
		    COALESCE(o.deletedat, '1900-01-01'::timestamp),
		    COALESCE(o.updatedat, '1900-01-01'::timestamp),
		    o.createdat
		) AT TIME ZONE 'UTC' AS "DateModified",
	  (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'system@yoma.world') as "ModifiedByUserId"
FROM
	dbo.organisations o
JOIN
    dbo.opportunities opp ON o.id = opp.organisationid; -- Ensure only organizations with opportunities are included

--SSI.TenantCreation (pending for active organizations)
INSERT INTO "SSI"."TenantCreation"(
    "Id",
    "EntityType",
    "StatusId",
    "UserId",
    "OrganizationId",
    "TenantId",
    "ErrorReason",
    "RetryCount",
    "DateCreated",
    "DateModified"
)
SELECT
    gen_random_uuid() AS "Id",
    'Organization' AS "EntityType",
    (SELECT "Id" FROM "SSI"."TenantCreationStatus" WHERE "Name" = 'Pending') AS "StatusId",
    NULL::uuid AS "UserId",
    "Id" AS "OrganizationId",
    NULL::uuid AS "TenantId",
    NULL::text AS "ErrorReason",
    NULL::int2 AS "RetryCount",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateCreated",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateModified"
FROM
    "Entity"."Organization"
WHERE
    "StatusId" = (SELECT "Id" FROM "Entity"."OrganizationStatus" WHERE "Name" = 'Active');

--Object.Blob (registration documents)
INSERT INTO "Object"."Blob" (
    "Id",
    "StorageType",
    "FileType",
    "Key",
    "ContentType",
    "OriginalFileName",
    "ParentId",
    "DateCreated"
)
SELECT DISTINCT
    f.id AS "Id",
    'Private' AS "StorageType",
    'Documents' AS "FileType",
    f.s3objectid AS "Key",
    f.contenttype AS "ContentType",
    split_part(f.s3objectid, '/', array_length(string_to_array(f.s3objectid, '/'), 1)) AS "OriginalFileName",
    NULL::uuid AS "ParentId",
    f.createdat AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    dbo.files f
INNER JOIN
    dbo.organisations o ON f.id = o.companyregistrationid
JOIN
    dbo.opportunities opp ON o.id = opp.organisationid; -- Ensure only organizations with opportunities are included

--Enity.OrganizationDocuments (registration documents)
INSERT INTO "Entity"."OrganizationDocuments" (
    "Id",
    "OrganizationId",
    "FileId",
    "Type",
    "DateCreated"
)
SELECT
    gen_random_uuid() AS "Id", -- Generates a unique ID for each document
    o.id AS "OrganizationId",
    o.companyregistrationid AS "FileId",
    'Registration' AS "Type",
    o.createdat AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    dbo.organisations o
WHERE
    EXISTS (
        -- Checks if the company registration ID corresponds to an existing Blob
        SELECT 1
        FROM "Object"."Blob" b
        WHERE b."Id" = o.companyregistrationid
    )
    AND EXISTS (
        -- Ensures the organization has at least one mapped opportunity
        SELECT 1
        FROM dbo.opportunities opp
        WHERE opp.organisationid = o.id
    );

--Entity.OrganizationProviderTypes
INSERT INTO "Entity"."OrganizationProviderTypes" (
    "Id",
    "OrganizationId",
    "ProviderTypeId",
    "DateCreated"
)
SELECT
    gen_random_uuid() AS "Id",
    o.Id AS "OrganizationId",
    (
        SELECT "Id"
        FROM "Entity"."OrganizationProviderType"
        WHERE "Name" = 'Education'
    ) AS "ProviderTypeId",
    o.createdat AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    dbo.organisations o
WHERE
    EXISTS (
        -- Ensures the organization has at least one associated opportunity
        SELECT 1
        FROM dbo.opportunities opp
        WHERE opp.organisationid = o.id
    )
    AND NOT EXISTS (
        -- Prevents adding duplicates based on OrganizationId and ProviderTypeId
        SELECT 1
        FROM "Entity"."OrganizationProviderTypes" opt
        WHERE opt."OrganizationId" = o.Id
        AND opt."ProviderTypeId" = (
            SELECT "Id"
            FROM "Entity"."OrganizationProviderType"
            WHERE "Name" = 'Education'
        )
    );

--Entity.OrganizationUsers (organization admins)
INSERT INTO "Entity"."OrganizationUsers" (
    "Id",
    "OrganizationId",
    "UserId",
    "DateCreated"
)
SELECT
    gen_random_uuid() AS "Id",
    u.organisationid AS "OrganizationId",
    u.id AS "UserId",
    u.createdat AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    dbo.users u
WHERE
    u.organisationid IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM "Entity"."Organization" o
        WHERE o."Id" = u.organisationid
        AND EXISTS (
        	-- Ensures the organization has at least one mapped opportunity
            SELECT 1
            FROM dbo.opportunities opp
            WHERE opp.organisationid = o."Id"
        )
    );

--Entity.OrganizationUsers (organization admins for orphans >> system@yoma.world)
INSERT INTO "Entity"."OrganizationUsers" (
    "Id",
    "OrganizationId",
    "UserId",
    "DateCreated"
)
SELECT
    gen_random_uuid(),
    o."Id" AS "OrganizationId",
    (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'system@yoma.world') AS "UserId",
    CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
FROM
    "Entity"."Organization" o
WHERE
    NOT EXISTS (
        SELECT 1
        FROM "Entity"."OrganizationUsers" ou
        WHERE ou."OrganizationId" = o."Id"
    );
/***END: User & Organizations***/

/***BEGIN: Opportunities***/
--Opportunity.Opportunity (ensure unique titles)
WITH CleanedTitles AS (
    SELECT
        o.id,
        o.title,
        LOWER(remove_double_spacing(o.title)) AS CleanTitle,
        ROW_NUMBER() OVER (PARTITION BY LOWER(remove_double_spacing(o.title)) ORDER BY o.createdat) AS DupNum
    FROM
        dbo.opportunities o
),
UpdatedTitles AS (
    SELECT
        id,
        CASE
            WHEN DupNum > 1 THEN CleanTitle || ' - ' || CAST(DupNum - 1 AS TEXT)
            ELSE title -- Preserve original title if not a duplicate
        END AS FinalTitle
    FROM CleanedTitles
)
UPDATE dbo.opportunities o
SET title = ut.FinalTitle
FROM UpdatedTitles ut
WHERE o.id = ut.id AND LOWER(o.title) <> LOWER(ut.FinalTitle);

--Opportunity.Opportunity
--checks for any opportunities with a type not listed among the expected values and raises an exception if found.
DO $$
DECLARE
    v_invalid_type_exists BOOLEAN;
BEGIN
    -- Check for any o.type that does not match the expected values
    SELECT EXISTS (
        SELECT 1
        FROM dbo.opportunities o
        WHERE lower(o.type) NOT IN ('task', 'learning', 'learningopportunity', 'impactopportunity', 'taskopportunity')
    ) INTO v_invalid_type_exists;

    IF v_invalid_type_exists THEN
        RAISE EXCEPTION 'One or more opportunities have an invalid type.';
    END IF;
END $$;

INSERT INTO "Opportunity"."Opportunity" (
    "Id",
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
    "ModifiedByUserId"
)
SELECT
	o.id AS "Id",
	remove_double_spacing(o.title) AS "Title" ,
	remove_double_spacing(o.description) AS "Description" ,
	(SELECT "Id" FROM "Opportunity"."OpportunityType" WHERE "Name" =
    	CASE
        	WHEN lower(o.type) = 'task' THEN 'Task'
	        WHEN lower(o.type) = 'learning' THEN 'Learning'
    	    WHEN lower(o.type) = 'learningopportunity' THEN 'Learning'
	        WHEN lower(o.type) = 'impactopportunity' THEN 'Task'
    	    WHEN lower(o.type) = 'taskopportunity' THEN 'Task'
	    END
	) AS "TypeId",
  o.organisationid AS "OrganizationId",
  NULL::varchar(500) AS "Summary",
  CASE
      WHEN remove_double_spacing(o.instructions) = '..' THEN NULL
      ELSE remove_double_spacing(o.instructions)
  END AS "Instructions",
  ensure_valid_http_url(opportunityurl) AS "URL",
	CASE
    	WHEN o.zltoreward IS NULL THEN NULL
    	WHEN ABS(o.zltoreward) = 0 THEN NULL
    	ELSE CAST(ABS(o.zltoreward) AS numeric(8,2))
	END AS "ZltoReward",
	CASE
    	WHEN o.zltoreward IS NULL OR ABS(o.zltoreward) = 0 THEN NULL
    	WHEN o.zltorewardpool IS NULL OR ABS(o.zltorewardpool) = 0 THEN NULL
	    ELSE CAST(ABS(o.zltorewardpool) AS numeric(12,2))
	END AS "ZltoRewardPool",
	NULL::numeric(12,2) as "ZltoRewardCumulative", --set below (see 'My' Opportunities section)
	NULL::numeric(8,2) AS "YomaReward",
	NULL::numeric(12,2) AS "YomaRewardPool",
	NULL::numeric(12,2) AS "YomaRewardCumulative",
	true AS "VerificationEnabled",
	'Manual' as "VerificationMethod",
	(SELECT "Id" FROM "Opportunity"."OpportunityDifficulty" WHERE "Name" =
    	CASE
        	WHEN lower(o.difficulty) = 'beginner' THEN 'Beginner'
        	WHEN lower(o.difficulty) = 'advanced' THEN 'Advanced'
        	WHEN o.difficulty IS NULL OR lower(o.difficulty) = 'alllevels' THEN 'Any Level'
        	WHEN lower(o.difficulty) = 'intermediate' THEN 'Intermediate'
        	ELSE 'Any Level'
	    END
	) AS "DifficultyId",
	(SELECT "Id" FROM "Lookup"."TimeInterval" WHERE "Name" =
	    CASE
    	    WHEN lower(o.timeperiod) = 'week' THEN 'Week'
        	WHEN lower(o.timeperiod) = 'day' THEN 'Day'
	        WHEN lower(o.timeperiod) = 'hour' THEN 'Hour'
    	    WHEN o.timeperiod = '1' THEN 'Day'
	        WHEN lower(o.timeperiod) = 'month' THEN 'Month'
	        ELSE 'Day'
	    END
	) AS "CommitmentIntervalId",
	COALESCE(o.timevalue, 1)::int2 AS "CommitmentIntervalCount",
	CASE
    	WHEN o.participantlimit IS NULL THEN NULL
    	WHEN ABS(o.participantlimit) = 0 THEN NULL
    	ELSE ABS(o.participantlimit)
	END AS "ParticipantLimit",
	NULL::int4 as "ParticipantCount", --set below (see 'My' Opportunities section)
	(SELECT "Id" FROM "Opportunity"."OpportunityStatus" WHERE "Name" =
       CASE
           WHEN o.deletedat IS NOT NULL THEN 'Deleted'
           WHEN o.enddate IS NULL OR o.enddate > (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') THEN 'Active'
           WHEN o.enddate IS NOT NULL AND o.enddate <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') THEN 'Expired'
           ELSE 'Inactive'
       END
    ) AS "StatusId",
    NULL::varchar(500) AS "Keywords",
    start_of_day(o.startdate) AT TIME ZONE 'UTC' AS "DateStart",
    end_of_day(
        CASE
            WHEN o.enddate IS NULL OR (o.enddate AT TIME ZONE 'UTC')::date >= '3849-12-31' THEN NULL
            ELSE o.enddate
        END
    ) AT TIME ZONE 'UTC' AS "DateEnd",
    true AS "CredentialIssuanceEnabled",
    'Opportunity|Default' AS "SSISchemaName",
    o.createdat AT TIME ZONE 'UTC' as "DateCreated",
    (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'system@yoma.world') as "CreatedByUserId",
    GREATEST(
	    COALESCE(o.deletedat, '1900-01-01'::timestamp),
    	o.createdat
	) AT TIME ZONE 'UTC' AS "DateModified",
	(SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'system@yoma.world') as "ModifiedByUserId"
FROM dbo.opportunities o;

--Opportunity.OpportunityCategories
INSERT INTO "Opportunity"."OpportunityCategories" ("Id", "OpportunityId", "CategoryId", "DateCreated") VALUES
(gen_random_uuid(),'AF91257B-6EB9-4793-CF0C-08DBC5A48A21','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1B091188-0DD3-4035-D7B8-08DB682B7C2B','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'B4C8D437-EEB5-4A07-97CF-08DA8FC2EDC0','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'598D8D55-D98C-4525-F2F2-08D8C7BDFD81','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9D1DB8B1-494B-4FD8-7A33-08DA8FE896A7','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'7EC8180F-CF3B-49B5-A2BA-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'FC5D942E-B7A3-407C-D7B6-08DB682B7C2B','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3F94B868-B62E-4589-9DA4-08D9F79727F8','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'932136BA-1788-4205-7A0C-08DA8FE896A7','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'D6C9D710-D069-4D0F-A2C1-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C92170D6-2514-4B45-3D19-08D9F1FE3A2A','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'BF29FB2F-A530-4C05-A2B4-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'4E4062B6-492B-4447-3D18-08D9F1FE3A2A','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'586FFF5B-5442-42D7-9DA3-08D9F79727F8','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'2D9CA8AE-FCD7-4E4F-97D3-08DA8FC2EDC0','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'97B337BC-6B1D-42D6-0B76-08D8C7BE02E6','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'BE452720-D6F4-4BD8-D7B9-08DB682B7C2B','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'98B4DC3D-24A0-455D-981B-08DA8FC2EDC0','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C397A080-951B-4D0D-E66D-08DBC8AD52C9','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'4B4B6857-3717-4080-D7B4-08DB682B7C2B','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'009B49A8-7158-430B-5280-08DB7CB2B486','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'B717B9E6-E6CC-466F-7DFD-08D932873FDF','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'BD9BEFCF-A984-4888-7A40-08DA8FE896A7','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'D027B375-97B1-4251-F2F0-08D8C7BDFD81','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'8C0251FD-D2E7-4E71-97D2-08DA8FC2EDC0','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'0BD3FFB2-7CA1-484A-A2C4-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'810FAD85-E7BB-4235-CF08-08DBC5A48A21','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'AD0CAA44-CCF1-4260-9807-08DA8FC2EDC0','d0d322ab-d1d7-44b6-94e8-7b85246aa42e',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'61D499B0-16D9-4201-E667-08DBC8AD52C9','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1FF4C927-9D6F-4A31-A2BD-08DADE7FDA54','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C821CAA1-46D5-4810-CF05-08DBC5A48A21','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'0101290E-318D-48E3-3D15-08D9F1FE3A2A','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'6202EA4A-7081-466B-D7B5-08DB682B7C2B','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'7A4F5DC8-2317-4A8E-9819-08DA8FC2EDC0','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'38D2F4FF-05E2-48A3-0B77-08D8C7BE02E6','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3A2E679F-60E9-4EA0-AD7F-08DBDF7E0894','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'AE7B9E76-F5F1-4A95-9D9D-08D9F79727F8','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'0CBC3160-835B-4985-CF0A-08DBC5A48A21','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'8FD433BE-569F-429E-CF09-08DBC5A48A21','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'23B4A0EC-E4C8-4AF6-CF0B-08DBC5A48A21','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'716D3C36-F64F-4BFB-3D1A-08D9F1FE3A2A','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'00CF288B-CEE8-4D36-3D1B-08D9F1FE3A2A','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'2724359A-1E65-4CAA-9DA2-08D9F79727F8','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'17C6A7C0-FA14-4F84-3D17-08D9F1FE3A2A','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'673D8C42-CFD7-4AEE-EE15-08D824A211F9','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'4A0CDD6F-8383-4D11-F6F4-08D8708A1F5E','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'5115CDE2-591E-4C4A-9DA1-08D9F79727F8','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E195A582-965D-4EA9-9817-08DA8FC2EDC0','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'005A75A6-063C-4616-7A34-08DA8FE896A7','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'24CA82B4-DDDD-4F33-A2BC-08DADE7FDA54','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'918143DF-17DE-424E-A2B8-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'DD327DA1-CF7E-47D9-97F4-08D870869F51','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'84A0DBBA-4BA0-40C8-D7B7-08DB682B7C2B','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'11A02C39-DE48-4B9D-F2EF-08D8C7BDFD81','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'8C397772-FD76-4847-7DA0-08DC22469C38','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'F9AA8E79-41EA-45D9-9814-08DA8FC2EDC0','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'D839A9E3-5C16-41E6-114B-08DB8A0AB3A8','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E9309905-F8EE-4512-0B7D-08D8C7BE02E6','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'ABF9337A-6A25-4FA5-F2F8-08D8C7BDFD81','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'2A9212FA-217F-480D-0B7E-08D8C7BE02E6','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'44F8D4EA-1F52-4D0E-A2B5-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'A8BA8054-03B7-4824-A2C0-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'F2BD357B-A897-479F-A2BF-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'320E9B56-F12A-49F4-97D5-08DA8FC2EDC0','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'52E183BA-16EF-49CB-A2C3-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'431E64E5-0C58-4D68-0B73-08D8C7BE02E6','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'7BBCB755-5CEE-415C-A2B2-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1CD5A641-9564-4139-F2F1-08D8C7BDFD81','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'DB2F3F0A-99DE-4035-EE18-08D824A211F9','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'34CA56AA-DA9E-41A2-9D9E-08D9F79727F8','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'4B4B9A3A-F02F-4CB6-0B74-08D8C7BE02E6','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9F202869-CDCF-4220-7A42-08DA8FE896A7','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'0C8ADF46-33DD-4B93-2067-08DB89B6E407','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'91136644-00AC-4EEA-A2B6-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C34935BD-FB5D-4B73-A2B9-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C500AD58-575B-4965-F2F5-08D8C7BDFD81','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'75DBECD4-3879-4B2A-7A3A-08DA8FE896A7','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'96AEDAC1-0C6E-44B1-AD71-08DBDF7E0894','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'7C372FC9-B0AC-4C95-3C25-08DC39060F51','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'B16095FA-2F73-4BCD-9815-08DA8FC2EDC0','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'2FA6858E-E582-4C2B-D7BF-08DB682B7C2B','f36051c9-9057-4765-bc2f-9dee82ef60d6',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1C6F0A1F-6D73-4666-D7BE-08DB682B7C2B','f36051c9-9057-4765-bc2f-9dee82ef60d6',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'ABC2CAB5-E3D5-42AC-BE00-08DB682D0342','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'D3DE6992-FF8D-45BD-68F5-08DBB91AD955','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E9B035A5-27C1-4213-E0FB-08DBBB6E9E36','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'838D4515-4DD5-4399-7D9C-08DC22469C38','d0d322ab-d1d7-44b6-94e8-7b85246aa42e',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'14A7059D-C90A-43BD-EB04-08DB4017D565','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'6A28D8DE-1583-43DA-A2B7-08DADE7FDA54','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3365642E-7D0F-4FE2-B8C4-08DC343ADFF9','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'55C4C671-5F4F-465E-4572-08DB40188571','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'B32AE34A-1684-4513-A2BE-08DADE7FDA54','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'6C1C517D-46FF-408D-C1CA-08DB0E721846','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'FE423E75-82CC-4BC1-EF78-08DB3B8DA203','d0d322ab-d1d7-44b6-94e8-7b85246aa42e',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C6AACD8E-D781-4D5C-B091-08DB91BB6439','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'A1C450C0-8CAE-4622-BDFF-08DB682D0342','f36051c9-9057-4765-bc2f-9dee82ef60d6',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'AF38CCC1-56A0-4F09-B095-08DB91BB6439','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'814B82FF-FDA3-4BFD-C1C4-08DB0E721846','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'31AE18B5-7EC0-4575-9ED3-08DC27902A12','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'32C9AF14-1AF2-4C48-5E5E-08DB99C1114A','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'966929E3-FDE8-4309-C0A5-08DBB2ADAE9A','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9D9B21EC-286B-471C-BDF7-08DB682D0342','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'14705BB4-94F5-4605-BDFB-08DB682D0342','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'65C3D5D2-A8E3-4D06-BDF6-08DB682D0342','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'616C9936-9C17-4B17-D7BD-08DB682B7C2B','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3DA1777F-A7AD-43F7-378A-08DB7D546683','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'37FA6907-7DDB-453A-E668-08DBC8AD52C9','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'17954B65-8144-48F5-CF06-08DBC5A48A21','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E01DB30A-9291-434F-5E5D-08DB99C1114A','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1D1CFA8B-1512-4DED-9875-08DB16368103','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'13B5A503-A3BB-4D18-9874-08DB16368103','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'AB53EAEB-BCF6-4732-CF0E-08DBC5A48A21','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E6F83767-60A8-4D98-C1CC-08DB0E721846','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'75E2F10A-2371-4881-D7C2-08DB682B7C2B','f36051c9-9057-4765-bc2f-9dee82ef60d6',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'56F39611-04D4-4805-D7C4-08DB682B7C2B','f36051c9-9057-4765-bc2f-9dee82ef60d6',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'AEB90F20-DDA7-4044-D7C1-08DB682B7C2B','f36051c9-9057-4765-bc2f-9dee82ef60d6',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'10500F0B-DFBD-463B-E957-08DB55577FB5','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C214D4D1-6B9D-4671-B090-08DB91BB6439','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'177254EB-24D8-4A8D-827C-08DB91BDA5E7','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'99767EF3-03B1-4C6D-07E7-08DC15AF94A8','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'0ECBE1AD-0478-487F-1149-08DB8A0AB3A8','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'4B735941-6A08-4040-C0B4-08DB2B191E29','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'B1CB8C9A-04D8-4C24-A14B-08DB296C84D3','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9AEC01AA-B6F2-45D0-C0B3-08DB2B191E29','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'D6226F04-1C09-4667-9870-08DB16368103','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'AABB9449-3FD9-4654-9871-08DB16368103','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'124FFDC4-9FB2-4118-31F2-08DB1635DFAB','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'22A13F2B-E3E2-472C-C1C1-08DB0E721846','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1A670A89-12CC-4945-CF04-08DBC5A48A21','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'13317422-5739-43B9-C1C0-08DB0E721846','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'F76001A5-8317-447E-5820-08DBB35482BB','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E89BE95F-C7E9-4D69-E66F-08DBC8AD52C9','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E8EE082E-7EDE-4666-BDF9-08DB682D0342','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'63608A47-5DAA-446E-975A-08DC0C23470C','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'5C32A54E-1659-4D00-C4C4-08DB0AB59E11','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'66456811-9A69-4F3D-5E5C-08DB99C1114A','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'67B73255-1984-4575-214F-08DC3905609C','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'75D48EB6-0B7F-4CB3-3C23-08DC39060F51','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1D6B60F2-1F3C-43B5-3577-08DB863B71CF','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'921069C2-49F5-4C4E-3C22-08DC39060F51','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'4B746698-E997-474B-C4C3-08DB0AB59E11','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'10042FE8-67CA-435F-5858-08DC46EC4453','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'5CD83393-3B91-410A-C1C9-08DB0E721846','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3FEA0382-71AA-4167-B08E-08DB91BB6439','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'41325E62-D14E-413C-B094-08DB91BB6439','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9E09BDBA-6838-4091-D7BC-08DB682B7C2B','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'516416AD-0BD0-4C1A-C4C2-08DB0AB59E11','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C7E9A431-C94F-4096-C1CB-08DB0E721846','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'A9EFBFF3-A0B1-49B8-7D9F-08DC22469C38','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'CDF4D33E-7F96-43A2-8277-08DB91BDA5E7','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'F7F41FB9-4868-4385-3C20-08DC39060F51','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'CD0836A4-D1E1-46AB-A2B3-08DADE7FDA54','d0d322ab-d1d7-44b6-94e8-7b85246aa42e',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'55F81762-7034-4BF3-C963-08DBF25222E3','d0d322ab-d1d7-44b6-94e8-7b85246aa42e',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3E4BF9A2-F718-43B5-214E-08DC3905609C','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'F7552662-60C7-4D77-3C21-08DC39060F51','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'0F218EDF-0977-4E76-9ED1-08DC27902A12','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'FE5A1102-EF51-465D-C4BF-08DB0AB59E11','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'EC89502F-48BC-47A6-31F4-08DB1635DFAB','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'244287D4-5960-4462-9872-08DB16368103','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'03F74337-7F35-4C69-9873-08DB16368103','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C7A50166-52D5-421C-2063-08DB89B6E407','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'DC940A90-0937-413C-31F5-08DB1635DFAB','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'FA2811C6-3E11-4AF5-31F6-08DB1635DFAB','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'5BF9ED83-3162-41BD-BDFC-08DB682D0342','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3B2916DF-9D18-4388-BDF8-08DB682D0342','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'6567F38C-2712-4146-82D6-08DC44CAA30F','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C718F63C-818D-4F7B-82D8-08DC44CAA30F','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'663E3F30-043C-4221-D7BA-08DB682B7C2B','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'23C4C80F-6918-4C87-B093-08DB91BB6439','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'4C129077-4987-4E7D-8275-08DB91BDA5E7','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3D848CB8-B199-49E3-B092-08DB91BB6439','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'0A2B7A04-3193-4291-8274-08DB91BDA5E7','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'B54699BE-4E64-4E40-4573-08DB40188571','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'7957906D-E9BE-4063-A14C-08DB296C84D3','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'66DEB965-21D6-42E6-FEDC-08DC27907189','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'7039E5F3-8C10-4473-6EB5-08DC343C2A93','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'A66F644F-2855-4C13-6EB4-08DC343C2A93','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C4DDA0BC-0D49-4B37-F095-08DB8222269C','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1CBF4325-2D00-4149-827A-08DB91BDA5E7','d0d322ab-d1d7-44b6-94e8-7b85246aa42e',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'A018B49C-013A-4A08-C1C2-08DB0E721846','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'87E83588-94C1-4A22-581F-08DBB35482BB','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9353D7A6-B2DC-460F-D7C3-08DB682B7C2B','f36051c9-9057-4765-bc2f-9dee82ef60d6',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'575EA32A-2288-4592-CF03-08DBC5A48A21','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'83909C55-F31E-4B73-BDFD-08DB682D0342','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'D2222635-7FB0-42A2-FEDE-08DC27907189','d0d322ab-d1d7-44b6-94e8-7b85246aa42e',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3CB18510-AF4C-45C1-9ED0-08DC27902A12','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'B4AE3050-7B40-49C2-D7C0-08DB682B7C2B','f36051c9-9057-4765-bc2f-9dee82ef60d6',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'6C522FAE-2776-4E73-E664-08DBC8AD52C9','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'4E6648FC-9DA3-4CFC-BDFA-08DB682D0342','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'5BC9DEC3-2923-4211-9444-08DB3B939CD8','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9C791E28-50E5-4522-9445-08DB3B939CD8','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'B09D894E-A6D5-4567-82D5-08DC44CAA30F','d0d322ab-d1d7-44b6-94e8-7b85246aa42e',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'A54F9D76-EDBA-4B1C-BDFE-08DB682D0342','f36051c9-9057-4765-bc2f-9dee82ef60d6',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E0ED132A-64ED-4A0A-E670-08DBC8AD52C9','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'870916AB-F003-4FCD-C1C3-08DB0E721846','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'43A83DC5-CE33-4BFC-82D7-08DC44CAA30F','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'932136BA-1788-4205-7A0C-08DA8FE896A7','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'BE452720-D6F4-4BD8-D7B9-08DB682B7C2B','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'8C0251FD-D2E7-4E71-97D2-08DA8FC2EDC0','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'0101290E-318D-48E3-3D15-08D9F1FE3A2A','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3A2E679F-60E9-4EA0-AD7F-08DBDF7E0894','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'0CBC3160-835B-4985-CF0A-08DBC5A48A21','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'8FD433BE-569F-429E-CF09-08DBC5A48A21','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'11A02C39-DE48-4B9D-F2EF-08D8C7BDFD81','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C500AD58-575B-4965-F2F5-08D8C7BDFD81','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'7C372FC9-B0AC-4C95-3C25-08DC39060F51','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'2FA6858E-E582-4C2B-D7BF-08DB682B7C2B','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1C6F0A1F-6D73-4666-D7BE-08DB682B7C2B','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'838D4515-4DD5-4399-7D9C-08DC22469C38','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'14A7059D-C90A-43BD-EB04-08DB4017D565','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'B32AE34A-1684-4513-A2BE-08DADE7FDA54','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'6C1C517D-46FF-408D-C1CA-08DB0E721846','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'31AE18B5-7EC0-4575-9ED3-08DC27902A12','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'32C9AF14-1AF2-4C48-5E5E-08DB99C1114A','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'966929E3-FDE8-4309-C0A5-08DBB2ADAE9A','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9D9B21EC-286B-471C-BDF7-08DB682D0342','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9AEC01AA-B6F2-45D0-C0B3-08DB2B191E29','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'D6226F04-1C09-4667-9870-08DB16368103','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E89BE95F-C7E9-4D69-E66F-08DBC8AD52C9','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'E8EE082E-7EDE-4666-BDF9-08DB682D0342','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'67B73255-1984-4575-214F-08DC3905609C','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1D6B60F2-1F3C-43B5-3577-08DB863B71CF','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'921069C2-49F5-4C4E-3C22-08DC39060F51','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9E09BDBA-6838-4091-D7BC-08DB682B7C2B','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C718F63C-818D-4F7B-82D8-08DC44CAA30F','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'C4DDA0BC-0D49-4B37-F095-08DB8222269C','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'1CBF4325-2D00-4149-827A-08DB91BDA5E7','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'87E83588-94C1-4A22-581F-08DBB35482BB','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'9353D7A6-B2DC-460F-D7C3-08DB682B7C2B','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'83909C55-F31E-4B73-BDFD-08DB682D0342','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'D2222635-7FB0-42A2-FEDE-08DC27907189','2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'3CB18510-AF4C-45C1-9ED0-08DC27902A12','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'6C522FAE-2776-4E73-E664-08DBC8AD52C9','89f4ab46-0767-494f-a18c-3037f698133a',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'A54F9D76-EDBA-4B1C-BDFE-08DB682D0342','c76786fd-fca9-4633-85b3-11e53486d708',CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(gen_random_uuid(),'870916AB-F003-4FCD-C1C3-08DB0E721846','fa564c1c-591a-4a6d-8294-20165da8866b',CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

--Opportunity.OpportunityCountries
INSERT INTO "Opportunity"."OpportunityCountries" ("Id", "OpportunityId", "CountryId", "DateCreated")
SELECT DISTINCT ON (oo."Id", lc."Id")
    gen_random_uuid() AS "Id",
    oo."Id" AS "OpportunityId",
    lc."Id" AS "CountryId",
    oo."DateCreated" AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    "Opportunity"."Opportunity" oo
JOIN
    dbo.opportunitycountry ooc ON oo."Id" = ooc.opportunityid
JOIN
    "Lookup"."Country" lc ON lc."CodeAlpha2" = ooc.country
WHERE
    NOT EXISTS (
        SELECT 1
        FROM "Opportunity"."OpportunityCountries" existing
        WHERE existing."OpportunityId" = oo."Id"
        AND existing."CountryId" = lc."Id"
    );

-- Opportunity.OpportunityLanguages
INSERT INTO "Opportunity"."OpportunityLanguages" ("Id", "OpportunityId", "LanguageId", "DateCreated")
SELECT DISTINCT ON (oo."Id", ll."Id")
    gen_random_uuid() AS "Id",
    oo."Id" AS "OpportunityId",
    ll."Id" AS "LanguageId",
    oo."DateCreated" AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    "Opportunity"."Opportunity" oo
JOIN
    dbo.opportunitylanguages ool ON oo."Id" = ool.opportunityid
JOIN
    "Lookup"."Language" ll ON ll."CodeAlpha2" = ool.language
WHERE
    NOT EXISTS (
        SELECT 1
        FROM "Opportunity"."OpportunityLanguages" existing
        WHERE existing."OpportunityId" = oo."Id"
        AND existing."LanguageId" = ll."Id"
    );

--Opportunity.Skills
INSERT INTO "Opportunity"."OpportunitySkills" ("Id", "OpportunityId", "SkillId", "DateCreated")
SELECT DISTINCT ON (oo."Id", ls."Id")
    gen_random_uuid() AS "Id",
    oo."Id" AS "OpportunityId",
    ls."Id" AS "SkillId",
    oo."DateCreated" AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    "Opportunity"."Opportunity" oo
JOIN
    dbo.opportunityskills os ON oo."Id" = os.opportunityid
JOIN
    dbo.skills ds ON ds.id = os.skillid
JOIN
    "Lookup"."Skill" ls ON lower(ls."Name") = lower(ds."name")
ORDER BY oo."Id", ls."Id";

--Opportunity.OpportunityVerificationTypes
INSERT INTO "Opportunity"."OpportunityVerificationTypes" ("Id", "OpportunityId", "VerificationTypeId", "Description", "DateCreated", "DateModified")
SELECT
    gen_random_uuid() AS "Id",
    oo."Id" AS "OpportunityId",
    (SELECT "Id" FROM "Opportunity"."OpportunityVerificationType" WHERE "Name" = 'FileUpload') AS "VerificationTypeId",
    NULL::text AS "Description",
    oo."DateCreated" AT TIME ZONE 'UTC' AS "DateCreated",
    oo."DateCreated" AT TIME ZONE 'UTC' AS "DateModified"
FROM
    "Opportunity"."Opportunity" oo;
/***END: Opportunities***/

/***BEGIN: 'My' Opportunities***/
--Opptorunity.MyOpportunity (Saved: dbo.myopportunities entries)
INSERT INTO "Opportunity"."MyOpportunity" (
    "Id",
    "UserId",
    "OpportunityId",
    "ActionId",
    "VerificationStatusId",
    "CommentVerification",
    "DateStart",
    "DateEnd",
    "DateCompleted",
    "ZltoReward",
    "YomaReward",
    "DateCreated",
    "DateModified"
)
SELECT DISTINCT ON (U."Id", O."Id", A."Id")
    gen_random_uuid() AS "Id",
    U."Id" AS "UserId",
    O."Id" AS "OpportunityId",
    A."Id" AS "ActionId",
    NULL AS "VerificationStatusId",
    NULL AS "CommentVerification",
    NULL AS "DateStart",
    NULL AS "DateEnd",
    NULL AS "DateCompleted",
    NULL AS "ZltoReward",
    NULL AS "YomaReward",
    CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS "DateCreated",
    CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS "DateModified"
FROM
    dbo.myopportunities MO
JOIN
    "Entity"."User" U ON U."Id" = MO.userid
JOIN
    "Opportunity"."Opportunity" O ON O."Id" = MO.opportunityid
JOIN
    (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Saved') AS A ON true;

--Opptorunity.MyOpportunity (Verificaton: Pending [VerifiedAt=null] | Verificaton: Completed [VerifiedAt!=null] & Approved=true | Verificaton: Rejected [VerifiedAt!=null] & Approved=false)
-- Create temporary tables if they do not exist
CREATE TEMP TABLE TempOpportunityDetails (
    MyOpportunityId UUID,
    UserId UUID,
    OpportunityId UUID,
    FileId UUID,
    DateCreated TIMESTAMP
);

CREATE TEMP TABLE TempInsertedOpportunity (
    "Id" UUID,
    "UserId" UUID,
    "OpportunityId" UUID,
    "ActionId" UUID,
    "VerificationStatusId" UUID,
    "CommentVerification" TEXT,
    "DateStart" TIMESTAMP,
    "DateEnd" TIMESTAMP,
    "DateCompleted" TIMESTAMP,
    "ZltoReward" NUMERIC(8,2),
    "YomaReward" NUMERIC(8,2),
    "DateCreated" TIMESTAMP,
    "DateModified" TIMESTAMP,
    "FileId" UUID
);

WITH Inserted AS (
    INSERT INTO TempInsertedOpportunity (
        "Id",
        "UserId",
        "OpportunityId",
        "ActionId",
        "VerificationStatusId",
        "CommentVerification",
        "DateStart",
        "DateEnd",
        "DateCompleted",
        "ZltoReward",
        "YomaReward",
        "DateCreated",
        "DateModified",
        "FileId"
    )
    SELECT DISTINCT ON (U."Id", O."Id")
        gen_random_uuid() AS "Id",
        U."Id" AS "UserId",
        O."Id" AS "OpportunityId",
        (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification') AS "ActionId",
        CASE
            WHEN C.verifiedat IS NULL THEN (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Pending')
            WHEN C.verifiedat IS NOT NULL AND (C.approved IS NULL OR C.approved = FALSE) THEN (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Rejected')
            WHEN C.verifiedat IS NOT NULL AND C.approved = TRUE THEN (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed')
        END AS "VerificationStatusId",
        CASE
            WHEN C.verifiedat IS NOT NULL THEN remove_double_spacing(C.approvalmessage)
            ELSE NULL
        END AS "CommentVerification",
        start_of_day(C.startdate) AT TIME ZONE 'UTC' AS "DateStart",
        end_of_day(
            CASE
                WHEN C.enddate IS NULL AND (C.verifiedat IS NOT NULL AND C.approved = TRUE) THEN C.verifiedat
                WHEN (C.enddate AT TIME ZONE 'UTC')::date >= '3849-12-31' AND (C.verifiedat IS NOT NULL AND C.approved = TRUE) THEN C.verifiedat
                WHEN C.enddate IS NULL OR (C.enddate AT TIME ZONE 'UTC')::date >= '3849-12-31' THEN NULL
                ELSE C.enddate
            END
        ) AT TIME ZONE 'UTC' AS "DateEnd",
        C.verifiedat AT TIME ZONE 'UTC' AS "DateCompleted",
        CASE
            WHEN C.verifiedat IS NOT NULL AND C.approved = TRUE AND ABS(C.zltoreward) > 0 THEN CAST(ABS(C.zltoreward) AS numeric(8,2))
            ELSE NULL
        END AS "ZltoReward",
        NULL AS "YomaReward",
        C.createdat AT TIME ZONE 'UTC' AS "DateCreated",
        C.createdat AT TIME ZONE 'UTC' AS "DateModified",
        C.fileId AS "FileId"
    FROM
        dbo.credentials C
    JOIN
        "Entity"."User" U ON U."Id" = C.userid
    JOIN
        "Opportunity"."Opportunity" O ON O."Id" = C.opportunityid
    WHERE
        C.fileId IS NOT NULL
    ORDER BY
        U."Id",
        O."Id",
        C.createdat DESC
    RETURNING *
)
INSERT INTO TempOpportunityDetails (MyOpportunityId, UserId, OpportunityId, FileId, DateCreated)
SELECT "Id", "UserId", "OpportunityId", "FileId", "DateCreated" FROM Inserted;

-- Insert into "Opportunity"."MyOpportunity" from the Inserted CTE
INSERT INTO "Opportunity"."MyOpportunity" (
    "Id",
    "UserId",
    "OpportunityId",
    "ActionId",
    "VerificationStatusId",
    "CommentVerification",
    "DateStart",
    "DateEnd",
    "DateCompleted",
    "ZltoReward",
    "YomaReward",
    "DateCreated",
    "DateModified"
)
SELECT "Id", "UserId", "OpportunityId", "ActionId", "VerificationStatusId", "CommentVerification", "DateStart",
       "DateEnd", "DateCompleted", "ZltoReward", "YomaReward", "DateCreated", "DateModified"
FROM TempInsertedOpportunity;

--"Opportunity"."MyOpportunity" start and end date data fixes 'Pending' and 'Completed' verifications
WITH AdjustedStartDate AS (
    SELECT DISTINCT ON (mo."Id")
    	mo."Id" as my_opp_id,
        mo."OpportunityId" as opp_id,
        o."DateStart" AT TIME ZONE 'UTC' as opp_date_start,
        o."DateEnd" AT TIME ZONE 'UTC' as opp_date_end,
        mo."DateStart" AT TIME ZONE 'UTC' AS my_opp_original_date_start,
        -- Adjust the start date based on the following conditions:
		start_of_day(CASE
		    -- If "my opportunity" start date (mo."DateStart") is after the "opportunity" end date (o."DateEnd"),
		    -- this indicates the "my opportunity" starts after the "opportunity" has ended.
		    -- In this case, use the "opportunity" start date (o."DateStart") to align the start dates.
		    WHEN mo."DateStart" IS NOT NULL AND o."DateEnd" IS NOT NULL AND mo."DateStart" > o."DateEnd" THEN o."DateStart"

		    -- If "my opportunity" start date (mo."DateStart") is before the "opportunity" start date (o."DateStart"),
		    -- indicating the "my opportunity" starts before the "opportunity" itself,
		    -- use the "opportunity" start date to ensure "my opportunity" does not start earlier.
		    WHEN mo."DateStart" IS NOT NULL AND mo."DateStart" < o."DateStart" THEN o."DateStart"

		    -- If none of the above conditions are met, or if "my opportunity" start date (mo."DateStart") is NULL,
		    -- use COALESCE to select the first non-null value between "my opportunity" start date and "opportunity" start date.
		    -- This ensures that a start date is always set, preferring "my opportunity" start date if it's available,
		    -- otherwise falling back to the "opportunity" start date.
		    ELSE COALESCE(mo."DateStart", o."DateStart")
		END) AT TIME ZONE 'UTC' AS my_opp_adjusted_date_start,
        mo."DateEnd" AT TIME ZONE 'UTC' AS my_opp_original_date_end,
        ti."Name" AS time_interval_name,
        o."CommitmentIntervalCount" as commitment_interval_count
    FROM "Opportunity"."MyOpportunity" mo
    INNER JOIN "Opportunity"."Opportunity" o ON mo."OpportunityId" = o."Id"
    INNER JOIN "Lookup"."TimeInterval" ti ON o."CommitmentIntervalId" = ti."Id"
    WHERE mo."ActionId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification')
    AND mo."VerificationStatusId" IN (
        SELECT "Id"
        FROM "Opportunity"."MyOpportunityVerificationStatus"
        WHERE "Name" IN ('Pending', 'Completed')
    )
), AdjustedEndDates AS (
    SELECT
        *,
        end_of_day(CASE
            -- Condition 1: Start date was adjusted
            WHEN my_opp_adjusted_date_start != my_opp_original_date_start THEN
                my_opp_adjusted_date_start +
                CASE
                    WHEN time_interval_name = 'Hour' AND commitment_interval_count / 24.0 < 1 THEN INTERVAL '1 day'
                    WHEN time_interval_name = 'Hour' THEN INTERVAL '1 day' * CEIL(commitment_interval_count / 24.0)
                    WHEN time_interval_name = 'Day' THEN INTERVAL '1 day' * commitment_interval_count
                    WHEN time_interval_name = 'Week' THEN INTERVAL '7 days' * commitment_interval_count
                    WHEN time_interval_name = 'Month' THEN INTERVAL '30 days' * commitment_interval_count
                END
            -- Condition 2: Original end date is null or less than the adjusted start date
            WHEN my_opp_original_date_end IS NULL OR my_opp_original_date_end < my_opp_adjusted_date_start THEN
                my_opp_adjusted_date_start +
                CASE
                    WHEN time_interval_name = 'Hour' AND commitment_interval_count / 24.0 < 1 THEN INTERVAL '1 day'
                    WHEN time_interval_name = 'Hour' THEN INTERVAL '1 day' * CEIL(commitment_interval_count / 24.0)
                    WHEN time_interval_name = 'Day' THEN INTERVAL '1 day' * commitment_interval_count
                    WHEN time_interval_name = 'Week' THEN INTERVAL '7 days' * commitment_interval_count
                    WHEN time_interval_name = 'Month' THEN INTERVAL '30 days' * commitment_interval_count
                END
            -- Condition 3: Duration from adjusted start to original end exceeds commitment
            WHEN my_opp_original_date_end - my_opp_adjusted_date_start >
                CASE
                    WHEN time_interval_name = 'Hour' AND commitment_interval_count / 24.0 < 1 THEN INTERVAL '1 day'
                    WHEN time_interval_name = 'Hour' THEN INTERVAL '1 day' * CEIL(commitment_interval_count / 24.0)
                    WHEN time_interval_name = 'Day' THEN INTERVAL '1 day' * commitment_interval_count
                    WHEN time_interval_name = 'Week' THEN INTERVAL '7 days' * commitment_interval_count
                    WHEN time_interval_name = 'Month' THEN INTERVAL '30 days' * commitment_interval_count
                END
            THEN my_opp_adjusted_date_start +
                CASE
                    WHEN time_interval_name = 'Hour' AND commitment_interval_count / 24.0 < 1 THEN INTERVAL '1 day'
                    WHEN time_interval_name = 'Hour' THEN INTERVAL '1 day' * CEIL(commitment_interval_count / 24.0)
                    WHEN time_interval_name = 'Day' THEN INTERVAL '1 day' * commitment_interval_count
                    WHEN time_interval_name = 'Week' THEN INTERVAL '7 days' * commitment_interval_count
                    WHEN time_interval_name = 'Month' THEN INTERVAL '30 days' * commitment_interval_count
                END
            ELSE
                -- Default to using the original end date if none of the above conditions are met
                my_opp_original_date_end
        END) AT TIME ZONE 'UTC' AS my_opp_adjusted_date_end
    FROM AdjustedStartDate
)
UPDATE "Opportunity"."MyOpportunity" mo
SET
    "DateStart" = ad.my_opp_adjusted_date_start,
    "DateEnd" = ad.my_opp_adjusted_date_end
FROM AdjustedEndDates ad
WHERE mo."Id" = ad.my_opp_id;

--Object.Blob (credential certificates / 'my' opportinity verifcation file upload)
INSERT INTO "Object"."Blob" (
    "Id",
    "StorageType",
    "FileType",
    "Key",
    "ContentType",
    "OriginalFileName",
    "ParentId",
    "DateCreated"
)
SELECT DISTINCT
    f.id AS "Id",
    'Private' AS "StorageType",
    'Certificates' AS "FileType",
    f.s3objectid AS "Key",
    f.contenttype AS "ContentType",
    split_part(f.s3objectid, '/', array_length(string_to_array(f.s3objectid, '/'), 1)) AS "OriginalFileName",
    NULL::uuid AS "ParentId",
    f.createdat AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    TempOpportunityDetails TOD
JOIN
    dbo.files f ON TOD.FileId = f.id;

--Opportunity.MyOpportunityVerifications (type FileUpload <> dbo.credentials.fileid)
INSERT INTO "Opportunity"."MyOpportunityVerifications" (
    "Id",
    "MyOpportunityId",
    "VerificationTypeId",
    "GeometryProperties",
    "FileId",
    "DateCreated"
)
SELECT
    gen_random_uuid() AS "Id",
    TOD.MyOpportunityId AS "MyOpportunityId",
    (SELECT "Id" FROM "Opportunity"."OpportunityVerificationType" WHERE "Name" = 'FileUpload') AS "VerificationTypeId",
    NULL AS "GeometryProperties",
    TOD.FileId AS "FileId",
    TOD.DateCreated AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    TempOpportunityDetails TOD;

DROP TABLE TempOpportunityDetails;
DROP TABLE TempInsertedOpportunity;

--SSI.CredentialIssuance (for 'My' Opportunities with verification completed)
INSERT INTO "SSI"."CredentialIssuance" (
    "Id",
    "SchemaTypeId",
    "ArtifactType",
    "SchemaName",
    "SchemaVersion",
    "StatusId",
    "UserId",
    "OrganizationId",
    "MyOpportunityId",
    "CredentialId",
    "ErrorReason",
    "RetryCount",
    "DateCreated",
    "DateModified"
)
SELECT
    gen_random_uuid() AS "Id",
    (SELECT "Id" FROM "SSI"."SchemaType" WHERE "Name" = 'Opportunity') AS "SchemaTypeId",
    'JWS' AS "ArtifactType",
    O."SSISchemaName" AS "SchemaName",
    '1.0' AS "SchemaVersion",
    (SELECT "Id" FROM "SSI"."CredentialIssuanceStatus" WHERE "Name" = 'Pending') AS "StatusId",
    NULL AS "UserId",
    NULL AS "OrganizationId",
    MO."Id" AS "MyOpportunityId",
    NULL AS "CredentialId",
    NULL AS "ErrorReason",
    NULL AS "RetryCount",
    MO."DateModified" AT TIME ZONE 'UTC' AS "DateCreated",
    MO."DateModified" AT TIME ZONE 'UTC' AS "DateModified"
FROM
    "Opportunity"."MyOpportunity" MO
INNER JOIN
    "Opportunity"."Opportunity" O ON MO."OpportunityId" = O."Id"
WHERE
    MO."ActionId" = (
        SELECT "Id"
        FROM "Opportunity"."MyOpportunityAction"
        WHERE "Name" = 'Verification'
    )
    AND MO."VerificationStatusId" = (
        SELECT "Id"
        FROM "Opportunity"."MyOpportunityVerificationStatus"
        WHERE "Name" = 'Completed'
    )
    AND O."CredentialIssuanceEnabled" = true;

--Reward.Transaction (for 'My' Opportunities with verification completed: for users with no zlto wallet added as pending;
--for user with zlto wallet added as processed [only on production])
INSERT INTO "Reward"."Transaction" (
    "Id",
    "UserId",
    "StatusId",
    "SourceEntityType",
    "MyOpportunityId",
    "Amount",
    "TransactionId",
    "ErrorReason",
    "RetryCount",
    "DateCreated",
    "DateModified"
)
SELECT
    gen_random_uuid() AS "Id",
    MO."UserId" AS "UserId",
    COALESCE(
        (
            SELECT TS."Id"
            FROM "Reward"."TransactionStatus" TS
            WHERE TS."Name" = 'Processed'
            AND EXISTS (
                SELECT 1
                FROM "Reward"."WalletCreation" WC
                WHERE WC."UserId" = MO."UserId"
                AND WC."StatusId" = (
                    SELECT WCS."Id"
                    FROM "Reward"."WalletCreationStatus" WCS
                    WHERE WCS."Name" = 'Created'
                )
            )
        ),
        (
            SELECT TS."Id"
            FROM "Reward"."TransactionStatus" TS
            WHERE TS."Name" = 'Pending'
        )
    ) AS "StatusId",
    'MyOpportunity' AS "SourceEntityType",
    MO."Id" AS "MyOpportunityId",
    MO."ZltoReward" AS "Amount",
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM "Reward"."WalletCreation" WC
            WHERE WC."UserId" = MO."UserId"
            AND WC."StatusId" = (
                SELECT WCS."Id"
                FROM "Reward"."WalletCreationStatus" WCS
                WHERE WCS."Name" = 'Created'
            )
        ) THEN 'Migrated from v2 to v3'
        ELSE NULL
    END AS "TransactionId",
    NULL AS "ErrorReason",
    NULL AS "RetryCount",
    MO."DateModified" AT TIME ZONE 'UTC' AS "DateCreated",
    MO."DateModified" AT TIME ZONE 'UTC' AS "DateModified"
FROM
    "Opportunity"."MyOpportunity" MO
WHERE
    MO."ActionId" = (
        SELECT "Id"
        FROM "Opportunity"."MyOpportunityAction"
        WHERE "Name" = 'Verification'
    )
    AND MO."VerificationStatusId" = (
        SELECT "Id"
        FROM "Opportunity"."MyOpportunityVerificationStatus"
        WHERE "Name" = 'Completed'
    )
    AND MO."ZltoReward" > 0;

--Reward.WalletCreation (Update balance and set to sum of processed Reward.Transactions for users with wallets [only on production])
UPDATE "Reward"."WalletCreation" WC
SET "Balance" = COALESCE(WC."Balance", 0) + T.SumZltoReward
FROM (
    SELECT
        RT."UserId",
        SUM(RT."Amount") AS SumZltoReward
    FROM
        "Reward"."Transaction" RT
    INNER JOIN
        "Reward"."TransactionStatus" RTS ON RT."StatusId" = RTS."Id" AND RTS."Name" = 'Processed'
    GROUP BY RT."UserId"
) T
WHERE WC."UserId" = T."UserId"
AND WC."StatusId" = (
    SELECT WCS."Id"
    FROM "Reward"."WalletCreationStatus" WCS
    WHERE WCS."Name" = 'Created'
);

--Entity.UserSkills (populated for 'My' Opportunities with verification completed)
INSERT INTO "Entity"."UserSkills" (
    "Id",
    "UserId",
    "SkillId",
    "DateCreated"
)
SELECT DISTINCT ON (MO."UserId", OS."SkillId")
    gen_random_uuid(),
    MO."UserId",
    OS."SkillId",
    MAX(MO."DateModified") OVER (PARTITION BY MO."UserId", OS."SkillId") AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    "Opportunity"."MyOpportunity" MO
INNER JOIN
    "Opportunity"."OpportunitySkills" OS ON MO."OpportunityId" = OS."OpportunityId"
WHERE
    MO."ActionId" = (
        SELECT "Id"
        FROM "Opportunity"."MyOpportunityAction"
        WHERE "Name" = 'Verification'
    )
    AND MO."VerificationStatusId" = (
        SELECT "Id"
        FROM "Opportunity"."MyOpportunityVerificationStatus"
        WHERE "Name" = 'Completed'
    );

--Entity.UserSkillOrganizations (populated for 'My' Opportunities with verification completed)
INSERT INTO "Entity"."UserSkillOrganizations" (
    "Id",
    "UserSkillId",
    "OrganizationId",
    "DateCreated"
)
SELECT
    gen_random_uuid() AS "Id",
    US."Id" AS "UserSkillId",
    OP."OrganizationId" AS "OrganizationId",
    US."DateCreated" AT TIME ZONE 'UTC' AS "DateCreated"
FROM
    "Entity"."UserSkills" US
INNER JOIN "Opportunity"."OpportunitySkills" OS ON US."SkillId" = OS."SkillId"
INNER JOIN "Opportunity"."Opportunity" OP ON OP."Id" = OS."OpportunityId"
INNER JOIN "Opportunity"."MyOpportunity" MO ON MO."OpportunityId" = OS."OpportunityId"
    AND MO."ActionId" = (
        SELECT "Id"
        FROM "Opportunity"."MyOpportunityAction"
        WHERE "Name" = 'Verification'
    )
    AND MO."VerificationStatusId" = (
        SELECT "Id"
        FROM "Opportunity"."MyOpportunityVerificationStatus"
        WHERE "Name" = 'Completed'
    )
GROUP BY
    US."Id",
    OP."OrganizationId",
    US."DateCreated";

--Opportunity.Opportunity (update running totals based on completed opportunities)
WITH AggregatedData AS (
	SELECT
	    o."Id" AS "OpportunityId",
	    COUNT(mo."Id") AS "Count",
	    SUM(mo."ZltoReward") AS "ZltoRewardTotal"
	FROM "Opportunity"."Opportunity" o
	LEFT JOIN "Opportunity"."MyOpportunity" mo ON o."Id" = mo."OpportunityId"
	WHERE mo."ActionId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification')
	    AND mo."VerificationStatusId" = (SELECT "Id" FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed')
	GROUP BY o."Id"
)
UPDATE "Opportunity"."Opportunity" o
SET
    "ParticipantCount" = a."Count",
    "ZltoRewardCumulative" = a."ZltoRewardTotal"
FROM AggregatedData a
WHERE o."Id" = a."OpportunityId";
/***END: 'My' Opportunities***/

--drop temporary functions
DROP FUNCTION remove_double_spacing(text);
DROP FUNCTION title_case(text, boolean);
DROP FUNCTION construct_display_name(text, text);
DROP FUNCTION format_phone_number(phone text);
DROP FUNCTION start_of_day(timestamp with time zone);
DROP FUNCTION end_of_day(timestamp with time zone);
DROP FUNCTION ensure_valid_http_url(text);
DROP FUNCTION ensure_valid_email(text);
