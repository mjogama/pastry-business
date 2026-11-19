// Scaffolds a server module plus its shared contract, and mounts it in the v1 router.
// Usage (from the root): npm run module:create -- <name>   or   npm run module:create -- --name <name>
// <name> is singular, e.g. "auth", "blog-post", "blogPost". The route is the kebab-case plural.
// Undo with: npm run module:remove -- <name>

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { fail, moduleNames, readNameArg, root, routesFile, serverDir } from "./module-names.mjs";

// ---------- args and names ----------

const rawName = readNameArg("Usage: npm run module:create -- <name>   (e.g. npm run module:create -- blog-post)");
const n = moduleNames(rawName);

if (n.Name === n.Names) fail(`"${rawName}" has the same singular and plural form; pick a singular name.`);

// ---------- targets ----------

const moduleDir = join(serverDir, "src/modules", n.kebab);
const sharedFile = join(root, "shared/modules", `${n.kebab}.ts`);

if (existsSync(moduleDir)) fail(`${relative(root, moduleDir)} already exists. Nothing was written.`);

// A contract written ahead of the server (e.g. from the client) is kept, not overwritten.
const keepSharedFile = existsSync(sharedFile);

const routes = readFileSync(routesFile, "utf8");
if (routes.includes(`"/${n.kebabs}"`)) fail(`Route "/${n.kebabs}" is already mounted in routes.ts.`);

// ---------- templates ----------

const files = {
  [sharedFile]: `// Contract for /api/v1/${n.kebabs}. The server's Zod schemas are checked against these types.

export interface ${n.Name} {
  id: string;
  name: string;
  createdAt: string;
}

export interface List${n.Names}Query {
  limit?: number;
}

export interface Create${n.Name}Input {
  name: string;
}
`,

  [join(moduleDir, `${n.kebab}.schema.ts`)]: `import { z } from "zod";

import type { Create${n.Name}Input, ${n.Name}, List${n.Names}Query } from "@common/modules/${n.kebab}";

export type { Create${n.Name}Input, ${n.Name} } from "@common/modules/${n.kebab}";

export const ${n.name}Schema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
}) satisfies z.ZodType<${n.Name}>;

export const list${n.Names}Schemas = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }) satisfies z.ZodType<Required<List${n.Names}Query>>,
};

export const get${n.Name}Schemas = {
  params: z.object({ id: z.uuid() }),
};

export const create${n.Name}Schemas = {
  body: z.object({
    name: z.string().trim().min(1).max(100),
  }) satisfies z.ZodType<Create${n.Name}Input>,
};
`,

  [join(moduleDir, `${n.kebab}.repository.ts`)]: `import type { ${n.Name} } from "./${n.kebab}.schema";

export interface ${n.Name}Repository {
  findAll(limit: number): Promise<${n.Name}[]>;
  findById(id: string): Promise<${n.Name} | null>;
  findByName(name: string): Promise<${n.Name} | null>;
  create(${n.name}: ${n.Name}): Promise<${n.Name}>;
}

export class InMemory${n.Name}Repository implements ${n.Name}Repository {
  private readonly items = new Map<string, ${n.Name}>();

  async findAll(limit: number): Promise<${n.Name}[]> {
    return [...this.items.values()].slice(0, limit);
  }

  async findById(id: string): Promise<${n.Name} | null> {
    return this.items.get(id) ?? null;
  }

  async findByName(name: string): Promise<${n.Name} | null> {
    return [...this.items.values()].find((item) => item.name === name) ?? null;
  }

  async create(${n.name}: ${n.Name}): Promise<${n.Name}> {
    this.items.set(${n.name}.id, ${n.name});
    return ${n.name};
  }
}
`,

  [join(moduleDir, `${n.kebab}.service.ts`)]: `import { randomUUID } from "node:crypto";

import { ConflictError, NotFoundError } from "@shared/errors/AppError";
import type { ${n.Name}Repository } from "./${n.kebab}.repository";
import type { Create${n.Name}Input, ${n.Name} } from "./${n.kebab}.schema";

export class ${n.Name}Service {
  constructor(private readonly repository: ${n.Name}Repository) {}

  list(limit: number): Promise<${n.Name}[]> {
    return this.repository.findAll(limit);
  }

  async getById(id: string): Promise<${n.Name}> {
    const ${n.name} = await this.repository.findById(id);
    if (!${n.name}) throw new NotFoundError(\`${n.Label} \${id} not found\`);
    return ${n.name};
  }

  async create(input: Create${n.Name}Input): Promise<${n.Name}> {
    const duplicate = await this.repository.findByName(input.name);
    if (duplicate) throw new ConflictError(\`A ${n.label} named "\${input.name}" already exists\`);

    return this.repository.create({ id: randomUUID(), name: input.name, createdAt: new Date().toISOString() });
  }
}
`,

  [join(moduleDir, `${n.kebab}.controller.ts`)]: `import type { Response } from "express";

import { sendSuccess } from "@shared/http/response";
import type { ${n.Name}Service } from "./${n.kebab}.service";
import type { ValidatedRequest } from "@shared/middlewares/validate";
import type { create${n.Name}Schemas, get${n.Name}Schemas, list${n.Names}Schemas } from "./${n.kebab}.schema";

export class ${n.Name}Controller {
  constructor(private readonly service: ${n.Name}Service) {}

  list = async (req: ValidatedRequest<typeof list${n.Names}Schemas>, res: Response) => {
    const items = await this.service.list(req.query.limit);
    sendSuccess(res, { message: "${n.Labels} retrieved", data: items });
  };

  getById = async (req: ValidatedRequest<typeof get${n.Name}Schemas>, res: Response) => {
    const ${n.name} = await this.service.getById(req.params.id);
    sendSuccess(res, { message: "${n.Label} retrieved", data: ${n.name} });
  };

  create = async (req: ValidatedRequest<typeof create${n.Name}Schemas>, res: Response) => {
    const ${n.name} = await this.service.create(req.body);
    sendSuccess(res, { statusCode: 201, message: "${n.Label} created", data: ${n.name} });
  };
}
`,

  [join(moduleDir, `${n.kebab}.routes.ts`)]: `import { Router } from "express";

import { validate } from "@shared/middlewares/validate";
import type { ${n.Name}Controller } from "./${n.kebab}.controller";
import { create${n.Name}Schemas, get${n.Name}Schemas, list${n.Names}Schemas } from "./${n.kebab}.schema";

export class ${n.Name}Router {
  readonly router: Router = Router();

  constructor(controller: ${n.Name}Controller) {
    this.router.get("/", validate(list${n.Names}Schemas), controller.list);
    this.router.get("/:id", validate(get${n.Name}Schemas), controller.getById);
    this.router.post("/", validate(create${n.Name}Schemas), controller.create);
  }
}
`,

  [join(moduleDir, `${n.kebab}.module.ts`)]: `import type { Router } from "express";

import { ${n.Name}Router } from "./${n.kebab}.routes";
import { ${n.Name}Service } from "./${n.kebab}.service";
import { ${n.Name}Controller } from "./${n.kebab}.controller";
import { type ${n.Name}Repository, InMemory${n.Name}Repository } from "./${n.kebab}.repository";

interface ${n.Name}ModuleDependencies {
  repository?: ${n.Name}Repository;
}

export class ${n.Name}Module {
  readonly service: ${n.Name}Service;
  readonly router: Router;

  constructor({ repository = new InMemory${n.Name}Repository() }: ${n.Name}ModuleDependencies = {}) {
    this.service = new ${n.Name}Service(repository);
    this.router = new ${n.Name}Router(new ${n.Name}Controller(this.service)).router;
  }
}
`,
};

