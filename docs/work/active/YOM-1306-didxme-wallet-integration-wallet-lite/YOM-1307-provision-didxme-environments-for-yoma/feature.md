# Feature: Provision didx:me environments for Yoma

## Meta

- **Ticket**: YOM-1307
- **Epic**: [YOM-1306](../README.md)
- **Owner**: Adrian / SRE
- **Areas**: API, local tooling, deployment coordination
- **Status**: review — Local setup complete; deployed preparation remains

## Goal and Plan

Run the platform independently and initialize Yoma's Local integration automatically.
Use the [startup guide](../environment.md). Private platform setup/security instructions are
provided through the approved team handoff, not this public repository.

## Tasks

- [x] Prepare and verify the standalone Local platform.
- [x] Integrate readiness checks and Local initialization into Yoma's existing startup pattern.
- [x] Synchronize only the integration section of ignored Local settings.
- [x] Verify local initialization and application startup after reset.
- [x] Add a parameterized local reset helper for an existing standalone container setup; document prerequisites and data-reset coordination.
- [x] Add an enabled-by-default local SSI opt-out shared by Compose init and the API; retain scheduling while pausing workers and blocking SSI endpoints.
- [x] Prepare ignored Local settings containing `{}` and disable SSI in e2e CI; keep local defaults enabled.
- [x] Make development fixture import tolerate a complete existing user set on restart without overwriting identities.
- [ ] Help Jason prepare his supported standalone setup and privately supplied Local settings.
- [ ] SRE: provision Dev and deliver environment-specific configuration/secrets privately.
- [ ] SRE: review development-fixture provisioning requirements before Dev rollout.
- [x] Review the supplied Dev/Stage configuration structure against the adapter model; secret values and deployed behavior remain unverified.

## Decisions

- Keep the platform independent; no mono source changes or embedded Yoma-stack deployment.
- Local initialization is not a deployed provisioning mechanism.
- 2026-11-03: Reuse `AppSettings.SSIEnabledEnvironments` through the local Compose override
  `YOMA_SSI_ENABLED_ENVIRONMENTS`. `None` skips provisioning and workers and returns 503 on SSI
  endpoints. Adrian explicitly retained scheduling; schema-dependent business flows still need
  seeded mappings. Keep the hard stop when enabled and document VS configuration separately.
- 2026-11-02: Share only the generic local reset entry point. Standalone installation,
  bootstrap/start scripts and environment-specific values remain privately supplied prerequisites.
- 2026-11-02: Public docs contain startup steps and ownership only. Private access details,
  topology and privileged setup procedures are removed and retained outside Git.

## Links

- [Startup / deployment handoff](../environment.md)
- [Local SSI opt-out handoff](./handoffs/2026-11-03-a.md)
- [Historical setup handoff](./handoffs/2026-10-27-a.md)
