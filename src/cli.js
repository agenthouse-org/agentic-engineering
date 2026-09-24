import {assessmentInventory,validateAssessment} from './assessment.js';
import {help} from './help.js';
import {onboard,demo} from './onboard.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {generateKeyPairSync} from 'node:crypto';
import {assert,read,write,create,hash,inside,VERSION,PACKAGE,exclusive,validated} from './io.js';
import {install,uninstall,detect,payload,recover,transact,restore,installationStatus} from './install.js';
import {cachePayload,projectContext} from './install.js';
import {resolve,signed} from './policy.js';
import {evaluate,evaluationPlan} from './evaluate.js';
import {newItem,advance,createBranch,STAGES} from './lifecycle.js';
import {update,updateFromChannel,configureUpdateTracking,rollback,session} from './update.js';
import {housekeep} from './housekeep.js';
import {importSkill} from './skills.js';
import {dependencyStatus} from './dependencies.js';
import {pinDependency,updateDependency} from './dependency-update.js';
import {survey,inspectChange,evidenceReview} from './inspect.js';
import {gate,specification} from './gates.js';
import {importBacklog} from './backlog.js';
import {setupUsability,auditUsability} from './usability.js';
import {hook,hookConfiguration,hookSettings} from './hooks.js';
import {controls} from './controls.js';
import {checkVisualPlan} from './visual-plan.js';
import {statusNpmProvenance,applyNpmProvenance} from './npm-provenance.js';
import {planModule,applyModulePlan} from './module-plan.js';

