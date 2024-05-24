// export default {
//   default: {
//     require: [
//       'tests/cucumber/step_definitions/**/*.steps.ts', // Path to your step definitions
//       'tests/cucumber/support/**/*.ts' // Path to any support files
//     ],
//     import: [
//       'tests/cucumber/step_definitions/**/*.steps.ts', // Path to your step definitions
//       'tests/cucumber/support/**/*.ts' // Path to any support files
//     ],
//     paths: ['tests/cucumber/features/**/*.{feature,feature.md}'], // Path to your feature files
//     format: ['progress', 'json:reports/cucumber_report.json'], // Output formats
//     //tags: '@smoke or @regression', // Tags to filter scenarios
//     parallel: 2, // Number of parallel execution threads
//     loader: ['ts-node/esm'], // Loader configuration
//     // or ts-node/register/transpile-only
//     publishQuiet: true
//   }
// };
export default {
  default: {
    import: [
      //'ts-node/register/transpile-only',
      'ts-node/esm',
      'tests/cucumber/step_definitions/**/*.steps.ts',
      'tests/cucumber/support/**/*.ts'
    ],
    paths: ['tests/cucumber/features/**/*.feature'],
    format: ['progress'],
    publishQuiet: true
  }
};