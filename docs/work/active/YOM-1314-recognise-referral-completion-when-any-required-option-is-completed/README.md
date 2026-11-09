# Referral pathway completion recognition

## Scope

[YOM-1314](https://linear.app/didx/issue/YOM-1314/recognise-referral-completion-when-any-required-option-is-completed) is a standalone API hotfix owned by Adrian. See [the feature record](./YOM-1314-recognise-referral-completion-when-any-required-option-is-completed/feature.md) for status and technical detail.

Completion must honour Any/All at both pathway and step levels. Percentages already honour these rules, but completion previously required every item: a claim could show 100% and remain Pending.

## Boundaries

- Preserve eligibility, completion windows, terminal statuses, reward allocation and transaction handling.
- No migration, frontend change or automatic historical repair.
- Recover eligible Pending claims through the normal completion service after deployment and separate operational review, never by directly setting Completed in SQL.
- Expired claims require a separate evidence-backed decision; current pathway settings do not prove historical eligibility.

## Cross-area note

Jason can test the existing referral flow with one of two optional tasks completed, then one of two optional steps completed. The claim should complete without requiring unused alternatives. No frontend files changed; browser coverage is not claimed by this API session.
