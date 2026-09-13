import fs from 'node:fs';
import {assert, read, hash, inside, validated} from './io.js';

export function visual(root,e,context) {
  const contract=validated('acceptance',read(inside(root,e.contract)));
  assert(new Set(contract.criteria.map(c=>c.id)).size===contract.criteria.length,'Duplicate acceptance criteria');
  const references=contract.references || [];
  if(contract.source.kind==='image') assert(references.length>0,'Image contract requires a hashed reference image');
  for(const r of references) assert(hash(fs.readFileSync(inside(root,r.path)))===r.sha256,`Reference image changed: ${r.path}`);
  const file=inside(root,e.assessment);
  if(!fs.existsSync(file))return {status:'incomplete',reason:'Visual assessment missing',findings:contract.criteria.map(c=>({id:c.id,status:'not-assessed',expectation:c.expectation}))};
  const data=read(file);
  assert(data.schemaVersion===1 && Array.isArray(data.criteria),'Invalid visual assessment');
  if(data.subject!==context.subject || data.contractDigest!==hash(contract) || data.policyDigest!==context.policyDigest) return {status:'incomplete',reason:'Visual assessment does not match the build, contract, or policy'};
  assert(data.environment && typeof data.environment==='object','Capture environment must be recorded');
  const findings=[],evidence=[...references.map(r=>({...r,label:'Design reference'}))];
  assert(new Set(data.criteria.map(c=>c.id)).size===data.criteria.length,'Duplicate assessment result');
  for(const c of contract.criteria) {
    const actual=data.criteria.find(x=>x.id===c.id);
    let status=actual?.status || 'incomplete', reason=actual?.reason || 'Criterion not assessed';
    assert(['passed','failed','incomplete'].includes(status),'Invalid visual criterion status');
    if(actual) {
      assert(typeof actual.reason==='string' && actual.reason.trim(),'Criterion requires an explanation');
      assert(Array.isArray(actual.evidence) && actual.evidence.length>0,'Criterion requires evidence');
      for(const ev of actual.evidence) {
        assert(typeof ev.sha256==='string' && ev.sha256===hash(fs.readFileSync(inside(root,ev.path))),`Visual evidence changed: ${ev.path}`);
        evidence.push(ev);
      }
      if(c.method==='concept' && (!actual.reviewer || actual.inspected!==true)) {status='incomplete';reason='Concept acceptance requires an identified reviewer and explicit image inspection';}
      if(['concept','regression'].includes(c.method) && !actual.evidence.some(ev=>/\.(png|jpe?g|webp)$/i.test(ev.path))) {status='incomplete';reason='Visual criterion requires screenshot evidence';}
      if(c.viewport && actual.viewport!==c.viewport || c.state && actual.state!==c.state) {status='incomplete';reason='Captured viewport/state does not match criterion';}
    }
    findings.push({id:c.id,method:c.method,expectation:c.expectation,status,reason,required:c.required!==false});
  }
  const required=findings.filter(c=>c.required);
  assert(required.length>0,'Acceptance contract has no required criteria');
  const status=required.some(c=>c.status==='failed')?'failed':required.some(c=>c.status==='incomplete')?'incomplete':'passed';
  return {status,reason:`Frontend acceptance: ${status}`,findings,evidence};
}
