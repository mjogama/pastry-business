// Writes the starter Vitest + Supertest tests for a module made by new-module.mjs.
// Usage (from the root): npm run module:test -- <name> [--force]
// Creates server/tests/<name>.service.test.ts and server/tests/<name>.test.ts.
// Existing test files are kept unless --force is passed. module:remove deletes them with the module.

import { existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { fail, moduleNames, readNameArg, root, serverDir } from "./module-names.mjs";

const rawName = readNameArg("Usage: npm run module:test -- <name> [--force]   (e.g. npm run module:test -- blog-post)");
const n = moduleNames(rawName);
const force = process.argv.includes("--force");

if (!existsSync(join(serverDir, "src/modules", n.kebab))) {
  fail(`No module "${n.kebab}" in server/src/modules. Create it first: npm run module:create -- ${n.kebab}`);
}

const testsDir = join(serverDir, "tests");
const base = `/api/v1/${n.kebabs}`;

const files = {
  [join(testsDir, `${n.kebab}.service.test.ts`)]: `import { randomUUID } from "node:crypto";

import { ConflictError, NotFoundError } from "@shared/errors/AppError";
import { ${n.Name}Service } from "@modules/${n.kebab}/${n.kebab}.service";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemory${n.Name}Repository } from "@modules/${n.kebab}/${n.kebab}.repository";

describe("${n.Name}Service", () => {
  let service: ${n.Name}Service;

  beforeEach(() => {
    service = new ${n.Name}Service(new InMemory${n.Name}Repository());
  });

  it("creates and returns a ${n.label}", async () => {
    const created = await service.create({ name: "first" });

    expect(await service.getById(created.id)).toEqual(created);
    expect(await service.list(10)).toEqual([created]);
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(service.getById(randomUUID())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError for a duplicate name", async () => {
    await service.create({ name: "dup" });

    await expect(service.create({ name: "dup" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("respects the list limit", async () => {
    await service.create({ name: "a" });
    await service.create({ name: "b" });

    expect(await service.list(1)).toHaveLength(1);
  });
});
`,

  [join(testsDir, `${n.kebab}.test.ts`)]: `import { randomUUID } from "node:crypto";

import { createApp } from "@app/app";
import request from "supertest";
import { describe, expect, it } from "vitest";

const app = createApp();
const unique = (prefix: string) => \`\${prefix}-\${randomUUID()}\`;

describe("${n.label} module", () => {
  it("creates, fetches and lists a ${n.label}", async () => {
    const name = unique("first");
    const created = await request(app).post("${base}").send({ name: \`  \${name}  \` });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ success: true, statusCode: 201 });
    expect(created.body.data).toMatchObject({ name });

    const id = created.body.data.id;
    const fetched = await request(app).get(\`${base}/\${id}\`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(id);

    const listed = await request(app).get("${base}?limit=100");
    expect(listed.status).toBe(200);
    expect(listed.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id })]));
  });

  it("rejects an invalid body with field-level details", async () => {
    const res = await request(app).post("${base}").send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, statusCode: 400, message: "Validation failed" });
    expect(res.body.details).toEqual([expect.objectContaining({ path: "name" })]);
  });

  it("rejects invalid params and query", async () => {
    await request(app).get("${base}/not-a-uuid").expect(400);
    await request(app).get("${base}?limit=0").expect(400);
  });

  it("returns 404 for a missing ${n.label}", async () => {
    const res = await request(app).get(\`${base}/\${randomUUID()}\`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, statusCode: 404 });
  });

  it("returns 409 for a duplicate name", async () => {
    const name = unique("dup");

    await request(app).post("${base}").send({ name }).expect(201);
    const res = await request(app).post("${base}").send({ name });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, statusCode: 409 });
  });
});
`,
};

const written = [];
const kept = [];
for (const [path, content] of Object.entries(files)) {
  if (existsSync(path) && !force) kept.push(path);
  else {
    writeFileSync(path, content);
    written.push(path);
  }
}

for (const path of written) console.log(`  + ${relative(root, path)}`);
for (const path of kept) console.log(`  = ${relative(root, path)} (kept, already existed; use --force to overwrite)`);
