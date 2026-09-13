import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {assert, read, write, hash, inside, validated, safeId, VERSION} from './io.js';
import {resolve, approval} from './policy.js';
import {run} from './process.js';
import {reports} from './reports.js';
import {visual} from './visual.js';
import {readiness} from './lifecycle.js';

export function subject(root, explicit) {
  if(explicit) return explicit;
  const git=spawnSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true});
  assert(git.status===0,'Provide --subject for a non-Git workspace');
  const status=spawnSync('git',['-C',root,'status','--porcelain','--untracked-files=normal'],{encoding:'utf8',windowsHide:true});
  assert(status.status===0 && !status.stdout.trim(),'Dirty workspace: provide an explicit immutable build identity with --subject');
  return git.stdout.trim();
}
export function summarize(checks) {
  const required=checks.filter(c=>c.required);
  for(const [status,exitCode] of [['error',2],['failed',1],['incomplete',4],['pending',3]]) if(required.some(c=>c.status===status)) return {status,exitCode};
  return {status:'satisfied',exitCode:0};
}
export function collectEvidence(root,folder,evidence=[]) {
  return evidence.map(e=>{
    assert(e && typeof e.path==='string','Invalid evidence path');
    const src=inside(root,e.path);
    assert(fs.existsSync(src) && fs.statSync(src).isFile(),`Missing evidence: ${e.path}`);
    assert(fs.statSync(src).size<=25*1024*1024,'Evidence file too large');
    const bytes=fs.readFileSync(src),digest=hash(bytes);
    if(e.sha256) assert(e.sha256===digest,`Evidence digest mismatch: ${e.path}`);
    const rel=`evidence/${digest.slice(0,16)}-${path.basename(e.path).replace(/[^a-zA-Z0-9_.-]/g,'_')}`;
    write(inside(folder,rel),bytes);
    return {path:rel,sha256:digest,label:e.label || e.path};
  });
}
async function execute(root,e,context) {
  if(e.kind==='visual') return visual(root,e,context);
  if(e.kind==='work-item') return readiness(read(inside(root,e.file)),e.stage);
  if(e.kind==='evidence') {
    const file=inside(root,e.file);
    if(!fs.existsSync(file)) return {status:'incomplete',reason:`Missing assessment: ${e.file}`};
    const data=validated('check-result',read(file));
    if(data.subject!==context.subject || data.policyDigest!==context.policyDigest) return {status:'incomplete',reason:'Assessment is for a different build or policy'};
    return data;
  }
  if(e.kind==='approval') {
    const file=inside(root,e.file);
    if(!fs.existsSync(file))return {status:'pending',reason:`Awaiting signed approval: ${e.file}`};
    const verdict=approval(read(file),context.snapshot,{subject:context.subject,action:e.action,scope:context.config.project});
    return {status:verdict==='allowed'?'passed':'failed',reason:`Governance decision: ${verdict}`};
  }
  assert(e.kind==='command',`Unknown evaluator kind ${e.kind}`);
  for(const variable of e.requiredEnvironment || []) assert(process.env[variable],`Missing environment variable: ${variable}`);
  const cwd=e.cwd && e.cwd!=='.' ? inside(root,e.cwd) : root;
  const executed=await run(e.executable==='node'?process.execPath:e.executable,e.args || [],{cwd,timeoutSeconds:e.timeoutSeconds || 120,
    env:{AH_SUBJECT:context.subject,AH_POLICY_DIGEST:context.policyDigest,AH_PROJECT:context.config.project,AH_BASE_URL:context.baseUrl || '',AH_CONTEXT:context.contextFile}});
  if(executed.error)return {status:'error',reason:executed.error};
  if(e.result==='json') {
    assert(executed.code===0,`Structured evaluator exited ${executed.code}: ${executed.stderr.slice(0,1000)}`);
    return validated('check-result',JSON.parse(executed.stdout));
  }
  const status=(e.exitCodes || {'0':'passed','1':'failed'})[String(executed.code)];
  assert(status,`Unmapped evaluator exit ${executed.code}`);
  return {status,reason:`Process exit ${executed.code}`,findings:[{stdout:executed.stdout,stderr:executed.stderr}]};
}
export async function evaluate(root,options={}) {
  const output=path.resolve(root,options.output || 'artifacts/agenthouse');
  fs.mkdirSync(output,{recursive:true});
  const runId=randomUUID(),folder=path.join(output,runId);
  fs.mkdirSync(folder);
  const result={schemaVersion:1,frameworkVersion:VERSION,runId,profile:options.profile || 'pull-request',subject:options.subject || '',startedAt:new Date().toISOString(),checks:[]};
  try {
    const {config,snapshot}=resolve(root,{frozen:!!options.frozen,policyFile:options.policyFile});
    result.subject=subject(root,options.subject);result.policyDigest=snapshot.digest;
    const profile=config.profiles[result.profile];assert(profile,`Unknown profile: ${result.profile}`);
    assert(profile.checks.length>0,'Empty evaluation profile is not a gate');
    const selected=new Set(profile.checks.map(c=>c.evaluator));
    for(const id of snapshot.requiredChecks) if(!selected.has(id)) result.checks.push({id,required:true,status:'incomplete',reason:'Required organization check omitted from profile'});
    const context={schemaVersion:1,subject:result.subject,policyDigest:snapshot.digest,profile:result.profile,baseUrl:options.baseUrl || null};
    const contextFile=path.join(folder,'context.json');write(contextFile,context);
    for(const check of profile.checks) {
      const id=safeId(check.evaluator),required=check.required!==false || snapshot.requiredChecks.includes(id);
      let data;
      try {
        const e=config.evaluators.find(x=>x.id===id);assert(e,`Unknown evaluator: ${id}`);
        data=await execute(root,e,{...context,contextFile,snapshot,config});
        if(data.subject && data.subject!==result.subject || data.policyDigest && data.policyDigest!==snapshot.digest) data={status:'incomplete',reason:'Evaluator returned stale build or policy evidence'};
        if(data.status==='not-applicable' && !check.allowNotApplicable) data={...data,status:'incomplete',reason:'Not-applicable is not permitted for this check'};
        if(data.status==='not-applicable') assert(data.reason?.trim(),'Not-applicable requires a reason');
        if(data.evidence) data.evidence=collectEvidence(root,folder,data.evidence);
      } catch(error) { data={status:'error',reason:error.message}; }
      result.checks.push({...data,id,required});
    }
  } catch(error) { result.checks.push({id:'framework',required:true,status:'error',reason:error.message}); }
  Object.assign(result,summarize(result.checks),{finishedAt:new Date().toISOString()});
  reports(folder,result);
  write(path.join(output,'latest.json'),{runId,path:runId,exitCode:result.exitCode});
  return {...result,folder};
}
