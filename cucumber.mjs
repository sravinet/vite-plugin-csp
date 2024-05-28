export default {
  require: [
    'ts-node/register',
    'tsconfig-paths/register',
  ],
  import: [
    'tests/cucumber/step_definitions/**/*.steps.ts',
    'tests/cucumber/support/**/*.ts'
  ],
  paths: ['tests/cucumber/features/**/*.feature'],
  format: ['progress']
};
