# Work Docs Convention

This folder tracks planned work and session handoffs for AI-assisted development. The convention is tool-agnostic — it works identically with Claude Code, Codex, Cursor, Copilot, or no AI at all.

## Structure

Work is organised by **epic**, with one sub-folder per **Linear issue**. Folder names carry the
ticket id and the Linear slug, so a folder can always be traced back to its ticket.

```
docs/work/
  templates/            # copy these to start
    epic.md
    feature.md
    handoff.md
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

- One folder per Linear issue. If work does not have a ticket, get one before writing a feature doc.
- A session that spans several child tickets (a branch sync, a cross-cutting refactor) may put its handoff in an epic-level `handoffs/` folder instead; file it under a ticket whenever one clearly owns it.
- Shared contracts, cross-cutting rules and blockers live in the **epic README**, once — not copied into each feature doc. Feature docs link to it.
- Never start coding on an existing feature without reading the epic `README.md`, the feature's `feature.md` and its latest handoff.
- Never end a session without writing a handoff. A thin handoff beats no handoff.
- A handoff written after the fact must say so — mark it `RECONSTRUCTED` in the title and name the commits it was rebuilt from. Do not present a reconstruction as a contemporaneous record.
- `active/` should stay small (a handful of epics). If it grows stale, archive or delete.
