import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {assert,read,PACKAGE} from '../src/io.js';
import {visual} from '../src/visual.js';
const cli=path.join(PACKAGE,'node_modules/@playwright/test/cli.js');
const env={...process.env,AH_SUBJECT:'browser-pilot',AH_POLICY_DIGEST:'browser-policy'};
const base=['test','--config','tests/browser/config.mjs'];
function run(args,extra={}) {return spawnSync(process.execPath,[cli,...args],{cwd:PACKAGE,env:{...env,...extra},encoding:'utf8',timeout:120000,windowsHide:true});}
const baseline=run([...base,'--update-snapshots']);assert(baseline.status===0,baseline.stdout+baseline.stderr);
const broken=run([...base,'--update-snapshots=none'],{AH_BREAK_LAYOUT:'1'});assert(broken.status===1,'Broken UI must fail: '+broken.stdout+broken.stderr);
const failed=visual(PACKAGE,{contract:'tests/browser/contract.json',assessment:'work/browser-assessment.json'},{subject:'browser-pilot',policyDigest:'browser-policy'});assert(failed.status==='failed','Broken UI assessment must fail');
const restored=run([...base,'--update-snapshots=none']);assert(restored.status===0,restored.stdout+restored.stderr);
const passed=visual(PACKAGE,{contract:'tests/browser/contract.json',assessment:'work/browser-assessment.json'},{subject:'browser-pilot',policyDigest:'browser-policy'});assert(passed.status==='passed',JSON.stringify(passed));
console.log('Real browser pilot passed: baseline established, broken layout detected, restored layout passed; hashed screenshot evidence verified.');
