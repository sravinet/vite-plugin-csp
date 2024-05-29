import { rmSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { build, BuildOptions, context } from "esbuild";

import packageJSON from "../package.json";

const dev = process.argv.includes("--dev");

rmSync("dist", { force: true, recursive: true });

const serverOptions: BuildOptions = {
  bundle: true,
  platform: "node",
  target: "node14",
  legalComments: "inline",
  external: Object.keys(packageJSON.peerDependencies).concat(
    Object.keys(packageJSON.dependencies),
  ),
};

const buildOrWatch = async (options: BuildOptions) => {
  if (!dev) return build(options);
  const ctx = await context(options);
  await ctx.watch();
  await ctx.rebuild();
};

Promise.all([
  buildOrWatch({
    ...serverOptions,
    stdin: {
      contents: `import react from "./src";
module.exports = react;
// For backward compatibility with the first broken version
module.exports.default = react;`,
      resolveDir: ".",
    },
    outfile: "dist/index.cjs",
    logOverride: { "empty-import-meta": "silent" },
  }),
  buildOrWatch({
    ...serverOptions,
    entryPoints: ["src/index.ts"],
    format: "esm",
    outfile: "dist/index.mjs",
  }),
]).then(() => {
  if (existsSync("LICENSE")) {
    copyFileSync("LICENSE", "dist/LICENSE");
  } else {
    console.warn("LICENSE file not found, skipping copy.");
  }

  if (existsSync("README.md")) {
    copyFileSync("README.md", "dist/README.md");
  } else {
    console.warn("README.md file not found, skipping copy.");
  }

  execSync(
    "tsc --project tsconfig.json --declaration --emitDeclarationOnly --outDir dist --target es2020 --module es2020 --moduleResolution bundler",
    { stdio: "inherit" },
  );

  writeFileSync(
    "dist/package.json",
    JSON.stringify(
      {
        name: packageJSON.name,
        description: packageJSON.description,
        version: packageJSON.version,
        author: packageJSON.author,
        license: packageJSON.license,
        repository: packageJSON.repository,
        type: "module",
        exports: {
          ".": {
            types: "./index.d.ts",
            import: "./index.mjs",
            require: "./index.cjs",
          },
        },
        keywords: packageJSON.keywords,
        peerDependencies: packageJSON.peerDependencies,
        dependencies: packageJSON.dependencies,
      },
      null,
      2,
    ),
  );
});