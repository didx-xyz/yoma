# Local startup and deployment handoff — YOM-1306

**For Jason: prepare standalone mono and obtain Local settings once, then start mono first and Yoma second. Yoma's Local initialization prepares the integration automatically.** An arbitrary or incomplete mono deployment is not sufficient: use the supported local setup supplied by DIDx/SRE, with its issuer ready and the compatible service routes.

This is a public-repository guide. Obtain private platform instructions, access and configuration through the team's approved secure channel. Do not paste credentials, private infrastructure details, token contents or configuration dumps into this repository, its issues or PRs.

SSI is **enabled by default**. For local work without mono, use the [SSI opt-out](#optional-local-startup-without-ssi) below.

## First-time preparation — Jason

1. Use the team's reviewed Yoma integration branch and its normal development prerequisites.
2. Ask Robbie/SRE for access and the supported **standalone mono local setup**. Follow those private instructions for dependencies, registry access and issuer preparation. Mono stays outside Yoma's Compose stack; no private checkout or platform configuration is committed here. Adrian's machine-local helpers are not a portable installer.
3. Obtain a current copy of Adrian's **`appsettings.Local.json` privately**, preferably via the approved password manager/secure sharing mechanism. Place it at `src/api/src/application/Yoma.Core.Api/appsettings.Local.json`. Keep Jason's existing settings if already configured and merge the required changes with Adrian; do not blindly replace unrelated integrations or machine-specific database/cache settings.
4. The Local file must be valid JSON, include a `DidxMe` object and exist before Compose starts. Tracked `appsettings.json` provides the structure/placeholders, not working credentials. Obtain any other required ignored Yoma configuration through the usual private setup process; this initializer does not generate the rest of Yoma's configuration.
5. Verify Git ignores the Local file, from the repository root:

   ```powershell
   git check-ignore src/api/src/application/Yoma.Core.Api/appsettings.Local.json
   ```

   The command must report the path. Never force-add it. The file contains real external-platform credentials even when some local defaults are disposable.

## Automatic Local Compose Initialization

### Every normal startup

1. **Start mono independently** using the supported private setup instructions. Wait until the required platform and issuer services are ready.
2. **Start Yoma**, from `src/api`:

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
| Local settings synchronization | Applies the agreed local development defaults and updates only `DidxMe` in the existing ignored source-project Local file. Other settings are preserved. |
| API startup | Waits for successful integration initialization, runs application migrations and allows the existing application seed/jobs to proceed. |
| Existing SQL/user init | Seeds full-reset development fixtures in the Compose database and identity service. |

This prepares the environment; it does **not** mean every participant has been provisioned or every credential issued. Those remain Yoma application jobs. Do not run background recovery/Replay until the outstanding implementation is complete.

Initialization is **Local only**. Dev and later environments use SRE provisioning, not this container.

### Optional local startup without SSI

From `src/api`, in PowerShell:

```powershell
$env:YOMA_SSI_ENABLED_ENVIRONMENTS = 'None'
docker compose up --build -d
```

This single Compose override feeds both `didxme-init` and the API's existing
`AppSettings.SSIEnabledEnvironments`. The init container logs a warning and exits successfully
before installing tools, reading/updating Local settings, waiting for mono or provisioning anything.
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

## Local Operations

- Keep mono and Yoma as separately managed stacks. Stopping Yoma does not stop mono.
- The init updates the real bind-mounted Local file used by Visual Studio. Do not edit it while init runs; restart an API process after configuration changes.
- Host/debugger URLs and container transport URLs differ. Compose supplies its container overrides; do not replace canonical identity settings to work around connectivity. Use the supported local topology and private platform instructions if ports/routes differ.
- Local application credentials are repeatable development defaults. Platform/issuer access credentials remain owned by standalone mono setup and are not copied into Yoma API settings.

### Debug the API in Visual Studio

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
setups should use their supported reset procedure instead.

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

1. Back up the database and stop/drain all SSI workers, including old API replicas, before applying it.
2. Prepare the target provider and configuration. Seed the current SDJWT defaults before enabling
   issuance: type-specific defaults for ImpactAction, Event, Job and Entrepreneurship, generic for
   Learning/Other, plus YoID. Verify any retained custom YoID schema names separately.
3. Apply the migration once. Tenant and credential schedules become Pending; old provider IDs,
   schema versions and retry/errors are cleared. Opportunity schema names are replaced with the
   defaults above, including previous custom selections. Row identities, business references, YoID
   schema names and original issuance dates remain. Aries storage is retained unchanged.
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

Local provisioning, issuance, API wallet list/detail, holder caching and mobile-to-email wallet continuity have been exercised. Frontend/browser journeys and deployed multi-instance behavior still need verification. Recovery and Replay remain release blockers. Dev preparation is next; the reset migration is prepared, with coordinated cutover/recovery rehearsal still required before Stage.

Use the [epic](./README.md) for scope/owners and the [adapter feature](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/feature.md) for current tasks. Historical/private investigation details are not startup instructions.
