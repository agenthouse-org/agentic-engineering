import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PACKAGE,read,write} from '../src/io.js';
import {onboard,demo} from '../src/onboard.js';
const temp=t=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-onboard-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;};
const cli=(args)=>spawnSync(process.execPath,[path.join(PACKAGE,'bin/ah-engineering.js'),...args],{encoding:'utf8',timeout:20000,windowsHide:true});
test('command help works without enrollment and unknown topics fail',()=>{
  for(const command of ['onboard','demo','init','work','evaluate','doctor','resolve','session','dependencies','update','bundle','rollback','recover','uninstall','skill','module','keygen','sign']) {
    assert.equal(cli(['help',command]).status,0);assert.equal(cli([command,'--help']).status,0);
  }
  assert.equal(cli(['help','missing']).status,2);
});
test('noninteractive onboarding enrolls and repeat preserves configuration',async t=>{
  const root=temp(t);const first=await onboard(root,{agents:'codex,cursor'});assert.match(first,/frontend-acceptance/);
  const file=path.join(root,'.agenthouse/config.json'),before=fs.readFileSync(file);
  assert.match(await onboard(root,{agents:'claude'}),/Project ready/);assert.deepEqual(fs.readFileSync(file),before);
  assert.deepEqual(read(path.join(root,'.agenthouse/installation.json')).agents,['codex','cursor']);
});
test('piped onboarding explains explicit options without writing a project',t=>{
  const root=temp(t),result=cli(['onboard','--root',root]);
  assert.equal(result.status,2);assert.match(result.stderr,/--non-interactive/);assert.deepEqual(fs.readdirSync(root),[]);
  assert.equal(cli(['onboard','--root',root,'--non-interactive']).status,0);
});
test('demo retains failed and passing reports and refuses nonempty targets',async t=>{
  const root=temp(t);const result=await demo(root);assert.match(result,/exit 1/);assert.match(result,/exit 0/);
  const reports=path.join(root,'artifacts/agenthouse');
  const results=fs.readdirSync(reports,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>read(path.join(reports,e.name,'result.json')));
  assert.deepEqual(results.map(r=>r.exitCode).sort(),[0,1]);
  await assert.rejects(()=>demo(root),/empty/);
  const other=temp(t);write(path.join(other,'keep.txt'),'user');await assert.rejects(()=>demo(other),/empty/);assert.equal(fs.readFileSync(path.join(other,'keep.txt'),'utf8'),'user');
  assert.equal(cli(['demo']).status,2);
});
test('invalid onboarding agent causes no enrollment',async t=>{
  const root=temp(t);await assert.rejects(()=>onboard(root,{agents:'unknown'}),/Unsupported agent/);
  assert.equal(fs.existsSync(path.join(root,'.agenthouse/installation.json')),false);
});
