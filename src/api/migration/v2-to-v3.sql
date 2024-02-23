--!!!THIS SCRIPT IS DESIGNED TO BE APPLIED TO AN EMPTY EF MIGRATED DATABASE, POST V2 MIGRATION AND FILES CLEANUP, WITH NO POST.SQL SCRIPT EXECUTED!!!--

SET TIMEZONE='UTC';

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
    NULL::numeric(12, 2) AS "Balance", -- Updated after populating Reward.Trnasaction for VerifiedAt credentials and users not yet migrated to new zlto wallet (see 'My' Opportunities section)
    NULL::text AS "ErrorReason", 
    0 AS "RetryCount", -- Assuming retry count should be initialized to 0 rather than NULL
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateCreated",
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "DateModified"
FROM
    dbo.users u
WHERE
    u.migratedtonewzlto = true
    AND u.zltowalletid IS NOT NULL
    AND u.email IS NOT NULL;

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
    LOWER(ensure_valid_http_url(url)) as "WebsiteURL",
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
    remove_double_spacing(o.instructions) AS "Instructions",
    LOWER(ensure_valid_http_url(opportunityurl)) AS "URL",
    CASE 
    	WHEN o.zltoreward IS NOT NULL THEN CAST(ABS(o.zltoreward) AS numeric(8,2))
	    ELSE NULL
	END AS "ZltoReward",
	CASE 
    	WHEN o.zltoreward IS NULL THEN NULL
	    WHEN o.zltorewardpool IS NOT NULL THEN CAST(ABS(o.zltorewardpool) AS numeric(12,2))
    	ELSE NULL
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
    	WHEN o.participantlimit IS NOT NULL THEN ABS(o.participantlimit)
	    ELSE NULL
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
    end_of_day(o.enddate) AT TIME ZONE 'UTC' AS "DateEnd",
    true AS "CredentialIssuanceEnabled",
    'Opportunity|Default' AS "SSISchemaName",
    o.createdat AT TIME ZONE 'UTC' as "DateCreated",
    (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'system@yoma.world') as "CreatedByUserId",
    GREATEST(
	    COALESCE(o.deletedat, '1900-01-01'::timestamp),
    	o.createdat
	) AT TIME ZONE 'UTC' AS "DateModified",
	(SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'system@yoma.world') as "ModifiedByUserId"
FROM dbo.opportunities o

--Opportunity.OpportunityCategories - No mappings; New concept in V3; To be updated by operations

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
    )

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
    )

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
    (SELECT "Id" FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Saved') AS A ON TRUE
    
--Opptorunity.MyOpportunity (Verificaton: Pending [VerifiedAt=null] | Verificaton: Completed [VerifiedAt!=null] & Approved=true | Verificaton: Rejected [VerifiedAt!=null] & Approved=false)
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
    end_of_day(C.enddate) AT TIME ZONE 'UTC' AS "DateEnd",
    CASE 
        WHEN C.verifiedat IS NOT NULL THEN C.verifiedat 
        ELSE NULL 
    END AS "DateCompleted",
    CASE 
        WHEN C.verifiedat IS NOT NULL AND C.approved = TRUE THEN 
            CASE 
                WHEN ABS(C.zltoreward) > 0 THEN CAST(ABS(C.zltoreward) AS numeric(8,2))
                ELSE NULL
            END
        ELSE NULL
    END AS "ZltoReward",
    NULL AS "YomaReward",
    C.createdat AT TIME ZONE 'UTC' AS "DateCreated",
    C.createdat AT TIME ZONE 'UTC' AS "DateModified"
FROM
    dbo.credentials C
JOIN
    "Entity"."User" U ON U."Id" = C.userid
JOIN
    "Opportunity"."Opportunity" O ON O."Id" = C.opportunityid
--WHERE --not needed; left as reference
--    C.verifiedat IS NULL
--    OR (C.verifiedat IS NOT NULL AND (C.approved IS NULL OR C.approved = FALSE))
--    OR (C.verifiedat IS NOT NULL AND C.approved = TRUE)
ORDER BY 
    U."Id", 
    O."Id", 
    C.createdat DESC;
   
--TODO: Opportunity.MyOpportunityVerifications (type FileUpload <> dbo.credentials.fileid)
   
--TODO: SSI.CredentialIssuance (for 'My' Opportunities with verification completed)
   
--TODO: Reward.Transaction (for 'My' Opportunities with verification completed: for users with no zlto wallet added as pending; for user with zlto wallet added as processed)
   
--TODO: Reward.WalletCreation (Update balance and set to sum of pending Reward.Transactions)

--TODO: Entity.UserSkills (populated for 'My' Opportunities with verification completed)
   
--TODO: Entity.UserSkillOrganizations (populated for 'My' Opportunities with verification completed)
   
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