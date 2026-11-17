// Removes a module created by new-module.mjs (or by hand, following the same layout).
// Usage (from the root): npm run module:remove -- <name> [--yes]
// Deletes the server module, its shared contract, its tests and client/features/<name>, and unmounts it.
// Asks for confirmation first unless --yes is passed. Deleted files are not recoverable outside git.

import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createInterface } from "node:readline/promises";

import { fail, moduleNames, readNameArg, root, routesFile, serverDir } from "./module-names.mjs";

const PROTECTED = new Set(["health"]);

const rawName = readNameArg("Usage: npm run module:remove -- <name> [--yes]   (e.g. npm run module:remove -- blog-post)");
const n = moduleNames(rawName);
const skipConfirm = process.argv.includes("--yes") || process.argv.includes("-y");

if (PROTECTED.has(n.kebab)) fail(`"${n.kebab}" is part of the template core and can't be removed with this script.`);

// ---------- collect targets ----------

const testsDir = join(serverDir, "tests");
const testFiles = existsSync(testsDir)
  ? readdirSync(testsDir)
      // "auth.test.ts", "auth.service.test.ts" — but not "author.test.ts".
      .filter((file) => file.startsWith(`${n.kebab}.`) && file.endsWith(".test.ts"))
      .map((file) => join(testsDir, file))
  : [];

const paths = [
  join(serverDir, "src/modules", n.kebab),
  join(root, "shared/modules", `${n.kebab}.ts`),
  ...testFiles,
  join(root, "client/features", n.kebab),
].filter((path) => existsSync(path));

const routes = readFileSync(routesFile, "utf8");
const routeLines = routes.split("\n");
const isModuleLine = (line) =>
  line.includes(`"@modules/${n.kebab}/`) || line.includes(`new ${n.Name}Module(`);
const removedRouteLines = routeLines.filter(isModuleLine);

if (paths.length === 0 && removedRouteLines.length === 0) fail(`No module named "${n.kebab}" was found.`);

// ---------- confirm ----------

console.log(`This removes the "${n.kebab}" module:`);
for (const path of paths) console.log(`  - ${relative(root, path)}${statSync(path).isDirectory() ? "/" : ""}`);
for (const line of removedRouteLines) console.log(`  ~ ${relative(root, routesFile)}: ${line.trim()}`);

if (!skipConfirm) {
  if (!process.stdin.isTTY) fail("\nNo terminal to confirm in. Re-run with --yes to remove without asking.");
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  // Ctrl+C / Ctrl+D close the input and reject the question; treat that as "no".
  const answer = await prompt.question("\nDelete these? [y/N] ").catch(() => "");
  prompt.close();
  if (!/^y(es)?$/i.test(answer.trim())) fail("Cancelled. Nothing was removed.");
}

// ---------- remove ----------

for (const path of paths) rmSync(path, { recursive: true, force: true });
if (removedRouteLines.length > 0) writeFileSync(routesFile, routeLines.filter((line) => !isModuleLine(line)).join("\n"));

console.log(`\nRemoved "${n.kebab}".`);

// ---------- leftover references ----------

const leftovers = [join(serverDir, "src"), join(serverDir, "tests"), join(root, "client/app"), join(root, "client/components"), join(root, "client/features"), join(root, "client/lib"), join(root, "shared")]
  .filter((dir) => existsSync(dir))
  .flatMap(listSourceFiles)
  .filter((file) => {
    const text = readFileSync(file, "utf8");
    return text.includes(`@modules/${n.kebab}/`) || text.includes(`@common/modules/${n.kebab}"`) || text.includes(`features/${n.kebab}/`);
  });

if (leftovers.length > 0) {
  console.log("\nThese files still import it; fix them before running npm run check:");
  for (const file of leftovers) console.log(`  ! ${relative(root, file)}`);
}

function listSourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === "node_modules" || name.startsWith(".")) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}
