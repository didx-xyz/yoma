# Linear template — Epic (parent issue)

Paste the block below into the Linear **epic** description and fill it in. Keep it free of
technical detail: no endpoints, schemas, SQL, class or file names, no code. Those live in
`docs/work/active/<EPIC>-<slug>/README.md`, which stays current as sessions change the design —
the ticket would not.

Title: a capability in plain language, e.g. _"Customizable fields / metadata framework"_. The
title becomes the folder slug, so keep it stable once work starts.

---

**Why**

<The problem this capability solves and who has it. 2–4 sentences. No solution design.>

**Outcome**

<What is true for users, admins or operators once the whole epic has shipped.>

**Children**

<One line per child issue: the ticket and the outcome it owns. Add rows as tickets are created —
this list is the epic's real content. Do not break children down by class, endpoint or file; a
child should be describable as something a person can verify.>

- <TICKET> — <outcome it owns>
- <TICKET> — <outcome it owns>

**Out of scope**

- <what this epic deliberately does not cover, and why>

**Blockers**

- <what is blocking, who owns unblocking it>

**Detail**

Plan, contract, decisions and session handoffs: `docs/work/active/<EPIC>-<slug>/README.md`

---

## Notes for whoever writes the ticket

- **Sizing.** A child that cannot be described without naming a class, endpoint or migration is a
  task, not a ticket. Fold it into a parent and let that parent's `feature.md` checklist carry the
  breakdown. Over-granular tickets produce documentation folders that only restate their own title.
- **Stable titles.** Folder names derive from the ticket id and slug; renaming a ticket mid-flight
  orphans its folder.
- **Status lives in Linear; everything else lives in the repo.** When an AI session changes the
  approach, the Decisions log in `feature.md` is updated — the ticket is only touched if the
  _outcome or scope_ changed.
