import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {assert,read,inside,hash,PACKAGE} from './io.js';
import {resolve} from './policy.js';
import {survey} from './inspect.js';
import {run} from './process.js';

export function hookRuntime() {
  const folder=path.join(PACKAGE,'dependencies/hooks'),manifest=read(path.join(folder,'manifest.json'));
  assert(manifest.package==='@agenthouse-org/hooks' && manifest.contractVersion===1,'Unsupported hook dependency');
  for(const file of ['engineering.cjs','LICENSE'])assert(hash(fs.readFileSync(path.join(folder,file)))===manifest.files[file],'Hook dependency modified');
  const runtime=createRequire(import.meta.url)(path.join(folder,'engineering.cjs'));
  assert(runtime.contractVersion===manifest.contractVersion,'Hook contract mismatch');return {runtime,manifest};
}
export async function hook(root,{vendor='ci',input}={}) {
  assert(['claude','cursor','ci'].includes(vendor),'Supported hook event formats: claude, cursor, ci');
  const {runtime}=hookRuntime();
  const raw=JSON.parse(input?fs.readFileSync(inside(root,input),'utf8'):fs.readFileSync(0,'utf8'));
  const event=runtime.normalize(vendor,raw),enrolled=fs.existsSync(inside(root,'.agenthouse/config.json'));
  assert(enrolled || event.event==='session','Enroll this repository before using engineering hooks');
  const config=enrolled?resolve(root,{frozen:true}).config:{};
  const info=survey(root);
  const standards=[...(info.stacks.includes('node')?['node-typescript']:[]),...(info.stacks.includes('php')?['php-laravel']:[])].map(name=>`node .agenthouse/run.mjs module --name ${name}`);
  const result=await runtime.handle(event,config.hooks || {},{root,enrolled,branch:info.branch,stacks:info.stacks,standards,
    run:(executable,args,options)=>run(executable==='node'?process.execPath:executable,args,options)});
  return runtime.render(vendor,event.event,result);
}
export function hookConfiguration(vendor='claude') {
  assert(vendor==='claude','Use the normalized hook command for other hosts');
  return {hooks:{SessionStart:[{hooks:[{type:'command',command:'node .agenthouse/run.mjs hook --vendor claude'}]}],
    PreToolUse:[{matcher:'Bash',hooks:[{type:'command',command:'node .agenthouse/run.mjs hook --vendor claude'}]}],
    PostToolUse:[{matcher:'Edit|Write',hooks:[{type:'command',command:'node .agenthouse/run.mjs hook --vendor claude'}]}]}};
}
export function hookSettings(root,{remove=false}={}) {
  const marker='.agenthouse/hook-installation.json',settings='.claude/settings.json';
  const ownedFile=inside(root,marker),settingsFile=inside(root,settings);
  const owned=fs.existsSync(ownedFile)?read(ownedFile):null;
  if(remove && !owned)return {changes:[],status:'not-installed'};
  const data=fs.existsSync(settingsFile)?read(settingsFile):{};
  assert(data && !Array.isArray(data) && typeof data==='object','Invalid host settings');
  if(owned) {
    for(const {event,entry} of owned.entries)assert(data.hooks?.[event]?.filter(e=>hash(e)===hash(entry)).length===1,`Modified or missing managed hook: ${event}`);
    if(!remove)return {changes:[],status:'installed'};
    for(const {event,entry} of owned.entries) {
      data.hooks[event]=data.hooks[event].filter(e=>hash(e)!==hash(entry));
      if(!data.hooks[event].length)delete data.hooks[event];
    }
    if(!Object.keys(data.hooks).length && !owned.hadHooks)delete data.hooks;
    return {status:'removed',changes:[{path:settings,content:!owned.existed && !Object.keys(data).length?null:JSON.stringify(data,null,2)+'\n'},{path:marker,content:null}]};
  }
  resolve(root,{frozen:true});
  const existed=fs.existsSync(settingsFile),hadHooks=Object.hasOwn(data,'hooks'),entries=[];
  assert(!hadHooks || data.hooks && typeof data.hooks==='object' && !Array.isArray(data.hooks),'Invalid native hooks settings');
  data.hooks ||= {};
  for(const [event,groups] of Object.entries(hookConfiguration().hooks)) {
    assert(!data.hooks[event] || Array.isArray(data.hooks[event]),'Invalid native event settings');
    data.hooks[event] ||= [];
    const entry=groups[0];
    const existing=data.hooks[event].filter(g=>g.hooks?.some(h=>h.command===entry.hooks[0].command));
    if(existing.length){assert(existing.length===1 && hash(existing[0])===hash(entry),`Conflicting existing engineering hook: ${event}`);continue;}
    data.hooks[event].push(entry);entries.push({event,entry});
  }
  return {status:'installed',changes:[{path:settings,content:JSON.stringify(data,null,2)+'\n'},{path:marker,content:JSON.stringify({schemaVersion:1,existed,hadHooks,entries},null,2)+'\n'}]};
}