const boolean=new Set(['install','remove','offline','ci','frozen','check','allow-breaking','help','non-interactive','ignore-generated','central','clean','preview','latest','list','propose-criteria']);
function parse(args) {
  const o={},pos=[];
  for(let i=0;i<args.length;i++) {
    if(!args[i].startsWith('--')){pos.push(args[i]);continue;}
    const key=args[i].slice(2);assert(!Object.hasOwn(o,key),`Repeated option --${key}`);
    if(boolean.has(key) || key==='plan' && pos[0]==='evaluate')o[key]=true;else {assert(args[i+1] && !args[i+1].startsWith('--'),`Missing value for --${key}`);o[key]=args[++i];}
  }
  return {o,pos};
}
const allowed={context:[],onboard:['integration','artifact-paths','agents','policy','project','autonomy','docs','non-interactive'],demo:[],dependencies:['bundle','sha256','public-key','check','allow-breaking'],init:['integration','central','agents','scope','policy','project','autonomy'],resolve:['frozen','policy-file'],evaluate:['list','plan','profile','subject','base-url','output','ci','frozen','policy-file'],doctor:['plugin-version'],restore:['bundle','ignore-generated'],bundle:['output','key'],update:['bundle','sha256','public-key','check','allow-breaking','latest','track','npm-cli'],rollback:[],session:['npm-cli'],uninstall:[],recover:[],work:['id','title','kind','to','decision','policy-file'],sign:['input','key','output','delegation'],keygen:['output'],skill:['source','name','sha256'],module:['name','output','preview','apply','workspace','layers','profile','advisory-profile','milestone-reference','milestone-owner','milestone-status']};
Object.assign(allowed,{survey:['output'],inspect:['ref','base','output'],review:['ref','base','baseline','item','evidence','output'],gate:['item','phase','decision','policy-file','output'],spec:['item','phase','evaluator','output'],backlog:['propose-criteria','source','id','title','provider','external-id','output']});
allowed.assessment=['item','selectors','ref','summary','output'];
allowed.controls=['policy-file'];
allowed.hook=['vendor','input'];
allowed['hook-config']=['vendor','install','remove'];
allowed.usability=['url','fixture','output','npm-cli','offline'];
allowed.work.push('gate-decision','path','from','parent');
allowed['visual-plan']=['item','plan','output'];
allowed['npm-provenance']=['provider','workflow','publish','access','output'];
allowed.dependencies.push('name');
allowed.housekeep=['check','clean'];
allowed.onboard.push('branch-pattern','branch-example','branch-base');
export async function main(args) {
  const {o,pos}=parse(args),command=pos.shift();
  if(!command || o.help || command==='help') {
    const topic=command==='help'?pos.splice(0).join(' ') || undefined:command;
    assert(pos.length===0,'Use help COMMAND or COMMAND --help');
    console.log(help(topic));return 0;
  }
  assert(Object.hasOwn(allowed,command),`Unknown command ${command}`);
  assert(['work','dependencies','usability','visual-plan','npm-provenance'].includes(command) ? pos.length===1 : pos.length===0,'Unexpected positional arguments');
  for(const key of Object.keys(o))assert(['root','help',...allowed[command]].includes(key),`Unknown option --${key} for ${command}`);
  const root=path.resolve(o.root || process.cwd());
  let result;
  switch(command) {
    case 'usability': {const action=pos.shift();assert(['setup','run'].includes(action),'Choose usability setup or run');result=action==='setup'?await setupUsability(root,{npmCli:o['npm-cli'],offline:o.offline}):await auditUsability(root,{url:o.url,fixture:o.fixture,output:o.output});break;}
    case 'hook': {const r=await hook(root,{vendor:o.vendor,input:o.input});if(r.stdout)process.stdout.write(r.stdout+'\n');if(r.stderr)process.stderr.write(r.stderr+'\n');return r.exitCode;}
    case 'controls':result=controls(root,{policyFile:o['policy-file']});break;
    case 'hook-config': {assert(!(o.install && o.remove),'Choose install or remove');hookConfiguration(o.vendor);result=o.install || o.remove?exclusive(root,()=>{const plan=hookSettings(root,{remove:o.remove});if(plan.changes.length)transact(root,plan.changes);return {status:plan.status};}):hookConfiguration(o.vendor);break;}
    case 'visual-plan': {const action=pos.shift();assert(action==='check','Choose visual-plan check');result=checkVisualPlan(root,{item:o.item,plan:o.plan});break;}
    case 'npm-provenance': {const action=pos.shift();assert(['status','apply'].includes(action),'Choose npm-provenance status or apply');result=action==='apply'?applyNpmProvenance(root,{provider:o.provider,workflow:o.workflow,publish:o.publish,access:o.access}):statusNpmProvenance(root,{provider:o.provider,workflow:o.workflow,publish:o.publish});break;}
    case 'assessment':result=o.summary?validateAssessment(root,o.summary):assessmentInventory(root,{item:o.item,selectors:o.selectors,ref:o.ref});break;
    case 'survey':result=survey(root);break;
    case 'inspect':result=inspectChange(root,{ref:o.ref,base:o.base});break;
    case 'review':result=evidenceReview(root,{ref:o.ref,base:o.base,item:o.item,evidence:o.evidence?.split(','),baseline:o.baseline});result.exitCode={passed:0,failed:1,incomplete:4}[result.status];break;
    case 'gate':result=gate(root,{item:o.item,phase:o.phase,decision:o.decision,policyFile:o['policy-file']});break;
    case 'spec':result=await specification(root,{item:o.item,phase:o.phase,evaluator:o.evaluator});break;
    case 'backlog':result=importBacklog(root,{source:o.source,id:o.id,title:o.title,provider:o.provider,externalId:o['external-id'],proposeCriteria:o['propose-criteria']});break;
    case 'context':dependencyStatus(root);result=projectContext(root);break;
    case 'onboard':console.log(await onboard(root,{integration:o.integration,artifactPaths:o['artifact-paths']?.split(',').filter(Boolean),agents:o.agents,policy:o.policy,autonomy:o.autonomy,project:o.project,docs:o.docs,nonInteractive:o['non-interactive'],branchPattern:o['branch-pattern'],branchExample:o['branch-example'],branchBase:o['branch-base']}));return 0;
    case 'demo':assert(o.root,'Specify --root NEW_EMPTY_DIRECTORY for the demo');console.log(await demo(root));return 0;
    case 'init': {
      assert(!o.scope || ['project','user'].includes(o.scope),'Scope must be project or user');
      if(o.scope==='user'){result=cachePayload();break;}
      assert(o.integration || fs.existsSync(inside(root,'.agenthouse/installation.json')),'Choose --integration shared or private; run onboard for guided setup');
      result=install(root,{integration:o.integration,storage:o.central?'machine':undefined,agents:o.agents?.split(','),policy:o.policy,project:o.project,autonomy:o.autonomy});break;
    }
    case 'restore':result=restore(root,{bundle:o.bundle,ignoreGenerated:o['ignore-generated']});break;
    case 'resolve':result=resolve(root,{frozen:o.frozen,policyFile:o['policy-file']}).snapshot;break;
    case 'evaluate': {
      if(o.list || o.plan){assert(!o.output,'Plan prints to stdout; --output is not supported');console.log(JSON.stringify(evaluationPlan(root,{profile:o.profile,subject:o.subject,frozen:o.frozen || o.ci,policyFile:o['policy-file']}),null,2));return 0;}
      result=await evaluate(root,{profile:o.profile,subject:o.subject,baseUrl:o['base-url'],output:o.output,frozen:o.frozen || o.ci,policyFile:o['policy-file']});
      console.log(`${result.status} · ${result.checks.length} checks · ${result.folder}`);return result.exitCode;
    }
    case 'doctor': {
      const problems=[],warnings=[];let config;
      try {installationStatus(root);}catch(e){problems.push(e.message);}
      try {dependencyStatus(root);}catch(e){problems.push(e.message);}
      try {config=resolve(root,{frozen:true}).config;}catch(e){problems.push(e.message);}
      if(fs.existsSync(inside(root,'.agenthouse/update.json')))try {validated('update-policy',read(inside(root,'.agenthouse/update.json')));}catch(e){problems.push(`Invalid update policy: ${e.message}`);}
      if(fs.existsSync(inside(root,'.agenthouse/transaction.json')))problems.push('Interrupted installation: run recover');
      const state=fs.existsSync(inside(root,'.agenthouse/installation.json'))?read(inside(root,'.agenthouse/installation.json')):null;
      if(!state)problems.push('No installed runtime');
      if(state && state.version!==VERSION)problems.push(`Executing runtime ${VERSION} differs from repository pin ${state.version}`);
      if(o['plugin-version'] && o['plugin-version']!==state?.version)problems.push(`Plugin version ${o['plugin-version']} differs from repository pin ${state?.version || 'missing'}`);
      if(config && !config.git?.branchNaming?.pattern && fs.existsSync(path.join(root,'.git')))warnings.push('Branch naming not configured (git.branchNaming.pattern); ask the team standard (for example {id}-{slug}) before work branch');
      if(fs.existsSync(inside(root,'.agenthouse/installation.json'))) {
        const keep=housekeep(root,{check:true});
        problems.push(...keep.errors);
        if(keep.ignoredBaselines.length)problems.push(`Source baselines are ignored: ${keep.ignoredBaselines.join(', ')}`);
        if(keep.missingIgnore.length)problems.push(`Generated output is not excluded (${keep.missingIgnore.join(', ')}); review artifacts.outputs and repository/local Git exclusions. Shared setups can rerun init after resolving configuration`);
        if(keep.tracked.length)problems.push(`Tracked inspection captures require untracking: ${keep.tracked.join(', ')}`);
        if(!keep.kept && (keep.dumps.length || keep.stray.length))problems.push(`Inspection screenshot dumps outside ${keep.canonical} (${[...keep.dumps,...keep.stray].join(', ')}); write captures under ${keep.canonical}/<work-id>/ then run housekeep`);
        if(keep.notes.length)problems.push(`Scratch files at repository root (${keep.notes.join(', ')}); write GitHub bodies under .agenthouse/local/ then run housekeep`);
      }
      result={version:VERSION,pluginVersion:o['plugin-version'] || null,repositoryVersion:state?.version || null,platform:process.platform,detectedAgents:detect(root),installed:state?.agents || [],problems,warnings,scope:config?.project,limitations:['Agent instruction adapters are advisory; native host loading is not certified.','External platform integrations use organization-owned CLI evaluators.']};
      console.log(JSON.stringify(result,null,2));return problems.length?2:0;
    }
    case 'work': {
      const action=pos.shift();
      if(action==='new')result=newItem(root,o.id,o.title || o.id,o.kind,o.path,{parentWork:o.parent});
      else if(action==='advance')result=advance(root,o.id,o.to,o.decision,{policyFile:o['policy-file'],gateDecision:o['gate-decision']});
      else if(action==='show'){const item=read(inside(root,`.agenthouse/work/${o.id}.json`));result={...item,subjectHash:hash(item)};}
      else if(action==='branch')result=createBranch(root,o.id,{from:o.from,parentWork:o.parent});
      else throw new Error(`Work action must be new, advance, show, or branch. Stages: ${STAGES.join(', ')}`);break;
    }
    case 'bundle': {
      assert(o.output,'--output required');const data=payload();const bundle=o.key?signed(data,fs.readFileSync(path.resolve(o.key),'utf8')):data;
      write(path.resolve(o.output),bundle);result={file:path.resolve(o.output),sha256:hash(fs.readFileSync(path.resolve(o.output))),version:VERSION};break;
    }
    case 'update': {
      const modes=[!!o.bundle,!!o.latest,!!o.track].filter(Boolean).length;assert(modes===1,'Choose exactly one of --bundle FILE, --latest, or --track latest|exact');
      if(o.track)result=configureUpdateTracking(root,o.track);
      else if(o.latest)result=updateFromChannel(root,{check:o.check,allowBreaking:o['allow-breaking'],npmCli:o['npm-cli']});
      else result=update(root,{bundle:o.bundle,sha256:o.sha256,publicKey:o['public-key'],check:o.check,allowBreaking:o['allow-breaking']});
      break;
    }
    case 'rollback':result=rollback(root);break;
    case 'session':result=session(root,{npmCli:o['npm-cli']});break;
    case 'housekeep':result=housekeep(root,{check:o.check,clean:o.clean});break;
    case 'recover':result={recovered:recover(root)};break;
    case 'uninstall':result=uninstall(root);break;
    case 'keygen': {
      assert(o.output,'--output required');const pair=generateKeyPairSync('ed25519'),out=path.resolve(o.output);
      assert(!fs.existsSync(out) && !fs.existsSync(out+'.pub'),'Key path already exists');
      create(out,pair.privateKey.export({type:'pkcs8',format:'pem'}));fs.chmodSync(out,0o600);create(out+'.pub',pair.publicKey.export({type:'spki',format:'pem'}));result={privateKey:out,publicKey:out+'.pub'};break;
    }
    case 'sign': {
      assert(o.input && o.key && o.output,'--input, --key and --output required');
      const envelope=signed(read(path.resolve(o.input)),fs.readFileSync(path.resolve(o.key),'utf8'));
      if(o.delegation)envelope.delegation=read(path.resolve(o.delegation));
      create(path.resolve(o.output),envelope);result={signed:path.resolve(o.output)};break;
    }
    case 'dependencies': {
      const action=pos.shift();
      if(action==='status')result=dependencyStatus(root);
      else if(action==='pin' || action==='unpin')result=pinDependency(root,action==='unpin',o.name);
      else if(action==='update'){assert(o.bundle,'--bundle required');result=updateDependency(root,{bundle:o.bundle,sha256:o.sha256,publicKey:o['public-key'],check:o.check,allowBreaking:o['allow-breaking']});}
      else throw new Error('Choose dependencies status, update, pin, or unpin');
      break;
    }
    case 'skill':assert(o.source,'--source required');result=importSkill(root,o.source,{name:o.name,expectedDigest:o.sha256});break;
    case 'module': {
      assert(!(o.apply && (o.name || o.preview)),'Use --apply PLAN by itself');
      if(o.apply)result=applyModulePlan(root,o.apply);
      else {
        assert(['node-typescript','php-laravel'].includes(o.name),'Choose node-typescript or php-laravel');
        if(o.preview)result=planModule(root,o.name,{workspace:o.workspace,layers:o.layers,profile:o.profile,advisoryProfile:o['advisory-profile'],milestoneReference:o['milestone-reference'],milestoneOwner:o['milestone-owner'],milestoneStatus:o['milestone-status']});
        else {result=read(path.join(PACKAGE,'modules',o.name+'.json'));if(result.standards)result.standardsText=fs.readFileSync(inside(PACKAGE,result.standards),'utf8');}
        if(o.output)create(path.resolve(root,o.output),result);
      }
      break;
    }
  }
  if(['survey','inspect','review','gate','spec','backlog','visual-plan','npm-provenance'].includes(command) && o.output)write(inside(root,o.output),result);
  console.log(JSON.stringify(result,null,2));return result.exitCode || 0;
}
