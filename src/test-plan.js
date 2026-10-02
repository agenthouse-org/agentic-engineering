import fs from 'node:fs';
import path from 'node:path';
import {assert, read, write, hash, inside, exclusive, validated} from './io.js';
import {TEST_LAYERS} from './inspect.js';

export const TEST_METHODS=['tdd','characterization','verify-after'];
export const TEST_PLAN_STATUSES=['planned','written','untestable'];

function planPathFromItem(root,item) {
  const record=read(inside(root,item));
  const linked=typeof record.fields?.testPlan==='string'?record.fields.testPlan.trim():'';
  if(linked)return {record,planPath:linked,embedded:null};
  if(record.testPlan && typeof record.testPlan==='object')return {record,planPath:null,embedded:record.testPlan};
  return {record,planPath:null,embedded:null};
}

export function loadTestPlan(root,{item,plan}={}) {
  if(plan) {
    const data=validated('test-plan',read(inside(root,plan)));
    return {planPath:plan,data,record:item?read(inside(root,item)):null};
  }
  assert(item,'Provide --item FILE or --plan FILE');
  const {record,planPath,embedded}=planPathFromItem(root,item);
  if(planPath)return {planPath,data:validated('test-plan',read(inside(root,planPath))),record};
  if(embedded)return {planPath:null,data:validated('test-plan',embedded),record};
  throw new Error('Work item has no fields.testPlan path or embedded testPlan');
}

function validateItems(data,criteria=[]) {
  const findings=[];
  const ids=new Set(criteria.map(c=>c.id));
  const seen=new Set();
  for(const entry of data.items || []) {
    if(seen.has(entry.criterionId))findings.push({id:entry.criterionId,status:'failed',reason:'Duplicate criterionId in test plan'});
    seen.add(entry.criterionId);
    if(criteria.length && !ids.has(entry.criterionId))findings.push({id:entry.criterionId,status:'failed',reason:'Plan criterionId is not on the work item'});
    if(entry.status==='untestable' && !String(entry.reason || '').trim())
      findings.push({id:entry.criterionId,status:'incomplete',reason:'Untestable item needs a reason'});
    if(entry.status!=='untestable') {
      if(!entry.level)findings.push({id:entry.criterionId,status:'incomplete',reason:'Plan item needs a level'});
      else if(!TEST_LAYERS.includes(entry.level))findings.push({id:entry.criterionId,status:'failed',reason:`Unknown level ${entry.level}`});
      if(!entry.method)findings.push({id:entry.criterionId,status:'incomplete',reason:'Plan item needs a method'});
      if(!entry.path)findings.push({id:entry.criterionId,status:'incomplete',reason:'Plan item needs a test path'});
    }
    if(entry.modifyExisting===true) {
      const decided=(data.decisions || []).some(d=>d.action==='modify-existing' && (d.path===entry.path || d.criterionId===entry.criterionId) && String(d.reason || '').trim());
      if(!decided)findings.push({id:entry.criterionId,status:'incomplete',reason:'modifyExisting requires an explicit decisions entry'});
    }
  }
  for(const criterion of criteria) {
    if(criterion.applicable===false)continue;
    if(criterion.state==='open')continue;
    if(!seen.has(criterion.id))findings.push({id:criterion.id,status:'incomplete',reason:'Criterion has no test'});
  }
  return findings;
}

export function checkTestPlan(root,{item,plan}={}) {
  const loaded=loadTestPlan(root,{item,plan});
  const findings=validateItems(loaded.data,loaded.record?.criteria || []);
  if(!(loaded.data.items || []).length)findings.push({id:'content',status:'incomplete',reason:'Test plan has no items'});
  const status=findings.some(f=>f.status==='failed')?'failed':findings.some(f=>f.status==='incomplete')?'incomplete':'passed';
  return {
    schemaVersion:1,
    item:item || null,
    plan:loaded.planPath,
    status,
    findings,
    unlinkedCriteria:findings.filter(f=>f.reason==='Criterion has no test').map(f=>f.id),
    exitCode:{passed:0,failed:1,incomplete:4}[status]
  };
}

export function writeTestPlan(root,{item,plan,output,standardRef,ownerRole='test-manager',defaultMethod='tdd',items,decisions=[],baseline}={}) {
  assert(item,'--item required');
  assert(Array.isArray(items) && items.length,'Provide --items JSON array or write the plan file first');
  const record=read(inside(root,item));
  assert(Array.isArray(record.criteria) && record.criteria.length,'Work item requires criteria before a test plan');
  const data=validated('test-plan',{
    schemaVersion:1,
    ...(standardRef?{standardRef}:{}),
    ownerRole,
    defaultMethod,
    ...(baseline?{baseline}:{}),
    items,
    decisions
  });
  const findings=validateItems(data,record.criteria);
  assert(!findings.some(f=>f.status==='failed'),findings.find(f=>f.status==='failed')?.reason || 'Invalid test plan');
  const target=output || plan || `.agenthouse/work/${record.id}.test-plan.json`;
  return exclusive(root,()=>{
    fs.mkdirSync(path.dirname(inside(root,target)),{recursive:true});
    write(inside(root,target),data);
    const next={...record,fields:{...record.fields,testPlan:target.replaceAll('\\','/')}};
    write(inside(root,item),next);
    return {schemaVersion:1,item,plan:target.replaceAll('\\','/'),status:'written',digest:hash(JSON.stringify(data)),findings,exitCode:0};
  });
}

export function criterionTestCoverage(record,planData) {
  const items=planData?.items || [];
  return (record.criteria || []).map(c=>{
    const links=items.filter(i=>i.criterionId===c.id);
    const applicable=c.applicable!==false;
    let coverage='none';
    if(!applicable)coverage='not-applicable';
    else if(!links.length)coverage='none';
    else if(links.every(i=>i.status==='untestable'))coverage='untestable';
    else if(links.some(i=>i.status==='written'))coverage='written';
    else coverage='planned';
    return {id:c.id,expectation:c.expectation,applicable,coverage,links};
  });
}
