import {updateDependency} from './dependency-update.js';
import {dependencyStatus,hookLock,bundledDependencies,checkDependencyPin,checkPresentPins} from './dependencies.js';
import fs from 'node:fs';
import path from 'node:path';
import {assert,read,write,inside,hash,VERSION} from './io.js';
import {housekeep} from './housekeep.js';
import {install,verifyPayload,installationStatus} from './install.js';
import {verifyEnvelope} from './policy.js';

export function update(root,options) {
  const file=path.resolve(options.bundle);
  const raw=fs.readFileSync(file),bundle=JSON.parse(raw);
  let data;
  if(options.publicKey) data=verifyEnvelope(bundle,fs.readFileSync(path.resolve(options.publicKey),'utf8'));
  else {assert(options.sha256 && hash(raw)===options.sha256,'Supply a trusted SHA-256 or public key for bundle verification');data=bundle;}
  verifyPayload(data);
  for(const dependency of bundledDependencies(data))checkDependencyPin(root,dependency.lock);
  const hooks=hookLock(data);if(hooks)checkDependencyPin(root,hooks);
  checkPresentPins(root,[...bundledDependencies(data).map(d=>d.lock.id),...(hooks?[hooks.id]:[])]);
  const installed=read(inside(root,'.agenthouse/installation.json'));
  const current=installed.version.split('.').map(Number),next=data.version.split('.').map(Number);
  const compatible=next[0]===current[0] && (current[0]!==0 || next[1]===current[1]);
  assert(compatible || options.allowBreaking,'Breaking update requires --allow-breaking');
  const policyFile=inside(root,'.agenthouse/update.json');
  const policy=fs.existsSync(policyFile)?read(policyFile):{};
  if(policy.pin)assert(policy.pin===data.version,`Version pinned to ${policy.pin}`);
  if(options.check)return {current:installed.version,available:data.version,compatible,digest:hash(data)};
  if(installed.digest===hash(data))return {version:installed.version,status:'current'};
  const config=inside(root,'.agenthouse/config.json'),before=fs.readFileSync(config);
  const result=install(root,{payload:data});
  assert(hash(fs.readFileSync(config))===hash(before),'Update changed project configuration');
  return result;
}
export function rollback(root) {
  const previous=read(inside(root,'.agenthouse/previous.json'));
  const source=inside(root,`.agenthouse/${previous.active.runtime}`);
  // Restoring via installation validates ownership and preserves custom files.
  const files={};
  const enumerate=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);assert(!entry.isSymbolicLink(),'Symlink in cached runtime');
    if(entry.isDirectory())enumerate(file);else files[path.relative(source,file).replaceAll('\\','/')]=fs.readFileSync(file).toString('base64');
  }};
  enumerate(source);
  const data={schemaVersion:1,version:previous.active.version,files};
  assert(hash(data)===previous.active.digest,'Previous runtime has been modified');
  return install(root,{payload:data});
}
export function session(root,options={}) {
  installationStatus(root);
  const file=inside(root,'.agenthouse/update.json');
  let updateResult={status:'not-configured'};
  if(fs.existsSync(file)) {
    const settings=read(file);
    if(settings.automatic && settings.bundle) {
      try {updateResult=update(root,{bundle:inside(root,settings.bundle),publicKey:settings.publicKey?inside(root,settings.publicKey):undefined,sha256:settings.sha256});}
      catch(error) {updateResult={status:'deferred',reason:error.message};}
    }
  }
  let dependencyUpdate={status:'not-configured'};
  const policy=inside(root,'.agenthouse/dependency-policy.json');
  if(fs.existsSync(policy)) {
    const settings=read(policy);
    if(settings.automatic && settings.bundle) {
      try {dependencyUpdate=updateDependency(root,{bundle:inside(root,settings.bundle),sha256:settings.sha256,publicKey:settings.publicKey?inside(root,settings.publicKey):undefined});}
      catch(error){dependencyUpdate={status:'deferred',reason:error.message};}
    }
  }
  const dependencies=dependencyStatus(root);
  const id=new Date().toISOString().replaceAll(':','-');
  const active=read(inside(root,'.agenthouse/active.json'));
  // A subsequent launcher invocation selects a newly activated runtime. The
  // current process never loads newly downloaded code midway through a task.
  const housekeeping=housekeep(root,{env:options.env});
  const result={id,active,executingVersion:VERSION,update:updateResult,dependencyUpdate,dependencies,housekeeping};
  write(inside(root,`.agenthouse/sessions/${id}.json`),result);
  return result;
}
