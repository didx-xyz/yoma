--!!!THIS SCRIPT IS DESIGNED TO BE APPLIED TO AN EMPTY EF MIGRATED DATABASE WITH NO POST.SQL SCRIPTS EXECUTED!!!--

--ensure 'Yoma (Youth Agency Marketplace)' organization exist and is active
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
RETURNS date AS $$
BEGIN
    -- Check if the input is NULL and return NULL if so
    IF input_timestamp IS NULL THEN
        RETURN NULL;
    ELSE
        -- Return the date part only, which corresponds to the start of the day
        RETURN input_timestamp::date;
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
    f.createdat AS "DateCreated"
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
    start_of_day(u.dateofbirth) AS "DateOfBirth",
    u.lastlogin AS "DateLastLogin",
    u.externalid AS "ExternalId",
    FALSE AS "YoIDOnboarded",
     NULL::timestamptz AS "DateYoIDOnboarded",
    u.createdat AS "DateCreated",
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
    NULL::numeric(12, 2) AS "Balance", -- Awarded inline in v2, so no pending transactions can exist; new concept in v3
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

--TODO: Entity.UserSkills (needs to be populated for complete 'my' opportunities)

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
    f.createdat AS "DateCreated"
FROM 
    dbo.files f
INNER JOIN 
    dbo.organisations o ON f.id = o.logoid;
   
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
    o.id,
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
      END AS "DateStatusModified",
      o.logoid as "LogoId",
      o.createdat as "DateCreated",
      (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'system@yoma.world') as "CreatedByUserId",
      GREATEST(
		    COALESCE(o.approvedat, '1900-01-01'::timestamp),
		    COALESCE(o.deletedat, '1900-01-01'::timestamp),
		    COALESCE(o.updatedat, '1900-01-01'::timestamp),
		    o.createdat
		) AS "DateModified",
	  (SELECT "Id" FROM "Entity"."User" WHERE "Email" = 'system@yoma.world') as "ModifiedByUserId"
FROM 
	dbo.organisations o;

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
        WHERE "Name" = 'Education' --default to Education for all existing organizations
    ) AS "ProviderTypeId",
    o.createdat AS "DateCreated"
FROM
    dbo.organisations o;

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
    u.createdat AS "DateCreated"
FROM
    dbo.users u
WHERE
    u.organisationid IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM "Entity"."Organization" o
        WHERE o."Id" = u.organisationid
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
    (SELECT id FROM dbo.users WHERE email = 'system@yoma.world') AS "UserId",
    CURRENT_TIMESTAMP
FROM
    "Entity"."Organization" o
WHERE
    NOT EXISTS (
        SELECT 1
        FROM "Entity"."OrganizationUsers" ou
        WHERE ou."OrganizationId" = o."Id"
    );
   
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
    f.createdat AS "DateCreated"
FROM 
    dbo.files f
INNER JOIN 
    dbo.organisations o ON f.id = o.companyregistrationid;
   
--Enity.OrganizationDocuments (registration documents)
INSERT INTO "Entity"."OrganizationDocuments" (
    "Id", 
    "OrganizationId", 
    "FileId", 
    "Type", 
    "DateCreated"
)
SELECT
    gen_random_uuid(), -- Generates a unique ID for each document
    o."Id" AS "OrganizationId",
    o.companyregistrationid AS "FileId",
    'Registration' AS "Type",
    o.createdat AS "DateCreated"
FROM 
    dbo.organisations o
WHERE 
    EXISTS (
        SELECT 1
        FROM "Object"."Blob" b
        WHERE b."Id" = o.companyregistrationid
    );
   
--TODO: Entity.UserSkillOrganizations (populaterd from completed 'my' opportunities)
   
/***END: User & Organizations***/
   
/***BEGIN: Opportunities***/
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
    NULL:varchar(500) AS "Summary",
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
	NULL::numberic(12,2) as "ZltoRewardCumulative", --set below (running totals)
	NULL::numberic(8,2) AS "YomaReward",
	NULL::numberic(12,2) AS "YomaRewardPool",
	NULL::numberic(12,2) AS "YomaRewardCumulative",
	true AS "VerificationEnabled",
	'Manual' as "VerificationMethod",
	(SELECT "Id" FROM "Opportunity"."OpportunityDifficulty" WHERE "Name" = 
    	CASE
        	WHEN lower(o.difficulty) = 'beginner' THEN 'Beginner'
        	WHEN lower(o.difficulty) = 'advanced' THEN 'Advanced'
        	WHEN o.difficulty IS NULL OR lower(o.difficulty) = 'alllevels' THEN 'Any Level'
        	WHEN lower(o.difficulty) = 'intermediate' THEN 'Intermediate'
	    END
	) AS "DifficultyId",
	(SELECT "Id" FROM "Lookup"."TimeInterval" WHERE "Name" = 
	    CASE
    	    WHEN lower(o.commitmentInterval) = 'week' THEN 'Week'
        	WHEN lower(o.commitmentInterval) = 'day' THEN 'Day'
	        WHEN lower(o.commitmentInterval) = 'hour' THEN 'Hour'
    	    WHEN o.commitmentInterval = '1' THEN 'Day'
	        WHEN lower(o.commitmentInterval) = 'month' THEN 'Month'
	    END
	) AS "CommitmentIntervalId",
	COALESCE(o.timevalue, 1)::int2 AS "CommitmentIntervalCount",
	CASE
    	WHEN o.participantlimit IS NOT NULL THEN ABS(o.participantlimit)
	    ELSE NULL
	END AS "ParticipantLimit",
	NULL::int4 as "ParticipantCount", --set below (running totals)
	


FROM dbo.opportunities o

SELECT id, title, "type", description, createdat, organisationid, createdbyadmin, zltoreward, deletedat, zltorewardpool, enddate, startdate, published, 
difficulty, instructions, timeperiod, timevalue, templateid, opportunityurl, participantcount, participantlimit, noenddate, sharing
FROM dbo.opportunities;

--Opportunity.Opportunity (update running totals based on completed opportunities)
SELECT
    O."Id" AS "OpportunityId",
    COUNT(MO."Id") AS "Count",
    SUM(MO."ZltoReward") AS "ZltoRewardTotal",
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
FROM AggregatedData A
WHERE O."Id" = A."OpportunityId";


/***END: Opportunities***/
   
--drop temporary functions
DROP FUNCTION remove_double_spacing(text);
DROP FUNCTION title_case(text, boolean);
DROP FUNCTION construct_display_name(text, text);
DROP FUNCTION format_phone_number(phone text);
DROP FUNCTION start_of_day(timestamp with time zone);
DROP FUNCTION ensure_valid_http_url(text);
DROP FUNCTION ensure_valid_email(text);

