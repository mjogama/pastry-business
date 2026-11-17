import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const serverDir = process.argv[2];
const checkOnly = process.argv.includes("--check");

if (!serverDir) {
  console.error("Usage: node sort-imports.mjs <server-dir> [--check]");
  process.exit(2);
}

const localPrefixes = [".", ...readAliasPrefixes(serverDir)];

function readAliasPrefixes(dir) {
  try {
    const paths = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8")).compilerOptions?.paths ?? {};
    return Object.keys(paths).map((alias) => alias.replace(/\*$/, ""));
  } catch {
    return ["@app/", "@modules/", "@shared/", "@common/"];
  }
}

function listTsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listTsFiles(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

function sortFile(text) {
  const lines = text.split("\n");
  const statements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (!line.startsWith("import ")) break;

    const block = [line];
    while (!block.at(-1).trimEnd().endsWith(";") && i + 1 < lines.length) {
      i++;
      block.push(lines[i]);
    }
    statements.push(block);
    i++;
  }

  if (statements.length === 0) return text;

  const flat = (block) => block.map((l) => l.trim()).join(" ");
  const source = (block) => flat(block).match(/["']([^"']+)["'];?\s*$/)?.[1] ?? "";
  const isSideEffect = (block) => /^import\s+["']/.test(block[0]);
  const isLocal = (block) => localPrefixes.some((prefix) => source(block).startsWith(prefix));
  const byLength = (a, b) => {
    const [x, y] = [flat(a), flat(b)];
    return x.length - y.length || (x < y ? -1 : x > y ? 1 : 0);
  };

  const sideEffects = statements.filter(isSideEffect);
  const packages = statements.filter((b) => !isSideEffect(b) && !isLocal(b)).sort(byLength);
  const files = statements.filter((b) => !isSideEffect(b) && isLocal(b)).sort(byLength);

  const groups = [[...sideEffects, ...packages], files].filter((group) => group.length > 0);
  const header = groups.map((group) => group.flat().join("\n")).join("\n\n");

  return `${header}\n\n${lines.slice(i).join("\n")}`;
}

const changed = [];
for (const file of listTsFiles(join(serverDir, "src"))) {
  const before = readFileSync(file, "utf8");
  const after = sortFile(before);
  if (after !== before) {
    changed.push(relative(serverDir, file));
    if (!checkOnly) writeFileSync(file, after);
  }
}

const verb = checkOnly ? "out of order" : "fixed";
console.log(changed.length === 0 ? "All imports in src are in order." : `${changed.length} file(s) ${verb}:`);
for (const file of changed) console.log(`  ${file}`);
process.exit(checkOnly && changed.length > 0 ? 1 : 0);
