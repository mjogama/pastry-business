---
name: commit
description: Review all changed files, flag anything that should not be committed, then commit everything on the current branch. Only run when the user calls /commit.
disable-model-invocation: true
---

# Commit all changes

Be brief. No narration between steps. Do not push.

## 1. Stage and look

Run from the repo root:

```bash
git add -A && git status --short && git diff --cached --stat
```

If nothing is staged, say "Nothing to commit." and stop.

Then read the diff, skipping lockfiles:

```bash
git diff --cached -- . ':(exclude)*package-lock.json' ':(exclude)*pnpm-lock.yaml' ':(exclude)*yarn.lock'
```

If that diff is very large (over ~1500 lines), read it per file for source files only and rely on `--stat` for the rest.

## 2. Check for problems

Flag only these. Do not comment on style or design.

**Files that should not be committed**
- `.env` or `.env.*` other than `.env.example`; keys or certificates (`*.pem`, `*.key`, `id_rsa`)
- build or dependency output: `node_modules/`, `dist/`, `build/`, `coverage/`
- OS and editor junk: `.DS_Store`, `Thumbs.db`, `*.swp`
- logs and large binaries (`*.log`, archives, files over ~1 MB)

**Content problems in the diff**
- secrets: API keys, tokens, passwords, private keys, connection strings with credentials
- merge conflict markers: `<<<<<<<`, `=======`, `>>>>>>>`
- leftover debugging: `console.log`, `debugger`, `it.only`, `describe.only`
- a dependency added to a `package.json` without a matching lockfile change (`package-lock.json` for root and `server/`, `pnpm-lock.yaml` for `client/`), or the reverse

## 3. Decide

**No problems:** go to step 4.

**Problems found:** list each as one line, `file:line - problem`. Then ask the user with AskUserQuestion:

- "Continue and commit": go to step 4.
- "Stop, I'll fix it first": run `git reset -q`, then say "Unstaged. Run /commit again once fixed." and stop.

## 4. Commit

Write the message from the staged diff only, never from the conversation, earlier commits, or what you think was intended:

- a subject line of at most 72 characters, imperative mood ("Add auth module", "Fix rate limit header"), naming the main change
- a blank line, then 1 to 5 short bullets when the change touches more than one area; omit them for a small change
- end with the commit attribution trailer this session provides, if any

Before committing, check the message against `git diff --cached --stat`:

- every bullet (or the subject, if there are no bullets) points to at least one staged file
- every staged area (each top-level folder or feature touched) is covered by the subject or a bullet
- it says nothing about unstaged, untracked or deleted-but-unstaged work
- it states what changed, not guesses about why (no "to improve performance" unless the diff shows it)

If any check fails, rewrite the message before committing.

Commit with a heredoc so the formatting survives:

```bash
git commit -F - <<'EOF'
<message>
EOF
```

If a pre-commit hook fails, show its output and stop. Do not retry with `--no-verify`.

Reply with one line: the short hash and the subject.
