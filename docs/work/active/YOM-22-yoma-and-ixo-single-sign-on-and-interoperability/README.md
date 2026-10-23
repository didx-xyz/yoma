# Epic: YOM-22 — Yoma and IXO single sign-on and interoperability

> **Ticket numbering.** This epic is tracked in the **ixo-world** Linear workspace (team "Yoma"),
> not the DIDx workspace the rest of `docs/work/` links to. `YOM-22`…`YOM-27` here are ixo-world
> ids and are unrelated to any DIDx `YOM-2x` ticket. If the epic is mirrored into DIDx Linear,
> rename the folders to the DIDx ids.

## Meta

- **Epic**: [YOM-22](https://linear.app/ixo-world/issue/YOM-22/yoma-and-ixo-single-sign-on-and-interoperability)
- **Owners**: Adrian (api) · Jason (web) · IXO team (Auth Hub, WorkOS config)
- **Areas**: both (+ keycloak, + external `ixoworld/ixo-auth-hub`)
- **Status**: planning
- **Started**: 2026-09-20
- **Branch**: `feature/yom-22-yoma-and-ixo-single-sign-on-and-interoperability` — docs only, not load-bearing

## Why This Epic Exists

Yoma is a Web 2.0 stack (Next.js + .NET + Keycloak "YoID"). The IXO portal for Yoma
(yoma.impacts.exchange) authenticates separately through the WorkOS-based IXO Auth Hub, which is
where a user's DID, chain keys and Matrix account come from. Users therefore log in twice, and the
existing Yoma→IXO hand-off (`IXO.PartnerSync`, `users/access`) is by IXO's own description "context
transfer, not authentication". Shipping this epic means one login (YoID), IXO keys provisioned from
it, the IXO multiclient SDK usable anywhere in the Yoma web app, and — as a stretch — a QiForge
agent inside Yoma.

## Child Features

| Folder                                                                                                                                         | Ticket                                                                                                     | Area       | Status      |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | ----------- |
| [`YOM-23-validate-silent-sign-on-and-agree-ixo-auth-hub-changes/`](./YOM-23-validate-silent-sign-on-and-agree-ixo-auth-hub-changes/feature.md) | [YOM-23](https://linear.app/ixo-world/issue/YOM-23/validate-silent-sign-on-and-agree-ixo-auth-hub-changes) | both + IXO | in-progress |

Tickets with no folder yet — add one when work starts:

| Ticket                                                                                                | Area            | Note                                                                                |
| ----------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| [YOM-24](https://linear.app/ixo-world/issue/YOM-24/link-a-yoid-to-an-ixo-identity-from-inside-yoma)   | both + keycloak | Phase 1 — activation flow, `User.IxoDid`, session exposure, sign-out wipe           |
| [YOM-25](https://linear.app/ixo-world/issue/YOM-25/ixo-sdk-available-across-the-yoma-web-app)         | web             | Phase 2 — `@ixo/impactxclient-sdk`, session-key signer, CSP, shared-device controls |
| [YOM-26](https://linear.app/ixo-world/issue/YOM-26/first-interoperable-features-between-yoma-and-ixo) | both            | Phase 3 — IXO identity on YoID, portal hand-off, completion claims, org entity DIDs |
| [YOM-27](https://linear.app/ixo-world/issue/YOM-27/qiforge-agent-inside-yoma-stretch)                 | web             | Phase 4 (stretch) — QiForge chat via `@ixo/oracles-client-sdk`                      |

## Shared Contract

Everything below was **read from code** on 2026-09-20 (Yoma repo at `22408310`; IXO repos via
`gh`), not yet observed running. YOM-23 exists to observe it.

### What already exists

- Keycloak realm client **`ixo-webos`** (`src/keycloak/exports/01-yoma-realm.yaml`, confidential)
  has the WorkOS OIDC SSO callback as its redirect URI — Keycloak is already an upstream Enterprise
  SSO connection in WorkOS. Enabled local/dev/stage, **disabled in prod**
  (`helm/keycloak/conf/prod/values.yaml`).
- Auth Hub `GET /api/auth/login` accepts `organization_id`, which routes straight to that WorkOS
  organisation's SSO connection (i.e. Keycloak) instead of the AuthKit chooser.
- Auth Hub is **semi-custodial**: it generates the mnemonics server-side, registers
  `did:ixo:<address>` plus smart-account authenticators in one feegranted tx, creates the Matrix
  account, and hands the calling app a bundle from `GET /api/auth/exchange` (PKCE). First-time users
  must set a PIN in the hub UI. The hub cannot be iframed.

### Principles

1. Keycloak stays Yoma's only login. IXO activation is **just-in-time** — at the first feature that
   needs a signer, never at registration.
2. Three client states: `unlinked` (no DID on the Yoma user) → `linked-locked` (DID known, no
   session key on this device) → `active`. **Chain/blocksync reads work in every state.**
3. Key material never enters the NextAuth cookie, the Yoma API, or logs. The browser keeps only
   `sessionMnemonic` + `sessionAuthenticatorId`, encrypted with AES-GCM under a non-extractable
   `CryptoKey` in IndexedDB (pattern from `ixoworld/ixo-portal` `lib/authHub/sessionStore.ts`).
   Wiped on sign-out, user change, and refresh-token failure.
4. Full-page redirect is the default activation transport (popups fail in PWA standalone and in-app
   webviews); popup is a desktop-only enhancement.
5. Yoma's `User.IxoDid` is the authoritative YoID↔DID link. First-bind-wins; Yoma never merges
   identities. The sync worker's email-based `/v1/link/bind` is bridged best-effort only.
6. The API proves a claimed DID by asking the hub server-to-server (partner key), not by verifying
   signatures in .NET. **Today that lookup is email-only**: the hub never receives the Keycloak
   `sub` (WorkOS User Management does not expose the upstream IdP subject, and the hub uses WorkOS
   `externalId` for the DID). So the proof only works for users whose YoID email matches the email
   WorkOS holds — see Blockers.

### Activation flow

1. Feature needs a signer → activation prompt → `returnTo` + pending intent saved in `sessionStorage`.
2. Redirect to `{hub}/api/auth/login?redirect_uri=<web>/ixo/callback&state&code_challenge&code_challenge_method=S256&organization_id=<org>&hide_mnemonic=true`
   — plus `&prompt=inherit&scope=session` once hub drafts H2/H4 land (see YOM-23).
3. WorkOS → Keycloak `ixo-webos` (existing SSO cookie) → hub (first time: display name + PIN;
   returning: consent remembered 90 days).
4. `/ixo/callback` (client-only): verify `state`, exchange, store session key, strip `code` from URL.
5. `POST /api/v3/user/ixo/link` (contract below).
6. `useSession().update()` → `ixoDid`/`ixoAddress` on the session; resume the pending intent. On any
   later activation the returned DID must equal the session DID, otherwise wipe and abort.

### API contract — `POST /api/v3/user/ixo/link` (draft, owner: Adrian)

- Auth: bearer, role `User`. Body: `{ "did": "did:ixo:ixo1…", "address": "ixo1…" }`.
- Server: validates `did == "did:ixo:" + address`; resolves the caller's DID from the Auth Hub
  partner API **by email** (lookup by Keycloak subject is not possible yet — see Blockers) and
  requires it to match; writes
  `User.IxoDid`, `User.IxoAddress`, `User.DateIxoLinked`.
- Responses: `200` with `UserProfile` (idempotent when the same DID is re-sent) · `409` when the
  user is already linked to a different DID, or the DID belongs to another user · `422` when the hub
  does not confirm the DID for this user.
- `UserProfile` gains `ixoDid` and `ixoAddress` (nullable). These fields are **never** writable via
  `UserRequest` or the Keycloak webhook upsert.

### Config (web, runtime via `pages/api/config/client-env.ts`)

`NEXT_PUBLIC_IXO_ENABLED`, `NEXT_PUBLIC_IXO_NETWORK` (`devnet|testnet|mainnet`),
`NEXT_PUBLIC_IXO_AUTH_HUB_URL`, `NEXT_PUBLIC_IXO_WORKOS_ORG_ID`, `NEXT_PUBLIC_IXO_CLIENT_ID`.
Proposed mapping: local/dev → devnet, stage → testnet (`pandora-8`), prod → mainnet (`ixo-5`) — to
be confirmed.

### SDK choices

- `@ixo/impactxclient-sdk` 3.1.x (the npm name of `ixo-multiclient-sdk`) — used; lazy-loaded only.
- `@ixo/jambo-wallet-sdk` 0.1.1 — not used (pins `@cosmjs` 0.30.1, which conflicts with 0.39; it is
  an external-wallet bridge and does not remove the second login).
- QiForge: `@ixo/oracles-client-sdk` 1.4.x is the current frontend SDK; `@ixo/assistant-sdk` 0.0.2
  is the legacy Companion client. Which one Phase 4 uses depends on the oracle backend — open.

## Out of Scope (whole epic)

- Replacing Keycloak, the Aries credential wallet, or ZLTO rewards.
- Generating or holding user keys on Yoma servers.
- Client-side (non-custodial) key generation in Yoma — diverges from the Auth Hub and leaves Yoma
  owning recovery.
- Building the oracle/agent backend.

## Blockers

| Blocker                                                                | Severity      | Note                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hub hard-codes `prompt: 'login'` toward WorkOS                         | High          | May force credential re-entry and defeat silent SSO. Draft hub change in YOM-23.                                                                                                                                                                                      |
| Phone-only Yoma users send no `email` claim                            | High          | WorkOS SSO may reject the profile. Workaround: conditional synthetic-email mapper on `ixo-webos` only. The link proof is email-based, so the synthetic address must be deterministic and the API must look up that same address.                                      |
| Hub cannot look a user up by Keycloak `sub`                            | High          | Found 2026-09-20 while drafting H3: no verified IdP subject reaches the hub. Options: WorkOS exposes SSO identities; map `sub` into a connection custom attribute (untested); move org logins to the standalone SSO API (large). Until then link proof = email match. |
| DID fork: hub keys accounts on the WorkOS user                         | High          | Same person via AuthKit-Google and via Keycloak SSO may get two DIDs. Needs a hub-side account-link step.                                                                                                                                                             |
| Yoma web host not an Auth Hub client                                   | Med           | Needs `yoma-web` entry in hub `sync-clients.mjs` per env + WorkOS org id per env.                                                                                                                                                                                     |
| `/exchange` returns the full key bundle                                | Med           | Scoped exchange (hub `FUTURE_IMPROVEMENTS.md` #1) so Yoma receives the session key only.                                                                                                                                                                              |
| No CSP on Yoma web                                                     | Med           | IndexedDB wrapping does not stop XSS; CSP + scoped/expiring session authenticator are the real mitigations. Phase 2.                                                                                                                                                  |
| Web `typescript` 5.4.5; SDK needs ≥ 5.7                                | Low           | Verified in YOM-23 S4: 5.9.3 builds with one fix (`target: es2018`). Separate prep PR; dependency change needs Jason's OK.                                                                                                                                            |
| `zod` 3 in web vs `zod` ^4 peer of `@ixo/oracles-client-sdk`           | Low (Phase 4) | Isolate agent in its own workspace package.                                                                                                                                                                                                                           |
| `@ixo/oracles-chain-client` needs build-time `NEXT_PUBLIC_GRAPHQL_URL` | Low (Phase 4) | Conflicts with one-image/runtime-env; try a `process.env` shim before dynamic import.                                                                                                                                                                                 |
| Data-protection review (minors' profile claims to WorkOS/IXO)          | High          | Owner TBD.                                                                                                                                                                                                                                                            |

## Cross-Area Notes

- **api ↔ web**: the `/user/ixo/link` contract above and the two new `UserProfile` fields.
  `server/auth.ts` already fetches the profile in both JWT paths, so the fields flow into the
  session without a new call.
- **keycloak / helm**: one new protocol mapper on `ixo-webos`; prod enablement of
  `CLIENT_IXO_WEBOS_ENABLED` at Phase 1 ship time. `helm/` edits need explicit owner sign-off per
  `AGENTS.md`.
- **Unknown**: what the private `ixofoundation/jambo-yoma-worker` already covers — check before
  Phase 3.
