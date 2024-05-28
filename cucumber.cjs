module.exports = {
  default: {
    require: [
      "ts-node/esm",
      "tests/cucumber/step_definitions/**/*.steps.ts",
      "tests/cucumber/support/**/*.ts"
    ],
    paths: ["tests/cucumber/features/**/*.feature"],
    format: ["progress"]
  }
};
