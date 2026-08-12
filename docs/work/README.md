# Work Docs Convention

This folder tracks planned work and session handoffs for AI-assisted development. The convention is tool-agnostic — it works identically with Claude Code, Codex, Cursor, Copilot, or no AI at all.

## Structure

Work is organised by **epic**, with a sub-folder per **Linear issue that warrants one** (see
[Does this ticket get a folder?](#does-this-ticket-get-a-folder) below). Folder names carry the
ticket id and the Linear slug, so a folder can always be traced back to its ticket.

```
docs/work/
  templates/            # copy these to start
    epic.md             # → active/<EPIC>-<slug>/README.md
    feature.md          # → active/<EPIC>-<slug>/<TICKET>-<slug>/feature.md
    handoff.md          # → …/handoffs/YYYY-MM-DD-a.md
    linear-epic.md      # paste into the Linear epic description
    linear-issue.md     # paste into the Linear issue description
    context-pack.md     # replaces handoffs whose provenance cannot be verified
  active/
    YOM-1244-customizable-fields-framework/        # epic = the Linear parent issue
      README.md                                    # epic: scope, ticket map, shared contract
      YOM-1255-ui-dynamic-custom-fields-for-opportunities-and-completions/
        feature.md                                 # what/why, plan, task checklist, decisions
        handoffs/
          2026-07-22-a.md                          # one per session (date + letter)
      YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/
        feature.md
        handoffs/
          2026-08-11-a.md
  archive/
    YOM-1244-customizable-fields-framework/        # whole epic moves here when shipped
```

- **Epic folder**: `<TICKET>-<linear-slug>` of the parent issue, e.g. `YOM-1244-customizable-fields-framework`.
- **Feature folder**: `<TICKET>-<linear-slug>` of the child issue, e.g. `YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions`. Take the slug straight from the Linear URL.
- No `api/` or `web/` split — the ticket is already area-specific, and `feature.md` carries an `Areas:` field.

**Standalone work with no epic** still gets an epic folder — use its own ticket
(`YOM-1234-<slug>/`) with a short `README.md` and one feature sub-folder. Consistency beats
special cases.

## Does this ticket get a folder?

Not every ticket does. A folder whose `feature.md` only restates the ticket title is worse than no
folder: it looks like documentation, so nobody writes the real thing, and it still has to be
maintained. **One folder per deliverable, not one per commit-sized ticket.**

Create a folder when **at least one** is true:

- Someone will spend a session on it, so it will collect handoffs.
- It carries decisions, gotchas or a contract a future session must not rediscover.
- It is blocked or unbuilt and the _reason_ is worth recording.

Otherwise it stays a checklist row in the parent's `feature.md` Tasks, with the ticket id in the
row. Closed historical tickets that were never documented do not need a retro folder — one line in
the epic README's ticket map is enough.

**Smell test.** If the Plan, Tasks and Decisions could be reconstructed from the ticket title
alone, do not create the file. Filler like _"Implement the ticket scope"_ or _"Integrate with
shared validation where applicable"_ is the signal you are documenting a title, not a deliverable.

The same test shapes new tickets: if a ticket cannot be described without naming a class, endpoint
or file, it is a task, not a ticket — fold it into a parent and let that parent's task checklist
carry the breakdown. See `templates/linear-epic.md` and `templates/linear-issue.md`.

## When the history cannot be trusted: context packs

Sometimes a doc set arrives whose provenance cannot be verified — work that predates this
convention, or handoffs citing commits that were squashed away on merge and now resolve nowhere.
Carrying those forward is worse than not having them: they read as traceable and are not.

In that case, replace them with a **context pack** (`templates/context-pack.md`): one document per
epic or ticket, keeping every decision, contract and gotcha, and dropping the session narrative.

**It fires on unverifiable provenance, not on restructuring.** Those are different things:

| Situation                                                              | Do this                                              |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| Handoffs written live; cited SHAs resolve                              | `git mv` them. They are better evidence than a summary |
| Handoffs already reconstructed, or SHAs that resolve nowhere           | Write a context pack and archive the originals       |
| A mix                                                                  | Move the good ones; pack only the unverifiable ones  |

Three rules, or the pack becomes the next problem:

- **Never call it lossless.** It is a reconstruction — the narrative is gone on purpose and only git
  still has it. A pack that claims nothing was lost licenses exactly the belief the `RECONSTRUCTED`
  rule exists to prevent. "Decision-complete" is the bar: every decision, contract and gotcha
  survives.
- **Never delete the source.** Archive it and say where it went. Git is the lossless layer; the pack
  is the readable one.
- **Never pack a pack.** Compressing an already-compressed doc set loses the detail that would let
  anyone check either version. If a pack is stale, correct it against the code.

## Lifecycle

- [ ] **Start an epic**: copy `templates/epic.md` to `active/<EPIC>-<slug>/README.md`. Record the scope, the ticket map, any contract shared by the children, and the blockers.
- [ ] **Start a feature**: copy `templates/feature.md` to `active/<EPIC>-<slug>/<TICKET>-<slug>/feature.md`, and add a row for it to the epic README's child table.
- [ ] **Work**: keep the task checklist and Decisions log in `feature.md` current during each session. Anything that affects sibling features belongs in the epic README instead.
- [ ] **End every session**: copy `templates/handoff.md` to `<TICKET>-<slug>/handoffs/YYYY-MM-DD-a.md` (increment the letter for a second session that day) and fill it in. Commit it with the code.
- [ ] **Hand over to the other person**: commit + push, then post the file link in Slack. The handoff document is the source of truth, not the Slack message.
- [ ] **Ship**: set `Status: shipped` in the feature's `feature.md`. When every child has shipped, set the epic's status too and `git mv docs/work/active/<EPIC>-<slug> docs/work/archive/<EPIC>-<slug>`.

## Linear vs these docs

**Linear tracks status; these documents hold the technical detail.** A ticket that carries
endpoint shapes, schemas or file paths goes stale the first time an AI session changes the
design — and a stale ticket is worse than an empty one, because it gets read as current.

Keep in the ticket: the problem, the user-facing outcome, acceptance criteria in business terms,
scope boundaries, status/assignee/priority, parent-child links, blockers, and a link to the
epic or feature folder.

Keep here: endpoints, payloads, models, migrations, file and class names, the implementation
plan, decisions and their rationale, task checklists, gotchas and handoffs.

When an approach changes mid-session, append to the feature's Decisions log — do not rewrite the
ticket description. Update the ticket only when the _outcome or scope_ changed. Agents must not
edit ticket descriptions unless explicitly asked.

## Rules

- At most one folder per Linear issue, and only for issues that pass the test above. If work does not have a ticket, get one before writing a feature doc.
- A session that spans several child tickets (a branch sync, a cross-cutting refactor) may put its handoff in an epic-level `handoffs/` folder instead; file it under a ticket whenever one clearly owns it.
- Shared contracts, cross-cutting rules and blockers live in the **epic README**, once — not copied into each feature doc. Feature docs link to it.
- Never start coding on an existing feature without reading the epic `README.md`, the feature's `feature.md` and its latest handoff.
- Never end a session without writing a handoff. A thin handoff beats no handoff.
- A handoff written after the fact must say so — mark it `RECONSTRUCTED` in the title and name the commits it was rebuilt from. Do not present a reconstruction as a contemporaneous record.
- **Every commit SHA written into a doc must resolve.** A citation that does not is worse than none — it reads as provenance and cannot be followed. Copy hashes from `git log`, never from memory, and check before committing:

  ```bash
  for h in $(grep -rlo RECONSTRUCTED docs/work/active --include=*.md); do
    for s in $(grep -oE '`[0-9a-f]{7,10}`' "$h" | tr -d '`' | sort -u); do
      git cat-file -e "$s^{commit}" 2>/dev/null || echo "MISSING $s in $h"; done; done
  ```

  If the source commits genuinely cannot be identified, write that instead of guessing.

- **Status is recorded once, in the feature's `feature.md`**, using `planning` | `in-progress` | `review` | `shipped` | `blocked`, optionally followed by ` — <short qualifier>` (e.g. `in-progress — dev complete, browser pass owed`). Epic README tables may repeat it for scanning, but the feature doc wins on conflict — do not invent parallel vocabularies (`production`, `testing`) in the table.
- `active/` should stay small (a handful of epics). If it grows stale, archive or delete.
