import {storeTree} from './storage.js';
import fs from 'node:fs';
import path from 'node:path';
import {assert,read,write,inside,walk,hash,safeId,exclusive} from './io.js';

export function importSkill(root,source,{name,expectedDigest}={}) {
  source=path.resolve(source);
  const files=walk(source),entry=fs.readFileSync(path.join(source,'SKILL.md'),'utf8');
  const id=safeId(name || entry.match(/^name:\s*["']?([a-z0-9-]+)/m)?.[1]);
  assert(!files.some(f=>f!== 'SKILL.md' && f.endsWith('/SKILL.md')),'Nested skills are not accepted');
  const manifest=Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(inside(source,f)))]));
  const digest=hash(manifest);
  if(expectedDigest)assert(expectedDigest===digest,'Skill dependency digest mismatch');
  return exclusive(root,()=>{
    const lockFile=inside(root,'.agenthouse/skills.json'),lock=fs.existsSync(lockFile)?read(lockFile):{};
    assert(!lock[id] || lock[id].digest===digest,'Skill already imported at another revision; remove it explicitly before replacement');
    const activeFile=inside(root,'.agenthouse/active.json');
    const central=fs.existsSync(activeFile) && read(activeFile).storage==='machine';
    if(central)storeTree(`skills/${id}/${digest}`,Object.fromEntries(files.map(f=>[f,fs.readFileSync(inside(source,f)).toString('base64')])));
    else for(const f of files) {
      const dest=inside(root,`.agents/skills/${id}/${f}`),bytes=fs.readFileSync(inside(source,f));
      if(fs.existsSync(dest))assert(hash(fs.readFileSync(dest))===hash(bytes),`Skill file conflict: ${f}`);else write(dest,bytes);
    }
    lock[id]={...(central?{storage:'machine'}:{}),version:entry.match(/^version:\s*(.+)$/m)?.[1] || 'unspecified',digest,files:manifest,source};write(lockFile,lock);return {id,...lock[id]};
  });
}
