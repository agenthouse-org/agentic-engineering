import fs from 'node:fs';
import os from 'node:os';
import {assert,hash,inside,read} from './io.js';

export const DEPENDENCY='frontend-acceptance';
export const DEPENDENCY_FILE='dependencies/frontend-acceptance.json';
export function verifyDependency(data) {
  assert(data?.schemaVersion===1 && data.kind==='skill' && data.id===DEPENDENCY,'Unsupported dependency');
  assert(/^\d+\.\d+\.\d+$/.test(data.version),'Invalid dependency version');
  assert(data.source?.repository==='https://github.com/agenthouse-org/skills.git' && /^[a-f0-9]{40}$/.test(data.source.commit) && data.source.path==='engineering/frontend-acceptance','Invalid upstream provenance');
  assert(data.license==='MIT' && data.files && typeof data.files==='object','Missing dependency license/files');
  assert(Object.keys(data.files).length>0 && Object.keys(data.files).length<500,'Dependency file limit');
  const hashes={};let total=0;
  for(const [file,encoded] of Object.entries(data.files)) {
    inside(os.tmpdir(),file);
    assert(!file.includes('\\') && file.split('/').every(p=>p && p!=='.'),'Noncanonical dependency path');
    assert(typeof encoded==='string' && Buffer.from(encoded,'base64').toString('base64')===encoded,'Invalid dependency encoding');
    const bytes=Buffer.from(encoded,'base64');total+=bytes.length;
    assert(total<5*1024*1024,'Dependency size limit');hashes[file]=hash(bytes);
  }
  const entry=Buffer.from(data.files['SKILL.md'] || '','base64').toString('utf8');
  assert(entry.match(/^name:\s*["']?([a-z0-9-]+)/m)?.[1]===data.id,'Dependency skill identity mismatch');
  assert(entry.match(/^version:\s*(.+)$/m)?.[1].trim()===data.version,'Dependency skill version mismatch');
  assert(hash(hashes)===data.digest,'Dependency digest mismatch');
  return {id:data.id,version:data.version,source:data.source,license:data.license,digest:data.digest,files:hashes};
}
export function bundledDependency(payload) {
  assert(payload.files[DEPENDENCY_FILE],'Required frontend-acceptance dependency missing');
  const data=JSON.parse(Buffer.from(payload.files[DEPENDENCY_FILE],'base64').toString('utf8'));
  return {data,lock:verifyDependency(data)};
}
export function checkDependencyPin(root,lock) {
  const file=inside(root,'.agenthouse/dependency-policy.json');
  if(!fs.existsSync(file))return;
  const pin=read(file).pins?.[lock.id];
  if(pin)assert(pin.version===lock.version && pin.digest===lock.digest,'Dependency pinned to another version or digest');
}
export function dependencyStatus(root) {
  const active=read(inside(root,'.agenthouse/active.json'));
  const data=read(inside(root,`.agenthouse/${active.runtime}/${DEPENDENCY_FILE}`));
  const expected=verifyDependency(data),lock=read(inside(root,'.agenthouse/dependencies.lock.json'));
  assert(hash(lock)===hash({schemaVersion:1,dependencies:{[expected.id]:expected}}),'Dependency lock changed');
  for(const [file,digest] of Object.entries(expected.files)) {
    const target=inside(root,`.agents/skills/${expected.id}/${file}`);
    assert(fs.existsSync(target) && hash(fs.readFileSync(target))===digest,`Dependency missing or modified: ${file}`);
  }
  checkDependencyPin(root,expected);
  return lock;
}
