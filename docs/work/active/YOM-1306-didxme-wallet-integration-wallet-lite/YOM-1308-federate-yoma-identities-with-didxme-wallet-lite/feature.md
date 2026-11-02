# Feature: Federate Yoma identities with didx:me Wallet Lite

## Meta

- **Ticket**: YOM-1308
- **Epic**: [YOM-1306](../README.md)
- **Owner**: Adrian; participant journey with Jason
- **Status**: in-progress — local API identity flow verified; browser/Dev checks remain

## Goal

Let participants access their credentials through their normal Yoma sign-in. Keep identity
integration within the established Yoma initialization and provider patterns. Detailed platform
security/configuration and investigation results belong in the private team handoff.

## Tasks

- [x] Prepare and validate the Local identity integration.
- [x] Apply Yoma-side configuration through its existing initialization process.
- [x] Verify participant identity resolution and authenticated API wallet reads locally.
- [x] Align full-reset development fixture identity IDs with SQL seeds.
- [x] Verify automatic Local integration initialization and repeatable local configuration.
- [ ] Verify browser sign-in, refresh and subsequent wallet access with Jason.
- [ ] Verify mobile-only identity and later email changes preserve wallet ownership.
- [ ] Confirm Dev provisioning/configuration privately with SRE before rollout.
- [ ] Agree supported background-operation requirements with the platform team; see YOM-1309.

## Decisions

- Participant API authentication remains required; successful local online access does not
  establish completed background recovery/Replay.
- Fixture identity IDs are test-data conventions, not runtime identity assumptions.
- Mono remains independently managed. Public setup is in the [environment guide](../environment.md).
- 2026-11-02: Remove detailed private platform trust/grant configuration and security probes from
  public Markdown. Preserve authorized engineering material privately; history cleanup is pending.

## Links

- [Adapter tasks](../YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/feature.md)
- [Session handoff](./handoffs/2026-11-02-a.md)
