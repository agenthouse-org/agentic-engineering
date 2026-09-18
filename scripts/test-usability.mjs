import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {install} from '../src/install.js';
import {setupUsability} from '../src/usability.js';
import {PACKAGE,assert,read,walk} from '../src/io.js';
fs.mkdirSync(path.join(PACKAGE,'work'),{recursive:true});
const root=fs.mkdtempSync(path.join(PACKAGE,'work','usability-test-'));
try {
  install(root,{agents:[]});
  await setupUsability(root);
  for(const [name,expected] of [['pass',0],['fail',1]]) {
    const output=`artifacts/agenthouse/usability/${name}.json`;
    const r=spawnSync(process.execPath,[path.join(root,'.agenthouse/run.mjs'),'usability','run','--root',root,'--fixture',`.agents/skills/web-usability-conformity/fixtures/${name}-basic.html`,'--output',output],{encoding:'utf8',windowsHide:true,timeout:180000});
    assert(r.status===expected,`Usability ${name} returned ${r.status}: ${r.stderr}`);
    const report=read(path.join(root,output));
    assert(name==='pass'?report.summary.criticalOrSerious===0:report.summary.criticalOrSerious>0,'Unexpected upstream findings');
    const shots=walk(path.join(root,'artifacts/agenthouse/usability',`${name}-shots`));
    assert(shots.length>=2 && shots.every(f=>fs.statSync(path.join(root,'artifacts/agenthouse/usability',`${name}-shots`,f)).size>0),'Missing screenshots');
  }
  console.log(`Usability pass/fail CLI outcomes and screenshots verified: ${root}`);
} finally {
  if(!process.env.CI && !process.env.AH_KEEP_BROWSER_ARTIFACTS)fs.rmSync(root,{recursive:true,force:true});
}
