import fs from 'node:fs';
import {assert, read, write, create, hash, inside, safeId, exclusive} from './io.js';
import {resolve, approval} from './policy.js';

export const STAGES=['discover','define','design','plan','implement','verify','accept','release','operate','learn','retire'];
export const FIELDS={discover:['outcome'],define:['scope','acceptance'],design:['decisions'],plan:['verification'],implement:['changes'],verify:['evidence'],accept:['acceptanceEvidence'],release:['releasePlan','rollbackPlan'],operate:['serviceObjectives','runbook'],learn:['learning'],retire:['retirement']};
export function newItem(root,id,title,kind='feature') {
  safeId(id);assert(['feature','bug','incident','change','investigation'].includes(kind),'Invalid work item kind');
  const item={schemaVersion:1,id,title,kind,stage:'discover',revision:1,fields:{outcome:''},history:[]};
  create(inside(root,`.agenthouse/work/${id}.json`),item);
  return item;
}
export function readiness(item,stage=item.stage) {
  assert(STAGES.includes(stage),'Unknown lifecycle stage');
  const missing=(FIELDS[stage]||[]).filter(f=>typeof item.fields?.[f]!=='string' || !item.fields[f].trim());
  return {status:missing.length?'incomplete':'passed',reason:missing.length?`Missing ${stage} evidence: ${missing.join(', ')}`:`${stage} record complete`,findings:missing.map(field=>({field}))};
}
export function advance(root,id,to,decisionFile,{policyFile}={}) {
  return exclusive(root,()=>{
    const file=inside(root,`.agenthouse/work/${safeId(id)}.json`),item=read(file);
    const {config,snapshot}=resolve(root,{frozen:true,policyFile});
    assert(STAGES.indexOf(to)===STAGES.indexOf(item.stage)+1,'Transitions must follow the lifecycle; amend the record to explain an exception');
    const ready=readiness(item);assert(ready.status==='passed',ready.reason);
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
