export default {
  import: [
    "ts-node/register",
    "tsconfig-paths/register",
    "tests/cucumber/step_definitions/**/*.steps.ts",
    "tests/cucumber/support/**/*.ts"
  ],
  paths: ["tests/cucumber/features/**/*.feature"],
  format: ["progress"]
};
