import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PACKAGE,read,write} from '../src/io.js';
import {assembleSkillDiscovery,mergeRoleProcessDefinition,processOrientation,roleProcessAdopt,roleProcessCheck,roleProcessIgnore,roleProcessList,roleProcessShow} from '../src/roles-processes.js';

function temp(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-roles-processes-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}

test('role and process baselines can be discovered and consumer copies are explicit',t=>{
  const root=temp(t),roles=roleProcessList('roles',root),processes=roleProcessList('processes',root);
  assert.ok(roles.length>0);assert.ok(processes.length>0);
  assert.equal(roles[0].adopted,false);
  const result=roleProcessAdopt('roles',roles[0].id,root);
  assert.equal(result.status,'adopted');
  const shown=roleProcessShow('roles',roles[0].id,root);
  assert.equal(shown.source,'consumer-global-copy');
  assert.equal(shown.baselineVersion,read(path.join(PACKAGE,'baselines/version.json')).baselineVersion);
  const state=read(path.join(root,'.agenthouse-global/state.json'));
  assert.equal(state.history[0].action,'adopt');
  assert.ok(fs.existsSync(path.join(root,'.agenthouse-global/baselines/roles',roles[0].id,`${shown.baselineVersion}-${state.adopted.roles[roles[0].id].baselineDigest}.json`)));
});

test('adoption never overwrites existing consumer definitions',t=>{
  const root=temp(t),baseline=roleProcessList('roles')[0],file=path.join(root,'roles',`${baseline.id}.json`);
  write(file,{consumer:'owned'});
  assert.throws(()=>roleProcessAdopt('roles',baseline.id,root),/Consumer file already exists/);
  assert.deepEqual(read(file),{consumer:'owned'});
});

test('update checks report local edits and skill coverage without changing consumer files',t=>{
  const root=temp(t),id=roleProcessList('roles')[0].id;
  roleProcessAdopt('roles',id,root);
  const file=path.join(root,'roles',`${id}.json`),value=read(file);value.summary='Consumer wording';write(file,value);
  const before=fs.readFileSync(file,'utf8'),check=roleProcessCheck('roles',id,root);
  assert.equal(check.results[0].status,'current');
  assert.ok(check.results[0].localChanges.some(change=>change.field==='summary'));
  assert.deepEqual(check.results[0].skillCoverage.available.concat(check.results[0].skillCoverage.missing).sort(),value.skills.map(skill=>skill.id).sort());
  assert.equal(fs.readFileSync(file,'utf8'),before);
});

test('three-way merge preserves independent changes and identifies same-field conflicts',()=>{
  const base={name:'base',nested:{local:'base',upstream:'base'},items:['a']};
  const merged=mergeRoleProcessDefinition(base,{...base,nested:{local:'consumer',upstream:'base'}},{...base,nested:{local:'base',upstream:'framework'}});
  assert.deepEqual(merged.value,{name:'base',nested:{local:'consumer',upstream:'framework'},items:['a']});
  assert.equal(merged.conflicts.length,0);
  const conflict=mergeRoleProcessDefinition({name:'base'},{name:'consumer'},{name:'framework'});
  assert.equal(conflict.conflicts[0].field,'name');
  assert.equal(conflict.conflicts[0].local,'consumer');
});

test('process orientation is an advisory prompt and never workflow state',()=>{
  const one=processOrientation('We are coding the implementation now');
  assert.equal(one.status,'possible-match');assert.deepEqual(one.candidateStages,['implement']);
  assert.equal(one.advisory,true);assert.equal(one.authoritativeStatusSource,null);
  assert.equal(processOrientation('We need to validate customer feedback before a release').status,'ambiguous');
  assert.equal(processOrientation('Unclear what happens next').status,'needs-human-orientation');
});

test('ignore defers one baseline revision without editing the consumer copy',t=>{
  const root=temp(t),id=roleProcessList('processes')[0].id;
  roleProcessAdopt('processes',id,root);
  const file=path.join(root,'processes',`${id}.json`),before=fs.readFileSync(file,'utf8');
  const ignored=roleProcessIgnore('processes',id,root);
  assert.equal(ignored.status,'ignored');assert.equal(fs.readFileSync(file,'utf8'),before);
  const state=read(path.join(root,'.agenthouse-global/state.json'));
  assert.deepEqual(state.adopted.processes[id].ignoredRevisions,[{version:ignored.baselineVersion,digest:ignored.baselineDigest}]);
});

