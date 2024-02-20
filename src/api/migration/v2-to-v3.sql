--!!!THIS SCRIPT IS DESIGNED TO BE APPLIED TO AN EMPTY EF MIGRATED DATABASE WITH NO POST.SQL SCRIPTS EXECUTED!!!--

--temporary function creation
CREATE OR REPLACE FUNCTION camel_case(str text)
RETURNS text AS $$
DECLARE
    parts text[];
    result text := '';
    part_index int := 0;
BEGIN
    -- Check for null or effectively empty strings after trimming
    IF str IS NULL OR trim(str) = '' THEN
        RETURN 'none';
    END IF;
    
    -- Split the string into an array of words after trimming and lowercasing
    parts := regexp_split_to_array(lower(trim(str)), '\s+');
    
    -- Iterate through each part to build the camelCase result
    FOREACH str IN ARRAY parts LOOP
        part_index := part_index + 1;
        -- For the first word, keep it lowercase; capitalize the first letter of subsequent words
        IF part_index = 1 THEN
            result := str;
        ELSE
            result := result || upper(substring(str from 1 for 1)) || substring(str from 2);
        END IF;
    END LOOP;
    
    -- Return the camelCased or 'none' result
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION construct_display_name(firstname text, lastname text)
RETURNS text AS $$
BEGIN
    -- Clean firstname and lastname using the camel_case function
    firstname := camel_case(firstname);
    lastname := camel_case(lastname);

    -- Check conditions to decide what to return
    IF firstname = 'none' AND lastname = 'none' THEN
        -- Both are 'none', return a single 'none'
        RETURN 'none';
    ELSIF firstname = 'none' THEN
        -- Only lastname is available, return it
        RETURN lastname;
    ELSIF lastname = 'none' THEN
        -- Only firstname is available, return it
        RETURN firstname;
    ELSE
        -- Both names are present, concatenate with a space
        RETURN firstname || ' ' || lastname;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION format_phone_number(phone text)
RETURNS text AS $$
BEGIN
    -- Check if the phone number is null or empty
    IF phone IS NULL OR trim(phone) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Check if the phone number matches the regex pattern
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

/***User***/
--Object.Blob (user photos)
INSERT INTO "Object"."Blob" (
    "Id", "StorageType", "FileType", "Key", "ContentType", "OriginalFileName", "ParentId", "DateCreated"
)
SELECT DISTINCT
    f.id AS "Id", 
    'Public' AS "StorageType", 
    'Photos' AS "FileType", 
    f.s3objectid AS "Key", 
    'application/octet-stream' AS "ContentType", 
    'Unknown' AS "OriginalFileName", 
    NULL::uuid AS "ParentId", 
    f.createdat AS "DateCreated"
FROM 
    dbo.files f
INNER JOIN 
    dbo.users u ON f.id = u.photoid;

--Entity.User
INSERT INTO "Entity"."User" (
    "Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "PhoneNumber", "CountryId", 
    "EducationId", "PhotoId", "GenderId", "DateOfBirth", "DateLastLogin", "ExternalId", "YoIDOnboarded", 
    "DateYoIDOnboarded", "DateCreated", "DateModified"
)
SELECT
    u.id,
    u.email,
    u.emailconfirmed,
    camel_case(u.firstname) AS "FirstName",
    camel_case(u.lastname) AS "Surname",
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
    dbo.users u;

--Reward.WalletCreation (users that were migrated to new zlto wallet)
INSERT INTO "Reward"."WalletCreation" (
    "Id", "StatusId", "UserId", "WalletId", "Balance", "ErrorReason", "RetryCount", "DateCreated", "DateModified"
)
SELECT
    gen_random_uuid(),
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
    AND u.zltowalletid IS NOT NULL;

--temporary function cleanup
DROP FUNCTION camel_case(text);
DROP FUNCTION construct_display_name(text, text);
DROP FUNCTION format_phone_number(phone text);
DROP FUNCTION start_of_day(timestamp with time zone);