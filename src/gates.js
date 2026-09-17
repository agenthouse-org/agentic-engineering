import fs from 'node:fs';
import {assert,read,write,inside,hash,exclusive} from './io.js';
import {resolve,approval} from './policy.js';
import {run} from './process.js';
import {checkVisualPlan} from './visual-plan.js';

export const CRITERIA={ready:['outcome','scope','acceptance','verification','dependencies','risks'],done:['changes','evidence','acceptanceEvidence','releasePlan','rollbackPlan']};
export function gate(root,{item,phase='ready',decision,policyFile}={}) {
  assert(['ready','done'].includes(phase),'Choose ready or done');
  const record=read(inside(root,item)),{config,snapshot}=resolve(root,{frozen:true,policyFile});
  const settings=config.lifecycle || {},rules=settings[phase] || {};
  const fields=rules.fields || CRITERIA[phase],findings=[];
  const kindFields=rules.kindFields || (phase==='ready'?{bug:['reproduction','expected','observed'],incident:['impact','mitigation'],investigation:['question','completionCondition'],documentation:['audience']}:{});
  for(const id of new Set([...fields,...(kindFields[record.kind] || [])]))if(typeof record.fields?.[id]!=='string'||!record.fields[id].trim())findings.push({id,status:'incomplete',reason:`Missing ${id}`});
  assert(Array.isArray(record.criteria),'Work item requires criteria');
  assert(record.criteria.every(c=>typeof c.id==='string' && c.id.trim() && typeof c.expectation==='string' && c.expectation.trim()) && new Set(record.criteria.map(c=>c.id)).size===record.criteria.length,'Invalid or duplicate acceptance criteria');
  if(!record.criteria.length)findings.push({id:'criteria',status:'incomplete',reason:'No observable criteria'});
  if(phase==='ready' && typeof record.fields?.visualPlan==='string' && record.fields.visualPlan.trim()) {
    try {
      const checked=checkVisualPlan(root,{item});
      findings.push(...checked.findings.filter(f=>f.status!=='passed'));
    } catch(error) {
      findings.push({id:'visualPlan',status:'incomplete',reason:error.message});
    }
  }
  const evidence=[];
  if(phase==='done') {
    for(const file of record.evidence || []) {
      const bytes=fs.readFileSync(inside(root,file)),result=JSON.parse(bytes);evidence.push({file,sha256:hash(bytes),result});
      if(!record.build || result.subject!==record.build || result.policyDigest!==snapshot.digest)findings.push({id:file,status:'incomplete',reason:'Stale build or policy evidence'});
      if(result.status!=='satisfied' || result.exitCode!==0)findings.push({id:file,status:'failed',reason:'Evidence does not pass'});
    }
    for(const c of record.criteria) {
      if(c.applicable===false) {if(!rules.allowNotApplicable || !c.reason)findings.push({id:c.id,status:'incomplete',reason:'Applicability exception not allowed or unexplained'});continue;}
      if(!evidence.some(e=>e.result.checks?.some(x=>x.status==='passed'&&(x.id===c.id||x.criteria?.includes(c.id)))))findings.push({id:c.id,status:'incomplete',reason:'Criterion has no passing evidence'});
    }
  }
  if(rules.requireRed || rules.requireGreen) {
    const spec=record.specification;
    if(!spec || spec.criteriaDigest!==hash(record.criteria))findings.push({id:'specification',status:'incomplete',reason:'Missing or stale specification'});
    else {
      const intact=Object.keys(spec.files || {}).length>0 && Object.entries(spec.files).every(([file,digest])=>fs.existsSync(inside(root,file)) && hash(fs.readFileSync(inside(root,file)))===digest);
      if(!intact)findings.push({id:'specification-files',status:'incomplete',reason:'Specification files missing or changed'});
      if(rules.requireRed && (spec.red?.status!=='red' || spec.red.policyDigest!==snapshot.digest))findings.push({id:'red',status:'incomplete',reason:'Missing or stale failing test evidence'});
      if(rules.requireGreen && (spec.green?.status!=='green'||spec.green?.commandDigest!==spec.red?.commandDigest||spec.green.policyDigest!==snapshot.digest))findings.push({id:'green',status:'incomplete',reason:'Missing passing test evidence for the same command and policy'});
    }
  }
  const subject=hash({record,phase,evidence:evidence.map(({file,sha256})=>({file,sha256}))});
  if(rules.approval!==false) {
    if(!decision)findings.push({id:'approval',status:'pending',reason:'Authorized decision required'});
    else {
      const envelope=read(inside(root,decision));
      if(rules.independent!==false)assert(record.author && envelope.payload.issuer!==record.author,'Gate requires an identified independent reviewer');
      assert(approval(envelope,snapshot,{scope:config.project,action:`gate:${phase}`,subject})==='allowed','Gate decision denied');
    }
  }
  const status=findings.some(f=>f.status==='failed')?'failed':findings.some(f=>f.status==='incomplete')?'incomplete':findings.length?'pending':'passed';
  return {schemaVersion:1,phase,item,subject,policyDigest:snapshot.digest,status,findings,evidence:evidence.map(({file,sha256})=>({file,sha256})),exitCode:{passed:0,failed:1,pending:3,incomplete:4}[status]};
}
export async function specification(root,{item,phase,evaluator}={}) {
  assert(['red','green'].includes(phase),'Choose red or green');
  const file=inside(root,item),record=read(file),before=hash(record),{config,snapshot}=resolve(root,{frozen:true});
  assert(Array.isArray(record.criteria)&&record.criteria.length,'Define acceptance criteria before specification tests');
  const command=config.evaluators.find(e=>e.id===evaluator);
  assert(command?.kind==='command'&&command.result==='exit-code','Specification capture needs an exit-code command evaluator');
  const commandDigest=hash(command),criteriaDigest=hash(record.criteria);
  assert(command.specificationFiles?.length,'Declare specificationFiles on this evaluator before capture');
  const files=Object.fromEntries(command.specificationFiles.map(file=>[file,hash(fs.readFileSync(inside(root,file)))]));
  if(phase==='green')assert(record.specification?.red?.status==='red'&&record.specification.criteriaDigest===criteriaDigest&&record.specification.red.commandDigest===commandDigest&&record.specification.red.policyDigest===snapshot.digest&&hash(record.specification.files)===hash(files),'Capture red evidence for these criteria, test files, policy and command first');
  const output=await run(command.executable==='node'?process.execPath:command.executable,command.args || [],{cwd:command.cwd?inside(root,command.cwd):root,timeoutSeconds:command.timeoutSeconds || 120});
  assert(!output.error && (phase==='red'?output.code===1:output.code===0),`Expected ${phase==='red'?'exit 1 test failure':'exit 0 success'}; got ${output.error || output.code}`);
  const capture={status:phase,at:new Date().toISOString(),commandDigest,policyDigest:snapshot.digest,exitCode:output.code,stdout:output.stdout,stderr:output.stderr};
  assert(command.specificationFiles.every(file=>hash(fs.readFileSync(inside(root,file)))===files[file]),'Test files changed during capture');
  record.specification=phase==='red'?{criteriaDigest,files,red:capture}:{...record.specification,green:capture};
  return exclusive(root,()=>{
    assert(hash(read(file))===before,'Work item changed during capture');
    write(file,record);return capture;
  });
}
