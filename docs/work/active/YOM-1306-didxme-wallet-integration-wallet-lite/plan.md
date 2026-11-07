# Implementation plan — YOM-1306

## Scope

Use the existing Yoma SSI provider boundary for didx:me integration. Preserve domain processes,
keep Aries infrastructure available, and isolate provider adaptation in infrastructure. The
initial detailed private-platform analysis has been removed from this public document; request
it through the private team handoff when authorized implementation work requires it.

## Implementation Sequence

1. Prepare standalone Local platform dependencies and automate Yoma Local initialization.
2. Implement identity integration and provider operations following existing API conventions.
3. Support SDJWT for YoID and opportunities while retaining Aries formats/behavior.
4. Maintain provider-specific schema/credential mappings without changing domain identity.
5. Verify issuance and authenticated wallet reads; retain domain filtering/order/pagination.
6. Complete recovery/Replay, including preserved issuance dates and failure reconciliation.
7. Complete browser/Dev verification, coordinated frontend updates and reviewed data cutover.

Current progress and unresolved work are recorded once in the child feature checklists linked
from the [epic](./README.md). Local API issuance, reads and caching have passed; production gates
remain open.

## Local Development

Use the [startup guide](./environment.md#local-operations). Mono is independently managed;
Yoma initializes only its integration after readiness. Developers obtain ignored Local settings
privately and adapt machine-specific values. No platform credentials or private setup instructions
belong in this repository.

## Deployment and Recovery

SRE owns once-off environment preparation separately from ongoing application configuration and
secret delivery. Private deployment/security details are supplied through the approved team
channel. No Helm/CI changes or deployed resets are authorized by this plan.

A provider cutover needs an explicit data reset/reissuance/reconciliation plan. Retire prior
provider data only after validation and an agreed recovery policy. Retaining an implementation
alone does not make provider IDs or data interchangeable.

## Public Documentation Boundary

Keep Yoma scope, code contracts, acceptance criteria and non-sensitive local commands here.
Private platform API research, topology, access-store details, trust configuration, privileged
procedures and security findings must remain outside the public repository. Historical public
copies require separate Git-history remediation; editing current files does not remove them.
