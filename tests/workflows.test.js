import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {install as installActual,payload,transact,uninstall} from '../src/install.js';
import {write,read,hash,PACKAGE} from '../src/io.js';
import {resolve,signed} from '../src/policy.js';
import {newItem,advance,createBranch} from '../src/lifecycle.js';
import {controls} from '../src/controls.js';
import {gate,specification,CRITERIA} from '../src/gates.js';
import {renderBranchName,slugify} from '../src/branch-naming.js';
import {writeBranchNaming} from '../src/onboard.js';
import {survey,inspectChange,evidenceReview} from '../src/inspect.js';
import {importBacklog} from '../src/backlog.js';
import {hookRuntime,hook,hookSettings} from '../src/hooks.js';
import {dependencyStatus} from '../src/dependencies.js';
import {pinDependency,updateDependency} from '../src/dependency-update.js';
import {evaluate} from '../src/evaluate.js';
import {planModule,applyModulePlan} from '../src/module-plan.js';
import {session} from '../src/update.js';

function temp(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah workflow '));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function setup(t){const root=temp(t);install(root,{agents:[],project:'example',autonomy:'bounded'});return root;}
function config(root,edit){const f=path.join(root,'.agenthouse/config.json'),c=read(f);edit(c);write(f,c);return resolve(root).snapshot;}
function git(root,...args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function item(root){const record={id:'sample',author:'author',criteria:[{id:'behavior',expectation:'Observable outcome'}],fields:Object.fromEntries([...CRITERIA.ready,...CRITERIA.done].map(f=>[f,'Documented'])),evidence:[],build:'build-one'};write(path.join(root,'item.json'),record);return record;}

test('survey and commit analysis handle root commit, deleted files and merge bases',t=>{
  const root=temp(t);git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Test');
  write(path.join(root,'package.json'),{scripts:{test:'not executed'},devDependencies:{typescript:'1'}});
  write(path.join(root,'widget.ts'),'export const value=1;\n');write(path.join(root,'tests/widget.test.ts'),'test\n');git(root,'add','.');git(root,'commit','-m','initial');const base=git(root,'rev-parse','HEAD');
  assert.equal(inspectChange(root).comparison,'root-commit');assert.equal(survey(root).tools[0].command,'not executed');
  write(path.join(root,'widget.ts'),'// TODO investigate\n// @ts-ignore\nexport const value=2;\n');fs.unlinkSync(path.join(root,'tests/widget.test.ts'));git(root,'add','.');git(root,'commit','-m','change');
  const report=inspectChange(root,{base});assert.equal(report.base,base);assert.equal(report.findings.length,2);assert.ok(report.files.some(f=>f.status==='D'));assert.throws(()=>inspectChange(root,{ref:'--help'}));
});
test('CI templates preserve JUnit reports on failures without masking the gate result',()=>{
  const github=fs.readFileSync(path.join(PACKAGE,'templates/ci/github.yml'),'utf8');
  const gitlab=fs.readFileSync(path.join(PACKAGE,'templates/ci/gitlab.yml'),'utf8');
  const skill=fs.readFileSync(path.join(PACKAGE,'skills/ah-evaluate/SKILL.md'),'utf8');
  assert.match(github,/if:\s*always\(\)/);
  assert.match(github,/path:\s*\.agenthouse\/local\/reports\//);
  assert.match(github,/not parsed into a native test-results view/);
  assert.match(gitlab,/when:\s*always/);
  assert.match(gitlab,/reports:\s*\n\s+junit:\s*\.agenthouse\/local\/reports\/\*\/junit\.xml/);
  assert.match(skill,/confirm the selected platform uploads the generated junit\.xml/);
  assert.match(skill,/report ingestion turn a failed gate into success/);
});
test('survey reports test-layer gaps and conservative nominal evidence without executing scripts',t=>{
  const root=temp(t);git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Test');
  write(path.join(root,'package.json'),{scripts:{'test:unit':'node -e "require(\'fs\').writeFileSync(\'executed\',\'bad\')"','test:api':'vitest run tests/api'}});
  write(path.join(root,'tests/unit/empty.test.js'),'// placeholder only\n');write(path.join(root,'tests/api/users.test.js'),'test("users",()=>expect(1).toBe(1));\n');
  git(root,'add','.');git(root,'commit','-m','tests');
  const result=survey(root),unit=result.testLayers.layers.find(item=>item.layer==='unit'),api=result.testLayers.layers.find(item=>item.layer==='functional-api');
  assert.equal(unit.status,'suspected-nominal');assert.ok(unit.signals.some(item=>item.signal==='empty-or-comments-only'));
  assert.equal(api.status,'present');assert.equal(result.testLayers.layers.find(item=>item.layer==='contract').status,'absent');
  assert.equal(fs.existsSync(path.join(root,'executed')),false);
});
test('survey honors reviewed local layer selection and aliases',t=>{
  const root=setup(t);git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Test');
  const file=path.join(root,'.agenthouse/config.json'),c=read(file);c.testing={layers:['contract'],aliases:{consumer:'contract'}};write(file,c);resolve(root);
  write(path.join(root,'tests/consumer/order.test.js'),'test("contract",()=>expect(true).toBe(true));');git(root,'add','.');git(root,'commit','-m','contract');
  const result=survey(root);assert.deepEqual(result.testLayers.selectedLayers,['contract']);assert.equal(result.testLayers.layers[0].status,'present');
});
test('module preview and apply wire discovered tests through an exact reviewed target state',t=>{
  const root=setup(t);write(path.join(root,'package.json'),{name:'@example/doc-service',scripts:{'test:unit':'node --test','test:api':'vitest run tests/api'}});
  const plan=planModule(root,'node-typescript',{});assert.match(plan.diff,/tests\.example-doc-service\.unit/);assert.equal(plan.changes.evaluators.length,2);
  assert.ok(plan.targetConfig.profiles['test-adoption'].checks.every(item=>item.required===false));assert.ok(plan.targetConfig.profiles['pull-request'].checks.some(item=>item.required===true));
  const tampered=structuredClone(plan);tampered.targetConfig.documentationAuthority='other';const bad=path.join(root,'bad-plan.json');write(bad,tampered);assert.throws(()=>applyModulePlan(root,bad),/unrelated configuration/);
  const artifact=path.join(root,'module-plan.json');write(artifact,plan);const applied=applyModulePlan(root,artifact);assert.equal(applied.status,'applied');
  const configured=read(path.join(root,'.agenthouse/config.json'));assert.ok(configured.evaluators.some(item=>item.id==='tests.example-doc-service.functional-api'));
  assert.throws(()=>resolve(root,{frozen:true}),/stale|modified/);assert.throws(()=>applyModulePlan(root,artifact),/changed after preview/);
});
test('module preview does not fabricate an evaluator when no test script exists',t=>{
  const root=setup(t);write(path.join(root,'package.json'),{name:'empty',scripts:{start:'node app.js'}});
  const plan=planModule(root,'node-typescript',{});assert.equal(plan.changes.evaluators.length,0);assert.match(plan.limitations.join(' '),/no evaluator.*fabricated/i);
});
test('module CLI saves and applies the reviewed handoff artifact',t=>{
  const root=setup(t);write(path.join(root,'package.json'),{name:'cli-app',scripts:{'test:contract':'node --test tests/contracts'}});
  const preview=spawnSync(process.execPath,[path.join(PACKAGE,'bin/ah-engineering.js'),'module','--root',root,'--name','node-typescript','--preview','--output','plan.json'],{encoding:'utf8'});
  assert.equal(preview.status,0,preview.stderr);assert.match(JSON.parse(preview.stdout).diff,/tests\.cli-app\.contract/);assert.ok(fs.existsSync(path.join(root,'plan.json')));
  const apply=spawnSync(process.execPath,[path.join(PACKAGE,'bin/ah-engineering.js'),'module','--root',root,'--apply','plan.json'],{encoding:'utf8'});
  assert.equal(apply.status,0,apply.stderr);assert.equal(JSON.parse(apply.stdout).status,'applied');
});
test('deferred profile promotion remains visible and prevents a successful enforced result',async t=>{
  const root=setup(t);write(path.join(root,'check.mjs'),'process.exit(0)');
  config(root,c=>{c.evaluators=[{id:'tests.root.unit',kind:'command',executable:'node',args:['check.mjs'],result:'exit-code'}];c.profiles={enforced:{checks:[{evaluator:'tests.root.unit',required:true}],promotion:{status:'deferred',reference:'ADR-42',owner:'repo-owner'}}};});
  const result=await evaluate(root,{profile:'enforced',frozen:true,subject:'build'});assert.equal(result.exitCode,4);assert.equal(result.promotion.status,'deferred');assert.ok(result.checks.some(item=>item.id==='profile-promotion'));
});
test('session reports policy drift without replacing the frozen snapshot',t=>{
  const root=setup(t),before=read(path.join(root,'.agenthouse/resolved.json'));const file=path.join(root,'.agenthouse/config.json'),c=read(file);c.documentationAuthority='reviewed-docs';write(file,c);
  const result=session(root);assert.equal(result.policyChange.status,'changed');assert.equal(read(path.join(root,'.agenthouse/resolved.json')).digest,before.digest);
});
test('ready gates separate incomplete fields from pending reviewer approval',t=>{
  const root=setup(t),record=item(root);assert.equal(gate(root,{item:'item.json'}).status,'pending');
  record.fields.scope='';write(path.join(root,'item.json'),record);assert.equal(gate(root,{item:'item.json'}).status,'incomplete');
  config(root,c=>c.lifecycle={ready:{approval:false}});record.fields.scope='Defined';write(path.join(root,'item.json'),record);assert.equal(gate(root,{item:'item.json'}).status,'passed');
});
test('ready gates report ticketSize until override, disable, or thinner criteria',t=>{
  const root=setup(t),record=item(root);
  config(root,c=>c.lifecycle={ready:{approval:false}});
  record.criteria=Array.from({length:9},(_,i)=>({id:`c${i}`,expectation:`Outcome ${i}`}));
  write(path.join(root,'item.json'),record);
  const oversized=gate(root,{item:'item.json'});
  assert.equal(oversized.status,'pending');
  assert.ok(oversized.findings.some(f=>f.id==='ticketSize'));
  record.fields.sizeOverride='User accepted one delivery for this epic';
  write(path.join(root,'item.json'),record);
  assert.equal(gate(root,{item:'item.json'}).status,'passed');
  delete record.fields.sizeOverride;
  record.fields.sizeRisk='oversized';
  record.criteria=[{id:'one',expectation:'Single outcome'}];
  write(path.join(root,'item.json'),record);
  assert.equal(gate(root,{item:'item.json'}).status,'pending');
  config(root,c=>c.lifecycle={ready:{approval:false,ticketSize:false}});
  assert.equal(gate(root,{item:'item.json'}).status,'passed');
  config(root,c=>c.lifecycle={ready:{approval:false,maxCriteria:2}});
  delete record.fields.sizeRisk;
  record.criteria=[{id:'a',expectation:'A'},{id:'b',expectation:'B'},{id:'c',expectation:'C'}];
  write(path.join(root,'item.json'),record);
  assert.ok(gate(root,{item:'item.json'}).findings.some(f=>f.id==='ticketSize'));
});
test('branch naming renders safe names and rejects incomplete patterns',t=>{
  assert.equal(slugify('Add Login Form!'),'add-login-form');
  assert.equal(renderBranchName('{kind}/{id}-{slug}',{id:'login',title:'Add Login Form',kind:'feature'}),'feature/login-add-login-form');
  assert.throws(()=>renderBranchName('{id}-{missing}',{id:'x',title:'Y'}),/incomplete/);
  assert.throws(()=>renderBranchName('../{id}',{id:'x',title:'Y'}),/Unsafe/);
});
test('work branch creates a related branch from a base and refuses dirty trees',t=>{
  const root=setup(t);
  git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Test');
  write(path.join(root,'readme.md'),'ok\n');git(root,'add','.');git(root,'commit','-m','initial');
  writeBranchNaming(root,{pattern:'{id}-{slug}',example:'slice-add-login',baseDefault:'main'});
  newItem(root,'parent','Parent feature');
  newItem(root,'login-slice','Add login form',undefined,undefined,{parentWork:'parent'});
  assert.throws(()=>createBranch(root,'login-slice'),/clean/);
  git(root,'add','.');git(root,'commit','-m','config');
  const created=createBranch(root,'login-slice',{from:'HEAD',parentWork:'parent'});
  assert.equal(created.branch,'login-slice-add-login-form');
  assert.equal(read(path.join(root,'.agenthouse/work/login-slice.json')).fields.branch,'login-slice-add-login-form');
  write(path.join(root,'dirty.txt'),'x');
  newItem(root,'other-slice','Other work');
  assert.throws(()=>createBranch(root,'other-slice'),/clean/);
  const bare=temp(t);install(bare,{agents:[],project:'example',autonomy:'bounded'});
  newItem(bare,'no-git','No git');
  writeBranchNaming(bare,{pattern:'{id}-{slug}'});
  assert.throws(()=>createBranch(bare,'no-git'),/Git repository required/);
});
test('done gates consume actual evaluator success and reject stale policy or failed criteria',async t=>{
  const root=setup(t),record=item(root);config(root,c=>{c.lifecycle={done:{approval:false}};c.evaluators=[{id:'behavior',kind:'command',executable:'node',args:['-e','process.exit(0)'],result:'exit-code'}];c.profiles={'pull-request':{checks:[{evaluator:'behavior',required:true}]}};});
  const result=await evaluate(root,{frozen:true,subject:record.build});
  const report=path.relative(root,path.join(result.folder,'result.json')).replaceAll('\\','/');
  record.evidence=[report];write(path.join(root,'item.json'),record);
  assert.equal(gate(root,{item:'item.json',phase:'done'}).status,'passed');
  config(root,c=>c.documentationAuthority='confluence');assert.equal(gate(root,{item:'item.json',phase:'done'}).status,'incomplete');
});
test('specification requires a relevant failing command before green and detects changed criteria',async t=>{
  const root=setup(t),record=item(root);write(path.join(root,'value.json'),1);write(path.join(root,'check.mjs'),"import fs from 'node:fs';process.exit(JSON.parse(fs.readFileSync('value.json'))===2?0:1);");
  config(root,c=>{c.evaluators=[{id:'behavior',kind:'command',executable:'node',args:['check.mjs'],result:'exit-code',specificationFiles:['check.mjs']}];c.profiles={'pull-request':{checks:[{evaluator:'behavior'}]}};});
  await assert.rejects(specification(root,{item:'item.json',phase:'green',evaluator:'behavior'}),/Capture red/);
  assert.equal((await specification(root,{item:'item.json',phase:'red',evaluator:'behavior'})).exitCode,1);
  write(path.join(root,'value.json'),2);assert.equal((await specification(root,{item:'item.json',phase:'green',evaluator:'behavior'})).status,'green');
  const changed=read(path.join(root,'item.json'));changed.criteria[0].expectation='Different behavior';write(path.join(root,'item.json'),changed);
  await assert.rejects(specification(root,{item:'item.json',phase:'green',evaluator:'behavior'}),/Capture red/);
});
test('backlog import preserves content and identity, is idempotent and refuses overwrite',t=>{
  const root=temp(t);write(path.join(root,'story.md'),'# A useful outcome\n\nKeep this text.');
  const args={source:'story.md',id:'item-1',provider:'jira',externalId:'TEAM-42'};
  assert.equal(importBacklog(root,args).item.external.id,'TEAM-42');assert.equal(importBacklog(root,args).status,'unchanged');
  fs.appendFileSync(path.join(root,'story.md'),'Changed');assert.throws(()=>importBacklog(root,args),/already exists/);
});
test('upstream hook guards abstain from host approval on success and reject unsafe matches',async t=>{
  const {runtime}=hookRuntime();assert.equal(runtime.guard('git commit --no-verify',{},'main').status,'denied');
  assert.equal(runtime.guard('git push --force origin main',{protectedBranches:['main']},'feature').status,'denied');
  assert.equal(runtime.guard('git push origin feature',{protectedBranches:['main']},'feature').status,'allowed');
  assert.deepEqual(JSON.parse(runtime.render('claude','before-command',{status:'allowed'}).stdout),{});
  const root=setup(t);write(path.join(root,'event.json'),{event:'after-edit',file:'../outside'});
  await assert.rejects(hook(root,{input:'event.json'}),/outside/);
  write(path.join(root,'event.json'),'malformed');await assert.rejects(hook(root,{input:'event.json'}));
});
test('touched-file checks run only selected extensions with bounded execution',async t=>{
  const {runtime}=hookRuntime(),root=temp(t);write(path.join(root,'file.ts'),'content');const calls=[];
  const policy={checks:[{id:'types',extensions:['.ts'],executable:'tool',args:['--file','{file}'],timeoutSeconds:3},{id:'php',extensions:['.php'],executable:'php',args:[]}]};
  const r=await runtime.handle({event:'after-edit',file:'file.ts'},policy,{root,run:async (...args)=>{calls.push(args);return {code:1,stderr:'failure'};}});
  assert.equal(r.status,'failed');assert.equal(calls.length,1);assert.deepEqual(calls[0][1],['--file','file.ts']);assert.equal(calls[0][2].timeoutSeconds,3);
});
test('second upstream skill is immutable, pinnable and can be checked independently',t=>{
  const root=setup(t),lock=dependencyStatus(root);assert.equal(lock.dependencies['web-usability-conformity'].version,'0.1.0');
  const policy=pinDependency(root,false,'web-usability-conformity');assert.ok(policy.pins['web-usability-conformity']);assert.equal(policy.pins['frontend-acceptance'],undefined);
  const data=read(new URL('../dependencies/web-usability-conformity.json',import.meta.url)),file=path.join(root,'bundle.json');write(file,data);
  assert.equal(updateDependency(root,{bundle:file,sha256:hash(fs.readFileSync(file)),check:true}).available,'0.1.0');
});

test('readiness approvals require a different issuer and become invalid after record changes',t=>{
  const root=setup(t),record=item(root),pending=gate(root,{item:'item.json'});
  const key=fs.readFileSync(path.join(root,'.agenthouse/local/owner.key'),'utf8');
  const decision={schemaVersion:1,kind:'decision',issuer:'project-owner',scope:'example',action:'gate:ready',subject:pending.subject,policyDigest:pending.policyDigest,issuedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+60000).toISOString(),verdict:'allowed'};
  write(path.join(root,'approval.json'),signed(decision,key));assert.equal(gate(root,{item:'item.json',decision:'approval.json'}).status,'passed');
  record.fields.scope='Changed';write(path.join(root,'item.json'),record);assert.throws(()=>gate(root,{item:'item.json',decision:'approval.json'}),/mismatch/);
  record.author='project-owner';write(path.join(root,'item.json'),record);assert.throws(()=>gate(root,{item:'item.json',decision:'approval.json'}),/independent/);
});
test('short paths require eligible kinds, rationale, verification and protected decisions',t=>{
  const root=setup(t);config(root,c=>c.lifecycle={paths:{small:['discover','implement','verify','accept','release','retire']},pathKinds:{small:['documentation']}});
  const record=newItem(root,'doc','Clarify guide','documentation','small');record.fields={outcome:'Clear instructions',pathReason:'Text-only clarification'};write(path.join(root,'.agenthouse/work/doc.json'),record);
  assert.equal(advance(root,'doc','implement').stage,'implement');
  const bug=newItem(root,'bug','Bug','bug','small');bug.fields={outcome:'Fix',pathReason:'Small'};write(path.join(root,'.agenthouse/work/bug.json'),bug);assert.throws(()=>advance(root,'bug','implement'),/eligible/);
  config(root,c=>c.lifecycle.paths.small=['discover','define','implement','release','retire']);assert.throws(()=>advance(root,'doc','release'),/protected/);
});
test('control mapping distinguishes unresolved guidance from automated mechanisms',t=>{
  const root=setup(t),file=path.join(root,'.agenthouse/policy.json'),policy=read(file);policy.rules.push({id:'naming',mode:'default',value:'Use clear names'});write(file,policy);resolve(root);
  const report=controls(root);assert.equal(report.rules.find(r=>r.id==='naming').automated,false);
});
test('pinned exports cannot disappear during a framework update',t=>{
  const root=setup(t);pinDependency(root,false,'hooks');
  const bundle=payload();for(const file of Object.keys(bundle.files))if(file.startsWith('dependencies/hooks/'))delete bundle.files[file];assert.throws(()=>install(root,{payload:bundle}),/Pinned dependency missing/);
  const data=read(path.join(root,'.agenthouse/active.json'));
  const manifest=path.join(root,'.agenthouse',data.runtime,'dependencies/hooks/engineering.cjs');fs.appendFileSync(manifest,'changed');assert.throws(()=>dependencyStatus(root),/modified/);
});

test('review maps explicit criteria and compares only matching build and policy baselines',t=>{
  const root=setup(t);git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Test');write(path.join(root,'code.js'),'before');git(root,'add','code.js');git(root,'commit','-m','before');const base=git(root,'rev-parse','HEAD');
  write(path.join(root,'code.js'),'after');git(root,'add','code.js');git(root,'commit','-m','after');const head=git(root,'rev-parse','HEAD'),record=item(root),{snapshot}=resolve(root,{frozen:true});
  write(path.join(root,'report.json'),{status:'satisfied',exitCode:0,subject:head,policyDigest:snapshot.digest,checks:[{id:'check',status:'passed',criteria:['behavior']}]});
  write(path.join(root,'baseline.json'),{subject:base,policyDigest:snapshot.digest,checks:[{id:'check',status:'failed'}]});
  const r=evidenceReview(root,{item:'item.json',evidence:['report.json'],baseline:'baseline.json'});assert.equal(r.status,'passed');assert.equal(r.baselineComparison[0].classification,'improved');
  config(root,c=>c.documentationAuthority='confluence');assert.equal(evidenceReview(root,{item:'item.json',evidence:['report.json']}).status,'incomplete');assert.throws(()=>evidenceReview(root,{item:'item.json',evidence:['report.json'],baseline:'baseline.json'}),/Baseline evidence/);
});

test('native hook setup preserves unrelated settings, is idempotent and removes owned entries',t=>{
  const root=setup(t),file=path.join(root,'.claude/settings.json'),original={permissions:{allow:['Read']},hooks:{SessionStart:[{hooks:[{type:'command',command:'existing-helper'}]}]}};write(file,original);
  transact(root,hookSettings(root).changes);assert.equal(read(file).hooks.SessionStart.length,2);assert.equal(hookSettings(root).changes.length,0);
  const changed=read(file);changed.extraSetting='preserve';write(file,changed);uninstall(root);
  assert.deepEqual(read(file),{...original,extraSetting:'preserve'});
});
test('native hook removal refuses edited managed groups without removing other files',t=>{
  const root=setup(t);transact(root,hookSettings(root).changes);const file=path.join(root,'.claude/settings.json'),settings=read(file);settings.hooks.PreToolUse[0].matcher='Custom';write(file,settings);
  assert.throws(()=>uninstall(root),/Modified or missing managed hook/);assert.ok(fs.existsSync(path.join(root,'.agenthouse/run.mjs')));
});

test('restoring a runtime without hooks removes owned handlers while preserving settings',t=>{
  const root=setup(t),file=path.join(root,'.claude/settings.json');write(file,{permissions:{allow:['Read']}});transact(root,hookSettings(root).changes);
  const bundle=payload();for(const name of Object.keys(bundle.files))if(name.startsWith('dependencies/hooks/'))delete bundle.files[name];install(root,{payload:bundle});
  assert.deepEqual(read(file),{permissions:{allow:['Read']}});assert.equal(fs.existsSync(path.join(root,'.agenthouse/hook-installation.json')),false);
});

test('kind-specific completion requirements are enforced and blank criteria rejected',t=>{
  const root=setup(t),record=item(root);record.kind='feature';write(path.join(root,'item.json'),record);
  config(root,c=>c.lifecycle={done:{approval:false,kindFields:{feature:['runbook']}}});
  assert.ok(gate(root,{item:'item.json',phase:'done'}).findings.some(f=>f.id==='runbook'));
  record.criteria[0].expectation=' ';write(path.join(root,'item.json'),record);assert.throws(()=>gate(root,{item:'item.json'}),/Invalid/);
});

function install(root,options={}) {return installActual(root,{storage:'project',...options});}
