//import 'ts-node/register';
import { runCucumber } from '@cucumber/cucumber/api';
import '@cucumber/pretty-formatter';
import { DEFAULT_THEME } from '@cucumber/pretty-formatter';

(async () => {
  const configuration = {
    require: ['tests/cucumber/step_definitions/**/*.ts'],
    paths: ['tests/cucumber/features/**/*.feature'],
    format: ['@cucumber/pretty-formatter'], // Ensure this is an array of strings
    formatOptions: {
      theme: {
        ...DEFAULT_THEME,
        'step text': 'magenta'
      },
    },
    support: {
      //requireModules: ['ts-node/register'],
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

  console.log('Configuration:', configuration); // Debugging line

  await runCucumber(configuration);
})();