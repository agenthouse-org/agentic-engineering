import fs from 'node:fs';
import path from 'node:path';
import {assert, read, write, inside, exclusive, validated} from './io.js';

function catalogFromItem(root,item) {
  const record=read(inside(root,item));
  const linked=typeof record.fields?.architectureCatalog==='string'?record.fields.architectureCatalog.trim():'';
  if(linked)return {record,catalogPath:linked,embedded:null};
  if(record.architectureCatalog && typeof record.architectureCatalog==='object')return {record,catalogPath:null,embedded:record.architectureCatalog};
  return {record,catalogPath:null,embedded:null};
}

export function loadArchitectureCatalog(root,{item,catalog}={}) {
  if(catalog) {
    const data=validated('architecture-catalog',read(inside(root,catalog)));
    return {catalogPath:catalog,data,record:item?read(inside(root,item)):null};
  }
  assert(item,'Provide --item FILE or --catalog FILE');
  const {record,catalogPath,embedded}=catalogFromItem(root,item);
  if(catalogPath)return {catalogPath,data:validated('architecture-catalog',read(inside(root,catalogPath))),record};
  if(embedded)return {catalogPath:null,data:validated('architecture-catalog',embedded),record};
  throw new Error('Work item has no fields.architectureCatalog path or embedded architectureCatalog');
}

function scanAdrDirectory(root,dir) {
  const target=path.resolve(root,dir);
  assert(fs.existsSync(target) && fs.statSync(target).isDirectory(),`Architecture path not found: ${dir}`);
  return fs.readdirSync(target).filter(name=>/\.md$/i.test(name) && !/^readme\.md$/i.test(name)).sort().map(name=>{
    const rel=path.relative(root,path.join(target,name)).replace(/\\/g,'/');
    const text=fs.readFileSync(path.join(target,name),'utf8');
    const title=text.match(/^#\s+(.+)$/m)?.[1]?.trim() || name;
    const status=text.match(/^Status:\s*(.+)$/im)?.[1]?.trim() || 'unknown';
    const id=name.replace(/\.md$/i,'').replace(/[^a-zA-Z0-9_.-]+/g,'-');
    return {id,title,path:rel,status,source:'directory-scan'};
  });
}

export function listArchitecture(root,{catalog,item,path:scanPath}={}) {
  if(catalog || item) {
    const loaded=loadArchitectureCatalog(root,{catalog,item});
    return {schemaVersion:1,source:loaded.catalogPath?'catalog-file':'embedded',catalog:loaded.catalogPath,entries:loaded.data.entries,ownerRole:loaded.data.ownerRole||null,standardRef:loaded.data.standardRef||null};
  }
  const dir=scanPath || (fs.existsSync(inside(root,'docs/adr'))?'docs/adr':'.agenthouse/architecture');
  if(!fs.existsSync(inside(root,dir)))return {schemaVersion:1,source:'directory-scan',path:dir,entries:[],note:`No architecture directory at ${dir}. Create Markdown ADRs or write a catalog with architecture write.`};
  return {schemaVersion:1,source:'directory-scan',path:dir,entries:scanAdrDirectory(root,dir)};
}

export function showArchitecture(root,{id,catalog,item,path:scanPath}={}) {
  assert(id,'--id required');
  const listed=listArchitecture(root,{catalog,item,path:scanPath});
  const entry=listed.entries.find(e=>e.id===id || e.path===id || (e.path && e.path.endsWith(`/${id}.md`)) || (e.path && path.basename(e.path,'.md')===id));
  assert(entry,`Unknown architecture entry: ${id}`);
  let markdown=null;
  if(entry.path && fs.existsSync(inside(root,entry.path)))markdown=fs.readFileSync(inside(root,entry.path),'utf8');
  return {schemaVersion:1,entry,markdown,source:listed.source,catalog:listed.catalog||null,path:listed.path||null};
}

function validateEntries(data) {
  const findings=[];
  const seen=new Set();
  if(!(data.entries || []).length)findings.push({id:'content',status:'incomplete',reason:'Architecture catalog has no entries'});
  for(const entry of data.entries || []) {
    if(seen.has(entry.id))findings.push({id:entry.id,status:'failed',reason:'Duplicate architecture entry id'});
    seen.add(entry.id);
    if(entry.authorityClass==='mandatory' && !(entry.ruleIds || []).length)
      findings.push({id:entry.id,status:'incomplete',reason:'Mandatory entries should declare ruleIds when enforceable obligations exist'});
  }
  return findings;
}

export function checkArchitecture(root,{item,catalog}={}) {
  const loaded=loadArchitectureCatalog(root,{item,catalog});
  const findings=validateEntries(loaded.data);
  for(const entry of loaded.data.entries || []) {
    if(entry.path && !fs.existsSync(inside(root,entry.path)))
      findings.push({id:entry.id,status:'incomplete',reason:`Missing architecture document: ${entry.path}`});
  }
  const status=findings.some(f=>f.status==='failed')?'failed':findings.some(f=>f.status==='incomplete')?'incomplete':'passed';
  return {schemaVersion:1,item:item||null,catalog:loaded.catalogPath,status,findings,exitCode:{passed:0,failed:1,incomplete:4}[status]};
}

export function writeArchitecture(root,{item,catalog,output,ownerRole='architect',standardRef,entries}={}) {
  assert(item,'--item required');
  assert(Array.isArray(entries) && entries.length,'Provide --entries JSON array');
  const record=read(inside(root,item));
  const data=validated('architecture-catalog',{
    schemaVersion:1,
    kind:'architecture-catalog',
    ownerRole,
    ...(standardRef?{standardRef}:{}),
    entries
  });
  const target=output || catalog || `.agenthouse/work/${record.id || path.basename(item,'.json')}-architecture.json`;
  return exclusive(root,()=>{
    write(inside(root,target),data);
    const next={...record,fields:{...(record.fields||{}),architectureCatalog:target}};
    write(inside(root,item),next);
    return {schemaVersion:1,status:'written',item,catalog:target,entries:data.entries.length,check:checkArchitecture(root,{item,catalog:target})};
  });
}
