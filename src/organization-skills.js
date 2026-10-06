import fs from 'node:fs';
import path from 'node:path';
import {assert,read,hash,inside,exclusive,validated,walk} from './io.js';
import {verifyEnvelope,signed} from './policy.js';
import {verifyDependency,SOURCES} from './dependencies.js';
import {storeTree,skillDirectory} from './storage.js';
import {transact} from './install.js';

export function organizationSkillBundle({source,repository,revision,sourcePath,publisher,key}={}) {
  const directory=path.resolve(source),files=Object.fromEntries(walk(directory).map(file=>[file,fs.readFileSync(inside(directory,file)).toString('base64')]));
  assert(!Object.keys(files).some(file=>file!=='SKILL.md' && file.endsWith('/SKILL.md')),'Nested skills are not accepted');
  const entry=Buffer.from(files['SKILL.md']||'','base64').toString('utf8');
  const field=name=>entry.match(new RegExp('^'+name+':\\s*(.+)$','m'))?.[1].trim();
  const data={schemaVersion:1,kind:'skill',id:field('name'),version:field('version'),license:field('license'),source:{repository,commit:revision,path:sourcePath},files,digest:hash(Object.fromEntries(Object.entries(files).map(([file,bytes])=>[file,hash(Buffer.from(bytes,'base64'))])))};
  verifyDependency(data,{organization:true});
  assert(typeof publisher==='string' && publisher.length,'Publisher required');
  return {publisher,...signed(data,fs.readFileSync(path.resolve(key),'utf8'))};
}

export function trustedSources(root) {
  const file=process.env.AGENTHOUSE_TRUST_FILE?path.resolve(process.env.AGENTHOUSE_TRUST_FILE):inside(root,'.agenthouse/trusted-sources.json');
  const data=validated('trusted-sources',read(file));
  assert(new Set(data.sources.map(s=>s.id)).size===data.sources.length,'Duplicate trusted source');
  return data.sources;
}
export function verifyOrganizationSkill(root,envelope,{enforcePin=true}={}) {
  const source=trustedSources(root).find(s=>s.id===envelope?.publisher);
  assert(source && !source.revoked,'Unknown or revoked skill publisher');
  assert(!source.expiresAt || Date.parse(source.expiresAt)>Date.now(),'Skill publisher trust expired');
  let data;
  for(const key of [source.publicKey,...(source.previousPublicKeys||[])])try{data=verifyEnvelope(envelope,key);break;}catch{}
  assert(data,'Invalid signature for trusted skill publisher');
  assert(!Object.hasOwn(SOURCES,data.id) && !data.id?.startsWith('ah-') && data.id!=='hooks','Organization publisher cannot replace a framework dependency');
  assert(source.skills[data.id]===data.source?.path && source.repository===data.source?.repository,'Skill outside publisher scope');
  assert(source.licenses.includes(data.license),'Skill license not permitted');
  const lock=verifyDependency(data,{organization:true});
  if(enforcePin && source.pins?.[data.id])assert(source.pins[data.id]===lock.digest,'Organization skill pinned to another digest');
  return {data,lock,publisher:source.id};
}
export function verifyOrganizationLock(id,entry,verified) {
  const recorded=Object.fromEntries(Object.keys(verified.lock).map(key=>[key,entry[key]]));
  assert(id===verified.lock.id && hash(recorded)===hash(verified.lock) && entry.publisher===verified.publisher,'Organization skill lock modified');
}
export function restoreOrganizationSkills(root) {
  const file=inside(root,'.agenthouse/skills.json'),imports=fs.existsSync(file)?read(file):{};
  return Object.values(imports).filter(entry=>entry.envelope).map(entry=>updateOrganizationSkill(root,{envelope:entry.envelope,restore:true}));
}
export function updateOrganizationSkill(root,{bundle,envelope:provided,restore=false,check=false,allowBreaking=false}={}) {
  return exclusive(root,()=>{
    const envelope=provided || read(path.resolve(bundle)),{data,lock,publisher}=verifyOrganizationSkill(root,envelope);
    const importsFile=inside(root,'.agenthouse/skills.json'),imports=fs.existsSync(importsFile)?read(importsFile):{},current=imports[lock.id];
    assert(!current || current.envelope,'Existing local skill import must be reconciled explicitly');
    if(current) {
      verifyOrganizationLock(lock.id,current,verifyOrganizationSkill(root,current.envelope,{enforcePin:false}));
      const directory=skillDirectory(root,lock.id);
      if(restore) {
        assert(lock.digest===current.digest,'Restore must use the exact imported digest');
        if(fs.existsSync(directory))assert(walk(directory).every(file=>Object.hasOwn(current.files,file)),'Imported skill inventory modified');
      }else assert(hash(walk(directory).sort())===hash(Object.keys(current.files).sort()),'Imported skill inventory modified');
      for(const [file,digest] of Object.entries(current.files)) {
        const target=inside(directory,file);
        if(restore && !fs.existsSync(target))continue;
        assert(fs.existsSync(target) && hash(fs.readFileSync(target))===digest,'Imported skill modified');
      }
      const a=current.version.split('.').map(Number),b=lock.version.split('.').map(Number);
      assert(a[0]===b[0] && (a[0]!==0 || a[1]===b[1]) || allowBreaking,'Breaking organization skill update requires --allow-breaking');
      assert(b[0]>a[0] || b[0]===a[0] && (b[1]>a[1] || b[1]===a[1] && b[2]>=a[2]),'Organization skill downgrade rejected');
      if(lock.version===current.version)assert(lock.digest===current.digest && hash(lock.source)===hash(current.source),'Organization skill version reused');
    }
    if(check)return {id:lock.id,publisher,current:current?.version||null,available:lock.version,digest:lock.digest};
    const central=read(inside(root,'.agenthouse/active.json')).storage==='machine',changes=[];
    if(central)storeTree(`skills/${lock.id}/${lock.digest}`,data.files);
    else {
      const directory=inside(root,`.agents/skills/${lock.id}`);
      if(!current)assert(!fs.existsSync(directory),'Existing skill directory conflict');
      for(const file of new Set([...Object.keys(current?.files||{}),...Object.keys(data.files)]))changes.push({path:`.agents/skills/${lock.id}/${file}`,content:data.files[file]===undefined?null:Buffer.from(data.files[file],'base64')});
    }
    imports[lock.id]={...lock,...(central?{storage:'machine'}:{}),publisher,envelope};
    changes.push({path:'.agenthouse/skills.json',content:JSON.stringify(imports,null,2)+'\n'});
    transact(root,changes);
    return {status:'updated',id:lock.id,publisher,version:lock.version,digest:lock.digest};
  });
}
