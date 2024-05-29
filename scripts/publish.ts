import { publish } from "@vitejs/release-scripts";

publish({
  defaultPackage: "vite-plugin-csp",
  getPkgDir: (pkg) => ".",
  provenance: true,
  packageManager: "pnpm",
});