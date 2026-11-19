#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const USAGE = `Usage: node clean-comments.mjs [paths...] [--all] [--check]

Removes code comments from JS/TS files.
  default   only comments on lines added since HEAD (staged, unstaged and untracked)
  --all     every comment in the given paths (paths required)
  --check   list what would be removed and exit 1 if anything would be, change nothing`;

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) {
	console.log(USAGE);
	process.exit(0);
}
const check = args.includes("--check");
const all = args.includes("--all");
const paths = args.filter((a) => !a.startsWith("--"));
if (all && paths.length === 0) {
	console.error("clean-comments: --all needs at least one path");
	process.exit(2);
}

const EXTENSIONS = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const IGNORED = /(^|\/)(node_modules|dist|build|coverage|\.next|\.turbo)\//;
const KEEP =
	/^\/\/\/\s*<|^\/\*!|@ts-(ignore|expect-error|nocheck|check)\b|biome-ignore|eslint-(disable|enable)|prettier-ignore|(istanbul|c8|v8) ignore|@vitest-environment|@jsxImportSource|@license|@preserve|webpack[A-Z]|#(end)?region|\b(TODO|FIXME|HACK|XXX)\b/;

const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8", maxBuffer: 64 << 20 });
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const scope = paths.length ? paths.map((p) => path.relative(root, path.resolve(p)) || ".") : ["."];
const ts = loadTypeScript();

function loadTypeScript() {
	for (const dir of ["client", "server", "."]) {
		try {
			const t = createRequire(path.join(root, dir, "package.json"))("typescript");
			if (typeof t.createSourceFile === "function") return t;
		} catch {}
	}
	console.error("clean-comments: no TypeScript with a JS API found; run `npm run setup` first");
	process.exit(2);
}

const wanted = (f) => EXTENSIONS.test(f) && !IGNORED.test(f) && !f.endsWith("clean-comments.mjs");
const lines = (out) => out.split("\n").filter(Boolean);

function collectTargets() {
	const targets = new Map();
	const untracked = lines(git("ls-files", "--others", "--exclude-standard", "--", ...scope));
	if (all) {
		for (const f of [...lines(git("ls-files", "--", ...scope)), ...untracked]) targets.set(f, "all");
	} else {
		for (const f of untracked) targets.set(f, "all");
		let hasHead = true;
		try {
			git("rev-parse", "--verify", "-q", "HEAD");
		} catch {
			hasHead = false;
		}
		const diff = hasHead
			? git("diff", "HEAD", "--unified=0", "--no-color", "--no-ext-diff", "--no-renames", "--diff-filter=AM", "--", ...scope)
			: "";
		let file = null;
		for (const line of diff.split("\n")) {
			if (line.startsWith("+++ ")) {
				file = line === "+++ /dev/null" ? null : line.slice(6);
				continue;
			}
			const hunk = /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/.exec(line);
			if (!hunk || !file) continue;
			const start = Number(hunk[1]);
			const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
			if (count === 0) continue;
			const set = targets.get(file) ?? new Set();
			if (set === "all") continue;
			for (let n = start; n < start + count; n++) set.add(n);
			targets.set(file, set);
		}
	}
	for (const f of targets.keys()) if (!wanted(f) || !existsSync(path.join(root, f))) targets.delete(f);
	return targets;
}

function scriptKind(file) {
	if (/\.tsx$/.test(file)) return ts.ScriptKind.TSX;
	if (/\.jsx$/.test(file)) return ts.ScriptKind.JSX;
	if (/\.[mc]?js$/.test(file)) return ts.ScriptKind.JS;
	return ts.ScriptKind.TS;
}

function findComments(file, text) {
	const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind(file));
	const found = new Map();
	const jsxText = [];
	const emptyJsxExpr = [];
	const addAll = (ranges) => {
		for (const r of ranges ?? []) if (!found.has(r.pos)) found.set(r.pos, r);
	};
	const visit = (node) => {
		if (node.kind === ts.SyntaxKind.JsxText) {
			jsxText.push([node.pos, node.end]);
			return;
		}
		if (node.kind === ts.SyntaxKind.JsxExpression && !node.expression) {
			emptyJsxExpr.push([node.getStart(sf), node.end]);
		}
		addAll(ts.getLeadingCommentRanges(text, node.pos));
		addAll(ts.getTrailingCommentRanges(text, node.end));
		for (const child of node.getChildren(sf)) visit(child);
	};
	visit(sf);
	const inside = (spans, pos, end) => spans.find(([s, e]) => pos >= s && end <= e);
	return [...found.values()]
		.filter((r) => !inside(jsxText, r.pos, r.end))
		.map((r) => ({
			pos: r.pos,
			end: r.end,
			text: text.slice(r.pos, r.end),
			line: sf.getLineAndCharacterOfPosition(r.pos).line + 1,
			wrapper: inside(emptyJsxExpr, r.pos, r.end),
		}));
}

const isBlankLineAt = (text, i) => {
	const end = text.indexOf("\n", i);
	return end !== -1 && text.slice(i, end).trim() === "";
};

function removeComment(text, c) {
	let s = c.wrapper ? c.wrapper[0] : c.pos;
	let e = c.wrapper ? c.wrapper[1] : c.end;
	const lineStart = text.lastIndexOf("\n", s - 1) + 1;
	let lineEnd = text.indexOf("\n", e);
	if (lineEnd === -1) lineEnd = text.length;
	const before = text.slice(lineStart, s);
	const after = text.slice(e, lineEnd);
	if (before.trim() === "" && after.trim() === "") {
		s = lineStart;
		e = Math.min(lineEnd + 1, text.length);
		const prevBlank = s === 0 || isBlankLineAt(text, text.lastIndexOf("\n", s - 2) + 1);
		if (prevBlank && isBlankLineAt(text, e)) e = text.indexOf("\n", e) + 1;
	} else if (after.trim() === "") {
		s = lineStart + before.trimEnd().length;
		e = lineEnd;
	} else if (/^\s*[)\]},;]/.test(after)) {
		s = lineStart + before.trimEnd().length;
		e += after.length - after.trimStart().length;
	} else {
		e += after.length - after.trimStart().length;
	}
	return text.slice(0, s) + text.slice(e);
}

const targets = collectTargets();
const report = [];
let total = 0;

for (const [file, scopeLines] of targets) {
	const abs = path.join(root, file);
	let text = readFileSync(abs, "utf8");
	const comments = findComments(file, text)
		.filter((c) => scopeLines === "all" || scopeLines.has(c.line))
		.filter((c) => !KEEP.test(c.text))
		.sort((a, b) => b.pos - a.pos);
	if (comments.length === 0) continue;
	total += comments.length;
	report.push(`${file}: ${comments.length}`);
	if (check) {
		for (const c of [...comments].reverse()) report.push(`  ${c.line}: ${c.text.split("\n")[0].slice(0, 100)}`);
		continue;
	}
	for (const c of comments) text = removeComment(text, c);
	writeFileSync(abs, text);
}

if (total === 0) {
	console.log("clean-comments: no comments to remove");
	process.exit(0);
}
console.log(report.join("\n"));
console.log(`clean-comments: ${check ? "would remove" : "removed"} ${total} comment(s) in ${report.filter((l) => !l.startsWith(" ")).length} file(s)`);
process.exit(check ? 1 : 0);
