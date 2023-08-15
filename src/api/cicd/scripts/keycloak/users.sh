#!/bin/sh

# KC_BASE_URL="http://keycloak:8080"
# KC_REALM="yoma"

# KC_CLIENT_ID="admin-cli"
# KC_ADMIN_USER="xxxxx@example.com"
# KC_ADMIN_PASSWORD="xxxxx"
KC_JWT=$(curl -s -X POST "${KC_BASE_URL}/realms/${KC_ADMIN_REALM}/protocol/openid-connect/token" \
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
echo "Creating Test Admin User"
curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users" \
  -H 'Content-Type: application/json' \
  -H "Authorization: bearer ${KC_JWT}" \
  -d '{
        "username": "testadminuser@gmail.com",
        "enabled": true,
        "emailVerified": true,
        "firstName": "Test Admin",
        "lastName": "User",
        "email": "testadminuser@gmail.com",
        "attributes": {
          "dateOfBirth": ["01/01/2001"],
          "phoneNumber": ["202-918-2132"],
          "countryOfOrigin": ["Afghanistan"],
          "countryOfResidence": ["Afghanistan"],
          "gender": ["Male"]
        },
        "credentials": [{
          "type": "password",
          "value": "P@ssword1",
          "temporary": false
        }],
        "realmRoles": ["default-roles-yoma", "Admin", "User"]
      }'
# Get Test Admin User ID
adminUserID=$(curl -s -X GET "${KC_BASE_URL}/admin/realms/${KC_REALM}/users?exact=true&username=testadminuser@gmail.com" \
  -H 'Content-Type: application/json' \
  -H "Authorization: bearer ${KC_JWT}" | jq .[].id -r)
# Assign Test Admin User to required roles
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
# Test Org Admin User
echo "Creating Test Org Admin User"
curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users" \
  -H 'Content-Type: application/json' \
  -H "Authorization: bearer ${KC_JWT}" \
  -d '{
        "username": "testorgadminuser@gmail.com",
        "enabled": true,
        "emailVerified": true,
        "firstName": "Test Organization Admin",
        "lastName": "User",
        "email": "testorgadminuser@gmail.com",
        "attributes": {
          "dateOfBirth": ["01/01/2001"],
          "phoneNumber": ["202-918-2132"],
          "countryOfOrigin": ["Afghanistan"],
          "countryOfResidence": ["Afghanistan"],
          "gender": ["Male"]
        },
        "credentials": [{
          "type": "password",
          "value": "P@ssword1",
          "temporary": false
        }],
        "realmRoles": ["default-roles-yoma", "OrganisationAdmin", "User"]
      }'
# Get Test Organisation Admin User ID
orgAdminUserID=$(curl -s -X GET "${KC_BASE_URL}/admin/realms/${KC_REALM}/users?exact=true&username=testorgadminuser@gmail.com" \
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
# Test User
echo "Creating Test User"
curl -s -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/users" \
  -H 'Content-Type: application/json' \
  -H "Authorization: bearer ${KC_JWT}" \
  -d '{
        "username": "testuser@gmail.com",
        "enabled": true,
        "emailVerified": true,
        "firstName": "Test",
        "lastName": "User",
        "email": "testuser@gmail.com",
        "attributes": {
          "dateOfBirth": ["01/01/2001"],
          "phoneNumber": ["202-918-2132"],
          "countryOfOrigin": ["Afghanistan"],
          "countryOfResidence": ["Afghanistan"],
          "gender": ["Male"]
        },
        "credentials": [{
          "type": "password",
          "value": "P@ssword1",
          "temporary": false
        }],
        "realmRoles": ["default-roles-yoma", "User"]
      }'
# Get Test User ID
userID=$(curl -s -X GET "${KC_BASE_URL}/admin/realms/${KC_REALM}/users?exact=true&username=testuser@gmail.com" \
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
