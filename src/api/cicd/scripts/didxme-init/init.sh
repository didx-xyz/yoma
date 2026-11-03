#!/bin/sh
# Local Compose bootstrap only. Mono is an independently managed prerequisite.
# Uses hub APIs and applies fixed local client secrets through Keycloak admin APIs.
# Never starts/resets mono or changes Yoma's realm. Not for deployed environments.
set -eu
umask 077

log() { printf '%s\n' "didxme-init: $*"; }
fail() { log "ERROR: $*"; exit 1; }

[ "${YOMA_ENVIRONMENT:-}" = Local ] || fail 'This initializer is restricted to Local.'
# Match the API environment list before installing tools, reading settings or contacting mono.
# The same Compose value overrides AppSettings.SSIEnabledEnvironments in the API container.
ssi_environments=$(printf '%s' "${YOMA_SSI_ENABLED_ENVIRONMENTS:-Local, Development, Staging, Production}" | tr '[:upper:]' '[:lower:]')
ssi_local=false
previous_ifs=$IFS
IFS=,
set -f
for environment in $ssi_environments; do
  environment=$(printf '%s' "$environment" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  case "$environment" in
    local) ssi_local=true ;;
    none|development|staging|production|'') ;;
    *) fail 'YOMA_SSI_ENABLED_ENVIRONMENTS contains an unsupported environment.' ;;
  esac
done
set +f
IFS=$previous_ifs
if [ "$ssi_local" = false ]; then
  log 'WARNING: SSI is disabled locally; skipping readiness and provisioning. SSI jobs and endpoints are unavailable.'
  exit 0
fi

command -v jq >/dev/null 2>&1 || /sbin/apk add --no-cache jq
settings=${LOCAL_SETTINGS_FILE:-/settings/appsettings.Local.json}
[ -f "$settings" ] && [ -w "$settings" ] || fail 'Mount the existing ignored appsettings.Local.json read/write.'
[ -n "${YOMA_ASSERTION_CLIENT_SECRET:-}" ] || fail 'The local Yoma assertion-client secret is required.'
[ -n "${YOMA_ISSUER_CLIENT_SECRET:-}" ] || fail 'The fixed local issuer-client secret is required.'
[ -n "${YOMA_HOLDER_CLIENT_SECRET:-}" ] || fail 'The fixed local holder-client secret is required.'
wait_seconds=${MONO_READY_TIMEOUT_SECONDS:-120}
case "$wait_seconds" in ''|*[!0-9]*) fail 'Readiness timeout must be a positive integer.' ;; esac
[ "$wait_seconds" -gt 0 ] && [ "$wait_seconds" -le 300 ] || fail 'Readiness timeout must be between 1 and 300 seconds.'

