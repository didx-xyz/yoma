# Epic: YOM-1324 — IXO Auth Hub signs Yoma users in without WorkOS

## Meta

- **Epic**: [YOM-1324](https://linear.app/didx/issue/YOM-1324)
- **Owners**: Robbie (keycloak)
- **Areas**: keycloak
- **Status**: in-progress — waiting on client secrets
- **Started**: 2026-11-25
- **Branch**: `feature/yom-1324-ixo-auth-hub-signs-yoma-users-in-without`

## Why This Epic Exists

IXO's Auth Hub signs Yoma users in through WorkOS, which uses the `ixo-webos` Keycloak client. WorkOS needs an email address and sends an extra email code at every sign-in, so phone-only users cannot sign in. IXO is moving the hub to Keycloak directly through a new client. `ixo-webos` stays until IXO says it can be switched off.

## Child Features

| Folder | Ticket | Area | Status |
| --- | --- | --- | --- |
| [`YOM-1324-ixo-auth-hub-signs-yoma-users-in-without-workos/`](./YOM-1324-ixo-auth-hub-signs-yoma-users-in-without-workos/feature.md) | [YOM-1324](https://linear.app/didx/issue/YOM-1324) | keycloak | in-progress |

## Out of Scope (whole epic)

- Switching off `ixo-webos`. IXO tells us when.
- Sending the client secret to IXO. Robbie sends it through a 1Password share.
