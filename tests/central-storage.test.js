import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {install,payload,restore,uninstall,installationStatus,projectContext} from '../src/install.js';
import {dependencyStatus} from '../src/dependencies.js';
import {runtimeDirectory,skillDirectory} from '../src/storage.js';
import {read,write,hash,PACKAGE} from '../src/io.js';
import {update,rollback} from '../src/update.js';
import {importSkill} from '../src/skills.js';
const home=fs.mkdtempSync(path.join(os.tmpdir(),'ah-central-store-'));process.env.AGENTHOUSE_HOME=home;after(()=>fs.rmSync(home,{recursive:true,force:true}));
function temp(t) {const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ah-central repo '));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function git(root,...args) {const r=spawnSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout;}
function setup(t,options={}){const root=temp(t);git(root,'init');install(root,{agents:['codex'],...options});return root;}
test('two repositories share exact skills and runtime, with no per-repo skill copies',t=>{
  const a=setup(t),b=setup(t);
  assert.equal(runtimeDirectory(a),runtimeDirectory(b));assert.equal(skillDirectory(a,'frontend-acceptance'),skillDirectory(b,'frontend-acceptance'));
  for(const root of [a,b]) {
    assert.equal(fs.existsSync(path.join(root,'.agents')),false);assert.equal(fs.existsSync(path.join(root,'.agenthouse/runtime')),false);
    assert.equal(fs.existsSync(path.join(root,'.agenthouse/lifecycle.md')),false);
    assert.ok(projectContext(root).skills['ah-work'].startsWith(home));dependencyStatus(root);
    const result=spawnSync(process.execPath,[path.join(root,'.agenthouse/run.mjs'),'context','--root',root],{encoding:'utf8',windowsHide:true});assert.equal(result.status,0,result.stderr);
  }
});
test('private setup and uninstall preserve existing instructions and keep all retained state excluded',t=>{
  const root=temp(t);git(root,'init');write(path.join(root,'AGENTS.md'),'consumer');write(path.join(root,'.gitignore'),'node_modules/\n');git(root,'add','AGENTS.md','.gitignore');
  install(root,{integration:'private',agents:['claude','codex']});
  assert.equal(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),'consumer');assert.equal(fs.existsSync(path.join(root,'CLAUDE.md')),false);
  assert.equal(git(root,'ls-files','--others','--exclude-standard'),'');
  uninstall(root);assert.equal(git(root,'ls-files','--others','--exclude-standard'),'');assert.ok(fs.existsSync(path.join(root,'.agenthouse/config.json')));
});
test('private setup rejects already tracked framework state before modifying instructions',t=>{
  const root=temp(t);git(root,'init');write(path.join(root,'.agenthouse/notes.md'),'consumer');git(root,'add','.agenthouse/notes.md');
  assert.throws(()=>install(root,{integration:'private'}),/cannot hide tracked/);assert.equal(fs.existsSync(path.join(root,'AGENTS.md')),false);
});
test('shared ignore blocks use native comments and legacy marker migration preserves consumer rules',t=>{
  const root=setup(t),file=path.join(root,'.gitignore'),statePath=path.join(root,'.agenthouse/installation.json');
  let content=fs.readFileSync(file,'utf8');assert.match(content,/^# agenthouse:start/m);assert.doesNotMatch(content,/<!--/);
  content=content.replace('# agenthouse:start','<!-- agenthouse:start -->').replace('# agenthouse:end','<!-- agenthouse:end -->');write(file,content+'\nconsumer-output/\n');
  const state=read(statePath);state.files['.gitignore'].digest=hash(content.trim());write(statePath,state);
  install(root);assert.match(fs.readFileSync(file,'utf8'),/consumer-output/);installationStatus(root);uninstall(root);assert.match(fs.readFileSync(file,'utf8'),/consumer-output/);
});
test('explicit migration removes unchanged managed project skills but preserves consumer skills',t=>{
  const root=setup(t,{storage:'project'});write(path.join(root,'.agents/skills/custom/SKILL.md'),'consumer');
  install(root,{storage:'machine'});assert.equal(fs.existsSync(path.join(root,'.agents/skills/ah-work/SKILL.md')),false);
  assert.equal(fs.readFileSync(path.join(root,'.agents/skills/custom/SKILL.md'),'utf8'),'consumer');dependencyStatus(root);
});
test('migration refuses edited owned skills without partially changing project files',t=>{
  const root=setup(t,{storage:'project'}),file=path.join(root,'.agents/skills/ah-work/SKILL.md');fs.appendFileSync(file,'edited');
  const before=fs.readFileSync(path.join(root,'.agenthouse/active.json'));assert.throws(()=>install(root,{storage:'machine'}),/Modified/);
  assert.deepEqual(fs.readFileSync(path.join(root,'.agenthouse/active.json')),before);assert.match(fs.readFileSync(file,'utf8'),/edited$/);
});
test('a clone restores from an exact offline bundle into another machine cache',t=>{
  const root=setup(t),data=payload(runtimeDirectory(root)),bundle=path.join(temp(t),'offline.json');write(bundle,data);
  git(root,'config','user.email','fixture@example.invalid');git(root,'config','user.name','Fixture');
  git(root,'add','--all');git(root,'commit','-m','Shared enrollment');
  const clone=temp(t);git(root,'clone',root,clone);
  assert.equal(fs.existsSync(path.join(clone,'.agenthouse/local/owner.key')),false);
  const previous=process.env.AGENTHOUSE_HOME;process.env.AGENTHOUSE_HOME=temp(t);
  try {restore(clone,{bundle});installationStatus(clone);dependencyStatus(clone);assert.ok(fs.existsSync(projectContext(clone).skills['frontend-acceptance']));}
  finally {process.env.AGENTHOUSE_HOME=previous;}
});
test('central updates and rollback leave a second repository on its own exact version',t=>{
  const a=setup(t),b=setup(t),original=runtimeDirectory(b),data=payload();data.version=data.version.split('.').map((part,index)=>index===2?String(Number(part)+1):part).join('.');const pkg=JSON.parse(Buffer.from(data.files['package.json'],'base64'));pkg.version=data.version;data.files['package.json']=Buffer.from(JSON.stringify(pkg)).toString('base64');
  const bundle=path.join(temp(t),'update.json');write(bundle,data);update(a,{bundle,sha256:hash(fs.readFileSync(bundle))});assert.notEqual(runtimeDirectory(a),original);assert.equal(runtimeDirectory(b),original);
  rollback(a);assert.equal(runtimeDirectory(a),original);dependencyStatus(b);
});
test('imported skills are stored centrally and conflicting content is rejected',t=>{
  const root=setup(t),source=temp(t);write(path.join(source,'SKILL.md'),'---\nname: example\n---\nReviewed skill');importSkill(root,source);
  assert.ok(skillDirectory(root,'example').startsWith(home));assert.equal(fs.existsSync(path.join(root,'.agents')),false);
  write(path.join(source,'SKILL.md'),'---\nname: example\n---\nChanged');assert.throws(()=>importSkill(root,source),/another revision/);
});
test('central tampering is reported without overwriting shared content',t=>{
  const previous=process.env.AGENTHOUSE_HOME;process.env.AGENTHOUSE_HOME=temp(t);
  try {const root=setup(t),file=path.join(skillDirectory(root,'frontend-acceptance'),'SKILL.md');fs.appendFileSync(file,'edited');assert.throws(()=>dependencyStatus(root),/modified/);assert.throws(()=>restore(root),/modified/);assert.match(fs.readFileSync(file,'utf8'),/edited$/);}
  finally {process.env.AGENTHOUSE_HOME=previous;}
});
test('scripted onboarding requires an integration choice before writing the target',t=>{
  const root=temp(t),r=spawnSync(process.execPath,[path.join(PACKAGE,'bin/ah-engineering.js'),'onboard','--root',root,'--non-interactive'],{encoding:'utf8',windowsHide:true});
  assert.equal(r.status,2);assert.match(r.stderr,/--integration/);assert.deepEqual(fs.readdirSync(root),[]);
});

test('reenrollment after uninstall reuses retained exclusions and keeps credentials hidden',t=>{
  for(const integration of ['shared','private']) {
    const root=setup(t,{integration});uninstall(root);
    assert.doesNotMatch(git(root,'ls-files','--others','--exclude-standard'),/owner.key/);
    install(root,{integration,agents:['codex']});installationStatus(root);
  }
});
test('invalid central storage and private output locations cannot activate',t=>{
  const root=temp(t);git(root,'init');
  assert.throws(()=>install(root,{integration:'private',artifactPaths:['../escape']}),/Unsafe/);
  assert.equal(fs.existsSync(path.join(root,'.agenthouse/config.json')),false);
  const previous=process.env.AGENTHOUSE_HOME;process.env.AGENTHOUSE_HOME=path.join(root,'store');
  try {assert.throws(()=>install(root),/outside the target/);assert.equal(fs.existsSync(path.join(root,'store')),false);}
  finally {process.env.AGENTHOUSE_HOME=previous;}
});
