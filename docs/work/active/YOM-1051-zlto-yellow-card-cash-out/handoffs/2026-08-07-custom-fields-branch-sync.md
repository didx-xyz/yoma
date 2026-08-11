# Custom Fields Branch Sync

## Branch

`feature/custom-fields-framework`

## Summary

- WIP SSI/custom-field schema management groundwork has been added.
- The changes are non-breaking and backwards compatible.
- IXO/master changes are included in the branch.
- Final branch merge commit: `d22056e67`

## UI Notes

- The duplicate “Time to complete” fix is present.
- No additional UI changes were introduced during the branch sync.
- We missed handing over that the API `OpportunityType` model now includes `displayName`. The UI model still needs to expose it for the upcoming opportunity schema-selection work.

## Verification

- Local and remote branches are aligned.
- Worktree is clean.
- API startup, schema seeding, partner sync, verification sync, completion, tenant creation and credential issuance were verified successfully.
