import {runtimeDirectory} from './storage.js';
import fs from 'node:fs';
import path from 'node:path';
import {assert,read,write,inside,hash,exclusive} from './io.js';
import {payload,install} from './install.js';
import {verifyEnvelope} from './policy.js';
import {DEPENDENCY,verifyDependency,dependencyStatus,checkDependencyPin,installedHooks} from './dependencies.js';

export function pinDependency(root,unpin=false,id=DEPENDENCY) {
  return exclusive(root,()=>{
    // Read installed identity even when replacing an existing pin.
    const installed=id==='hooks'?installedHooks(root):read(inside(root,'.agenthouse/dependencies.lock.json')).dependencies[id];
    assert(installed,'Dependency not installed');
    const file=inside(root,'.agenthouse/dependency-policy.json');
    const policy=fs.existsSync(file)?read(file):{schemaVersion:1,pins:{}};
    policy.pins ||= {};
    if(unpin)delete policy.pins[id];
    else policy.pins[id]={version:installed.version,digest:installed.digest};
    write(file,policy);return policy;
  });
}
export function updateDependency(root,options) {
  const installed=dependencyStatus(root).dependencies;
  const raw=fs.readFileSync(path.resolve(options.bundle));
  const data=options.publicKey?verifyEnvelope(JSON.parse(raw),fs.readFileSync(path.resolve(options.publicKey),'utf8')):JSON.parse(raw);
  if(!options.publicKey)assert(options.sha256 && hash(raw)===options.sha256,'Supply a trusted SHA-256 or public key for dependency verification');
  const next=verifyDependency(data),current=installed[next.id];
  assert(current,'Install this bundled dependency through a framework update first');
  checkDependencyPin(root,next);
  const a=current.version.split('.').map(Number),b=next.version.split('.').map(Number);
  const compatible=a[0]===b[0] && (a[0]!==0 || a[1]===b[1]);
  assert(compatible || options.allowBreaking,'Breaking dependency update requires --allow-breaking');
  assert(a.every((v,i)=>v===b[i]) || b[0]>a[0] || (b[0]===a[0] && (b[1]>a[1] || (b[1]===a[1] && b[2]>a[2]))),'Use rollback for dependency downgrades');
  if(next.version===current.version)assert(next.digest===current.digest && hash(next.source)===hash(current.source),'Upstream version reused with different content or provenance');
  if(options.check)return {current:current.version,available:next.version,compatible};
  if(hash(current)===hash(next))return {status:'current',version:current.version};
  const active=read(inside(root,'.agenthouse/active.json'));
  const bundle=payload(runtimeDirectory(root,active));
  assert(hash(bundle)===active.digest,'Active runtime modified');
  bundle.files['dependencies/'+next.id+'.json']=Buffer.from(JSON.stringify(data,null,2)+'\n').toString('base64');
  return install(root,{payload:bundle,expectedDigest:active.digest});
}
