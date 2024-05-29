import { runCucumber } from '@cucumber/cucumber/api';

(async () => {
  const configuration = {
    require: [],
    paths: [],
    format: [], // No custom formatters
  };

  console.log('Configuration:', configuration); // Debugging line

  try {
    await runCucumber(configuration);
  } catch (error) {
    console.error('Error running Cucumber:', error);
    console.error('Error details:', error.stack);
  }
})();