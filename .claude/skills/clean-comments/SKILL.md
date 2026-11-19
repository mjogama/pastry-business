---
name: clean-comments
description: Remove the code comments an agent added, in one command. By default strips comments only on lines added since HEAD (staged, unstaged and untracked JS/TS files), so existing comments are untouched. Use when the user runs /clean-comments or asks to clean up, strip or remove the agent's (or "your") comments.
argument-hint: "[paths...] [--all] [--check]"
---

# Clean up agent comments

A script does the work in one call. Do not remove comments by hand and do not read the files first. Be brief.

## Run

From the repo root, passing the user's arguments through (none is the normal case):

```bash
node .claude/skills/clean-comments/clean-comments.mjs $ARGUMENTS
```

- No arguments: every comment on a line added since `HEAD`, in every changed or untracked `.ts/.tsx/.js/.jsx/.mjs/.cjs` file.
- `<paths...>`: the same, limited to those files or folders.
- `--all <paths...>`: every comment in those paths, including old ones. Only when the user asks for it.
- `--check`: list what would go, change nothing (exits 1 if anything would).

## What it keeps

Directives and markers are never removed: `@ts-expect-error`/`@ts-ignore`, `biome-ignore`, `eslint-disable`, `prettier-ignore`, coverage ignores, `/// <reference>`, `/*! license */`, `#region`, and `TODO`/`FIXME`/`HACK`/`XXX`. It parses files with TypeScript, so `//` inside strings, regexes and JSX text is safe, and JSX `{/* ... */}` is removed along with its braces.

## Report

One line from the script's summary: how many comments were removed in how many files (or "no comments to remove"). Do not list them unless the user asks. If the script exits with an error, show its output and stop.