// ---------- mount in routes.ts (computed before writing anything) ----------

const importLine = `import { ${n.Name}Module } from "@modules/${n.kebab}/${n.kebab}.module";`;
const useLine = `v1Router.use("/${n.kebabs}", new ${n.Name}Module().router);`;

const lines = routes.split("\n");
const lastImport = lines.findLastIndex((line) => line.startsWith("import "));
if (lastImport < 0) fail("Could not find the imports in routes.ts. Mount the module by hand.");
lines.splice(lastImport + 1, 0, importLine);

let anchor = lines.findLastIndex((line) => line.startsWith("v1Router.use("));
if (anchor < 0) anchor = lines.findIndex((line) => line.includes("Mount one module per feature"));
if (anchor < 0) anchor = lines.findIndex((line) => line.startsWith("export default v1Router")) - 2;
if (anchor < 0) fail("Could not find where to mount the module in routes.ts. Mount it by hand.");
lines.splice(anchor + 1, 0, useLine);

// ---------- write ----------

mkdirSync(moduleDir, { recursive: true });
if (keepSharedFile) delete files[sharedFile];
for (const [path, content] of Object.entries(files)) writeFileSync(path, content);
writeFileSync(routesFile, lines.join("\n"));

execFileSync("node", [join(root, ".claude/skills/sort-imports/sort-imports.mjs"), serverDir], { stdio: "ignore" });

console.log(`Created module "${n.kebab}" at /api/v1/${n.kebabs}:`);
for (const path of Object.keys(files)) console.log(`  + ${relative(root, path)}`);
console.log(`  ~ ${relative(root, routesFile)}`);
if (keepSharedFile) console.log(`  = ${relative(root, sharedFile)} (kept, already existed)`);
console.log(`\nNext: edit the fields in shared/modules/${n.kebab}.ts and ${n.kebab}.schema.ts, then /write-module-tests ${n.kebab}.`);
