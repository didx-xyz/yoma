# Local startup and deployment handoff — YOM-1306

**For Jason: prepare standalone mono and obtain Local settings once, then start mono first and Yoma second. Yoma's Local initialization prepares the integration automatically.** An arbitrary or incomplete mono deployment is not sufficient: use the supported local setup supplied by DIDx/SRE, with its issuer ready and the compatible service routes.

This is a public-repository guide. Obtain private platform instructions, access and configuration through the team's approved secure channel. Do not paste credentials, private infrastructure details, token contents or configuration dumps into this repository, its issues or PRs.

SSI is **enabled by default**. For local work without mono, use the [SSI opt-out](#optional-local-startup-without-ssi) below.

## First-time preparation — Jason

1. Use the team's reviewed Yoma integration branch and its normal development prerequisites.
2. Ask Robbie/SRE for access and the supported **standalone mono local setup**. Follow those private instructions for dependencies, registry access and issuer preparation. Mono stays outside Yoma's Compose stack; no private checkout or platform configuration is committed here. Adrian's machine-local helpers are not a portable installer.
3. Obtain a current copy of Adrian's **`appsettings.Local.json` privately**, preferably via the approved password manager/secure sharing mechanism. Place it at `src/api/src/application/Yoma.Core.Api/appsettings.Local.json`. Keep Jason's existing settings if already configured and merge the required changes with Adrian; do not blindly replace unrelated integrations or machine-specific database/cache settings.
4. Obtain the local webhook provisioning token privately and set `YOMA_WEBHOOK_API_TOKEN` in ignored `src/api/.env`. It is used only by the initializer, not by the API. Renew it if it expires or the local platform signing configuration changes. The standalone local platform must permit webhook delivery to the host API; follow its private setup instructions. Do not disable outbound protections broadly.
5. The Local file must be valid JSON and exist before Compose starts. Include a `DidxMe` object when SSI is enabled. Tracked `appsettings.json` provides the structure/placeholders, not working credentials. Obtain other Yoma configuration that is ignored by Git through the usual private setup process; this initializer does not generate the rest of Yoma's configuration.
6. Verify Git ignores both private files, from the repository root:

   ```powershell
   git check-ignore src/api/src/application/Yoma.Core.Api/appsettings.Local.json
   git check-ignore src/api/.env
   ```

   The command must report the path. Never force-add it. The file contains real external-platform credentials even when some local defaults are disposable.

## Automatic Local Compose Initialization

### Every normal startup

1. **Start mono independently** using the supported private setup instructions. Wait until the required platform and issuer services are ready.
2. **Start Yoma**, from `src/api`:

   **Existing database:** before startup, back up persistent data and complete the
   [cutover preparation](#provider-reset-migration--deployment-coordination-required).
   Startup applies pending migrations: the one-off provider reset clears SSI provider IDs and
   changes opportunity schema selections. Disabling SSI does not disable migrations.

   ```powershell
   docker compose up --build -d
   docker compose logs -f didxme-init
   ```

3. Wait for `didxme-init` to exit successfully, then for Yoma's API and remaining database/user initialization to complete. Check with `docker compose ps -a`. One-shot init containers exiting with code 0 is expected.
4. Start the Yoma frontend using its normal instructions. No manual Keycloak configuration or secret copying is part of a normal startup.

### What Yoma handles automatically

| Step | Result |
| --- | --- |
| Existing Yoma identity import | Applies Yoma's integration configuration through its normal initialization pattern. |
| Local `didxme-init` | Waits up to 120 seconds for the independent platform, then creates or verifies the Yoma integration resources. It never starts or resets mono. |
| Local settings synchronization | Applies the agreed local development defaults and updates `DidxMe` and `KeycloakAdmin.TokenExchange` in the existing ignored source-project Local file. Other settings are preserved. |
| Local webhook provisioning | Creates or verifies the acceptance endpoint and retrieves its signing secret into `DidxMe.Webhook.SigningSecret`. Reuses existing secrets; refreshes the local value after a platform reset. Preserves webhook timeout settings. |
| API startup | Waits for successful integration initialization, runs application migrations and allows the existing application seed/jobs to proceed. |
| Existing SQL/user init | Seeds full-reset development fixtures in the Compose database and identity service. |

This prepares the environment; it does **not** mean every participant has been provisioned or every credential issued. Those remain Yoma application jobs. Background recovery/Replay is implemented in the phase-1 follow-up; verify its configuration and data readiness before running it in an environment.

Initialization is **Local only**. Dev and later environments use SRE provisioning, not this container.
Compose builds the local initializer image with `curl` and `jq` already installed. Startup does
not download packages; rebuild the image with `--build` after tooling changes.

The separate Yoma `keycloak-init` still installs tools and downloads its public provider JARs.
Downloads retry transient failures and must pass archive validation before Keycloak starts.
`keycloak-health` fails after about five minutes if Keycloak never becomes ready. For failures,
check `docker compose logs keycloak-init keycloak keycloak-health` and retry startup after the
download/service problem is resolved; a database reset is not required.

### Optional local startup without SSI

The e2e CI job uses this disabled mode and creates an ignored Local settings file containing `{}` before
Compose starts. Local development remains enabled by default and uses privately supplied settings.

From `src/api`, in PowerShell:

**Existing database:** back up persistent data and complete the
[cutover preparation](#provider-reset-migration--deployment-coordination-required) before starting.
SSI-disabled startup still applies pending migrations, including the one-off reset of provider IDs
and opportunity schema selections.

```powershell
$env:YOMA_SSI_ENABLED_ENVIRONMENTS = 'None'
docker compose up --build -d
```

This single Compose override feeds both `didxme-init` and the API's existing
`AppSettings.SSIEnabledEnvironments`. The init container logs a warning and exits successfully
before checking tools, reading/updating Local settings, waiting for mono or provisioning anything.
Its successful exit satisfies the API dependency. Mono can stay stopped. Schema seeding, tenant
creation and issuance/Replay jobs skip processing; authenticated SSI endpoints return HTTP 503
with the normal error envelope. Other API routes remain available.

Scheduling stays unchanged: existing queued work is preserved and new domain actions may still
queue work for later processing. Workflows that look up schemas while scheduling or configuring
opportunities need previously seeded local schema mappings. For those workflows on a fresh database,
complete an SSI-enabled startup/seeding first. This mode does not supply mock schemas or wallet data.
Normal Yoma database migrations and other initialization still run; the ignored Local file is still
required by the API/Compose mounts. The switch does not stop mono or clear any data.

To re-enable SSI, start mono independently and wait for readiness, then:

**Existing database:** confirm backups and
[cutover preparation](#provider-reset-migration--deployment-coordination-required) before restart;
any pending provider-reset migration still runs during API startup.

```powershell
Remove-Item Env:YOMA_SSI_ENABLED_ENVIRONMENTS -ErrorAction SilentlyContinue
docker compose up --build -d
```

With no override, the default is `Local, Development, Staging, Production`. An enabled initializer
still fails startup if mono is unavailable or provisioning fails. Use `None` to disable explicitly;
an empty value uses the enabled default. These commands recreate changed containers; a plain
`docker compose restart` does not apply new environment settings. Only start processing queued work
once the matching provider data and schema mappings are ready.

**Visual Studio:** Compose overrides do not apply to the debugger. Set
`AppSettings.SSIEnabledEnvironments` to `None` in ignored `appsettings.Local.json` and restart the
debugging session. Restore its previous list including `Local` before testing SSI again. The init
does not synchronize this setting into that file. No Helm or deployed-environment settings change.

## Identity token configuration

Yoma assertion acquisition belongs to the identity-provider adapter. Configure its client under
`KeycloakAdmin.TokenExchange` (`ClientId`, `ClientSecret`, `RedirectUri`, and
`RequestTimeoutSeconds`, default 30). It uses the existing `Keycloak.AuthServerUrl` and
`Keycloak.Realm`. didx:me consumes the identity-provider interface; it does not receive these secrets.

**Existing deployments:** SRE must move the former `DidxMe.TokenExchange.ClientId/ClientSecret`
values to `KeycloakAdmin.TokenExchange`, verify the existing identity URL/realm, and remove the old
section. Register the exact callback and supply the matching `CLIENT_DIDXME_ASSERTION_REDIRECT_URI`
to the Yoma realm import. Confirm the approved background identity permissions privately before
enabling background processing. No Helm configuration or deployed secrets were changed in this session.

Local Compose supplies matching development values to the normal realm import and initializer.
The initializer removes the old Local section and preserves unrelated settings, including other
`KeycloakAdmin` properties. Restart the API/debugger after initialization. There is no deployed
configuration fallback to the former section.

## Local Operations

### Issuance webhook

Locally, `didxme-init` creates or verifies the acceptance endpoint, retrieves its signing secret,
and updates `DidxMe.Webhook.SigningSecret` in ignored `appsettings.Local.json`. A rerun does not
rotate the secret or duplicate the endpoint. A changed/disabled endpoint or failed secret read
blocks initialization without updating settings. Webhook timeout settings are retained.

The callback is `http://host.docker.internal:5000/api/v3/webhook/didxme`, so it can reach either
the Docker API's published port or the API running in VS. Stop the Docker API before starting
the VS project profile. That profile now listens on all host interfaces on port 5000 while opening
the browser at `http://localhost:5000`. Use the project profile, not IIS Express. Host firewall and
the independently managed local platform's outbound rules must permit the callback; initialization
does not alter these rules or wait for the API, which starts afterwards. Verify signed delivery
before triggering issuance. A full mono reset may require its local delivery permission to be reapplied.

For deployed environments, agree registration/automation with Robbie/SRE and supply the
endpoint-specific signing secret through environment secret configuration. Local initialization
does not configure deployed environments. The signing secret is separate from OAuth client secrets;
tracked settings contain placeholders only.

The API verifies the signature and timestamp, then saves the wallet credential ID before returning
success. Issuance waits inline after delivery for that persisted result, including when another API
instance receives the event. `WaitTimeoutSeconds` bounds this wait; `PollIntervalMilliseconds`
controls the database check interval. A timeout leaves the attempt available for recovery, rather
than issuing another credential. Do not enable issuance until callback reachability and signing
configuration have been verified for the environment.

- Keep mono and Yoma as separately managed stacks. Stopping Yoma does not stop mono.
- The init updates the real bind-mounted Local file used by Visual Studio. Do not edit it while init runs; restart an API process after configuration changes.
- Host/debugger URLs and container transport URLs differ. Compose supplies its container overrides; do not replace canonical identity settings to work around connectivity. Use the supported local topology and private platform instructions if ports/routes differ.
- Local application credentials are repeatable development defaults. Platform/issuer access credentials remain owned by standalone mono setup and are not copied into Yoma API settings.

### Debug the API in Visual Studio

Before starting the debugger against an existing database, back it up and complete the
[cutover preparation](#provider-reset-migration--deployment-coordination-required).
API migrations also run under Visual Studio, including when SSI is disabled.

1. Complete normal Compose startup, including SQL/user initialization.
2. From `src/api`, run `docker compose stop yoma-api`; leave dependencies running.
3. Open `src/api/Yoma.Core.sln`, select the API project and its local Project launch profile, then start debugging.
4. Verify the database configured for that profile has its own migrations and test seeds. Adrian's host database is separate from Compose's database; copying his Local file does not copy its data. Run the existing PostgreSQL `post.sql` only against the intended empty development database.
5. Stop VS before restarting the API container. Use one API host during the debug run. Restore temporarily reduced SSI parallelism when debugging is complete.

### Failures and resets

| Situation | Action |
| --- | --- |
| Mono unavailable or initialization failed | Read the named init stage, correct the standalone setup and rerun Yoma initialization. Do not bypass the API dependency. |
| Mono reset after Yoma was already initialized | Once mono and its issuer are ready again, run `docker compose run --rm didxme-init` from `src/api`, then restart the API. |
| Provider data was deleted | Coordinate matching Yoma test-data reset/reseeding with Adrian. Recreating integration resources alone does not repair stale holder/credential mappings. |
| Existing preset during schema seeding | Matching presets are recovered automatically. An incompatible definition or final seed failure needs investigation; do not reset merely because a preset already exists. |

Use mono's supported private reset procedure only for a deliberate clean test environment. It can destroy platform test data. Never assume a Yoma reset also resets mono, or vice versa.

### Optional reset helper — existing local setup only

[Reset-Local.ps1](../../../../src/api/src/infrastructure/Yoma.Core.Infrastructure.DidxMe/Tools/Reset-Local.ps1)
is a Yoma-owned convenience script for an **already prepared standalone Linux development
container using Kind and Tilt**. It does not install mono or add it to Yoma Compose. Other local
setups should use their supported reset procedure instead. Run this helper in **PowerShell 7.3+
(`pwsh`)**, not Windows PowerShell 5.1; native argument handling must preserve embedded quotes.

Robbie/SRE supplies the container/cluster names, container repository path and bootstrap/start
script paths privately. Those scripts must already exist in the container: bootstrap must rebuild
only the named local cluster, and start must run Tilt on the specified port and handle its own
logging. They are not bundled with Yoma. No credentials are arguments to this helper.

From the Yoma repository root, substitute the placeholders with your local setup values:

```powershell
$reset = './src/api/src/infrastructure/Yoma.Core.Infrastructure.DidxMe/Tools/Reset-Local.ps1'
$localSetup = @{
    DevelopmentContainer = '<local-development-container>'
    ClusterName = '<local-kind-cluster>'
    RepositoryPath = '/path/to/standalone/checkout'
    BootstrapScript = '/path/to/local/bootstrap.sh'
    StartScript = '/path/to/local/start.sh'
    TiltPort = 10350
}
& $reset @localSetup -WhatIf
& $reset @localSetup
```

`-WhatIf` checks prerequisites without changing anything; the real invocation asks for
confirmation. The helper stops Tilt, deletes only the named Kind cluster, runs bootstrap and
launches startup. Cluster-local test data is lost; externally stored data/volumes are not cleared.
It does not touch Yoma, edit mono source, or prove service readiness. Bootstrap logs stay in the
OS temporary directory and must not be committed or shared unredacted.

After reset, complete standalone service/issuer readiness using the private setup instructions.
Then start Yoma for a clean test run, or rerun `didxme-init` as described above. If provider data
was removed, reset/reseed the corresponding Yoma test data too; old mappings cannot be reused.

## Dev and Later Environments — SRE

Local success does not configure Dev. Robbie/SRE owns both tracks below; detailed platform/security instructions and values are supplied privately.

| Once per environment, or when deliberately rebuilt | Ongoing deployment configuration |
| --- | --- |
| Prepare the independent platform/issuer and required connectivity. | Supply environment-specific API settings, URLs and identifiers using the tracked configuration structure. |
| Provision and validate Yoma's platform integration resources and identity integration. | Inject credentials through the approved environment secret store and deployment mechanism. Never reuse Local defaults. |
| Prepare the separate Yoma identity import and development-fixture provisioning permissions/order where applicable. | Maintain those import settings and provisioning-job permissions separately from runtime API permissions. |
| Verify the complete participant journey with Yoma before activation. | Maintain shared cache/data-protection configuration consistently across API replicas; validate distributed reuse. |

The private SRE handoff must include the development-user import permission change before Dev uses the updated fixture script. No Helm, CI or deployed-environment changes are made by this guide.

Cutover is a separate reviewed operation: prepare provider-specific data, reissue and reconcile credentials, and agree recovery/retention before decommissioning the prior provider. Changing DI alone is not a data migration. See the [adapter task list](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/feature.md).

### Provider-reset migration — deployment coordination required

`20261102114553_ApplicationDb_SSI_DidxMe` now includes the one-off reset of existing SSI schedules.
Applying this migration activates the reset; it is not a dormant script or runtime setting.
There is no application-level approval flag. The first API startup with this migration pending
applies it automatically, even with SSI jobs disabled. SRE must arrange a controlled stop/start
cutover after backup and worker drain; a normal rolling deployment with old workers still active
does not satisfy these prerequisites.

1. Back up the database and stop/drain all SSI workers, including old API replicas, before applying it.
2. Prepare the target provider and configuration. Seed the current SDJWT defaults before enabling
   issuance: type-specific defaults for ImpactAction, Event, Job and Entrepreneurship, generic for
   Learning/Other, plus `YoID|Default`. Set `AppSettings.SSISchemaFullNameYoID` to `YoID|Default`
   in each target environment before schema seeding and issuance.
3. Apply the migration once. Tenant and credential schedules become Pending; old provider IDs,
   schema versions and retry/errors are cleared. Both credential families use the defaults above,
   replacing historical/custom names across every status. Issuance resolves the latest seeded version.
   Existing opportunity schema selections also move to their type's default so future completions
   use the new provider. Issuance enablement is unchanged; disabled opportunities without a schema
   selection remain unselected.
   Row identities, business references and populated issuance dates remain. Legacy Issued rows
   without `DateIssued` use their previous `DateModified`, which may differ from the original issuance
   date. Obtain authoritative dates before cutover where exact dates matter. Aries storage is retained unchanged.
4. Complete schema seeding and tenant creation, then allow issuance. Existing workers enforce tenant
   prerequisites and use retained dates. Reconcile counts, dates and wallet access before retiring Aries.

Fresh databases have no schedules to reset; normal development seeding follows. A database that
already applied this migration will **not** execute the newly added seed. Use a deliberate full reset
for disposable development databases; arrange a reviewed follow-up migration for any persistent
environment in that position. Never remove migration-history rows to force it to run again.

Automatic migration rollback is blocked: retained Aries storage alone cannot restore the old domain
provider IDs. Agree and rehearse recovery before rollout. See the
[reset handoff](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-03-a.md)
for scope and verification.

## Local Federation Contract

Normal Yoma sign-in remains the participant entry point. Environment preparation is automated locally; platform trust settings, privileged provisioning procedures and security diagnostics belong in the private SRE handoff. Do not reproduce them in public documentation.

## Explicit Local Adapter Dry Run

The optional `LocalDryRunTests` harness is for adapter diagnostics, **not** Jason's startup prerequisite. It needs a separately prepared disposable database, ignored Local settings and explicit opt-in. It exercises real local services and may leave test records. Coordinate it with Adrian using the private test instructions; normal API/UI testing needs no extra dry-run database.

## Verification and Next Steps

The initial integration is deployed to Stage. Phase-1 native wallet IDs, signed webhook completion,
holder recovery, credential recovery with/without tracking rows and Replay have passed the real
local VS job run for YoID and Opportunity. Replay produced new wallet IDs while preserving the
original issuance dates. Missing issuance tracking rows are not reconstructed: the domain regains
the native wallet ID, but issuer/session audit references remain unavailable. Preset mappings are
still required for reads and recovery.

The follow-up remains uncommitted for review; Dev deployment verification, Stage-only preset/data
preparation and deployed multi-instance checks are still required. See the
[local debug handoff](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-10-e.md)
and the [configuration checklist for Robbie](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-10-d.md#configuration-handoff--pending-with-robbie).

Use the [epic](./README.md) for scope/owners and the [adapter feature](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/feature.md) for current tasks. Historical/private investigation details are not startup instructions.
