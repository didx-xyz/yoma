# Work Docs Convention

This folder tracks planned work and session handoffs for AI-assisted development. The convention is tool-agnostic — it works identically with Claude Code, Codex, Cursor, Copilot, or no AI at all.

## Structure

```
docs/work/
  templates/            # copy these to start
    feature.md
    handoff.md
  active/
    <feature-slug>/     # one folder per in-flight feature
      feature.md        # what/why, plan, task checklist, decisions
      handoffs/
        2026-08-06-a.md # one per session (date + letter)
  archive/
    <feature-slug>/     # moved here when shipped
```

## Lifecycle

- [ ] **Start**: copy `templates/feature.md` to `active/<feature-slug>/feature.md`. Slug is short kebab-case (e.g. `referral-rewards`).
- [ ] **Work**: keep the task checklist and Decisions log in `feature.md` current during each session.
- [ ] **End every session**: copy `templates/handoff.md` to `active/<slug>/handoffs/YYYY-MM-DD-a.md` (increment the letter for a second session that day) and fill it in. Commit it with the code.
- [ ] **Hand over to the other person**: commit + push, then post the file link in Slack. The handoff document is the source of truth, not the Slack message.
- [ ] **Ship**: set `Status: shipped` in `feature.md`, then `git mv docs/work/active/<slug> docs/work/archive/<slug>`.

## Rules

- One feature folder per unit of work. Epics are just an optional `Epic:` field in the feature header — no separate epic documents.
- Never start coding on an existing feature without reading `feature.md` and the latest handoff.
- Never end a session without writing a handoff. A thin handoff beats no handoff.
- `active/` should stay small (a handful of folders). If it grows stale, archive or delete.
