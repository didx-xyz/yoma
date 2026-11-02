#!/bin/sh
set -eu

# Local/Dev fixtures for a freshly reset realm. Keep IDs in sync with
# src/api/cicd/scripts/postgressql-init/post.sql. Application logic must not use them.
# Partial import preserves supplied IDs; POST /users generates new IDs in Keycloak 26.8.1.
# Requires a provisioning account with manage-realm, not the runtime API account.
umask 077
work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT
printf '[]' > "$work_dir/users.json"

add_user() {
  user_id=$1
  username_variable=$2
  password_variable=$3
  first_name=$4
  last_name=$5
  roles=$6
  attributes=$7

  # Read credentials inside jq; never print them or put them in jq arguments.
  jq --arg id "$user_id" --arg username_variable "$username_variable" \
    --arg password_variable "$password_variable" --arg first_name "$first_name" \
    --arg last_name "$last_name" --arg realm "$KC_REALM" \
    --argjson roles "$roles" --argjson attributes "$attributes" '
    env[$username_variable] as $username |
    if ($username // "") == "" then .
    elif (env[$password_variable] // "") == "" then error("Configured fixture user requires a password")
    else . + [{
      id: $id, username: $username, email: $username, enabled: true, emailVerified: true,
      firstName: $first_name, lastName: $last_name, attributes: $attributes,
      credentials: [{type: "password", value: env[$password_variable], temporary: false}],
      realmRoles: (["default-roles-" + $realm] + $roles)
    }] end' "$work_dir/users.json" > "$work_dir/next-users.json"
  mv "$work_dir/next-users.json" "$work_dir/users.json"
}

profile_attributes='{"dateOfBirth":["01/01/2001"],"country":["Afghanistan"],"gender":["Male"],"education":["Tertiary (Qualification not specified)"],"terms_and_conditions":["Yes"]}'
test_user_attributes=$(printf '%s' "$profile_attributes" | jq '. + {phoneNumber: ["+27821234567"], phoneNumberVerified: ["true"]}')

add_user 'bed06c20-e8ce-45d8-b15c-26958c7c2721' TEST_USER TEST_USER_PASSWORD \
  'Test' 'User' '["User"]' "$test_user_attributes"
add_user '5461f741-ef04-4875-8307-c896175d94d0' ADMIN_USER ADMIN_USER_PASSWORD \
  'Test Admin' 'User' '["Admin","User"]' "$profile_attributes"
add_user '2a7f48c8-7dfe-41b6-9172-df47cc791303' ORG_ADMIN_USER ORG_ADMIN_USER_PASSWORD \
  'Test Organization Admin' 'User' '["OrganisationAdmin","User"]' "$profile_attributes"
add_user '419cde78-352d-4362-bacc-71b327ec984c' YOMA_SYSTEM_USER YOMA_SYSTEM_USER_PASSWORD \
  'Yoma' 'System' '["OrganisationAdmin","User"]' '{}'

user_count=$(jq 'length' "$work_dir/users.json")
if [ "$user_count" -eq 0 ]; then
  echo 'keycloak-users: No test users configured.'
  exit 0
fi

# Keep form data private and correctly encode passwords containing special characters.
jq -jn '"grant_type=password&client_id=" + (env.KC_CLIENT_ID | @uri) +
  "&username=" + (env.KC_ADMIN_USER | @uri) + "&password=" + (env.KC_ADMIN_PASSWORD | @uri)' \
  > "$work_dir/token-form"
curl --fail --silent --show-error \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-binary "@$work_dir/token-form" --output "$work_dir/token.json" \
  "${KC_BASE_URL}/realms/${KC_ADMIN_REALM:-master}/protocol/openid-connect/token"
token=$(jq -er '.access_token | select(type == "string" and length > 0)' "$work_dir/token.json")
printf 'Authorization: Bearer %s\n' "$token" > "$work_dir/auth-header"
unset token

# Full-reset fixtures only. Fail on conflicts; never overwrite existing identities.
jq '{ifResourceExists: "FAIL", users: .}' "$work_dir/users.json" > "$work_dir/import.json"
echo "keycloak-users: Importing $user_count test users with fixed IDs."
if ! curl --fail --silent --show-error \
  --header "@$work_dir/auth-header" --header 'Content-Type: application/json' \
  --data-binary "@$work_dir/import.json" --output "$work_dir/import-result.json" \
  "${KC_BASE_URL}/admin/realms/${KC_REALM}/partialImport"; then
  echo 'keycloak-users: Import failed. Requires a reset realm and a provisioning account with manage-realm; response body omitted.' >&2
  exit 1
fi
jq -e --argjson count "$user_count" '.added == $count' "$work_dir/import-result.json" > /dev/null

# Verify the exact identity seeded by post.sql, not merely a successful HTTP response.
jq -r '.[].id' "$work_dir/users.json" > "$work_dir/ids"
while IFS= read -r user_id; do
  curl --fail --silent --show-error --header "@$work_dir/auth-header" \
    --output "$work_dir/user.json" "${KC_BASE_URL}/admin/realms/${KC_REALM}/users/${user_id}"
  jq -e --arg id "$user_id" --slurpfile expected "$work_dir/users.json" '
    . as $actual | $expected[0][] | select(.id == $id) |
    .id == $actual.id and .username == $actual.username' "$work_dir/user.json" > /dev/null
done < "$work_dir/ids"
echo 'keycloak-users: Test users imported and fixed IDs verified.'
