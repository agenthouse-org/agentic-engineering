import fs from 'node:fs';
import {assert, read, write, create, hash, inside, safeId, exclusive} from './io.js';
import {resolve, approval} from './policy.js';
import {gate} from './gates.js';

export const STAGES=['discover','define','design','plan','implement','verify','accept','release','operate','learn','retire'];
export const FIELDS={discover:['outcome'],define:['scope','acceptance'],design:['decisions'],plan:['verification'],implement:['changes'],verify:['evidence'],accept:['acceptanceEvidence'],release:['releasePlan','rollbackPlan'],operate:['serviceObjectives','runbook'],learn:['learning'],retire:['retirement']};
export function newItem(root,id,title,kind='feature',pathName) {
  safeId(id);assert(['feature','bug','incident','change','investigation','documentation'].includes(kind),'Invalid work item kind');
  const item={schemaVersion:1,id,title,kind,stage:'discover',revision:1,fields:{outcome:''},criteria:[],evidence:[],history:[]};
  if(pathName){safeId(pathName);item.path=pathName;}
  create(inside(root,`.agenthouse/work/${id}.json`),item);
  return item;
}
export function readiness(item,stage=item.stage) {
  assert(STAGES.includes(stage),'Unknown lifecycle stage');
  const missing=(FIELDS[stage]||[]).filter(f=>typeof item.fields?.[f]!=='string' || !item.fields[f].trim());
  return {status:missing.length?'incomplete':'passed',reason:missing.length?`Missing ${stage} evidence: ${missing.join(', ')}`:`${stage} record complete`,findings:missing.map(field=>({field}))};
}
export function advance(root,id,to,decisionFile,{policyFile,gateDecision}={}) {
  return exclusive(root,()=>{
    const file=inside(root,`.agenthouse/work/${safeId(id)}.json`),item=read(file);
    const {config,snapshot}=resolve(root,{frozen:true,policyFile});
    const stages=item.path?config.lifecycle?.paths?.[item.path]:STAGES;
    assert(Array.isArray(stages),'Lifecycle path is not configured');
    if(item.path)assert(config.lifecycle.pathKinds?.[item.path]?.includes(item.kind),'Work kind is not eligible for this lifecycle path');
    assert(stages[0]==='discover' && ['verify','accept','release','retire'].every(s=>stages.includes(s)) && stages.every((s,i)=>STAGES.includes(s) && (!i || STAGES.indexOf(s)>STAGES.indexOf(stages[i-1]))),'Lifecycle paths must retain verification and protected decisions in order');
    assert(stages.indexOf(item.stage)>=0 && stages.indexOf(to)===stages.indexOf(item.stage)+1,'Transitions must follow the lifecycle; amend the record to explain an exception');
    if(STAGES.indexOf(to)>STAGES.indexOf(item.stage)+1)assert(item.fields?.pathReason?.trim(),'Explain why the configured shorter path fits this work');
    const ready=readiness(item);assert(ready.status==='passed',ready.reason);
    const phase=to==='implement'?'ready':to==='accept'?'done':null;
    if(phase && config.lifecycle?.[phase]) {
      const result=gate(root,{item:`.agenthouse/work/${id}.json`,phase,decision:gateDecision,policyFile});
      assert(result.status==='passed',`${phase} gate ${result.status}: ${result.findings.map(f=>f.reason).join('; ')}`);
    }
    // In supervised mode all transitions require a signed decision. Other profiles
    // still require explicit governance for acceptance, release, and retirement.
    const needsApproval=(config.autonomy||'supervised')==='supervised' || ['accept','release','retire'].includes(to);
    if(needsApproval) {
      assert(decisionFile,'Signed approval required for this transition');
      assert(approval(read(inside(root,decisionFile)),snapshot,{subject:hash(item),action:`transition:${to}`,scope:config.project})==='allowed','Transition denied');
    }
    const previous=hash(item);
    item.history.push({from:item.stage,to,at:new Date().toISOString(),previous,policyDigest:snapshot.digest,decision:decisionFile || null});
    item.stage=to;item.revision++;write(file,item);return item;
  });
}
