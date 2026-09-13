import {help} from './help.js';
import {onboard,demo} from './onboard.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {generateKeyPairSync} from 'node:crypto';
import {assert,read,write,create,hash,inside,VERSION,PACKAGE} from './io.js';
import {install,uninstall,detect,payload,recover} from './install.js';
import {resolve,signed} from './policy.js';
import {evaluate} from './evaluate.js';
import {newItem,advance,STAGES} from './lifecycle.js';
import {update,rollback,session} from './update.js';
import {importSkill} from './skills.js';
import {dependencyStatus} from './dependencies.js';
import {pinDependency,updateDependency} from './dependency-update.js';

const boolean=new Set(['ci','frozen','check','allow-breaking','help','non-interactive']);
function parse(args) {
  const o={},pos=[];
  for(let i=0;i<args.length;i++) {
    if(!args[i].startsWith('--')){pos.push(args[i]);continue;}
    const key=args[i].slice(2);assert(!Object.hasOwn(o,key),`Repeated option --${key}`);
    if(boolean.has(key))o[key]=true;else {assert(args[i+1] && !args[i+1].startsWith('--'),`Missing value for --${key}`);o[key]=args[++i];}
  }
  return {o,pos};
}
const allowed={onboard:['agents','policy','project','autonomy','non-interactive'],demo:[],dependencies:['bundle','sha256','public-key','check','allow-breaking'],init:['agents','scope','policy','project','autonomy'],resolve:['frozen','policy-file'],evaluate:['profile','subject','base-url','output','ci','frozen','policy-file'],doctor:[],bundle:['output','key'],update:['bundle','sha256','public-key','check','allow-breaking'],rollback:[],session:[],uninstall:[],recover:[],work:['id','title','kind','to','decision','policy-file'],sign:['input','key','output','delegation'],keygen:['output'],skill:['source','name','sha256'],module:['name','output']};
export async function main(args) {
  const {o,pos}=parse(args),command=pos.shift();
  if(!command || o.help || command==='help') {
    const topic=command==='help'?pos.shift():command;
    assert(pos.length===0,'Use help COMMAND or COMMAND --help');
    console.log(help(topic));return 0;
  }
  assert(Object.hasOwn(allowed,command),`Unknown command ${command}`);
  assert(['work','dependencies'].includes(command) ? pos.length===1 : pos.length===0,'Unexpected positional arguments');
  for(const key of Object.keys(o))assert(['root','help',...allowed[command]].includes(key),`Unknown option --${key} for ${command}`);
  const root=path.resolve(o.root || process.cwd());
  let result;
  switch(command) {
    case 'onboard':console.log(await onboard(root,{agents:o.agents,policy:o.policy,autonomy:o.autonomy,project:o.project,nonInteractive:o['non-interactive']}));return 0;
    case 'demo':assert(o.root,'Specify --root NEW_EMPTY_DIRECTORY for the demo');console.log(await demo(root));return 0;
    case 'init': {
      assert(!o.scope || ['project','user'].includes(o.scope),'Scope must be project or user');
      const target=o.scope==='user'?path.join(os.homedir(),'.agenthouse-defaults'):root;
      result=install(target,{agents:o.agents?.split(','),policy:o.policy,project:o.project,autonomy:o.autonomy});break;
    }
    case 'resolve':result=resolve(root,{frozen:o.frozen,policyFile:o['policy-file']}).snapshot;break;
    case 'evaluate': {
      result=await evaluate(root,{profile:o.profile,subject:o.subject,baseUrl:o['base-url'],output:o.output,frozen:o.frozen || o.ci,policyFile:o['policy-file']});
      console.log(`${result.status} · ${result.checks.length} checks · ${result.folder}`);return result.exitCode;
    }
    case 'doctor': {
      const problems=[];let config;
      try {dependencyStatus(root);}catch(e){problems.push(e.message);}
      try {config=resolve(root,{frozen:true}).config;}catch(e){problems.push(e.message);}
      if(fs.existsSync(inside(root,'.agenthouse/transaction.json')))problems.push('Interrupted installation: run recover');
      const state=fs.existsSync(inside(root,'.agenthouse/installation.json'))?read(inside(root,'.agenthouse/installation.json')):null;
      if(!state)problems.push('No installed runtime');
      result={version:VERSION,platform:process.platform,detectedAgents:detect(root),installed:state?.agents || [],problems,scope:config?.project,limitations:['Agent instruction adapters are advisory; native host loading is not certified.','External platform integrations use organization-owned CLI evaluators.']};
      console.log(JSON.stringify(result,null,2));return problems.length?2:0;
    }
    case 'work': {
      const action=pos.shift();
      if(action==='new')result=newItem(root,o.id,o.title || o.id,o.kind);
      else if(action==='advance')result=advance(root,o.id,o.to,o.decision,{policyFile:o['policy-file']});
      else if(action==='show'){const item=read(inside(root,`.agenthouse/work/${o.id}.json`));result={...item,subjectHash:hash(item)};}
      else throw new Error(`Work action must be new, advance, or show. Stages: ${STAGES.join(', ')}`);break;
    }
    case 'bundle': {
      assert(o.output,'--output required');const data=payload();const bundle=o.key?signed(data,fs.readFileSync(path.resolve(o.key),'utf8')):data;
      write(path.resolve(o.output),bundle);result={file:path.resolve(o.output),sha256:hash(fs.readFileSync(path.resolve(o.output))),version:VERSION};break;
    }
    case 'update':assert(o.bundle,'--bundle required');result=update(root,{bundle:o.bundle,sha256:o.sha256,publicKey:o['public-key'],check:o.check,allowBreaking:o['allow-breaking']});break;
    case 'rollback':result=rollback(root);break;
    case 'session':result=session(root);break;
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
      else if(action==='pin' || action==='unpin')result=pinDependency(root,action==='unpin');
      else if(action==='update'){assert(o.bundle,'--bundle required');result=updateDependency(root,{bundle:o.bundle,sha256:o.sha256,publicKey:o['public-key'],check:o.check,allowBreaking:o['allow-breaking']});}
      else throw new Error('Choose dependencies status, update, pin, or unpin');
      break;
    }
    case 'skill':assert(o.source,'--source required');result=importSkill(root,o.source,{name:o.name,expectedDigest:o.sha256});break;
    case 'module': {
      assert(['node-typescript','php-laravel'].includes(o.name),'Choose node-typescript or php-laravel');
      const data=read(path.join(PACKAGE,'modules',o.name+'.json'));
      if(o.output)create(path.resolve(root,o.output),data);result=data;break;
    }
  }
  console.log(JSON.stringify(result,null,2));return 0;
}
