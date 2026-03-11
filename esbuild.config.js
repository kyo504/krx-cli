import { build } from "esbuild";
import { rmSync } from "node:fs";

const watch = process.argv.includes("--watch");

rmSync("dist", { recursive: true, force: true });

const ctx = await build({
  entryPoints: ["src/cli/index.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outfile: "dist/cli.js",
  sourcemap: true,
  banner: {
    js: "#!/usr/bin/env node\nimport{createRequire}from'node:module';const require=createRequire(import.meta.url);",
  },
});
