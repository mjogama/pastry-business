import { defineConfig } from "tsup";

// Bundles src into dist/server.js. Path aliases (@app, @modules, @shared) are resolved here,
// and everything in node_modules stays external.
export default defineConfig({
  entry: { server: "src/app/server.ts" },
  format: "esm",
  platform: "node",
  target: "node22",
  outDir: "dist",
  sourcemap: true,
  clean: true,
});
