import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {install} from '../src/install.js';
import {read,write,hash,PACKAGE,VERSION} from '../src/io.js';
import {resolve} from '../src/policy.js';
import {evaluationPlan,evaluate} from '../src/evaluate.js';
import {assessmentInventory,validateAssessment} from '../src/assessment.js';
import {importBacklog} from '../src/backlog.js';
import {evidenceReview} from '../src/inspect.js';
import {advance} from '../src/lifecycle.js';
import {gate} from '../src/gates.js';
import {help} from '../src/help.js';
const put=(root,file,value)=>write(path.join(root,file),value);
function setup(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah consumer '));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));install(root,{storage:'project',agents:[],autonomy:'bounded'});return root;}
function git(root,...args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function init(root){git(root,'init');git(root,'config','user.name','Test');git(root,'config','user.email','test@example.invalid');}
function configure(root,fn){const c=read(path.join(root,'.agenthouse/config.json'));fn(c);put(root,'.agenthouse/config.json',c);return resolve(root).snapshot;}
function cli(root,...args){return spawnSync(process.execPath,[path.join(PACKAGE,'bin/ah-engineering.js'),...args,'--root',root],{encoding:'utf8',windowsHide:true});}

test('evaluation plan is read-only, lists missing required checks, and reports origins',async t=>{
  const root=setup(t);
  put(root,'check.mjs',"import fs from 'node:fs';fs.writeFileSync('executed','yes');");
  configure(root,c=>{c.evaluators=[{id:'unit',kind:'command',executable:'node',args:['check.mjs'],result:'exit-code',origin:{module:'node-typescript',file:'package.json',rule:'UNIT-001'}}];c.profiles={'pull-request':{checks:[{evaluator:'unit'}]}};});
  const lock=fs.readFileSync(path.join(root,'.agenthouse/resolved.json'));
  const plan=evaluationPlan(root,{subject:'build',frozen:true});
  assert.equal(plan.checks[0].origin.module,'node-typescript');assert.equal(plan.mode,'plan');
  assert.equal(fs.existsSync(path.join(root,'executed')),false);
  assert.equal(fs.existsSync(path.join(root,'artifacts')),false);
  assert.deepEqual(fs.readFileSync(path.join(root,'.agenthouse/resolved.json')),lock);
  const dry=cli(root,'evaluate','--list','--subject','build');assert.equal(dry.status,0,dry.stderr);assert.equal(JSON.parse(dry.stdout).subject,'build');
  const alias=cli(root,'evaluate','--plan','--subject','build');assert.equal(alias.status,0,alias.stderr);assert.equal(JSON.parse(alias.stdout).mode,'plan');
  assert.equal(fs.existsSync(path.join(root,'executed')),false);
  const result=await evaluate(root,{subject:'build',frozen:true});assert.equal(result.exitCode,0);
  assert.match(fs.readFileSync(path.join(result.folder,'report.html'),'utf8'),/Origin: node-typescript · package.json · rule UNIT-001/);
  const policy=read(path.join(root,'.agenthouse/policy.json'));policy.requiredChecks=['missing'];put(root,'.agenthouse/policy.json',policy);resolve(root);
  assert.deepEqual(evaluationPlan(root,{subject:'build'}).omittedRequiredChecks,['missing']);
  assert.throws(()=>evaluationPlan(root,{subject:'build',profile:'unknown'}),/Unknown profile/);
});

test('feasibility inventory is commit-bound for PHP and TypeScript with exact locations',t=>{
  const root=setup(t);init(root);
  put(root,'src/store.ts','\n  saveRecord(value);\n');put(root,'app/Store.php','<?php\n saveRecord($value);\n');
  put(root,'item.json',{id:'assessment',fields:{outcome:'Replace persistence'},criteria:[{id:'AC-1',expectation:'Assess migration'}]});
  put(root,'selectors.json',[{text:'saveRecord(',category:'storage',reason:'Affected write'}]);
  git(root,'add','.');git(root,'commit','-m','base');const commit=git(root,'rev-parse','HEAD');
  const args={item:'item.json',selectors:'selectors.json',ref:commit},first=assessmentInventory(root,args);
  assert.equal(first.counts.storage,3);assert.equal(first.locations.find(l=>l.file==='src/store.ts').line,2);
  put(root,'src/store.ts','no calls');assert.deepEqual(assessmentInventory(root,args),first);
  const work=read(path.join(root,'item.json'));
  for(const [f,v] of [['assessment.md','# Proposal'],['current.mmd','flowchart LR\n A-->B'],['target.mmd','flowchart LR\n A-->C']])put(root,f,v);
  const summary={schemaVersion:1,kind:'technical-feasibility',commit,workItem:'item.json',criteriaDigest:hash(work.criteria),hypothesisDigest:hash(work.fields.outcome),policyDigest:resolve(root,{frozen:true}).snapshot.digest,
    selectors:'selectors.json',inventoryDigest:hash(first),artifacts:Object.fromEntries(['assessment.md','current.mmd','target.mmd'].map(f=>[f,hash(fs.readFileSync(path.join(root,f)))])),
    callSites:first.locations.map(l=>({...l,category:l.file==='selectors.json'?'excluded':'boundary',reason:l.file==='selectors.json'?'Search definition, not a call':'Repository call'})),scale:'1=least favorable;5=most favorable',
    scenarios:['big bang','dual write','adapter'].map((name,i)=>({name,rank:i+1,effort:3,risk:3,reversibility:3,prerequisites:3,operationalImpact:3,explanation:'Evidence-based rationale'})),
    migration:[{action:'Backfill',consistentWhen:'Rows match',abort:'Keep source'}],consumers:[],openQuestions:[],proposal:'Adapter'};
  put(root,'summary.json',summary);assert.equal(validateAssessment(root,'summary.json').counts.boundary,2);
  put(root,'followup.json',{id:'followup',fields:{technicalAssessment:'summary.json',assessmentCommit:commit},criteria:[{id:'next',expectation:'Implement proposal'}]});
  configure(root,c=>{c.lifecycle={ready:{fields:[],approval:false}};});
  summary.policyDigest=resolve(root,{frozen:true}).snapshot.digest;put(root,'summary.json',summary);
  assert.equal(gate(root,{item:'followup.json'}).status,'passed');
  const before=gate(root,{item:'followup.json'}).subject;
  summary.proposal='Revised recommendation';put(root,'summary.json',summary);
  assert.notEqual(gate(root,{item:'followup.json'}).subject,before,'Approval subject must bind assessment content');
  summary.scenarios[0].risk=6;put(root,'summary.json',summary);
  assert.throws(()=>validateAssessment(root,'summary.json'),/Rate risk/);
  summary.scenarios[0].risk=3;put(root,'summary.json',summary);
  put(root,'current.mmd','tampered');assert.throws(()=>validateAssessment(root,'summary.json'),/artifact changed/);
  assert.equal(gate(root,{item:'followup.json'}).status,'incomplete');
});

test('prose IDs require confirmation; open criteria stay open and baseline failures stay failed',t=>{
  const root=setup(t);init(root);put(root,'ticket.md','# Ticket\n- Returns a record\n- TBD consumer behavior\n');
  const imported=importBacklog(root,{source:'ticket.md',id:'ticket',proposeCriteria:true});assert.equal(imported.item.criteria[1].state,'open');
  git(root,'add','.');git(root,'commit','-m','base');const base=git(root,'rev-parse','HEAD');
  put(root,'change.txt','new');git(root,'add','change.txt');git(root,'commit','-m','head');const head=git(root,'rev-parse','HEAD');
  const digest=resolve(root,{frozen:true}).snapshot.digest;
  const report={subject:head,policyDigest:digest,status:'failed',exitCode:1,checks:[{id:'behavior',criteria:['AC-1'],required:true,status:'failed'}]};
  put(root,'head.json',report);put(root,'base.json',{...report,subject:base});
  const args={item:'.agenthouse/work/ticket.json',evidence:['head.json'],baseline:'base.json',ref:`${base}..${head}`};
  assert.equal(evidenceReview(root,args).coverage[0].verdict,'incomplete');
  const item=imported.item;item.criteriaConfirmation={digest:hash(item.criteria)};put(root,args.item,item);
  const result=evidenceReview(root,args);assert.equal(result.coverage[0].verdict,'fail');assert.equal(result.coverage[1].verdict,'open');assert.notEqual(result.status,'passed');assert.equal(result.baselineComparison[0].classification,'inherited');
  put(root,'base.json',{...report,subject:'wrong'});assert.throws(()=>evidenceReview(root,args),/Baseline evidence/);
});

test('verify transition blocks missing specification and remains opt-in',t=>{
  const root=setup(t),file='.agenthouse/work/item.json';
  const item={id:'item',stage:'implement',kind:'feature',revision:1,fields:{changes:'Implemented'},criteria:[{id:'AC',expectation:'Behavior'}],evidence:[],history:[]};
  put(root,file,item);configure(root,c=>{c.lifecycle={verify:{fields:['changes'],approval:false,requireRed:true,requireGreen:true}};});
  assert.throws(()=>advance(root,'item','verify'),/specification/);assert.equal(read(path.join(root,file)).stage,'implement');
  configure(root,c=>{delete c.lifecycle.verify;});assert.equal(advance(root,'item','verify').stage,'verify');
});

test('doctor exposes supplied plugin mismatch and help maps goals without administration',t=>{
  const root=setup(t),result=cli(root,'doctor','--plugin-version','0.0.0');
  assert.equal(result.status,2,result.stderr);assert.equal(JSON.parse(result.stdout).repositoryVersion,VERSION);assert.match(result.stdout,/Plugin version/);
  assert.match(help('I need to assess migration impact'),/Primary: ah-assess-tech-feasibility/);
  assert.match(help('review this merge request'),/Primary: ah-review-mr/);
  assert.ok(help().split('\n').length<20);assert.doesNotMatch(help(),/keygen|npm-provenance|hook-config/);
  const goal=cli(root,'help','I','need','to','plan','this');assert.equal(goal.status,0,goal.stderr);assert.match(goal.stdout,/Primary: ah-draft-user-story/);
});
