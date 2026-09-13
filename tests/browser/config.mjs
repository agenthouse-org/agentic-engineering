import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'.',testMatch:'fixture.spec.mjs',workers:1,retries:0,outputDir:'../../work/browser-results',
  snapshotPathTemplate:'{testDir}/../../work/browser-baselines/{arg}{ext}',
  use:{viewport:{width:360,height:800},locale:'en-US',timezoneId:'UTC',launchOptions:process.env.AH_BROWSER_EXECUTABLE?{executablePath:process.env.AH_BROWSER_EXECUTABLE}:{},screenshot:'only-on-failure'},
  reporter:[['list'],['../../adapters/playwright.mjs',{root:process.cwd(),contract:'tests/browser/contract.json',output:'work/browser-assessment.json'}]]
});
