import fs from 'node:fs';
import os from 'node:os';
import {assert,hash,inside,read,walk} from './io.js';

export const DEPENDENCY='frontend-acceptance';
export const SOURCES={'frontend-acceptance':'engineering/frontend-acceptance','web-usability-conformity':'usability/web-usability-conformity'};
export const DEPENDENCY_FILE='dependencies/frontend-acceptance.json';
export function verifyDependency(data) {
  assert(data?.schemaVersion===1 && data.kind==='skill' && Object.hasOwn(SOURCES,data.id),'Unsupported dependency');
  assert(/^\d+\.\d+\.\d+$/.test(data.version),'Invalid dependency version');
  assert(data.source?.repository==='https://github.com/agenthouse-org/skills.git' && /^[a-f0-9]{40}$/.test(data.source.commit) && data.source.path===SOURCES[data.id],'Invalid upstream provenance');
  assert(data.license==='MIT' && data.files && typeof data.files==='object','Missing dependency license/files');
  assert(Object.keys(data.files).length>0 && Object.keys(data.files).length<500,'Dependency file limit');
  const hashes={};let total=0;
  for(const [file,encoded] of Object.entries(data.files)) {
    inside(os.tmpdir(),file);
    assert(!file.includes('\\') && file.split('/').every(p=>p && p!=='.'),'Noncanonical dependency path');
    assert(typeof encoded==='string' && Buffer.from(encoded,'base64').toString('base64')===encoded,'Invalid dependency encoding');
    const bytes=Buffer.from(encoded,'base64');total+=bytes.length;
    assert(Buffer.from(bytes.toString('utf8')).equals(bytes),'Only UTF-8 skill resources are supported');
    assert(total<5*1024*1024,'Dependency size limit');hashes[file]=hash(bytes);
  }
  const entry=Buffer.from(data.files['SKILL.md'] || '','base64').toString('utf8');
  assert(entry.match(/^name:\s*["']?([a-z0-9-]+)/m)?.[1]===data.id,'Dependency skill identity mismatch');
  assert(entry.match(/^version:\s*(.+)$/m)?.[1].trim()===data.version,'Dependency skill version mismatch');
  assert(/^license:\s*MIT\s*$/m.test(entry),'Skill license mismatch');
  assert(hash(hashes)===data.digest,'Dependency digest mismatch');
  return {id:data.id,version:data.version,source:data.source,license:data.license,digest:data.digest,files:hashes};
}
export function bundledDependency(payload) {
  assert(payload.files[DEPENDENCY_FILE],'Required frontend-acceptance dependency missing');
  const data=JSON.parse(Buffer.from(payload.files[DEPENDENCY_FILE],'base64').toString('utf8'));
  return {data,lock:verifyDependency(data)};
}
export function bundledDependencies(payload) {
  bundledDependency(payload);
  return Object.keys(SOURCES).filter(id=>payload.files['dependencies/'+id+'.json']).map(id=>{
    const data=JSON.parse(Buffer.from(payload.files['dependencies/'+id+'.json'],'base64').toString('utf8'));
    assert(data.id===id,'Dependency filename mismatch');return {data,lock:verifyDependency(data)};
  });
}
export function checkDependencyPin(root,lock) {
  const file=inside(root,'.agenthouse/dependency-policy.json');
  if(!fs.existsSync(file))return;
  const pin=read(file).pins?.[lock.id];
  if(pin)assert(pin.version===lock.version && pin.digest===lock.digest,'Dependency pinned to another version or digest');
}
export function checkPresentPins(root,ids) {
  const file=inside(root,'.agenthouse/dependency-policy.json');if(!fs.existsSync(file))return;
  for(const id of Object.keys(read(file).pins || {}))assert(ids.includes(id),`Pinned dependency missing from bundle: ${id}`);
}
export function hookLock(payload) {
  const file='dependencies/hooks/manifest.json';if(!payload.files[file])return null;
  const manifest=JSON.parse(Buffer.from(payload.files[file],'base64'));
  assert(manifest.package==='@agenthouse-org/hooks' && manifest.contractVersion===1,'Invalid hook contract');
  for(const name of ['engineering.cjs','LICENSE'])assert(payload.files[`dependencies/hooks/${name}`] && hash(Buffer.from(payload.files[`dependencies/hooks/${name}`],'base64'))===manifest.files[name],'Hook export missing or modified');
  return {id:'hooks',version:manifest.version,digest:hash(manifest),source:{package:manifest.package,path:manifest.sourcePath},files:manifest.files};
}
export function installedHooks(root) {
  const active=read(inside(root,'.agenthouse/active.json')),files={};
  for(const name of ['manifest.json','engineering.cjs','LICENSE']) {
    const file=inside(root,`.agenthouse/${active.runtime}/dependencies/hooks/${name}`);
    if(fs.existsSync(file))files[`dependencies/hooks/${name}`]=fs.readFileSync(file).toString('base64');
  }
  return hookLock({files});
}
export function dependencyStatus(root) {
  const active=read(inside(root,'.agenthouse/active.json')),expected={};
  for(const id of Object.keys(SOURCES)) {
    const file=inside(root,'.agenthouse/'+active.runtime+'/dependencies/'+id+'.json');
    if(!fs.existsSync(file)){assert(id!==DEPENDENCY,'Required frontend dependency missing');continue;}
    const entry=verifyDependency(read(file));expected[id]=entry;
    const directory=inside(root,'.agents/skills/'+id);
    assert(fs.existsSync(directory) && hash(walk(directory).sort())===hash(Object.keys(entry.files).sort()),'Dependency file inventory changed');
    for(const [file,digest] of Object.entries(entry.files))assert(hash(fs.readFileSync(inside(directory,file)))===digest,'Dependency missing or modified: '+file);
    checkDependencyPin(root,entry);
  }
  const lock=read(inside(root,'.agenthouse/dependencies.lock.json'));
  assert(hash(lock)===hash({schemaVersion:1,dependencies:expected}),'Dependency lock changed');
  const hooks=installedHooks(root);if(hooks)checkDependencyPin(root,hooks);
  return {...lock,runtimeDependencies:hooks?{hooks}:{}};
}
