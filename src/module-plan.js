import fs from 'node:fs';
import path from 'node:path';
import {assert,canonical,exclusive,hash,inside,read,validated,write} from './io.js';
import {classifyTestLayer,TEST_LAYERS} from './inspect.js';

const PLAN_KIND='agenthouse-module-plan';
const testScript=(name,command)=>/(^|:|-|_)(test|spec|e2e|contract|integration|unit|regression|functional|component)(:|-|_|$)/i.test(name) || /\b(?:jest|vitest|mocha|phpunit|playwright|cypress|pest|ava|tap|node\s+--test)\b/i.test(command);
const key=value=>String(value || '').toLowerCase().replace(/^@/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50) || 'root';
const rel=value=>value.replaceAll('\\','/').replace(/^\.\//,'').replace(/\/$/,'') || '.';
function validConfig(value) {
  const config=validated('config',value),ids=new Set(config.evaluators.map(item=>item.id));
  assert(ids.size===config.evaluators.length,'Duplicate evaluator identifier');
  for(const profile of Object.values(config.profiles)) {
    const checks=profile.checks.map(item=>item.evaluator);assert(new Set(checks).size===checks.length,'Duplicate check in profile');
    for(const id of checks)assert(ids.has(id),`Unknown evaluator in profile: ${id}`);
  }
  return config;
}
function validMutation(base,target) {
  for(const field of new Set([...Object.keys(base),...Object.keys(target)]))if(!['evaluators','profiles'].includes(field))assert(canonical(base[field])===canonical(target[field]),`Module plan changed unrelated configuration: ${field}`);
  for(const evaluator of base.evaluators)assert(target.evaluators.some(item=>item.id===evaluator.id && canonical(item)===canonical(evaluator)),`Module plan removed or changed evaluator: ${evaluator.id}`);
  for(const [name,profile] of Object.entries(base.profiles)) {
    const next=target.profiles[name];assert(next,`Module plan removed profile: ${name}`);
    for(const check of profile.checks)assert(next.checks.some(item=>canonical(item)===canonical(check)),`Module plan removed or changed ${name} check: ${check.evaluator}`);
    if(profile.promotion)assert(canonical(next.promotion)===canonical(profile.promotion),`Module plan changed existing promotion metadata: ${name}`);
  }
  return target;
}
function workspaceRoot(root,workspace) {const normalized=rel(workspace || '.');return {relative:normalized,absolute:normalized==='.'?root:inside(root,normalized)};}
function workspaceIdentity(root,workspace,data) {
  const original=data?.name || (workspace.relative==='.'?path.basename(root):workspace.relative),base=key(original);
  return {key:base,original,path:workspace.relative,source:data?.name?'declared-name':'repository-relative-path'};
}
function additions(before,after) {
  const oldEvaluators=new Set(before.evaluators.map(item=>item.id));
  const evaluators=after.evaluators.filter(item=>!oldEvaluators.has(item.id));
  const profiles=[];
  for(const [name,profile] of Object.entries(after.profiles)) {
    const old=new Set((before.profiles[name]?.checks || []).map(item=>item.evaluator));
    const checks=profile.checks.filter(item=>!old.has(item.evaluator));
    if(checks.length || !before.profiles[name])profiles.push({name,created:!before.profiles[name],checks,promotion:profile.promotion || null});
  }
  const lines=[...evaluators.map(item=>`+ evaluator ${item.id}: ${item.executable} ${item.args.join(' ')} (cwd ${item.cwd || '.'})`),
    ...profiles.flatMap(profile=>profile.checks.map(item=>`+ profile ${profile.name}: ${item.evaluator} (${item.required===false?'advisory':'required'})`))];
  return {evaluators,profiles,diff:lines.length?lines.join('\n'):'No configuration changes proposed'};
}
function uniqueWorkspaceKey(config,identity,workspacePath) {
  const prefix=`tests.${identity.key}.`;
  const conflict=config.evaluators.some(item=>item.id.startsWith(prefix) && rel(item.cwd || '.')!==workspacePath);
  return conflict?`${identity.key}-${hash(workspacePath).slice(0,8)}`:identity.key;
}
export function planModule(root,name,options={}) {
  assert(['node-typescript','php-laravel'].includes(name),'Choose node-typescript or php-laravel');
  const configFile=inside(root,'.agenthouse/config.json'),before=validConfig(read(configFile));
  const workspace=workspaceRoot(root,options.workspace || '.');
  const manifestName=name==='node-typescript'?'package.json':'composer.json',manifestFile=path.join(workspace.absolute,manifestName);
  assert(fs.existsSync(manifestFile),`Missing ${rel(path.relative(root,manifestFile))}; no evaluator was guessed`);
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8')),scripts=manifest.scripts || {},identity=workspaceIdentity(root,workspace,manifest);
  identity.key=uniqueWorkspaceKey(before,identity,workspace.relative);
  const requested=options.layers?options.layers.split(',').map(value=>value.trim()).filter(Boolean):TEST_LAYERS;
  for(const layer of requested)assert(TEST_LAYERS.includes(layer),`Unknown test layer: ${layer}`);
  const aliases=before.testing?.aliases || {},candidates=[];
  for(const [script,command] of Object.entries(scripts)) {
    if(typeof command!=='string' || !testScript(script,command))continue;
    const layer=classifyTestLayer(`${script}/${command}`,aliases) || (script==='test'?'unit':null);
    if(layer && requested.includes(layer) && !candidates.some(item=>item.layer===layer))candidates.push({layer,script,command});
  }
  const target=structuredClone(before),selectedEvaluators=[];
  for(const candidate of candidates) {
    const id=`tests.${identity.key}.${candidate.layer}`,existing=target.evaluators.find(item=>item.id===id);
    const evaluator={id,origin:{module:name,file:workspace.relative==='.'?(name==='node-typescript'?'package.json':'composer.json'):`${workspace.relative}/${name==='node-typescript'?'package.json':'composer.json'}`},kind:'command',executable:name==='node-typescript'?'npm':'composer',args:name==='node-typescript'?['run',candidate.script]:[candidate.script],cwd:workspace.relative,result:'exit-code'};
    if(existing) {
      // Older enrolled evaluators predate provenance metadata; preserve their bytes.
      if(!existing.origin)delete evaluator.origin;
      assert(canonical(existing)===canonical(evaluator),`Evaluator conflict: ${id}`);
      selectedEvaluators.push(existing);
      continue;
    }
    target.evaluators.push(evaluator);selectedEvaluators.push(evaluator);
  }
  const requiredProfile=options.profile || 'pull-request',advisoryProfile=options.advisoryProfile || 'test-adoption';
  const addChecks=(profileName,required)=>{
    if(!selectedEvaluators.length)return;
    target.profiles[profileName] ||= {checks:[]};
    for(const evaluator of selectedEvaluators)if(!target.profiles[profileName].checks.some(item=>item.evaluator===evaluator.id))target.profiles[profileName].checks.push({evaluator:evaluator.id,required});
  };
  addChecks(advisoryProfile,false);addChecks(requiredProfile,true);
  if(options.milestoneReference || options.milestoneOwner || options.milestoneStatus) {
    assert(options.milestoneReference && options.milestoneOwner && options.milestoneStatus,'Milestone status, reference, and owner must be supplied together');
    assert(['reached','deferred'].includes(options.milestoneStatus),'Milestone status must be reached or deferred');
    target.profiles[requiredProfile] ||= {checks:[]};
    target.profiles[requiredProfile].promotion={status:options.milestoneStatus,reference:options.milestoneReference,owner:options.milestoneOwner};
  }
  validConfig(target);
  const change=additions(before,target);
  return {schemaVersion:1,kind:PLAN_KIND,module:name,base:{path:'.agenthouse/config.json',sha256:hash(before),config:before},workspace:identity,
    selection:{layers:requested,requiredProfile,advisoryProfile},discovered:candidates,changes:{evaluators:change.evaluators,profiles:change.profiles},diff:change.diff,targetConfig:target,
    limitations:[selectedEvaluators.length?'No selected evaluator was executed.':'No usable test script was discovered; no evaluator or profile check was fabricated.','Applying this plan does not resolve policy, evaluate checks, or create approval.']};
}
export function applyModulePlan(root,file) {
  const planFile=path.isAbsolute(file)?file:path.resolve(root,file),plan=read(planFile);
  assert(plan?.schemaVersion===1 && plan.kind===PLAN_KIND && plan.base?.path==='.agenthouse/config.json' && typeof plan.base.sha256==='string' && plan.base.config,'Invalid module plan');
  const base=validConfig(plan.base.config),target=validMutation(base,validConfig(plan.targetConfig));assert(hash(base)===plan.base.sha256,'Module plan base content does not match its digest');
  return exclusive(root,()=>{
    const configFile=inside(root,'.agenthouse/config.json'),before=validConfig(read(configFile));
    assert(hash(before)===plan.base.sha256,'Project configuration changed after preview; create and review a new module plan');
    write(configFile,target);
    return {status:'applied',plan:planFile,config:'.agenthouse/config.json',before:plan.base.sha256,after:hash(target),policySnapshot:'stale-until-resolve',executedCommands:[]};
  });
}
