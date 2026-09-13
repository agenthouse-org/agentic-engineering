import fs from 'node:fs';
import path from 'node:path';
import {assert,read,write,inside,hash,exclusive} from './io.js';
import {payload,install} from './install.js';
import {verifyEnvelope} from './policy.js';
import {DEPENDENCY,DEPENDENCY_FILE,verifyDependency,dependencyStatus,checkDependencyPin} from './dependencies.js';

export function pinDependency(root,unpin=false) {
  return exclusive(root,()=>{
    // Read installed identity even when replacing an existing pin.
    const installed=read(inside(root,'.agenthouse/dependencies.lock.json')).dependencies[DEPENDENCY];
    const file=inside(root,'.agenthouse/dependency-policy.json');
    const policy=fs.existsSync(file)?read(file):{schemaVersion:1,pins:{}};
    policy.pins ||= {};
    if(unpin)delete policy.pins[DEPENDENCY];
    else policy.pins[DEPENDENCY]={version:installed.version,digest:installed.digest};
    write(file,policy);return policy;
  });
}
export function updateDependency(root,options) {
  const current=dependencyStatus(root).dependencies[DEPENDENCY];
  const raw=fs.readFileSync(path.resolve(options.bundle));
  const data=options.publicKey?verifyEnvelope(JSON.parse(raw),fs.readFileSync(path.resolve(options.publicKey),'utf8')):JSON.parse(raw);
  if(!options.publicKey)assert(options.sha256 && hash(raw)===options.sha256,'Supply a trusted SHA-256 or public key for dependency verification');
  const next=verifyDependency(data);
  checkDependencyPin(root,next);
  const a=current.version.split('.').map(Number),b=next.version.split('.').map(Number);
  const compatible=a[0]===b[0] && (a[0]!==0 || a[1]===b[1]);
  assert(compatible || options.allowBreaking,'Breaking dependency update requires --allow-breaking');
  assert(a.every((v,i)=>v===b[i]) || b[0]>a[0] || (b[0]===a[0] && (b[1]>a[1] || (b[1]===a[1] && b[2]>a[2]))),'Use rollback for dependency downgrades');
  if(next.version===current.version)assert(next.digest===current.digest && hash(next.source)===hash(current.source),'Upstream version reused with different content or provenance');
  if(options.check)return {current:current.version,available:next.version,compatible};
  if(hash(current)===hash(next))return {status:'current',version:current.version};
  const active=read(inside(root,'.agenthouse/active.json'));
  const bundle=payload(inside(root,`.agenthouse/${active.runtime}`));
  assert(hash(bundle)===active.digest,'Active runtime modified');
  bundle.files[DEPENDENCY_FILE]=Buffer.from(JSON.stringify(data,null,2)+'\n').toString('base64');
  return install(root,{payload:bundle});
}
