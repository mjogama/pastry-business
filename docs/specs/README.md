# Feature specs

One file per new feature or significant change, written **before** the work starts and updated when it's done. It records what was asked, what was decided and what changed, so the next person (or agent) knows why the code looks the way it does.

## File name

```
<YYYY-MM-DD>-<feature-name>.md
```

- `YYYY-MM-DD`: the day the spec was started.
- `feature-name`: kebab-case, a few words.

Example: `2026-11-23-recipe-search.md`

## How to write one

1. Copy [`_TEMPLATE.md`](./_TEMPLATE.md) to a new file named as above.
2. Fill in **Summary**, **Scope** and **Design** before writing code. Ask the owner about anything under **Open questions** instead of guessing.
3. When done, set **Status** to `done`, fill in **Changes** with the files touched, and update the page's story in `docs/architecture/` if the feature changed how a page works.

Specs are never deleted. If a later spec replaces one, set the old one's **Status** to `superseded by <file>`.
