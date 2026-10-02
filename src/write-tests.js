import fs from 'node:fs';
import {assert, read, write, inside, exclusive} from './io.js';
import {loadTestPlan, checkTestPlan} from './test-plan.js';

function baselineOk(plan) {
  const status=plan.baseline?.status;
  return status==='passed';
}

export function prepareWriteTests(root,{item,plan,evaluator}={}) {
  assert(item,'--item required');
  const loaded=loadTestPlan(root,{item,plan});
  const checked=checkTestPlan(root,{item,plan:loaded.planPath || undefined});
  assert(checked.status!=='failed',checked.findings.find(f=>f.status==='failed')?.reason || 'Test plan failed validation');
  if(!baselineOk(loaded.data)) {
    return {
      schemaVersion:1,
      status:'incomplete',
      reason:'Run the existing suite and record a green baseline on the test plan before writing new tests',
      baseline:loaded.data.baseline || null,
      evaluator:evaluator || loaded.data.baseline?.evaluator || null,
      items:[],
      nextSteps:[
        'Run evaluate (or the configured tests evaluator) and confirm exit 0',
        'Update the test plan baseline.status to passed with the report path',
        'Re-run write-tests prepare, then author only new failing tests listed as planned',
        'For method tdd, hand off to spec --phase red before implementation'
      ],
      exitCode:4
    };
  }
  const writable=loaded.data.items.filter(i=>i.status==='planned' && i.path);
  const blocked=loaded.data.items.filter(i=>i.modifyExisting && !(loaded.data.decisions || []).some(d=>d.action==='modify-existing' && (d.path===i.path || d.criterionId===i.criterionId)));
  assert(!blocked.length,`Existing-test modification requires an explicit decision for ${blocked.map(i=>i.criterionId).join(', ')}`);
  const tdd=writable.filter(i=>i.method==='tdd');
  return {
    schemaVersion:1,
    status:'ready',
    item,
    plan:loaded.planPath,
    baseline:loaded.data.baseline,
    items:writable,
    tddItems:tdd,
    frontendLevels:writable.filter(i=>['interaction','end-to-end'].includes(i.level)).map(i=>i.criterionId),
    guidance:[
      'Write only new tests for planned items; do not modify or delete existing tests without decisions[]',
      'Match repository conventions from survey/module (node-typescript or php-laravel)',
      'For interaction/end-to-end use Playwright or the repo e2e runner and agenthouse-criterion annotations when applicable',
      'A compilation or environment failure is not a valid red',
      'After writing failing TDD tests, run spec --phase red before implementation'
    ],
    nextSteps:tdd.length?[
      `After writing failing tests, run: node .agenthouse/run.mjs spec --item ${item} --phase red --evaluator ${evaluator || loaded.data.baseline?.evaluator || 'tests'}`
    ]:[],
    exitCode:0
  };
}

export function markTestsWritten(root,{item,plan,criterionIds}={}) {
  assert(item,'--item required');
  assert(Array.isArray(criterionIds) && criterionIds.length,'--criteria requires one or more criterion ids');
  const loaded=loadTestPlan(root,{item,plan});
  assert(baselineOk(loaded.data),'Green baseline required before marking tests written');
  const wanted=new Set(criterionIds);
  return exclusive(root,()=>{
    const data={
      ...loaded.data,
      items:loaded.data.items.map(entry=>{
        if(!wanted.has(entry.criterionId))return entry;
        assert(entry.status!=='untestable',`Cannot mark untestable criterion ${entry.criterionId} as written`);
        assert(entry.path,`Criterion ${entry.criterionId} has no path`);
        if(entry.modifyExisting) {
          const decided=(loaded.data.decisions || []).some(d=>d.action==='modify-existing' && (d.path===entry.path || d.criterionId===entry.criterionId));
          assert(decided,`modifyExisting for ${entry.criterionId} needs an explicit decision`);
        } else if(fs.existsSync(inside(root,entry.path))) {
          // New tests may create the file; existing path without modifyExisting is only allowed if the case is additive.
        }
        return {...entry,status:'written'};
      })
    };
    if(loaded.planPath)write(inside(root,loaded.planPath),data);
    else {
      const record=read(inside(root,item));
      write(inside(root,item),{...record,testPlan:data});
    }
    const tdd=data.items.filter(i=>wanted.has(i.criterionId) && i.method==='tdd');
    return {
      schemaVersion:1,
      status:'written',
      item,
      plan:loaded.planPath,
      written:criterionIds,
      requireRed:tdd.map(i=>i.criterionId),
      nextSteps:tdd.length?['Capture red with spec --phase red before implementation']:[],
      exitCode:0
    };
  });
}
