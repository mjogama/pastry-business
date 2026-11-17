// Shared by new-module.mjs and remove-module.mjs so both derive the same names from user input.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const serverDir = join(root, "server");
export const routesFile = join(serverDir, "src/app/routes/v1/routes.ts");

export function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Reads <name> from `<name>` or `--name <name>` in the CLI args. */
export function readNameArg(usage) {
  const args = process.argv.slice(2);
  const flagIndex = args.indexOf("--name");
  const rawName = flagIndex >= 0 ? args[flagIndex + 1] : args.find((arg) => !arg.startsWith("-"));
  if (!rawName) fail(usage);
  return rawName;
}

/** "blog-post" | "blogPost" | "BlogPost" -> every casing the templates need. */
export function moduleNames(rawName) {
  const words = rawName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

  if (words.length === 0 || !words.every((word) => /^[a-z][a-z0-9]*$/.test(word))) {
    fail(`Invalid module name "${rawName}". Use letters and digits, e.g. auth, blog-post, blogPost.`);
  }

  const pluralWords = [...words.slice(0, -1), pluralize(words.at(-1))];
  const pascal = (list) => list.map((word) => word[0].toUpperCase() + word.slice(1)).join("");
  const camel = (list) => list[0] + pascal(list.slice(1));
  const sentence = (list) => list.join(" ").replace(/^./, (char) => char.toUpperCase());

  return {
    kebab: words.join("-"),
    kebabs: pluralWords.join("-"),
    Name: pascal(words),
    Names: pascal(pluralWords),
    name: camel(words),
    label: words.join(" "),
    Label: sentence(words),
    Labels: sentence(pluralWords),
  };
}

function pluralize(word) {
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
}
