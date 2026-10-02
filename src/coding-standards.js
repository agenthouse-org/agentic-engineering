import fs from 'node:fs';
import path from 'node:path';
import {assert, read, write, inside, exclusive, validated, PACKAGE} from './io.js';

function catalogFromItem(root,item) {
  const record=read(inside(root,item));
  const linked=typeof record.fields?.codingStandards==='string'?record.fields.codingStandards.trim():'';
  if(linked)return {record,catalogPath:linked,embedded:null};
  if(record.codingStandards && typeof record.codingStandards==='object')return {record,catalogPath:null,embedded:record.codingStandards};
  return {record,catalogPath:null,embedded:null};
}

export function loadCodingStandards(root,{item,catalog}={}) {
  if(catalog) {
    const data=validated('coding-standards-catalog',read(inside(root,catalog)));
    return {catalogPath:catalog,data,record:item?read(inside(root,item)):null};
  }
  assert(item,'Provide --item FILE or --catalog FILE');
  const {record,catalogPath,embedded}=catalogFromItem(root,item);
  if(catalogPath)return {catalogPath,data:validated('coding-standards-catalog',read(inside(root,catalogPath))),record};
  if(embedded)return {catalogPath:null,data:validated('coding-standards-catalog',embedded),record};
  throw new Error('Work item has no fields.codingStandards path or embedded codingStandards');
}

export function showCodingStandards(root,{item,catalog,module}={}) {
  let catalogData=null,catalogPath=null;
  if(catalog || item) {
    try {
      const loaded=loadCodingStandards(root,{item,catalog});
      catalogData=loaded.data;
      catalogPath=loaded.catalogPath;
    } catch(error) {
      if(catalog || !module)throw error;
    }
  }
  let moduleStandards=null;
  const selected=module || catalogData?.module;
  if(selected) {
    assert(['node-typescript','php-laravel'].includes(selected),`Unknown module: ${selected}`);
    const moduleFile=read(path.join(PACKAGE,'modules',`${selected}.json`));
    if(moduleFile.standards && fs.existsSync(path.join(PACKAGE,moduleFile.standards)))
      moduleStandards={module:selected,path:moduleFile.standards,text:fs.readFileSync(path.join(PACKAGE,moduleFile.standards),'utf8')};
  }
  return {
    schemaVersion:1,
    catalog:catalogPath,
    ownerRole:catalogData?.ownerRole||null,
    standardRef:catalogData?.standardRef||null,
    entries:catalogData?.entries||[],
    moduleStandards,
    note:'Use controls to see which rule identifiers map to real checks. Advisory entries are guidance only.'
  };
}

function validateEntries(data) {
  const findings=[];
  const seen=new Set();
  if(!(data.entries || []).length)findings.push({id:'content',status:'incomplete',reason:'Coding standards catalog has no entries'});
  for(const entry of data.entries || []) {
    if(seen.has(entry.id))findings.push({id:entry.id,status:'failed',reason:'Duplicate coding-standards entry id'});
    seen.add(entry.id);
    if(entry.mechanism==='evaluate-check' && !entry.checkId)
      findings.push({id:entry.id,status:'incomplete',reason:'evaluate-check entries need checkId'});
    if(entry.mechanism!=='advisory' && !(entry.ruleIds || []).length && !entry.checkId)
      findings.push({id:entry.id,status:'incomplete',reason:'Non-advisory entries should declare ruleIds or checkId'});
  }
  return findings;
}

export function checkCodingStandards(root,{item,catalog}={}) {
  const loaded=loadCodingStandards(root,{item,catalog});
  const findings=validateEntries(loaded.data);
  for(const entry of loaded.data.entries || []) {
    if(entry.path && !fs.existsSync(inside(root,entry.path)))
      findings.push({id:entry.id,status:'incomplete',reason:`Missing coding-standards document: ${entry.path}`});
  }
  if(loaded.data.standardRef && !fs.existsSync(inside(root,loaded.data.standardRef)))
    findings.push({id:'standardRef',status:'incomplete',reason:`Missing standardRef: ${loaded.data.standardRef}`});
  const status=findings.some(f=>f.status==='failed')?'failed':findings.some(f=>f.status==='incomplete')?'incomplete':'passed';
  return {schemaVersion:1,item:item||null,catalog:loaded.catalogPath,status,findings,exitCode:{passed:0,failed:1,incomplete:4}[status]};
}

export function writeCodingStandards(root,{item,catalog,output,ownerRole='architect',standardRef,module,entries}={}) {
  assert(item,'--item required');
  assert(Array.isArray(entries) && entries.length,'Provide --entries JSON array');
  const record=read(inside(root,item));
  const data=validated('coding-standards-catalog',{
    schemaVersion:1,
    kind:'coding-standards-catalog',
    ownerRole,
    ...(standardRef?{standardRef}:{}),
    ...(module?{module}:{}),
    entries
  });
  const target=output || catalog || `.agenthouse/work/${record.id || path.basename(item,'.json')}-coding-standards.json`;
  return exclusive(root,()=>{
    write(inside(root,target),data);
    const next={...record,fields:{...(record.fields||{}),codingStandards:target}};
    write(inside(root,item),next);
    return {schemaVersion:1,status:'written',item,catalog:target,entries:data.entries.length,check:checkCodingStandards(root,{item,catalog:target})};
  });
}
