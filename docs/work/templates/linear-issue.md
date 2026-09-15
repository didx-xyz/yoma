# Linear template — Issue (child of an epic)

Paste the block below into the Linear **issue** description and fill it in. Keep it free of
technical detail: no endpoints, payloads, schemas, SQL, class or file names, no code. Those live in
`docs/work/active/<EPIC>-<slug>/<TICKET>-<slug>/feature.md`.

Title: the outcome, in the language of whoever benefits — _"Filter opportunities by configured
custom fields"_, not _"Add customFields to OpportunitySearchFilter"_. The title becomes the folder
slug, so keep it stable once work starts.

---

**Why**

<Who is blocked, and by what. 1–2 sentences.>

**Outcome**

<What is true once this ships, in user or operator terms.>

**Acceptance criteria**

<Observable behaviour only. Someone who cannot read the code must be able to check each line.>

- <criterion>
- <criterion>

**Scope**

- In: <the boundary>
- Out: <what belongs to a sibling ticket, and which one>

**Blocked by**

- <ticket / person / external dependency, or "nothing">

**Detail**

Plan, decisions and session handoffs:
`docs/work/active/<EPIC>-<slug>/<TICKET>-<slug>/feature.md`

---

## Notes for whoever writes the ticket

- **If you cannot write the acceptance criteria without naming a class or endpoint, the ticket is
  too small.** Make it a checklist row in the parent's `feature.md` instead, carrying the ticket id
  if one already exists.
- **One ticket per deliverable**, not per commit. Ten tickets that each describe one refactor step
  produce ten documentation folders that restate their own titles and then rot.
- **Do not paste session output into the ticket** — no diffs, no command output, no file lists. Link
  the feature folder; it is versioned alongside the code and cannot drift from it.
- Agents must not edit ticket descriptions unless explicitly asked.
