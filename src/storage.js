import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assert,inside,read,hash,walk,write,safeId} from './io.js';

// Only identities, never machine-specific absolute paths, belong in project pins.
export function machineHome() {
  const home=process.env.AGENTHOUSE_HOME || path.join(os.homedir(),'.agenthouse');
  assert(path.isAbsolute(home),'AGENTHOUSE_HOME must be an absolute path');
  return path.resolve(home);
}
export function runtimeDirectory(root,active=read(inside(root,'.agenthouse/active.json'))) {
  assert(/^[a-f0-9]{64}$/.test(active.digest),'Invalid runtime digest');
  assert(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(active.version),'Invalid runtime version');
  const expected=`runtime/${active.version}-${active.storage==='machine'?active.digest:active.digest.slice(0,12)}`;
  assert(active.runtime===expected,'Active runtime path differs from recorded pin');
  return inside(active.storage==='machine'?machineHome():inside(root,'.agenthouse'),expected);
}
export function skillDirectory(root,id,active=read(inside(root,'.agenthouse/active.json'))) {
  safeId(id);
  if(active.storage!=='machine')return inside(root,`.agents/skills/${id}`);
  const runtime=runtimeDirectory(root,active),dependency=path.join(runtime,'dependencies',`${id}.json`);
  if(fs.existsSync(dependency))return inside(machineHome(),`skills/${id}/${read(dependency).digest}`);
  const imports=inside(root,'.agenthouse/skills.json');
  const imported=fs.existsSync(imports)?read(imports)[id]:null;
  if(imported?.storage==='machine')return inside(machineHome(),`skills/${id}/${imported.digest}`);
  if(imported)return inside(root,`.agents/skills/${id}`); // Preserve consumer imports across legacy migration.
  return inside(runtime,`skills/${id}`);
}
export function verifyTree(directory,files) {
  assert(fs.existsSync(directory),'Central assets missing; run ah-engineering restore');
  assert(hash(walk(directory).sort())===hash(Object.keys(files).sort()),`Central asset inventory changed: ${directory}`);
  for(const [file,bytes] of Object.entries(files))assert(hash(fs.readFileSync(inside(directory,file)))===hash(Buffer.from(bytes,'base64')),`Central asset modified: ${file}`);
}
export function storeTree(relative,files) {
  const destination=inside(machineHome(),relative);
  if(fs.existsSync(destination)){verifyTree(destination,files);return destination;}
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  const stage=fs.mkdtempSync(destination+'.staging-');
  try {
    for(const [file,bytes] of Object.entries(files))write(inside(stage,file),Buffer.from(bytes,'base64'));
    try {fs.renameSync(stage,destination);}catch(error) {
      if(!fs.existsSync(destination))throw error;
      verifyTree(destination,files);
    }
  }finally {
    assert(stage.startsWith(destination+'.staging-'),'Unsafe staging cleanup');
    if(fs.existsSync(stage))fs.rmSync(stage,{recursive:true,force:true});
  }
  return destination;
}
