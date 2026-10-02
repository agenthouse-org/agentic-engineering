import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {classifyTestLayer, TEST_LAYERS} from '../src/inspect.js';
import {checkTestPlan, writeTestPlan} from '../src/test-plan.js';
import {prepareWriteTests, markTestsWritten} from '../src/write-tests.js';
import {createPipeline, planPipeline, applyPipeline, pipelineJobs, publishPipeline} from '../src/pipeline.js';
import {roleProcessList, roleProcessShow} from '../src/roles-processes.js';
import {PACKAGE} from '../src/io.js';

function temp(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-test-authoring-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  return root;
}
function workItem(root,id='demo') {
  const file=path.join(root,'.agenthouse','work',`${id}.json`);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const record={
    schemaVersion:1,id,title:'Demo',kind:'feature',stage:'define',author:'tester',
    fields:{outcome:'o',scope:'s',acceptance:'a',verification:'v',dependencies:'d',risks:'r'},
    criteria:[{id:'c1',expectation:'rejects empty input'},{id:'c2',expectation:'shows confirmation'}]
  };
  fs.writeFileSync(file,JSON.stringify(record,null,2));
  return {file:`.agenthouse/work/${id}.json`,record};
}

test('interaction is a portable test layer',()=>{
  assert.ok(TEST_LAYERS.includes('interaction'));
  assert.equal(classifyTestLayer('tests/interaction/checkout.spec.ts'),'interaction');
  assert.equal(classifyTestLayer('e2e/checkout.spec.ts'),'end-to-end');
});

test('test-manager and devops roles are listed',()=>{
  const roles=roleProcessList('roles');
  assert.ok(roles.some(r=>r.id==='test-manager'));
  assert.ok(roles.some(r=>r.id==='devops'));
  const shown=roleProcessShow('roles','test-manager');
  assert.equal(shown.definition.id,'test-manager');
  assert.ok(shown.definition.skills.some(s=>s.id==='ah-test-plan'));
});

test('test-plan write and check cover criteria',t=>{
  const root=temp(t);
  const {file}=workItem(root);
  const written=writeTestPlan(root,{
    item:file,
    items:[
      {criterionId:'c1',level:'unit',method:'tdd',path:'tests/demo.test.js',status:'planned'},
      {criterionId:'c2',level:'interaction',method:'tdd',path:'e2e/confirm.spec.ts',status:'planned'}
    ],
    standardRef:'modules/node-typescript.md',
    baseline:{status:'passed',evaluator:'tests',report:'.agenthouse/local/reports/demo/result.json'}
  });
  assert.equal(written.exitCode,0);
  const checked=checkTestPlan(root,{item:file});
  assert.equal(checked.status,'passed');
  assert.equal(checked.unlinkedCriteria.length,0);
});

test('test-plan reports criterion has no test',t=>{
  const root=temp(t);
  const {file}=workItem(root);
  writeTestPlan(root,{
    item:file,
    items:[{criterionId:'c1',level:'unit',method:'tdd',path:'tests/demo.test.js',status:'planned'}],
    baseline:{status:'passed'}
  });
  const checked=checkTestPlan(root,{item:file});
  assert.equal(checked.status,'incomplete');
  assert.deepEqual(checked.unlinkedCriteria,['c2']);
});

test('write-tests requires green baseline then marks written',t=>{
  const root=temp(t);
  const {file}=workItem(root);
  writeTestPlan(root,{
    item:file,
    items:[
      {criterionId:'c1',level:'unit',method:'tdd',path:'tests/demo.test.js',status:'planned'},
      {criterionId:'c2',level:'interaction',method:'tdd',path:'e2e/confirm.spec.ts',status:'planned'}
    ]
  });
  const blocked=prepareWriteTests(root,{item:file});
  assert.equal(blocked.status,'incomplete');
  writeTestPlan(root,{
    item:file,
    items:[
      {criterionId:'c1',level:'unit',method:'tdd',path:'tests/demo.test.js',status:'planned'},
      {criterionId:'c2',level:'interaction',method:'tdd',path:'e2e/confirm.spec.ts',status:'planned'}
    ],
    baseline:{status:'passed',evaluator:'tests'}
  });
  const ready=prepareWriteTests(root,{item:file,evaluator:'tests'});
  assert.equal(ready.status,'ready');
  assert.equal(ready.items.length,2);
  const marked=markTestsWritten(root,{item:file,criterionIds:['c1']});
  assert.equal(marked.status,'written');
  assert.deepEqual(marked.requireRed,['c1']);
});

test('pipeline create and publish templates',t=>{
  const root=temp(t);
  assert.equal(pipelineJobs().jobs.length,4);
  const created=createPipeline(root,{provider:'github',jobs:'pull-request,frontend'});
  assert.equal(created.status,'created');
  const body=fs.readFileSync(path.join(root,'.github','workflows','agenthouse-evaluate.yml'),'utf8');
  assert.match(body,/pull-request:/);
  assert.match(body,/frontend:/);
  assert.match(body,/upload-artifact@/);
  assert.doesNotMatch(body,/ah-job:/);
  assert.doesNotMatch(body,/post-deploy:/);
  const pub=publishPipeline(root,{provider:'github'});
  assert.equal(pub.status,'ready');
  const again=createPipeline(root,{provider:'github'});
  assert.equal(again.status,'incomplete');
});

test('pipeline plan apply refuses drifted files',t=>{
  const root=temp(t);
  const planned=planPipeline(root,{provider:'gitlab',jobs:'pull-request',output:'.agenthouse/local/plan.json'});
  assert.equal(planned.status,'create');
  const applied=applyPipeline(root,{plan:planned.plan});
  assert.equal(applied.status,'applied');
  fs.appendFileSync(path.join(root,'.gitlab-ci.yml'),'\n# edited\n');
  const replanned=planPipeline(root,{provider:'gitlab',jobs:'pull-request',output:'.agenthouse/local/plan2.json'});
  fs.writeFileSync(path.join(root,'.gitlab-ci.yml'),'stages: [test]\n');
  const denied=applyPipeline(root,{plan:replanned.plan});
  assert.equal(denied.status,'incomplete');
});

test('ready gate validates linked test plan',t=>{
  const root=temp(t);
  const {file}=workItem(root);
  writeTestPlan(root,{
    item:file,
    items:[{criterionId:'c1',level:'unit',method:'tdd',path:'tests/a.test.js',status:'planned'}],
    baseline:{status:'passed'}
  });
  const checked=checkTestPlan(root,{item:file});
  assert.ok(checked.findings.some(f=>f.reason==='Criterion has no test'));
});

test('CLI help exposes test-plan write-tests and pipeline',()=>{
  const cli=path.join(PACKAGE,'bin','ah-engineering.js');
  const help=spawnSync(process.execPath,[cli,'help','test-plan'],{encoding:'utf8'});
  assert.equal(help.status,0,help.stderr);
  assert.match(help.stdout,/test-plan check/);
  const pipe=spawnSync(process.execPath,[cli,'help','pipeline'],{encoding:'utf8'});
  assert.equal(pipe.status,0,pipe.stderr);
  assert.match(pipe.stdout,/pipeline create/);
  const writeHelp=spawnSync(process.execPath,[cli,'help','write-tests'],{encoding:'utf8'});
  assert.equal(writeHelp.status,0,writeHelp.stderr);
  assert.match(writeHelp.stdout,/write-tests prepare/);
});
