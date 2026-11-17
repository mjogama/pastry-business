---
name: sort-imports
description: Fix the import order in every file under server/src to the project style (packages first, then project files, each group shortest line to longest). Use when the user runs /sort-imports or asks to fix or make imports consistent in src.
---

# Sort imports in server/src

A script does the work. Do not reorder imports by hand and do not read the files. Be brief.

## Style it enforces (for reference only)

```ts
import cors from "cors";
import helmet from "helmet";
import express, { type Express } from "express";

import { registerRoutes } from "./routes";
import { type Env, env } from "./config/env";
import { healthModule } from "@modules/health/health.module";
```

- Group 1: npm packages and `node:` built-ins. Group 2: project files (the path aliases in `server/tsconfig.json`, such as `@app/`, `@modules/`, `@shared/`, `@common/`, and `./` `../`).
- Each group sorted shortest line to longest; equal lengths compared character by character.
- One blank line between groups, no comments.
- Side-effect imports such as `import "dotenv/config";` stay first in their original order, because they must run before anything else.
- Only `server/src/`. Never touch `tests/`, config files or `client/`; Biome sorts those.

## Steps

Run from the repo root:

```bash
node .claude/skills/sort-imports/sort-imports.mjs server
cd server && npx biome format --write src && node ../.claude/skills/sort-imports/sort-imports.mjs . --check && npx tsc --noEmit
```

The format pass can wrap a long import onto several lines; the `--check` run confirms the order still holds afterwards.

## Report

One line: how many files were fixed (or "already consistent"), and whether the typecheck passed. If `--check` or `tsc` failed, show its output and stop.
