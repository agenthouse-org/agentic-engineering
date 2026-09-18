import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {install} from '../src/install.js';
import {session} from '../src/update.js';
import {housekeep} from '../src/housekeep.js';
import {PACKAGE} from '../src/io.js';

const temp=t=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-housekeep-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;};
function git(root,...args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function dump(root,rel,bytes='x') {
  const target=path.join(root,rel);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,bytes);
  return target;
}

test('housekeep adds missing ignore rules and deletes untracked captures',t=>{
  const root=temp(t);install(root,{agents:[]});
  fs.writeFileSync(path.join(root,'.gitignore'),'node_modules\n<!-- agenthouse:start -->\n.agenthouse/local/\n.agenthouse/runtime/\n<!-- agenthouse:end -->\n');
  const shot=dump(root,'.agenthouse/evidence/overview/shot.png');
  const report=dump(root,'artifacts/agenthouse/run/result.json','{}');
  const check=housekeep(root,{check:true,env:{}});
  assert.equal(check.status,'incomplete');
  assert.ok(check.missingIgnore.includes('.agenthouse/evidence/'));
  assert.ok(fs.existsSync(shot));
  const applied=housekeep(root,{env:{}});
  assert.equal(applied.status,'passed');
  assert.ok(applied.addedIgnore.includes('.agenthouse/evidence/'));
  assert.ok(applied.removed.includes('.agenthouse/evidence'));
  assert.equal(fs.existsSync(shot),false);
  assert.ok(fs.existsSync(report));
  assert.match(fs.readFileSync(path.join(root,'.gitignore'),'utf8'),/\.agenthouse\/evidence\//);
});

test('housekeep does not delete tracked captures and doctor reports them',t=>{
  const root=temp(t);install(root,{agents:[]});
  git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Test');
  const rel='.agenthouse/evidence/tracked.png';
  dump(root,rel);
  git(root,'add','-f',rel);git(root,'commit','-m','tracked capture');
  const applied=housekeep(root,{env:{}});
  assert.equal(applied.status,'failed');
  assert.equal(applied.exitCode,1);
  assert.ok(applied.tracked.some(file=>file.endsWith('tracked.png')));
  assert.ok(fs.existsSync(path.join(root,rel)));
  const cli=spawnSync(process.execPath,[path.join(PACKAGE,'bin/ah-engineering.js'),'doctor','--root',root],{encoding:'utf8',windowsHide:true});
  assert.equal(cli.status,2);
  assert.match(cli.stdout,/Tracked inspection captures/);
});

test('session applies housekeeping and CI keeps scratch',t=>{
  const root=temp(t);install(root,{agents:[]});
  const shot=dump(root,'.agenthouse/evidence/session.png');
  assert.equal(housekeep(root,{env:{CI:'true'}}).kept,true);
  assert.ok(fs.existsSync(shot));
  const result=session(root,{env:{}});
  assert.equal(result.housekeeping.status,'passed');
  assert.ok(result.housekeeping.removed.includes('.agenthouse/evidence'));
  assert.equal(fs.existsSync(shot),false);
});

test('housekeep CLI applies rules on an enrolled repository',t=>{
  const root=temp(t);install(root,{agents:[]});
  dump(root,'.agenthouse/evidence/cli.png');
  const env={...process.env};delete env.CI;delete env.AH_KEEP_BROWSER_ARTIFACTS;
  const cli=spawnSync(process.execPath,[path.join(PACKAGE,'bin/ah-engineering.js'),'housekeep','--root',root],{encoding:'utf8',windowsHide:true,env});
  assert.equal(cli.status,0,cli.stderr);
  assert.match(cli.stdout,/"status": "passed"/);
  assert.equal(fs.existsSync(path.join(root,'.agenthouse/evidence')),false);
});
