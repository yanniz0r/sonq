---
name: commit
description: Stage and commit changes in this repo following its Conventional Commits style. Use when the user asks to commit, create a commit, or invokes /commit.
---

# Commit

Create a git commit that matches how this repository's history is actually
written. Do not invent a different style — match what `git log` shows.

## This repo's commit message convention

Inspect recent history before drafting if you haven't already this session:

```
git log --pretty=format:"%s" -20
```

Observed pattern:

- Subject line: `type: imperative summary`, all lowercase, no trailing period.
  - Types used here: `feat`, `fix`, `chore`, `ci`, `test`. Don't introduce a
    new type (e.g. `docs`, `refactor`) unless nothing existing fits.
  - Imperative mood ("add", "let players guess by search", "remove"), not
    past tense.
  - No scope in parentheses (e.g. no `feat(routes):`) — this repo doesn't use
    that.
- Body: omit it for small/obvious changes (most commits here have none). Add
  a short body only when the _why_ isn't obvious from the diff or subject —
  e.g. explaining a non-obvious design choice. Wrap body prose at ~76
  columns.
- Trailer: every commit ends with a `Co-Authored-By:` line crediting the
  Claude model that made it — check this session's attribution instructions
  (system reminder) for the exact current line to use, and use that verbatim.
  Never fabricate a different model name.

Example shape:

```
feat: let players guess by search

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

## Steps

1. Run in parallel: `git status`, `git diff` (staged + unstaged), and
   `git log --pretty=format:"%s" -20` (skip the log call if you already have
   recent history in context).
2. Decide what belongs in this commit. Only stage what's relevant to the
   change being committed — never `git add -A` or `git add .` blindly; name
   files explicitly. Flag anything that looks like a secret (`.env`,
   credentials) before staging it, and don't commit it without asking.
3. Draft the subject line (and body, if warranted) following the convention
   above, focused on _why_ the change was made, not a restatement of the
   diff.
4. Stage the chosen files and commit in one shot using a HEREDOC so the
   message formats correctly:

   ```
   git commit -m "$(cat <<'EOF'
   type: summary here

   Co-Authored-By: <current attribution line>
   EOF
   )"
   ```

5. Run `git status` after to confirm the commit succeeded and nothing
   unexpected got left uncommitted or staged.

## Rules

- Only commit when the user has asked for it in this conversation. If it's
  unclear whether "commit this" means now or later, ask.
- Never use `--amend` unless the user explicitly asks for it — hooks can fail
  a commit silently-ish, and amending in that case rewrites the wrong parent.
- Never pass `--no-verify`, `--no-gpg-sign`, or `-c commit.gpgsign=false`
  unless explicitly requested.
- If a pre-commit hook fails, fix the underlying issue, re-stage, and make a
  new commit — don't bypass the hook.
- Don't push. This skill only creates local commits.