test('roles CLI exposes baseline discovery from an isolated consumer repository',t=>{
  const root=temp(t),cli=path.join(PACKAGE,'bin/ah-engineering.js');
  const result=spawnSync(process.execPath,[cli,'roles','list','--root',root],{encoding:'utf8',env:{...process.env,AGENTHOUSE_GLOBAL_REPO:root}});
  assert.equal(result.status,0,result.stderr);
  assert.ok(JSON.parse(result.stdout).length>0);
});

test('process and role views discover installed agenthouse-skills without copying them into the definition',()=>{
  const bug=roleProcessShow('processes','bug'),lifecycle=roleProcessShow('processes','product-lifecycle'),market=roleProcessShow('processes','market-validation'),engineer=roleProcessShow('roles','engineer'),product=roleProcessShow('roles','product-manager');
  for(const view of [bug,lifecycle,engineer]) {
    const ids=view.skillDiscovery.skills.map(skill=>skill.id);
    assert.deepEqual(ids,['frontend-acceptance','web-usability-conformity']);
    assert.equal(view.skillDiscovery.advisory,true);
    assert.equal(view.skillDiscovery.unscoped.length,0);
    for(const skill of view.skillDiscovery.skills) {
      assert.equal(skill.availability,'installed');
      assert.equal(skill.origin,'bundled-dependency');
      assert.equal(skill.source,'agenthouse-skills');
      assert.equal(skill.repository,'https://github.com/agenthouse-org/skills.git');
    }
  }
  assert.equal(bug.skillDiscovery.skills[0].version,'0.2.0');
  assert.equal(bug.skillDiscovery.skills[1].version,'0.1.0');
  assert.equal(bug.definition.skills.includes('frontend-acceptance'),false);
  assert.deepEqual(lifecycle.skillDiscovery.skills.find(skill=>skill.id==='frontend-acceptance').matchedBy,['process','stage']);
  assert.deepEqual(market.skillDiscovery.skills,[]);
  assert.deepEqual(market.skillDiscovery.unscoped,[]);
  assert.deepEqual(product.skillDiscovery.skills,[]);
});

test('skill discovery honors frontmatter, reports unscoped installs, and keeps explicit baseline skills mapped',()=>{
  const index=new Map([['frontend-acceptance',{id:'frontend-acceptance',source:'agenthouse-skills',processes:['bug'],roles:[],stages:[],use:'Use the pinned method.'}]]);
  const installed=[
    {id:'frontend-acceptance',version:'0.2.0',repository:'https://github.com/agenthouse-org/skills.git',path:'engineering/frontend-acceptance',origin:'bundled-dependency',frontmatter:{}},
    {id:'sample-method',version:'1.0.0',repository:null,path:null,origin:'project-import',frontmatter:{processes:['market-validation'],description:'Review a sample.'}},
    {id:'bare-method',version:'1.0.0',repository:null,path:null,origin:'project-import',frontmatter:{}}
  ];
  const market=assembleSkillDiscovery({id:'market-validation',skills:[]},'processes',installed,index);
  assert.deepEqual(market.skills.map(skill=>skill.id),['sample-method']);
  assert.equal(market.skills[0].origin,'project-import');
  assert.equal(market.skills[0].use,'Review a sample.');
  assert.deepEqual(market.unscoped.map(skill=>skill.id),['bare-method']);
  const explicit=assembleSkillDiscovery({id:'bug',skills:['frontend-acceptance']},'processes',installed,index);
  assert.equal(explicit.skills.some(skill=>skill.id==='frontend-acceptance'),false);
  const missing=assembleSkillDiscovery({id:'bug',skills:[]},'processes',[],index);
  assert.equal(missing.skills[0].availability,'not-installed');
  assert.equal(missing.skills[0].origin,'discovery-index');
});

test('an imported skill is discovered from the project when its frontmatter names the process',t=>{
  const root=temp(t),project=temp(t);
  const skill=path.join(project,'.agents','skills','sample-method');
  fs.mkdirSync(skill,{recursive:true});
  fs.writeFileSync(path.join(skill,'SKILL.md'),'---\nname: sample-method\nprocesses:\n  - market-validation\n---\n\n# Sample\n');
  write(path.join(project,'.agenthouse','skills.json'),{'sample-method':{version:'1.2.3',digest:'abc',files:{'SKILL.md':'abc'}}});
  const shown=roleProcessShow('processes','market-validation',root,project);
  const found=shown.skillDiscovery.skills.find(skill=>skill.id==='sample-method');
  assert.equal(found.origin,'project-import');
  assert.equal(found.version,'1.2.3');
  assert.deepEqual(found.matchedBy,['process']);
});