kc=http://host.docker.internal:18080/iam
hub=http://host.docker.internal:3400/api
yoma=http://keycloak:8080
jwks=http://host.docker.internal:8080/realms/yoma/protocol/openid-connect/certs
audience=https://didx.127.0.0.1.nip.io/iam/realms/consumers
work=$(mktemp -d /tmp/yoma-didxme-init.XXXXXX)
stage=preflight
cleanup() {
  result=$?
  if [ "$result" -ne 0 ]; then log "Failed during $stage. API startup is blocked; credentials and response bodies were not logged."; fi
  rm -f "$work"/*
  rmdir "$work"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
# Keep parser/network diagnostics private: they may include remote responses.
exec 2>"$work/errors"
cp "$settings" "$work/original.json"
jq -e 'type == "object" and (.DidxMe | type == "object")' "$work/original.json" >/dev/null || fail 'Local settings must contain a DidxMe object.'

# No redirects, verbose curl, credentials in process arguments, or response-body logging.
request() {
  method=$1; url=$2; token_file=${3:-}; payload=${4:-}; content_type=${5:-application/json}
  : >"$work/headers"
  if [ -n "$token_file" ]; then printf 'Authorization: Bearer %s\n' "$(cat "$token_file")" >"$work/headers"; fi
  printf 'Content-Type: %s\n' "$content_type" >>"$work/headers"
  set -- --silent --connect-timeout 3 --max-time 45 --request "$method" --header "@$work/headers" --output "$work/response.json" --write-out '%{http_code}'
  if [ -n "$payload" ]; then set -- "$@" --data-binary "@$payload"; fi
  status=$(curl "$@" "$url") || fail "Network request failed during $stage. Check local services and retry."
  case "$status" in 2??|404|409) ;; *) fail "HTTP $status during $stage. Check local provisioning/configuration; no settings were updated." ;; esac
}
success() { case "$status" in 2??) ;; *) fail "Unexpected HTTP $status during $stage; existing resources were not overwritten." ;; esac; }
assert_json() { jq -e "$1" "$work/response.json" >/dev/null || fail "Unexpected configuration during $stage. Review the existing resource before retrying."; }
token() {
  realm=$1; client_id=$2; secret_file=$3; destination=$4
  jq -jn --arg client "$client_id" --rawfile secret "$secret_file" '
    {grant_type:"client_credentials",client_id:$client,client_secret:($secret|rtrimstr("\n"))}
    | to_entries | map((.key|@uri)+"="+(.value|@uri)) | join("&")' >"$work/form"
  request POST "$kc/realms/$realm/protocol/openid-connect/token" '' "$work/form" application/x-www-form-urlencoded
  success
  assert_json '(.access_token | type == "string" and length > 0) and .token_type == "Bearer"'
  jq -r .access_token "$work/response.json" >"$destination"
}

# Hub creation generates secrets. Reconcile only our two local clients to Compose defaults,
# including after a mono reset. Read back the applied value; never invoke random secret rotation.
apply_local_client_secret() {
  local_realm=$1; local_client=$2; local_record=$3; local_token=$4; local_secret_env=$5
  jq -e '.id | type == "string" and test("^[A-Za-z0-9-]+$")' "$local_record" >/dev/null || fail 'Invalid local client identifier.'
  local_id=$(jq -r .id "$local_record")
  local_url="$kc/admin/realms/$local_realm/clients/$local_id"
  request GET "$local_url" "$local_token"
  success
  jq -e --arg client "$local_client" '.clientId == $client and .publicClient == false' "$work/response.json" >/dev/null || fail 'Unexpected local client; refusing to set its secret.'
  request GET "$local_url/client-secret" "$local_token"
  success
  if ! jq -e --arg name "$local_secret_env" '.value == env[$name]' "$work/response.json" >/dev/null; then
    jq -n --arg name "$local_secret_env" '{secret:env[$name]}' >"$work/payload"
    request PUT "$local_url" "$local_token" "$work/payload"
    success
    request GET "$local_url/client-secret" "$local_token"
    success
  fi
  jq -e --arg name "$local_secret_env" '.value == env[$name]' "$work/response.json" >/dev/null || fail 'Fixed local client secret verification failed.'
  jq --slurpfile secret "$work/response.json" '.clientSecret = $secret[0].value' "$local_record" >"$work/client-updated.json"
  cp "$work/client-updated.json" "$local_record"
}

log 'Checking independently started mono (maximum readiness wait: '"$wait_seconds"' seconds).'
deadline=$(($(date +%s) + wait_seconds))
while :; do
  unavailable=''
  for endpoint in "$kc/realms/consumers/.well-known/openid-configuration" \
    http://host.docker.internal:3400/health http://host.docker.internal:3302/health \
    http://host.docker.internal:3300/health http://host.docker.internal:3303/health; do
    remaining=$((deadline - $(date +%s)))
    if [ "$remaining" -le 0 ]; then unavailable=$endpoint; break; fi
    [ "$remaining" -le 5 ] || remaining=5
    health=$(curl --silent --connect-timeout 2 --max-time "$remaining" --output /dev/null --write-out '%{http_code}' "$endpoint") || health=000
    if [ "$health" != 200 ]; then unavailable=$endpoint; break; fi
  done
  [ -n "$unavailable" ] || break
  [ "$(date +%s)" -lt "$deadline" ] || fail "Mono is not ready at $unavailable. Start mono separately, finish its Paradym setup, then rerun didxme-init. Yoma will not start mono."
  sleep 1
done
log 'Mono is ready. Validating Yoma discovery and the consumers issuer.'
request GET "$kc/realms/consumers/.well-known/openid-configuration"
success
assert_json '.issuer == "https://didx.127.0.0.1.nip.io/iam/realms/consumers"'
request GET "$yoma/realms/yoma/.well-known/openid-configuration"
success
assert_json '.issuer == "http://keycloak:8080/realms/yoma" and .jwks_uri == "http://keycloak:8080/realms/yoma/protocol/openid-connect/certs"'
request GET "$jwks"
success
assert_json '(.keys | type == "array" and length > 0)'

# These are mono's checked-in local service-client defaults, not deployed credentials.
printf '%s' secret >"$work/local-service-secret"
token product-hub product-hub-management "$work/local-service-secret" "$work/hub-token"
token consumers hub-management-api "$work/local-service-secret" "$work/consumer-token"

stage='Yoma tenant'
request GET "$hub/tenants/alias/yoma" "$work/hub-token"
if [ "$status" = 404 ]; then
  users="$kc/admin/realms/product-hub/users"
  request GET "$users?username=yoma-local-operator%40example.invalid&exact=true" "$work/hub-token"
  success
  assert_json 'type == "array" and length <= 1'
  if [ "$(jq length "$work/response.json")" = 0 ]; then
    printf '%s' '{"username":"yoma-local-operator@example.invalid","email":"yoma-local-operator@example.invalid","firstName":"Yoma","lastName":"Local Operator","enabled":true,"emailVerified":true,"requiredActions":[]}' >"$work/payload"
    request POST "$users" "$work/hub-token" "$work/payload"
    # A concurrent initializer may have created this exact local operator.
    case "$status" in 201|204|409) ;; *) success ;; esac
    request GET "$users?username=yoma-local-operator%40example.invalid&exact=true" "$work/hub-token"
    success
  fi
  assert_json 'length == 1 and (.[0].id | type == "string" and length > 0)'
  jq '{tenantAlias:"yoma",tenantName:"Yoma",userId:.[0].id,domains:[]}' "$work/response.json" >"$work/payload"
  request POST "$hub/tenants" "$work/hub-token" "$work/payload"
  case "$status" in 2??|409) ;; *) success ;; esac
  request GET "$hub/tenants/alias/yoma" "$work/hub-token"
fi
success
assert_json '.tenantAlias == "yoma" and .tenantName == "Yoma" and (.owner | type == "string" and length > 0)'
cp "$work/response.json" "$work/tenant.json"
log 'Yoma tenant created or verified.'

stage='holder federation'
request GET "$hub/federated-lite-clients?tenantAlias=yoma" "$work/hub-token"
success
assert_json '(.liteClients | type == "array" and length <= 1)'
if [ "$(jq '.liteClients|length' "$work/response.json")" = 0 ]; then
  jq -n --arg jwks "$jwks" '{tenantAlias:"yoma",issuer:"http://keycloak:8080/realms/yoma",jwksUrl:$jwks}' >"$work/payload"
  request POST "$hub/federated-lite-clients" "$work/hub-token" "$work/payload"
  case "$status" in 2??|409) ;; *) success ;; esac
  request GET "$hub/federated-lite-clients?tenantAlias=yoma" "$work/hub-token"
  success
fi
assert_json '(.liteClients|length) == 1 and .liteClients[0].clientId == "yoma-federated-lite" and .liteClients[0].idpAlias == "yoma-idp" and (.liteClients[0].clientSecret|type == "string" and length > 0)'
jq '.liteClients[0]' "$work/response.json" >"$work/holder.json"
holder_id=$(jq -r .id "$work/holder.json")
request GET "$kc/admin/realms/consumers/identity-provider/instances/yoma-idp" "$work/consumer-token"
success
assert_json '.enabled == true and .providerId == "jwt-authorization-grant" and .config.issuer == "http://keycloak:8080/realms/yoma" and .config.jwksUrl == "http://host.docker.internal:8080/realms/yoma/protocol/openid-connect/certs" and .config.useJwksUrl == "true" and .config.jwtAuthorizationGrantEnabled == "true"'
request GET "$kc/admin/realms/consumers/clients/$holder_id" "$work/consumer-token"
success
assert_json '.clientId == "yoma-federated-lite" and .enabled == true and .publicClient == false and .standardFlowEnabled == false and .directAccessGrantsEnabled == false and .serviceAccountsEnabled == false and .attributes["oauth2.jwt.authorization.grant.enabled"] == "true" and .attributes["oauth2.jwt.authorization.grant.idp"] == "yoma-idp" and (["basic","profile","email"] - .defaultClientScopes | length == 0)'
assert_json 'any(.protocolMappers[]; .protocolMapper == "oidc-hardcoded-claim-mapper" and .config["claim.name"] == "tenantAlias" and .config["claim.value"] == "yoma" and .config["access.token.claim"] == "true") and any(.protocolMappers[]; .protocolMapper == "oidc-audience-mapper" and .config["included.custom.audience"] == "me-wallet-api" and .config["access.token.claim"] == "true")'
log 'Holder client, Yoma trust, tenant claim and wallet audience verified.'
apply_local_client_secret consumers yoma-federated-lite "$work/holder.json" "$work/consumer-token" YOMA_HOLDER_CLIENT_SECRET

stage='issuer client and project'
request GET "$hub/clients/yoma-me-creds" "$work/hub-token"
if [ "$status" = 404 ]; then
  printf '%s' '{"tenantAlias":"yoma","service":"me-creds"}' >"$work/payload"
  request POST "$hub/clients" "$work/hub-token" "$work/payload"
  case "$status" in 2??|409) ;; *) success ;; esac
  request GET "$hub/clients/yoma-me-creds" "$work/hub-token"
fi
success
assert_json '.clientId == "yoma-me-creds" and .tenantAlias == "yoma"'
cp "$work/response.json" "$work/issuer.json"
apply_local_client_secret product-hub yoma-me-creds "$work/issuer.json" "$work/hub-token" YOMA_ISSUER_CLIENT_SECRET
jq -r .clientSecret "$work/issuer.json" >"$work/issuer-secret"
token product-hub yoma-me-creds "$work/issuer-secret" "$work/issuer-token"
jq -R 'split(".")[1] | gsub("-";"+") | gsub("_";"/") | @base64d | fromjson' "$work/issuer-token" >"$work/response.json"
assert_json '.tenantAlias == "yoma" and ([.aud] | flatten | index("me-creds-api") != null)'
# Hub implements create-or-get on project conflict and deduplicates service registration.
# The HTTP DTO requires userId even though registration resolves tenancy from the caller.
jq '{tenantAlias:"yoma",userId:.owner,serviceName:"me-creds",issuerDisplay:{displayName:"Yoma"}}' "$work/tenant.json" >"$work/payload"
request POST "$hub/service-registrations" "$work/hub-token" "$work/payload"
success
assert_json '.tenantAlias == "yoma" and .serviceName == "me-creds" and (.meCredsProjectId | type == "string" and length > 0)'
log 'Issuer client and project created or verified; existing credentials were reused.'

stage='ignored Local settings'
# Preserve every other platform's configuration. Host URLs stay in Local settings; Compose
# supplies container-reachable URL overrides to the API. Secrets never enter tracked files.
jq --slurpfile holder "$work/holder.json" --slurpfile issuer "$work/issuer.json" --arg audience "$audience" '
  .DidxMe += {
    TenantAlias:"yoma",CredentialsBaseUri:"http://localhost:3302/api",WalletBaseUri:"http://localhost:3300/api",
    OnboardingBaseUri:"http://localhost:3303/api",KeycloakBaseUri:"http://localhost:18080/iam",
    Issuer:{Realm:"product-hub",ClientId:"yoma-me-creds",ClientSecret:$issuer[0].clientSecret},
    Holder:{Realm:"consumers",ClientId:"yoma-federated-lite",ClientSecret:$holder[0].clientSecret,AssertionAudience:$audience},
    TokenExchange:{Realm:"yoma",KeycloakBaseUri:"http://localhost:8080",ClientId:"yoma-didxme-assertion",ClientSecret:env.YOMA_ASSERTION_CLIENT_SECRET}
  }' "$work/original.json" >"$work/settings.json"
jq -e --slurpfile before "$work/original.json" 'del(.DidxMe) == ($before[0] | del(.DidxMe))' "$work/settings.json" >/dev/null || fail 'Unrelated settings changed; refusing to write.'
cmp -s "$settings" "$work/original.json" || fail 'Local settings changed concurrently; rerun init after finishing edits.'
# Keep the bind-mounted file inode so an already-created API mount sees the update.
if ! cmp -s "$work/settings.json" "$work/original.json"; then
  if ! cat "$work/settings.json" >"$settings"; then
    cat "$work/original.json" >"$settings" || true
    fail 'Could not write Local settings.'
  fi
fi
log 'Local didx:me setup complete. Only ignored DidxMe settings were updated; Yoma API may start.'
