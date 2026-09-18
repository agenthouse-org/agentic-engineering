import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir: './tests', retries: 0, updateSnapshots: 'none',
  outputDir: 'artifacts/agenthouse/playwright',
  use: {baseURL:process.env.AH_BASE_URL,viewport:{width:360,height:800},locale:'en-US',timezoneId:'UTC'},
  reporter: [['list'], ['@agenthouse/engineering/playwright', {contract:'.agenthouse/acceptance.json',output:'artifacts/agenthouse/browser-assessment.json'}]]
});
