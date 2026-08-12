# Context Pack: <TICKET> — <name>

<!--
  A context pack REPLACES a set of handoffs whose provenance can no longer be verified — typically
  work that predates this convention, or whose cited commits were squashed away on merge.

  It is a reconstruction. Say so, keep the shape below, and never call it lossless: the narrative
  is deliberately gone and only git still has it. What must survive is every decision, contract and
  gotcha a future session would otherwise rediscover the hard way.

  Do NOT write one of these for handoffs that were written live and whose SHAs resolve. Those are
  better evidence than any summary — `git mv` them and leave them alone.
-->

## Provenance

- **Replaces**: <the handoff files this pack stands in for, by original path>
- **Source now at**: `docs/work/archive/<EPIC>-<slug>/…` <or: "removed; recover with `git log --follow <path>`">
- **Rebuilt from**: <branch, tickets, out-of-repo notes — be specific about what was actually read>
- **Could not be verified**: <what was unverifiable and why, e.g. "the 17 cited SHAs predate a squash
  merge and resolve nowhere in this repo; the surrounding claims could not be re-checked against a diff">
- **Written**: YYYY-MM-DD by <name>

> ⚠️ This is a reconstruction, not a contemporaneous record. Where it disagrees with the code, the
> code wins — and correct this file rather than working around it.

## Where the Work Got To

<Two or three sentences of current state, in the present tense. What is built, what is not, what is
in flight. Not a narrative of how it got there.>

## Decisions That Still Bind

<!-- The core of the pack. A decision that no longer binds anything is history — leave it out. -->

- **YYYY-MM-DD: <decision>.** <Why, and what it forbids or requires now. If the reasoning is gone,
  write "rationale not recoverable" rather than inventing one.>

## Contracts

<Endpoints, payload shapes, field semantics, validation rules — with the file or class that is the
source of truth, so the next session verifies rather than trusts this table.>

## Gotchas

<Each one should have cost someone real time. Anything that reads like general advice is noise —
cut it.>

## Open Questions

<Carried forward unanswered, with who owns each. If a question was answered but you cannot find the
answer, that is an open question again — say so.>

## Deliberately Dropped

<What did not survive the compression, so nobody assumes it never existed: superseded decisions,
struck plans, session-by-session narrative, commit citations that no longer resolve. Name the git
path where the detail still lives.>
