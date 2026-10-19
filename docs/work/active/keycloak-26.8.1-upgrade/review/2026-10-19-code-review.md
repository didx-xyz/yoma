# Code review: `chore/keycloak-26.8.1`

- **Date:** 2026-10-19
- **Branch:** `origin/chore/keycloak-26.8.1` at `a1903f5a1`
- **Compared with:** `origin/master` at `ddb36f1ca` (merge base `3c718b8fd`)
- **Scope:** 20 commits, mostly Helm, compose, the realm export, the provider JARs and docs
- **Method:** `/code-review`, without a verification pass. Treat these as likely, not confirmed.
- **Citations:** `a1903f5a1` and `839b640ae` are branch commits. Re-point them at the squashed
  `(#NNNN)` commit, or annotate them, before the PR merges.

## Summary

No definite code bugs. The serious findings are deployment risks. The branch's own kind test shows
that a Keycloak 26.4.0 pod running against a database already migrated to 26.8.1 returns HTTP 500
on the login page. Findings 1 and 2 are two different ways that situation can happen.

Most of the files involved (`helm/`, `helmfile.yaml.gotmpl`, `src/api`) are outside `src/web`.

## Deployment risks (address before merging)

### 1. Older branches can break Dev login

`helm/keycloak/values.yaml:158`

Once this branch deploys to Dev and migrates the Keycloak schema, any PR that touches
`src/keycloak/**` or `helm/keycloak/**` and has not been rebased will redeploy the 26.4.0 image onto
the migrated database. The rollout plan and gotchas do not cover this.

**How it fails:** CI's paths-filter runs "Helmfile Apply/Diff Keycloak" for any PR that touches
Keycloak paths. A theme or OTP fix branch cut before the merge deploys `keycloak:26.4.0` to
`yoma-v3-dev`, which already has the 26.8.1 schema. The result is the error the feature doc already
recorded (`column ipe1_0.organization_id does not exist`), HTTP 500 on the login page and a
config-cli 500. Dev login stays broken until someone redeploys 26.8.1, and this branch's Dev check
is no longer valid.

### 2. `atomic: true` can roll back onto a migrated schema

`helmfile.yaml.gotmpl:240`

Raising the timeout to 600s fixes only one cause of failure. With `atomic: true`, any failed
Keycloak release still rolls back to 26.4.0 after the schema has migrated.

**How it fails:** The config-cli import job fails, a readiness probe fails, the image pull is slow
on a fresh spot node, or the provider tarball download fails. Helm rolls the StatefulSet back to
26.4.0 on a 26.8.1 schema, and Stage/Prod return HTTP 500 on the login page until someone fixes
forward by hand.

**Suggestion:** set `atomic: false` on the keycloak release for this rollout instead of only
allowing more time.

### 3. Turning off preview disables legacy token exchange v1

`helm/keycloak/values.yaml:168`

Removing `--features=preview,declarative-ui` disables legacy token exchange v1. The only evidence
that nobody uses it is a 7-day Datadog window, and the realm still records `TOKEN_EXCHANGE` events.

**How it fails:** A partner (Atingi, Goodwall, IXO, an SSO partner) or a manually configured client
might exchange tokens less often than weekly, for example in a monthly batch. After the upgrade its
`grant_type=urn:ietf:params:oauth:grant-type:token-exchange` call returns `invalid_request` (the doc
reproduced this for `yoma-web`). The integration breaks with nothing in the repo to explain why.

### 4. Realm export relabelled 26.8.1 without being re-exported

`src/keycloak/exports/01-yoma-realm.yaml:2855`

Bumping `keycloakVersion` to 26.8.1 relabels a 26.4-era export without re-exporting it. A fresh
realm import then skips every import migration from 26.5 to 26.8. The bump was only needed for the
`token-exchange-delegation` scope that `--features=preview` added, and the branch has since removed
that flag.

