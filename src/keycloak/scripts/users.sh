#!/bin/sh

# KC_BASE_URL="http://keycloak:8080"
# KC_REALM="yoma"

# KC_CLIENT_ID="admin-cli"
# KC_ADMIN_USER="xxxxx@example.com"
# KC_ADMIN_PASSWORD="xxxxx"
KC_JWT=$(curl -s -X POST "${KC_BASE_URL}/realms/${KC_ADMIN_REALM:-master}/protocol/openid-connect/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password' \
  -d "client_id=${KC_CLIENT_ID}" \
  -d "username=${KC_ADMIN_USER}" \
  -d "password=${KC_ADMIN_PASSWORD}" | jq .access_token -r)

# Get Realm roles
roleIDs=$(curl -s -X GET "${KC_BASE_URL}/admin/realms/${KC_REALM}/roles" \
  -H 'Content-Type: application/json' \
  -H "Authorization: bearer ${KC_JWT}" | jq -r '
  map(select(.name == "Admin" or .name == "User" or .name == "OrganisationAdmin")) |
  {
    admin: .[] | select(.name == "Admin") | .id,
    orgAdmin: .[] | select(.name == "OrganisationAdmin") | .id,
    user: .[] | select(.name == "User") | .id
  }')

# Test Admin User
if [ ! -z "${ADMIN_USER}" ]; then
  echo "Creating Test Admin User: ${ADMIN_USER}"
  curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" \
    -d '{
          "id": "'"55BA2D33-EC40-4EFE-B09F-190E9CEF49EB"'",
          "username": "'"${ADMIN_USER}"'",
          "enabled": true,
          "emailVerified": true,
          "firstName": "Test Admin",
          "lastName": "User",
          "email": "'"${ADMIN_USER}"'",
          "attributes": {
            "dateOfBirth": ["01/01/2001"],
            "country": ["Afghanistan"],
            "gender": ["Male"]
          },
          "credentials": [{
            "type": "password",
            "value": "'"${ADMIN_USER_PASSWORD}"'",
            "temporary": false
          }],
          "realmRoles": ["default-roles-yoma", "Admin", "User"]
        }'
  # Get Test Admin User ID
  echo "Geting Test Admin User: ${ADMIN_USER}"
  adminUserID=$(curl -s -X GET "${KC_BASE_URL}/admin/realms/${KC_REALM}/users?exact=true&username=${ADMIN_USER}" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" | jq .[].id -r)
  # Assign Test Admin User to required roles
  echo "Assigning Test Admin User: ${ADMIN_USER}"
  curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users/${adminUserID}/role-mappings/realm" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" \
    -d "[
          {
            \"id\": \"$(echo ${roleIDs} | jq .admin -r)\",
            \"name\": \"Admin\"
          },
          {
            \"id\": \"$(echo ${roleIDs} | jq .user -r)\",
            \"name\": \"User\"
          }
        ]"
fi

# Test Org Admin User
if [ ! -z "${ORG_ADMIN_USER}" ]; then
  echo "Creating Test Org Admin User"
  curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" \
    -d '{
          "id": "'"398CBF5A-FB5C-49E8-96F4-B8D3D718F1A2"'",
          "username": "'"${ORG_ADMIN_USER}"'",
          "enabled": true,
          "emailVerified": true,
          "firstName": "Test Organization Admin",
          "lastName": "User",
          "email": "'"${ORG_ADMIN_USER}"'",
          "attributes": {
            "dateOfBirth": ["01/01/2001"],
            "country": ["Afghanistan"],
            "gender": ["Male"]
          },
          "credentials": [{
            "type": "password",
            "value": "'"${ORG_ADMIN_USER_PASSWORD}"'",
            "temporary": false
          }],
          "realmRoles": ["default-roles-yoma", "OrganisationAdmin", "User"]
        }'
  # Get Test Organisation Admin User ID
  orgAdminUserID=$(curl -s -X GET "${KC_BASE_URL}/admin/realms/${KC_REALM}/users?exact=true&username=${ORG_ADMIN_USER}" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" | jq .[].id -r)
  # Assign Test Organisation Admin User to required roles
  curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users/${orgAdminUserID}/role-mappings/realm" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" \
    -d "[
          {
            \"id\": \"$(echo ${roleIDs} | jq .orgAdmin -r)\",
            \"name\": \"OrganisationAdmin\"
          },
          {
            \"id\": \"$(echo ${roleIDs} | jq .user -r)\",
            \"name\": \"User\"
          }
        ]"
fi

# Yoma System User
if [ ! -z "${YOMA_SYSTEM_USER}" ]; then
  echo "Creating Yoma System User"
  curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" \
    -d '{
          "id": "'"160CE61E-E275-48AD-93B7-5FF4A7704525"'",
          "username": "'"${YOMA_SYSTEM_USER}"'",
          "enabled": true,
          "emailVerified": true,
          "firstName": "Yoma",
          "lastName": "System",
          "email": "'"${YOMA_SYSTEM_USER}"'",
          "attributes": {
            "dateOfBirth": ["01/01/2001"],
            "country": ["Afghanistan"],
            "gender": ["Male"]
          },
          "credentials": [{
            "type": "password",
            "value": "'"${YOMA_SYSTEM_USER_PASSWORD}"'",
            "temporary": false
          }],
          "realmRoles": ["default-roles-yoma", "OrganisationAdmin", "User"]
        }'
  # Get Yoma System User ID
  yomaSystemUserId=$(curl -s -X GET "${KC_BASE_URL}/admin/realms/${KC_REALM}/users?exact=true&username=${YOMA_SYSTEM_USER}" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" | jq .[].id -r)
  # Assign Yoma System User to required roles
  curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users/${yomaSystemUserId}/role-mappings/realm" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" \
    -d "[
          {
            \"id\": \"$(echo ${roleIDs} | jq .orgAdmin -r)\",
            \"name\": \"OrganisationAdmin\"
          },
          {
            \"id\": \"$(echo ${roleIDs} | jq .user -r)\",
            \"name\": \"User\"
          }
        ]"
fi

# Test User
if [ ! -z "${TEST_USER}" ]; then
  echo "Creating Test User"
  curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" \
    -d '{
          "id": "'"B75A7A05-9F7D-4E68-9325-EF3EF269D690"'",
          "username": "'"${TEST_USER}"'",
          "enabled": true,
          "emailVerified": true,
          "firstName": "Test",
          "lastName": "User",
          "email": "'"${TEST_USER}"'",
          "attributes": {
            "dateOfBirth": ["01/01/2001"],
            "country": ["Afghanistan"],
            "gender": ["Male"]
          },
          "credentials": [{
            "type": "password",
            "value": "'"${TEST_USER_PASSWORD}"'",
            "temporary": false
          }],
          "realmRoles": ["default-roles-yoma", "User"]
        }'
  # Get Test User ID
  userID=$(curl -s -X GET "${KC_BASE_URL}/admin/realms/${KC_REALM}/users?exact=true&username=${TEST_USER}" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" | jq .[].id -r)
  # Assign Test User to required roles
  curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users/${userID}/role-mappings/realm" \
    -H 'Content-Type: application/json' \
    -H "Authorization: bearer ${KC_JWT}" \
    -d "[
          {
            \"id\": \"$(echo ${roleIDs} | jq .user -r)\",
            \"name\": \"User\"
          }
        ]"
fi
