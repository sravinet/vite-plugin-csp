export default {
  loader: ['ts-node/esm'],
  import: [
    'tests/cucumber/step_definitions/**/*.steps.ts',
    'tests/cucumber/support/**/*.ts'
  ],
  paths: ['tests/cucumber/features/**/*.feature'],
  format: ['progress'],
}