**How it fails:** A fresh realm (Dev `reset-deployments`, a new local stack) is created without the
`MigrateTo26_5`–`26_8` import steps. Stage and Prod upgrade in place and do run them. The two drift
apart (for example in default scopes or realm attributes those migrations add), so fresh
environments stop matching production.

**Suggestion:** now that preview is off, the label can probably go back to 26.4.0 so the import
migrations run.

### 5. Datadog tracer bumps bundled into the Keycloak PR

`helm/yoma-web/values.yaml:28`

A major Datadog Node tracer bump (v5.105.0 → v6.20.1) and the .NET/Java tracer bumps are part of
this PR. Dev has `ddInjectEnabled: false`, so the planned Dev check never loads these tracers.

**How it fails:** helmfile sets `admission.datadoghq.com/enabled` from `ddInjectEnabled`, which is
false for Dev and true for Stage and Prod. The Dev checks (phone registration, Google/Facebook
login, SendGrid) run without an injected tracer. A v6 incompatibility with the Next.js server, or a
.NET 3.55 regression, first shows up on Stage or on Prod at release. It also cannot be rolled back
separately from the Keycloak upgrade.

### 6. 600s timeout applied to every release

`helmfile.yaml.gotmpl:238`

The 600s timeout was first scoped to the Keycloak release (`839b640ae`), then widened to
`helmDefaults`. That doubles the time before a failed yoma-api or yoma-web deploy rolls back.

**How it fails:** A broken yoma-api or yoma-web image that never becomes ready holds the shared
deploy concurrency group for 10 minutes instead of 5 before `atomic` rolls it back. Every queued
Dev/Stage deploy waits behind it.

**Suggestion:** put `timeout: 600` on the keycloak release only.

## Lower severity

### 7. Docs folder does not follow the work-docs convention

`docs/work/active/keycloak-26.8.1-upgrade/feature.md:1`

The folder has no YOM ticket id and no epic `README.md`. `AGENTS.md` requires
`<TICKET>-<linear-slug>` names. `docs/work/README.md` says standalone work still gets an epic folder
named after its own ticket, with a short `README.md` and one feature sub-folder. As it stands, the
folder cannot be traced to Linear.

### 8. Handoff contradicts the rollout decision in `feature.md`

`docs/work/active/keycloak-26.8.1-upgrade/handoffs/2026-10-14-a.md:49`

The handoff's Next Steps says not to let a 26.4.0 pod run next to a 26.8.1 pod (Prod has
`replicas: 2`). `feature.md` later records keeping `replicas: 2` with a normal rolling update, which
runs both versions side by side. The handoff was never marked superseded. Whoever runs the Prod
rollout may follow the handoff, scale to 1 replica and take an outage of about 67s.

### 9. Password config set on only one registration flow

`src/keycloak/exports/01-yoma-realm.yaml:2682`

Only the custom "Registration with phone" flow gets `always_set_password_on_register_form`. The
built-in `registration` flow's `registration-password-action` has no config, even though the realm
has `verifyEmail: true`.

**How it fails:** If `registrationFlow` is ever pointed back at the built-in flow (an admin console
change, or a later export), Keycloak 26.7+ hides the password fields at registration. The custom
`register.ftl` renders them only when `passwordRequired` is set, so the form shows no password
inputs. This is the same regression the branch fixed for the phone flow.

### 10. keycloak-config-cli built for 26.5.5, run against 26.8.1

`src/api/docker-compose.yml:181`

`keycloak-config-cli 6.5.1-26.5.5` uses the 26.5.5 admin client against a 26.8.1 server, so it does
not know the representation fields added in 26.6–26.8.

**How it fails:** A realm or client attribute introduced after 26.5.5 and added to the export is
silently dropped or never compared. With `IMPORT_VALIDATE` on, the import still reports success while
the server keeps a hand-set value. Nothing next to the image tag says it should be bumped once a
26.8 build is published.
