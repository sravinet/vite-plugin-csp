import 'ts-node/register';
import { runCucumber } from '@cucumber/cucumber/api';

(async () => {
  const configuration = {
    require: ['tests/cucumber/step_definitions/**/*.ts'],
    paths: ['tests/cucumber/features/**/*.feature'],
    format: ['@cucumber/pretty-formatter'], // Use the custom formatter
    support: {
      requireModules: ['ts-node/register'],
      require: ['tests/cucumber/step_definitions/**/*.ts', 'tests/cucumber/support/**/*.ts'],
    },
    formats: {
      publish: false, // Add this line to avoid the error
    },
    sources: {
      paths: ['tests/cucumber/features/**/*.feature'], // Ensure paths are included in sources
    },
    // Add any other configuration options you need here
  };

  await runCucumber(configuration);
})();