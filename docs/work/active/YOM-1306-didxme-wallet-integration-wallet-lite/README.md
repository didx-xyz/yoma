# Epic: YOM-1306 — didx:me wallet integration (Wallet Lite)

## Meta

- **Epic**: [YOM-1306](https://linear.app/didx/issue/YOM-1306)
- **Owners**: Adrian (API), Jason (web), Robbie/SRE (environments)
- **Status**: in-progress — Stage recovery/Replay verified; YoID profile replacement in review
- **Branch**: `feature/yom-1306-yoid-revocation-reissuance`

## Goal

Integrate didx:me behind Yoma's existing SSI provider boundary for YoID and opportunity
credentials. Preserve the domain process and retain Aries infrastructure for a deliberately
planned recovery/cutover. Provider changes are not an automatic runtime fallback.

## Start Here — Jason / Robbie

Use the [local startup guide](./environment.md): obtain Local configuration privately, prepare
standalone mono using DIDx's supported private instructions, start mono, then start Yoma.
Yoma Local initialization prepares the integration and updates the integration and identity token sections of the ignored
Local file. Participant provisioning and issuance still run through application jobs.

This repository is public. Private platform research, access instructions, security configuration
and environment receipts belong in the approved private team handoff, not Markdown here.

## Child Features

| Feature | Owner | Status |
| --- | --- | --- |
| [YOM-1307 — Environments](./YOM-1307-provision-didxme-environments-for-yoma/feature.md) | Adrian / SRE | review |
| [YOM-1308 — Identity integration](./YOM-1308-federate-yoma-identities-with-didxme-wallet-lite/feature.md) | Adrian / Jason | in-progress |
| [YOM-1309 — Provider adapter](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/feature.md) | Adrian | review |
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
- Recovery and Replay have been verified locally and reconciled on Stage. YoID profile replacement is a separate change under YOM-1309; review and live local replacement/status/retry tests passed. Approval and deployed verification remain pending.

## Cross-area Handoff

YoID profile replacement adds `status` (`Unknown` / `Issued` / `Revoked` / `Expired`) to wallet list and detail responses. Revoked wallet copies remain visible until deletion succeeds, including alongside their issued replacement if cleanup fails. The provider resolves lifecycle status; unavailable status remains `Unknown` unless a known signed expiry establishes `Expired`. Jason must render status tags and retain both entries by native credential ID; see the [replacement UI handover](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-11-c.md#jason--wallet-status-tags). Opportunity credentials remain historical snapshots.

Cards use lifecycle status. Detail adds `verificationStatus`: Verified for Issued, Invalid for Revoked/Expired and Unknown otherwise. This display result relies on provider issuance/receipt verification and current lifecycle checks; it is not a fresh signature check or a verified presentation. No per-view cryptographic re-verification is planned. Proof acceptance remains a separate operation. The linked UI handover owns the full contract.

Two custom-field source keys changed while retaining definition identity and display labels:
`EntrepreneurshipProgrammeOtherDescription` becomes `EntrepreneurshipProgrammeOther`, and
`EntrepreneurshipRegistrationReference` becomes `EntrepreneurshipRegistrationRef`.
Jason aligned the frontend references and added guards on this branch; coordinated rollout remains.
See the
[API/frontend handoff](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-02-a.md#credential-attribute-names--implemented-api-change-and-jason-handoff).

## Release Gates

PR #2013 merged and Adrian confirmed initial Stage issuance and wallet access. The next phase
addresses issuance tracking and interim recovery; YoID replacement/revocation follows separately.
See the [phase-1 handoff](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-10-a.md).
The subsequent [local background-access proof](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-10-b.md)
passed recovery lookup, deletion and replacement without a holder password or existing login.
Application integration and the real VS job run now pass, including recovery without an issuance
journal and Replay for both credential families. See the [local debug results and release preparation](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-10-e.md).
Deployed configuration/verification and Stage preset/data preparation remain outstanding.

The latest PR follow-ups are in the [2026-11-08 handoff](./handoffs/2026-11-08-a.md).
The Medium batch is committed and pushed on PR #2013; detailed task status lives in the
[adapter feature](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/feature.md).
Jason's consolidated UI/Keycloak checklist is in the [2026-11-09 handoff](./handoffs/2026-11-09-a.md);
the full API contracts and test history remain in the [2026-11-06 handoff](./handoffs/2026-11-06-a.md);
earlier decisions remain in the [2026-11-03 handoff](./handoffs/2026-11-03-a.md).
Jason's §1–§2 work (reward-pool endpoint, terminal upload rejection, rich-text/log sanitising,
Keycloak OTP consume-once and brute-force attribution) is in the
[2026-11-09-b handoff](./handoffs/2026-11-09-b.md); document previews and the §3–§4 groups remain.

1. Verify the locally tested recovery and Replay flows in Dev with deployed permissions and callbacks.
2. Finish participant/browser/mobile and credential-detail checks with Jason.
3. SRE provisions Dev once and supplies ongoing deployment configuration/secrets privately.
4. Rehearse data cutover/reissuance and agree rollback/retention before retiring Aries.
5. Adrian reviews remaining changes and authorizes merge when the release gates are met.

Local provisioning, issuance, API wallet list/detail and caching have been exercised. This is
not a claim of deployed readiness or a completed browser journey. See [plan](./plan.md) and the
[adapter checklist](./YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/feature.md).
