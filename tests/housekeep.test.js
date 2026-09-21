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

test('housekeep deletes tests/output dumps and invented viewport galleries',t=>{
  const root=temp(t);install(root,{agents:[]});
  git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Test');
  git(root,'add','.gitignore','.agenthouse');git(root,'commit','-m','enroll');
  const dumpShot=dump(root,'tests/output/overview-ui/overview-1440-light.png');
  const gallery=[
    dump(root,'docs/ui-review/panel-1440-light.png'),
    dump(root,'docs/ui-review/panel-768-dark.png'),
    dump(root,'docs/ui-review/panel-390-light.png')
  ];
  const mockup=dump(root,'docs/mockups/hero.png');
  const check=housekeep(root,{check:true,env:{}});
  assert.equal(check.status,'incomplete');
  assert.ok(check.dumps.includes('tests/output'));
  assert.ok(check.stray.includes('docs/ui-review'));
  assert.ok(fs.existsSync(dumpShot));
  const applied=housekeep(root,{env:{}});
  assert.equal(applied.status,'passed');
  assert.ok(applied.removed.includes('tests/output'));
  assert.ok(applied.removed.includes('docs/ui-review'));
  assert.equal(fs.existsSync(path.join(root,'tests/output')),false);
  for(const file of gallery)assert.equal(fs.existsSync(file),false);
  assert.ok(fs.existsSync(mockup));
  const doctor=spawnSync(process.execPath,[path.join(PACKAGE,'bin/ah-engineering.js'),'doctor','--root',root],{encoding:'utf8',windowsHide:true,env:{...process.env,CI:'',AH_KEEP_BROWSER_ARTIFACTS:''}});
  assert.equal(doctor.status,0,doctor.stdout);
});

test('housekeep does not delete tracked tests/output or a single mockup',t=>{
  const root=temp(t);install(root,{agents:[]});
  git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Test');
  dump(root,'tests/output/golden.png');
  git(root,'add','-f','tests/output/golden.png');git(root,'commit','-m','tracked output');
  dump(root,'docs/mockups/hero.png');
  const applied=housekeep(root,{env:{}});
  assert.ok(fs.existsSync(path.join(root,'tests/output/golden.png')));
  assert.ok(fs.existsSync(path.join(root,'docs/mockups/hero.png')));
  assert.ok(applied.tracked.some(file=>file.endsWith('golden.png')));
});

test('housekeep deletes untracked root tmp drafts and keeps nested files',t=>{
  const root=temp(t);install(root,{agents:[]});
  git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Test');
  dump(root,'tmp-pr-178.md','## Summary\n');
  dump(root,'tmp-issue-178.md','## Issue\n');
  dump(root,'tmp/draft.md','x');
  const nested=dump(root,'docs/tmp-notes.md','keep');
  git(root,'add','-f','docs/tmp-notes.md');git(root,'commit','-m','nested');
  dump(root,'tmp-keep.md','tracked');
  git(root,'add','-f','tmp-keep.md');git(root,'commit','-m','tracked tmp');
  const check=housekeep(root,{check:true,env:{}});
  assert.equal(check.status,'incomplete');
  assert.ok(check.notes.includes('tmp-pr-178.md'));
  assert.ok(check.notes.includes('tmp-issue-178.md'));
  assert.ok(check.notes.includes('tmp'));
  assert.ok(!check.notes.includes('tmp-keep.md'));
  const applied=housekeep(root,{env:{CI:'true'}});
  assert.equal(fs.existsSync(path.join(root,'tmp-pr-178.md')),false);
  assert.equal(fs.existsSync(path.join(root,'tmp-issue-178.md')),false);
  assert.equal(fs.existsSync(path.join(root,'tmp')),false);
  assert.ok(fs.existsSync(nested));
  assert.ok(fs.existsSync(path.join(root,'tmp-keep.md')));
  assert.ok(applied.removed.includes('tmp-pr-178.md'));
});
