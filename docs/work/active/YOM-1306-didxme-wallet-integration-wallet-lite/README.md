# Epic: YOM-1306 — didx:me wallet integration (Wallet Lite)

## Meta

- **Epic**: [YOM-1306](https://linear.app/didx/issue/YOM-1306)
- **Owners**: Adrian (API), Jason (web), Robbie/SRE (environments)
- **Status**: in-progress — local API flow verified; release work remains
- **Branch**: `feature/yom-1306-didxme-wallet-integration-wallet-lite`

## Goal

Integrate didx:me behind Yoma's existing SSI provider boundary for YoID and opportunity
credentials. Preserve the domain process and retain Aries infrastructure for a deliberately
planned recovery/cutover. Provider changes are not an automatic runtime fallback.

## Start Here — Jason / Robbie

Use the [local startup guide](./environment.md): obtain Local configuration privately, prepare
standalone mono using DIDx's supported private instructions, start mono, then start Yoma.
Yoma Local initialization prepares the integration and updates only its section of the ignored
Local file. Participant provisioning and issuance still run through application jobs.

This repository is public. Private platform research, access instructions, security configuration
and environment receipts belong in the approved private team handoff, not Markdown here.

## Child Features

| Feature | Owner | Status |
| --- | --- | --- |
| [YOM-1307 — Environments](./YOM-1307-provision-didxme-environments-for-yoma/feature.md) | Adrian / SRE | review |
| [YOM-1308 — Identity integration](./YOM-1308-federate-yoma-identities-with-didxme-wallet-lite/feature.md) | Adrian / Jason | in-progress |
| [YOM-1309 — Provider adapter](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/feature.md) | Adrian | in-progress |
| [YOM-1310 — Participant wallet](https://linear.app/didx/issue/YOM-1310) | Jason | planning |

Feature files own detailed task status. YOM-1306 is the canonical root; the redundant earlier
ticket was removed.

## Shared Yoma Contract

- Both credential families use `SDJWT` with this adapter. Preserve existing enum values and
  Aries behavior; provider adaptation belongs in infrastructure.
- Domain scheduling, credential identity and wallet response contracts remain intact. Provider
  mappings bridge external identifiers; they are not interchangeable across providers.
- Current integration uses Yoma signing. Per-organisation signing is a future design decision;
  the existing Aries implementation is retained. See code summaries for Yoma compatibility logic.
- Wallet filtering, ordering and paging remain in the domain. No pagination redesign is included.
- Encrypted holder caching is implemented; deployed multi-instance verification remains open.
- Recovery and Replay are incomplete and block production readiness.

## Cross-area Handoff

Two custom-field source keys changed while retaining definition identity and display labels:
`EntrepreneurshipProgrammeOtherDescription` becomes `EntrepreneurshipProgrammeOther`, and
`EntrepreneurshipRegistrationReference` becomes `EntrepreneurshipRegistrationRef`.
Jason must align frontend rules/help/CSV samples before coordinated rollout. See the
[API/frontend handoff](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-02-a.md#credential-attribute-names--implemented-api-change-and-jason-handoff).

## Release Gates

PR review fixes and validation are recorded in the [2026-11-03 handoff](./handoffs/2026-11-03-a.md).
Adrian reviewed and authorized committing this batch.

1. Complete recovery and Replay; verify original issuance dates are preserved.
2. Finish participant/browser/mobile and credential-detail checks with Jason.
3. SRE provisions Dev once and supplies ongoing deployment configuration/secrets privately.
4. Rehearse data cutover/reissuance and agree rollback/retention before retiring Aries.
5. Adrian reviews implementation and authorizes commit/push.

Local provisioning, issuance, API wallet list/detail and caching have been exercised. This is
not a claim of deployed readiness or a completed browser journey. See [plan](./plan.md) and the
[adapter checklist](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/feature.md).
