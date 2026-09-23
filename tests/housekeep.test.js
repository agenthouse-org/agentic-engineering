import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {install} from '../src/install.js';
import {housekeep,artifactPolicy,assertOutput} from '../src/housekeep.js';
import {read,write} from '../src/io.js';
import {resolve} from '../src/policy.js';
import {evaluate} from '../src/evaluate.js';
const home=fs.mkdtempSync(path.join(os.tmpdir(),'ah-artifact-store-'));
process.env.AGENTHOUSE_HOME=home;after(()=>fs.rmSync(home,{recursive:true,force:true}));
function git(root,...args){const r=spawnSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout;}
function setup(t,options={}) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-artifacts-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  git(root,'init');install(root,{agents:[],...options});return root;
}
function configure(root,artifacts) {const file=path.join(root,'.agenthouse/config.json'),config=read(file);config.artifacts=artifacts;write(file,config);resolve(root);}
test('only framework outputs are ignored; new baselines and galleries survive',t=>{
  const root=setup(t);
  for(const file of ['tests/screenshots/new-baseline.png','docs/review/screen-1440-light.png','tmp-notes.md','.agenthouse/evidence/shot.png'])write(path.join(root,file),'keep');
  assert.equal(housekeep(root).status,'passed');
  assert.ok(fs.existsSync(path.join(root,'tests/screenshots/new-baseline.png')));
  assert.ok(fs.existsSync(path.join(root,'.agenthouse/evidence/shot.png')));
  assert.match(git(root,'ls-files','--others','--exclude-standard'),/new-baseline/);
});
test('repo-specific outputs use effective Git exclusions, including nested negations',t=>{
  const root=setup(t);configure(root,{outputs:['custom-results'],baselines:['tests/screenshots']});
  assert.equal(housekeep(root,{check:true}).status,'incomplete');
  install(root);assert.equal(housekeep(root,{check:true}).status,'passed');
  write(path.join(root,'custom-results/result.json'),'{}');
  fs.appendFileSync(path.join(root,'.gitignore'),'\n!/custom-results/\n/custom-results/*\n!/custom-results/result.json\n');
  assert.equal(housekeep(root,{check:true}).status,'incomplete');
  assert.ok(housekeep(root,{check:true}).missingIgnore.includes('custom-results/result.json'));
});
test('force-staged generated reports fail diagnostics and evaluation; files survive',async t=>{
  const root=setup(t);write(path.join(root,'.agenthouse/local/reports/staged.json'),'{}');
  git(root,'add','-f','.agenthouse/local/reports/staged.json');
  const result=housekeep(root,{clean:true});assert.equal(result.status,'failed');
  assert.ok(result.tracked.includes('.agenthouse/local/reports/staged.json'));
  assert.ok(fs.existsSync(path.join(root,'.agenthouse/local/reports/staged.json')));
  await assert.rejects(()=>evaluate(root,{subject:'build'}),/staged or tracked/);
});
test('cleanup requires explicit classification and preserves indexed files and CI evidence',t=>{
  const root=setup(t);configure(root,{outputs:['scratch'],cleanup:['scratch']});install(root);
  write(path.join(root,'scratch/result.txt'),'keep');
  housekeep(root);assert.ok(fs.existsSync(path.join(root,'scratch/result.txt')));
  housekeep(root,{clean:true,env:{CI:'1'}});assert.ok(fs.existsSync(path.join(root,'scratch/result.txt')));
  housekeep(root,{clean:true,env:{}});assert.equal(fs.existsSync(path.join(root,'scratch')),false);
  write(path.join(root,'scratch/result.txt'),'keep');git(root,'add','-f','scratch/result.txt');
  housekeep(root,{clean:true,env:{}});assert.ok(fs.existsSync(path.join(root,'scratch/result.txt')));
});
test('ambiguous, escaping, broad and baseline-overlapping output paths fail closed',t=>{
  const root=setup(t);
  for(const artifacts of [{outputs:['../outside']},{outputs:['.']},{outputs:['.agenthouse']},{outputs:['.agenthouse/config.json']},{outputs:['tests/*']},{outputs:['tests'],baselines:['tests/baselines']},{cleanup:['tests']}]) {
    configure(root,artifacts);assert.throws(()=>artifactPolicy(root));
  }
});
test('missing Git is an error and cleanup preserves files',t=>{
  const root=setup(t);configure(root,{outputs:['scratch'],cleanup:['scratch']});write(path.join(root,'scratch/keep'),'x');
  fs.renameSync(path.join(root,'.git'),path.join(root,'git-backup'));
  assert.equal(housekeep(root,{clean:true}).status,'error');assert.ok(fs.existsSync(path.join(root,'scratch/keep')));
});
test('private integration ignores local evidence without editing shared files',t=>{
  const root=setup(t,{integration:'private'});assert.equal(housekeep(root,{check:true}).status,'passed');
  assert.equal(fs.existsSync(path.join(root,'.gitignore')),false);
  assertOutput(root,'.agenthouse/local/reports');assert.throws(()=>assertOutput(root,'unclassified-results'),/not classified/);
});
test('evaluation rechecks artifacts after commands run and cannot report a passed gate',async t=>{
  const root=setup(t),file=path.join(root,'.agenthouse/config.json'),config=read(file);
  write(path.join(root,'check.mjs'),`import fs from 'node:fs';import {spawnSync} from 'node:child_process';fs.writeFileSync('.agenthouse/evidence/leak.txt','x');spawnSync('git',['add','-f','.agenthouse/evidence/leak.txt']);`);
  fs.mkdirSync(path.join(root,'.agenthouse/evidence'),{recursive:true});
  config.evaluators=[{id:'test',kind:'command',executable:'node',args:['check.mjs'],result:'exit-code'}];config.profiles={'pull-request':{checks:[{evaluator:'test'}]}};write(file,config);resolve(root);
  const result=await evaluate(root,{subject:'build',frozen:true});assert.equal(result.exitCode,1);
  assert.equal(result.checks.find(c=>c.id==='AH-ARTIFACT-001').status,'failed');
  assert.ok(fs.existsSync(path.join(result.folder,'report.html')));
});

test('baseline exclusions are diagnosed and credentials cannot be classified for cleanup',t=>{
  const root=setup(t);configure(root,{baselines:['tests/screenshots']});
  fs.appendFileSync(path.join(root,'.gitignore'),'\ntests/screenshots/\n');
  assert.equal(housekeep(root,{check:true}).status,'incomplete');
  assert.ok(housekeep(root,{check:true}).ignoredBaselines.length);
  configure(root,{outputs:['.agenthouse/local'],cleanup:['.agenthouse/local']});assert.throws(()=>artifactPolicy(root),/overlaps framework state/);
});
