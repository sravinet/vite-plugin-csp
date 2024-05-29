import { release } from "@vitejs/release-scripts";
import { execSync } from 'child_process';

release({
  repo: "vite-plugin-csp",
  packages: ["vite-plugin-csp"],
  toTag: (pkg, version) => `${pkg}@${version}`,
  logChangelog: (pkg) => {
    try {
      const log = execSync(
        "git log $(git describe --tags --abbrev=0)..HEAD --oneline"
      ).toString();
      console.log(log);
    } catch (error) {
      console.error("No tags found in the repository.");
    }
  },
  generateChangelog: (pkg, version) => {
    // Implement changelog generation logic here
  },
  getPkgDir: (pkg) => ".",
});