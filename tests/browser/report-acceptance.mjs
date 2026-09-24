import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {reports} from '../../src/reports.js';

const folder=path.resolve('.agenthouse/evidence/consumer-feedback');
reports(folder,{schemaVersion:1,runId:'report-acceptance',profile:'pull-request',subject:'commit-under-review',status:'failed',exitCode:1,
  checks:[{id:'unit',required:true,status:'failed',reason:'Regression assertion failed',origin:{module:'node-typescript',file:'package.json',rule:'UNIT-001'}},
    {id:'php-unit',required:true,status:'passed',reason:'Process exit 0',origin:{module:'php-laravel',file:'composer.json',rule:'PHP-001'}}]});
const browser=await chromium.launch(process.env.AH_BROWSER_EXECUTABLE?{executablePath:process.env.AH_BROWSER_EXECUTABLE}:{});
try {
  const page=await browser.newPage();
  for(const width of [390,1280]) {
    await page.setViewportSize({width,height:900});
    await page.goto(pathToFileURL(path.join(folder,'report.html')).href);
    assert.match(await page.locator('body').innerText(),/Profile pull-request/);
    assert.match(await page.locator('section').nth(0).innerText(),/Origin: node-typescript · package.json · rule UNIT-001/);
    assert.match(await page.locator('section').nth(1).innerText(),/Origin: php-laravel · composer.json · rule PHP-001/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:path.join(folder,`report-${width}.png`),fullPage:true});
  }
  console.log(`Report acceptance passed at 390px and 1280px: ${folder}`);
}finally{await browser.close();}
