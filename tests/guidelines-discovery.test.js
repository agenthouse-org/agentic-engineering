import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PACKAGE} from '../src/io.js';
import {help} from '../src/help.js';
import {roleProcessList, roleProcessShow} from '../src/roles-processes.js';
import {listArchitecture, checkArchitecture, writeArchitecture} from '../src/architecture.js';
import {checkCodingStandards, writeCodingStandards, showCodingStandards} from '../src/coding-standards.js';
import {rolesIndexMarkdown, processesIndexMarkdown, processMarkdown, mapMarkdown} from '../src/discovery-help.js';

const cli=path.join(PACKAGE,'bin/ah-engineering.js');
function temp(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-guidelines-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  return root;
}
function workItem(root,id='feat') {
  const file=`.agenthouse/work/${id}.json`;
  fs.mkdirSync(path.join(root,'.agenthouse','work'),{recursive:true});
  fs.writeFileSync(path.join(root,file),JSON.stringify({
    schemaVersion:1,id,kind:'feature',title:'Guidelines',stage:'design',
    criteria:[{id:'c1',expectation:'Catalog is linked'}],
    fields:{outcome:'Document guidelines',scope:'Catalogs',acceptance:'Linked',verification:'check',dependencies:'none',risks:'low'}
  },null,2));
  return file;
}

test('architect role is listed and linked to architecture skills',()=>{
  const roles=roleProcessList('roles');
  assert.ok(roles.some(r=>r.id==='architect'));
  const shown=roleProcessShow('roles','architect');
  assert.equal(shown.definition.id,'architect');
  assert.ok(shown.definition.skills.some(s=>s.id==='ah-architecture'));
  assert.ok(shown.definition.skills.some(s=>s.id==='ah-coding-standards'));
});

test('architecture write and check link a catalog on the work item',t=>{
  const root=temp(t);
  const item=workItem(root);
  fs.mkdirSync(path.join(root,'docs','adr'),{recursive:true});
  fs.writeFileSync(path.join(root,'docs','adr','0001-example.md'),'# ADR-0001 Example\n\nStatus: accepted\n\nDecision body.\n');
  const written=writeArchitecture(root,{
    item,
    entries:[{id:'ADR-0001',title:'Example',path:'docs/adr/0001-example.md',status:'accepted',authorityClass:'advisory',summary:'Sample'}]
  });
  assert.equal(written.status,'written');
  assert.equal(written.check.status,'passed');
  const record=JSON.parse(fs.readFileSync(path.join(root,item),'utf8'));
  assert.equal(record.fields.architectureCatalog,written.catalog);
  const listed=listArchitecture(root,{item});
  assert.equal(listed.entries.length,1);
  const missing=checkArchitecture(root,{catalog:written.catalog});
  assert.equal(missing.status,'passed');
});

test('architecture check reports missing ADR paths',t=>{
  const root=temp(t);
  const catalog='.agenthouse/work/arch.json';
  fs.mkdirSync(path.join(root,'.agenthouse','work'),{recursive:true});
  fs.writeFileSync(path.join(root,catalog),JSON.stringify({
    schemaVersion:1,kind:'architecture-catalog',ownerRole:'architect',
    entries:[{id:'ADR-X',title:'Missing',path:'docs/adr/missing.md',status:'proposed',authorityClass:'advisory'}]
  }));
  const checked=checkArchitecture(root,{catalog});
  assert.equal(checked.status,'incomplete');
  assert.ok(checked.findings.some(f=>/Missing architecture document/.test(f.reason)));
});

test('coding-standards write, show module, and check',t=>{
  const root=temp(t);
  const item=workItem(root,'std');
  const written=writeCodingStandards(root,{
    item,
    module:'node-typescript',
    entries:[{id:'CS-001',title:'Prefer clear names',mechanism:'advisory',summary:'Readable identifiers'}]
  });
  assert.equal(written.status,'written');
  assert.equal(written.check.status,'passed');
  const shown=showCodingStandards(root,{item,module:'node-typescript'});
  assert.equal(shown.entries.length,1);
  assert.ok(shown.moduleStandards?.text);
  const enforce=writeCodingStandards(root,{
    item,
    output:'.agenthouse/work/std-coding-standards-strict.json',
    entries:[{id:'CS-LINT',title:'Lint',mechanism:'eslint'}]
  });
  assert.equal(enforce.check.status,'incomplete');
});

test('help renders roles, processes markdown, and support map',()=>{
  const roles=help('roles');
  assert.match(roles,/^# Roles/m);
  assert.match(roles,/architect/);
  const role=help('role architect');
  assert.match(role,/Propose architecture decisions/);
  const processes=help('processes');
  assert.match(processes,/^# Product processes/m);
  assert.match(processes,/feature-request/);
  const process=help('process feature-request');
  assert.match(process,/^# Feature request/m);
  assert.match(process,/ah-architecture/);
  const map=help('map');
  assert.match(map,/Command support map/);
  assert.match(map,/ah-architecture/);
  assert.match(map,/`architect`/);
  assert.equal(rolesIndexMarkdown().includes('engineer'),true);
  assert.equal(processesIndexMarkdown().includes('bug'),true);
  assert.ok(processMarkdown('change'));
  assert.ok(mapMarkdown().includes('ah-coding-standards'));
});

test('CLI help and architecture list work',()=>{
  const helpArch=spawnSync(process.execPath,[cli,'help','architecture'],{encoding:'utf8'});
  assert.equal(helpArch.status,0,helpArch.stderr);
  assert.match(helpArch.stdout,/architecture list/);
  const helpCs=spawnSync(process.execPath,[cli,'help','coding-standards'],{encoding:'utf8'});
  assert.equal(helpCs.status,0,helpCs.stderr);
  assert.match(helpCs.stdout,/coding-standards show/);
  const helpMap=spawnSync(process.execPath,[cli,'help','map'],{encoding:'utf8'});
  assert.equal(helpMap.status,0,helpMap.stderr);
  assert.match(helpMap.stdout,/Command support map/);
  const goal=spawnSync(process.execPath,[cli,'help','coding standards for this repo'],{encoding:'utf8'});
  assert.equal(goal.status,0,goal.stderr);
  assert.match(goal.stdout,/Primary: ah-coding-standards/);
});

test('default help stays short and points to discovery topics',()=>{
  const text=help();
  assert.ok(text.split('\n').length<20);
  assert.match(text,/help roles/);
  assert.match(text,/help processes/);
  assert.match(text,/help map/);
  assert.doesNotMatch(text,/keygen/);
});
