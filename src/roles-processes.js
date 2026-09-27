import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PACKAGE,assert,hash,inside,read,write,safeId,validated} from './io.js';
import {skillDirectory} from './storage.js';

const kinds=['roles','processes'];
const baselineRoot=path.join(PACKAGE,'baselines');
const baseVersion=read(path.join(baselineRoot,'version.json')).baselineVersion;
assert(typeof baseVersion==='string'&&/^\d{4}\.\d{2}\.\d+\.\d+$/.test(baseVersion),'Invalid baseline version');

export function globalRepository() {
  const value=process.env.AGENTHOUSE_GLOBAL_REPO || path.join(process.env.AGENTHOUSE_HOME || path.join(os.homedir(),'.agenthouse'),'global');
  assert(path.isAbsolute(value),'AGENTHOUSE_GLOBAL_REPO must be an absolute path');
  return path.resolve(value);
}
function typeName(kind) { assert(kinds.includes(kind),`Choose roles or processes`);return kind; }
function baselineFiles(kind) {
  const dir=path.join(baselineRoot,kind);
  return fs.readdirSync(dir).filter(name=>name.endsWith('.json')).sort().map(name=>({id:name.slice(0,-5),file:path.join(dir,name)}));
}
function baseline(kind,id) {
  safeId(id);const file=path.join(baselineRoot,kind,`${id}.json`);
  assert(fs.existsSync(file),`Unknown baseline ${kind.slice(0,-1)}: ${id}`);
  const value=read(file);validated(kind==='roles'?'role':'process',value);assert(value.id===id,`Baseline identifier mismatch: ${id}`);return value;
}
function localRoot(root=globalRepository()) {
  root=path.resolve(root);
  fs.mkdirSync(root,{recursive:true});
  const meta=inside(root,'.agenthouse-global/state.json');
  if(!fs.existsSync(meta))write(meta,{schemaVersion:1,adopted:{roles:{},processes:{}},history:[]});
  const state=read(meta);
  assert(state.schemaVersion===1 && state.adopted?.roles && state.adopted?.processes,'Invalid global repository state');
  if(!Array.isArray(state.history))state.history=[];
  return {root,meta,state};
}
function localFile(root,kind,id) { return inside(root,`${kind}/${id}.json`); }
function snapshotFile(root,kind,id,version,digest) { return inside(root,`.agenthouse-global/baselines/${kind}/${id}/${version}-${digest}.json`); }
function currentBaselineDigest(value) { return hash(value); }
const bundledSkillIds=()=>new Set([
  ...fs.readdirSync(path.join(PACKAGE,'skills'),{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>entry.name),
  ...fs.readdirSync(path.join(PACKAGE,'dependencies')).filter(file=>file.endsWith('.json')).map(file=>read(path.join(PACKAGE,'dependencies',file))).filter(record=>record.kind==='skill').map(record=>record.id)
]);
function coverage(definition,kind) {
  const references=kind==='roles'?definition.skills.map(item=>item.id):definition.skills||[];
  const available=bundledSkillIds();
  return {status:references.length?'mapped':'candidate-gap',available:references.filter(id=>available.has(id)),missing:references.filter(id=>!available.has(id)),note:references.length?undefined:'No specialist skills are mapped yet; assess whether this process/role needs one.'};
}
function listed(value) {
  if(Array.isArray(value))return [...new Set(value.filter(item=>typeof item==='string'&&item.trim()).map(item=>item.trim()))];
  if(typeof value==='string'&&value.trim())return [...new Set(value.split(',').map(item=>item.trim().replace(/^["']|["']$/g,'')).filter(Boolean))];
  return [];
}
function skillFrontmatter(markdown) {
  const block=String(markdown||'').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if(!block)return {};
  const data={};let key=null;
  for(const line of block[1].split(/\r?\n/)) {
    const item=line.match(/^\s+-\s+(.+)$/);
    if(item&&key&&Array.isArray(data[key])){data[key].push(item[1].trim().replace(/^["']|["']$/g,''));continue;}
    const field=line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if(!field){key=null;continue;}
    key=field[1];const raw=field[2].trim();
    if(!raw){data[key]=[];continue;}
    if(raw.startsWith('[')&&raw.endsWith(']'))data[key]=raw.slice(1,-1).split(',').map(part=>part.trim().replace(/^["']|["']$/g,'')).filter(Boolean);
    else data[key]=raw.replace(/^["']|["']$/g,'');
  }
  return data;
}
function discoveryIndex() {
  const value=read(path.join(baselineRoot,'skill-discovery.json'));
  assert(value.schemaVersion===1&&Array.isArray(value.skills),'Invalid skill discovery index');
  const byId=new Map();
  for(const entry of value.skills) {
    safeId(entry.id);
    assert(!byId.has(entry.id),`Duplicate skill discovery id: ${entry.id}`);
    for(const key of ['processes','roles','stages'])assert(Array.isArray(entry[key])&&entry[key].every(item=>typeof item==='string'&&item.length),`Invalid skill discovery ${key} for ${entry.id}`);
    assert(typeof entry.source==='string'&&entry.source&&typeof entry.use==='string'&&entry.use,`Invalid skill discovery source/use for ${entry.id}`);
    assert(entry.processes.length||entry.roles.length||entry.stages.length,`Skill discovery ${entry.id} needs a process, role, or stage`);
    byId.set(entry.id,{...entry,processes:listed(entry.processes),roles:listed(entry.roles),stages:listed(entry.stages)});
  }
  return byId;
}
function dependencySkills() {
  const dir=path.join(PACKAGE,'dependencies');if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir).filter(name=>name.endsWith('.json')).map(name=>read(path.join(dir,name))).filter(record=>record.kind==='skill'&&record.id).map(record=>{
    const source=record.source||{};
    return {id:record.id,version:record.version||null,repository:source.repository||null,path:source.path||null,origin:'bundled-dependency',frontmatter:skillFrontmatter(Buffer.from(record.files?.['SKILL.md']||'','base64').toString('utf8'))};
  });
}
function importSkillText(projectRoot,id) {
  const local=path.join(projectRoot,'.agents','skills',id,'SKILL.md');
  if(fs.existsSync(local))return fs.readFileSync(local,'utf8');
  if(!fs.existsSync(path.join(projectRoot,'.agenthouse','active.json')))return '';
  try {const file=path.join(skillDirectory(projectRoot,id),'SKILL.md');return fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';}catch{return '';}
}
function installedSpecialistSkills(projectRoot) {
  const found=new Map(dependencySkills().map(skill=>[skill.id,skill]));
  if(!projectRoot)return [...found.values()];
  const lock=path.join(path.resolve(projectRoot),'.agenthouse','skills.json');
  if(!fs.existsSync(lock))return [...found.values()];
  for(const [id,entry] of Object.entries(read(lock))) {
    if(found.has(id))continue;
    safeId(id);
    found.set(id,{id,version:entry.version||null,repository:null,path:null,origin:'project-import',frontmatter:skillFrontmatter(importSkillText(projectRoot,id))});
  }
  return [...found.values()];
}
function applicability(skill,index) {
  const declared=index.get(skill.id);
  const front=skill.frontmatter||{};
  const processes=listed([...(declared?.processes||[]),...listed(front.processes)]);
  const roles=listed([...(declared?.roles||[]),...listed(front.roles)]);
  const stages=listed([...(declared?.stages||[]),...listed(front.stages)]);
  const described=typeof front.description==='string'?front.description.trim():'';
  return {source:declared?.source||(skill.repository?'agenthouse-skills':skill.origin==='project-import'?'project-import':'installed-skill'),use:declared?.use||described,processes,roles,stages};
}
function matchedBy(definition,kind,scope) {
  if(kind==='processes') {
    const reasons=[];
    if(scope.processes.includes(definition.id))reasons.push('process');
    const stageIds=new Set((definition.stages||[]).map(stage=>stage.id));
    if(scope.stages.some(stage=>stageIds.has(stage)))reasons.push('stage');
    return reasons;
  }
  return scope.roles.includes(definition.id)?['role']:[];
}
export function assembleSkillDiscovery(definition,kind,installed,index) {
  const explicit=new Set(kind==='roles'?definition.skills.map(item=>item.id):definition.skills||[]);
  const present=new Map(installed.map(skill=>[skill.id,skill]));
  const catalog=[...installed];
  for(const entry of index.values())if(!present.has(entry.id))catalog.push({id:entry.id,version:null,repository:null,path:null,origin:'discovery-index',frontmatter:{}});
  const skills=[],unscoped=[];
  for(const skill of catalog.sort((a,b)=>a.id.localeCompare(b.id))) {
    if(explicit.has(skill.id))continue;
    const scope=applicability(skill,index),reasons=matchedBy(definition,kind,scope),installedNow=skill.origin!=='discovery-index';
    const record={id:skill.id,version:skill.version,source:scope.source,repository:skill.repository,path:skill.path,origin:skill.origin,availability:installedNow?'installed':'not-installed',use:scope.use};
    if(reasons.length)skills.push({...record,matchedBy:reasons});
    else if(installedNow&&!scope.processes.length&&!scope.roles.length&&!scope.stages.length)unscoped.push({id:skill.id,version:skill.version,source:scope.source,repository:skill.repository,path:skill.path,origin:skill.origin,availability:'installed'});
  }
  return {advisory:true,skills,unscoped,note:'Discovered specialist skills follow the pinned runtime and installed imports. Applicability comes from the packaged discovery index and from skill frontmatter. Discovery is advisory, is not stored in the consumer definition, and does not grant approval.'};
}
function skillDiscovery(definition,kind,projectRoot) {
  return assembleSkillDiscovery(definition,kind,installedSpecialistSkills(projectRoot),discoveryIndex());
}
function writeBatch(entries) {
  const before=entries.map(([file])=>({file,content:fs.existsSync(file)?fs.readFileSync(file):null})),written=[];
  try {for(const [file,value] of entries){write(file,value);written.push(file);}}
  catch(error) {
    for(const file of written.reverse()) {
      const prior=before.find(entry=>entry.file===file).content;
      try { if(prior===null){if(fs.existsSync(file))fs.unlinkSync(file);}else write(file,prior); } catch {}
    }
    throw error;
  }
}

export function roleProcessList(kind,root=globalRepository()) {
  typeName(kind);
  const meta=inside(root,'.agenthouse-global/state.json');
  const adopted=fs.existsSync(meta)?read(meta).adopted?.[kind]||{}:{};
  return baselineFiles(kind).map(({id})=>{const value=baseline(kind,id);return {id,title:value.title,summary:value.summary,adopted:!!adopted[id],baselineVersion:adopted[id]?.baselineVersion||null};});
}
export function roleProcessShow(kind,id,root=globalRepository(),projectRoot) {
  typeName(kind);const value=baseline(kind,id);
  const local=path.resolve(root),meta=inside(local,'.agenthouse-global/state.json'),file=localFile(local,kind,id);
  const adopted=fs.existsSync(meta)?read(meta).adopted?.[kind]?.[id]:null;
  if(adopted && fs.existsSync(file)) {const localValue=read(file);validated(kind==='roles'?'role':'process',localValue);assert(localValue.id===id,`Consumer definition identifier mismatch: ${id}`);return {source:'consumer-global-copy',baselineVersion:adopted.baselineVersion,availableBaselineVersion:baseVersion,definition:localValue,skillCoverage:coverage(localValue,kind),skillDiscovery:skillDiscovery(localValue,kind,projectRoot)};}
  return {source:'framework-baseline',baselineVersion:baseVersion,definition:value,skillCoverage:coverage(value,kind),skillDiscovery:skillDiscovery(value,kind,projectRoot)};
}
export function roleProcessAdopt(kind,id,root=globalRepository()) {
  typeName(kind);
  if(!id) {
    const results=[];
    for(const {id:key} of baselineFiles(kind))try{results.push(roleProcessAdopt(kind,key,root));}catch(error){results.push({status:'conflict',kind,id:key,reason:error.message});}
    return {kind,repository:path.resolve(root),results,adopted:results.filter(r=>r.status==='adopted').length,conflicts:results.filter(r=>r.status==='conflict').length};
  }
  const value=baseline(kind,id),repo=localRoot(root),destination=localFile(repo.root,kind,id);
  assert(!fs.existsSync(destination),`Consumer file already exists: ${path.relative(repo.root,destination)}; inspect it and use merge only when it has baseline lineage`);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  const digest=currentBaselineDigest(value),snapshot=snapshotFile(repo.root,kind,id,baseVersion,digest);
  const at=new Date().toISOString();
  repo.state.adopted[kind][id]={baselineVersion:baseVersion,baselineDigest:digest,ignoredRevisions:[],lastAdoptedAt:at};
  repo.state.history.push({action:'adopt',kind,id,baselineVersion:baseVersion,baselineDigest:digest,at});
  writeBatch([[destination,value],[snapshot,value],[repo.meta,repo.state]]);
  return {status:'adopted',kind,id,file:destination,baselineVersion:baseVersion,repository:repo.root};
}
function changes(before,after,prefix='',out=[]) {
  if(JSON.stringify(before)===JSON.stringify(after))return out;
  if(before && after && typeof before==='object' && typeof after==='object' && !Array.isArray(before) && !Array.isArray(after)) {
    for(const key of [...new Set([...Object.keys(before),...Object.keys(after)])].sort())changes(before[key],after[key],prefix?`${prefix}.${key}`:key,out);
  } else out.push({field:prefix,before:before===undefined?null:before,after:after===undefined?null:after});
  return out;
}
export function roleProcessCheck(kind,id,root=globalRepository(),projectRoot) {
  typeName(kind);const repo=path.resolve(root),meta=inside(repo,'.agenthouse-global/state.json');
  if(!fs.existsSync(meta))return {kind,repository:repo,results:id?[{id,status:'not-adopted'}]:[],summary:{updatesAvailable:0,ignored:0}};
  const state=read(meta);assert(state.schemaVersion===1&&state.adopted?.[kind],'Invalid global repository state');
  const ids=id?[safeId(id)]:Object.keys(state.adopted[kind]).sort();
  const results=ids.map(key=>{
    const record=state.adopted[kind][key],local=localFile(repo,kind,key);
    if(!record)return {id:key,status:'not-adopted'};
    if(!fs.existsSync(local))return {id:key,status:'missing-local-copy'};
    const base=snapshotFile(repo,kind,key,record.baselineVersion,record.baselineDigest);
    if(!fs.existsSync(base))return {id:key,status:'missing-baseline-snapshot'};
    const old=read(base),currentFile=path.join(baselineRoot,kind,`${key}.json`);
    if(!fs.existsSync(currentFile))return {id:key,status:'baseline-retired',baselineVersion:record.baselineVersion,localChanges:changes(old,read(local))};
    const current=baseline(kind,key),localValue=read(local);validated(kind==='roles'?'role':'process',localValue);assert(localValue.id===key,`Consumer definition identifier mismatch: ${key}`);
    const baselineChanges=changes(old,current),localChanges=changes(old,localValue);
    const changed=record.baselineVersion!==baseVersion||currentBaselineDigest(current)!==record.baselineDigest;
    const digest=currentBaselineDigest(current),ignored=(record.ignoredRevisions||[]).some(revision=>revision.version===baseVersion&&revision.digest===digest);
    return {id:key,status:changed?'update-available':'current',baselineVersion:record.baselineVersion,availableVersion:baseVersion,ignored,baselineChanges,localChanges,conflicts:mergeRoleProcessDefinition(old,localValue,current).conflicts,skillCoverage:coverage(localValue,kind),skillDiscovery:skillDiscovery(localValue,kind,projectRoot)};
  });
  const available=results.filter(r=>r.status==='update-available');
  return {kind,repository:repo,results,summary:{updatesAvailable:available.length,ignored:available.filter(r=>r.ignored).length}};
}
export function mergeRoleProcessDefinition(base,local,upstream,pathName='',conflicts=[]) {
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  if(equal(local,base))return {value:upstream,conflicts};
  if(equal(upstream,base) || equal(local,upstream))return {value:local,conflicts};
  if(base && local && upstream && [base,local,upstream].every(v=>typeof v==='object'&&!Array.isArray(v))) {
    const result={};
    for(const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(upstream)])) {
      const merged=mergeRoleProcessDefinition(base[key],local[key],upstream[key],pathName?`${pathName}.${key}`:key,conflicts);
      if(merged.value!==undefined)result[key]=merged.value;
    }
    return {value:result,conflicts};
  }
  conflicts.push({field:pathName,base:base??null,local:local??null,upstream:upstream??null});
  return {value:local,conflicts};
}
export function roleProcessMerge(kind,id,root=globalRepository()) {
  typeName(kind);safeId(id);const {root:repo,meta,state}=localRoot(root),record=state.adopted[kind][id];
  assert(record,`${kind.slice(0,-1)} ${id} has no baseline lineage; adopt the baseline before merging`);
  const upstreamFile=path.join(baselineRoot,kind,`${id}.json`);
  assert(fs.existsSync(upstreamFile),`Baseline ${id} was retired; review the retained consumer copy and migration guidance manually`);
  const basePath=snapshotFile(repo,kind,id,record.baselineVersion,record.baselineDigest),localPath=localFile(repo,kind,id);
  assert(fs.existsSync(basePath) && fs.existsSync(localPath),'Local copy or previous baseline snapshot is missing');
  const base=read(basePath),local=read(localPath),upstream=baseline(kind,id),merged=mergeRoleProcessDefinition(base,local,upstream);
  if(merged.conflicts.length)return {status:'conflict',kind,id,from:record.baselineVersion,to:baseVersion,conflicts:merged.conflicts,changed:false};
  if(record.baselineVersion===baseVersion && record.baselineDigest===currentBaselineDigest(upstream))return {status:'current',kind,id,baselineVersion:baseVersion,changed:false};
  const from=record.baselineVersion;
  validated(kind==='roles'?'role':'process',merged.value);
  const digest=currentBaselineDigest(upstream);
  const at=new Date().toISOString();
  record.baselineVersion=baseVersion;record.baselineDigest=digest;record.lastAdoptedAt=at;record.ignoredRevisions=(record.ignoredRevisions||[]).filter(v=>v.version!==baseVersion||v.digest!==digest);
  state.history.push({action:'merge',kind,id,fromVersion:from,fromDigest:hash(base),baselineVersion:baseVersion,baselineDigest:digest,at});
  writeBatch([[localPath,merged.value],[snapshotFile(repo,kind,id,baseVersion,digest),upstream],[meta,state]]);
  return {status:'merged',kind,id,from,to:baseVersion,file:localPath,changed:true};
}
export function roleProcessIgnore(kind,id,root=globalRepository()) {
  typeName(kind);safeId(id);const {root:repo,meta,state}=localRoot(root),record=state.adopted[kind][id];
  assert(record,`${kind.slice(0,-1)} ${id} has no baseline lineage`);
  const digest=currentBaselineDigest(baseline(kind,id)),at=new Date().toISOString();
  record.ignoredRevisions=[...(record.ignoredRevisions||[]).filter(v=>v.version!==baseVersion||v.digest!==digest),{version:baseVersion,digest}];
  state.history.push({action:'ignore',kind,id,baselineVersion:baseVersion,baselineDigest:digest,at});write(meta,state);
  return {status:'ignored',kind,id,baselineVersion:baseVersion,baselineDigest:digest,repository:repo};
}
export function processOrientation(description) {
  assert(typeof description==='string'&&description.trim(),'Provide --description with current evidence or situation');
  const text=description.toLowerCase();
  const signals=[
    ['discover',/market|customer|user interview|problem|opportunity|validation/],
    ['define',/requirement|acceptance|scope|feature request/],
    ['design',/architecture|design|interface|risk/],
    ['plan',/estimate|priority|plan|ready/],
    ['implement',/implement|coding|development|fixing/],
    ['verify',/test|verify|review|quality/],
    ['release',/release|deploy|launch/],
    ['operate',/production|support|incident|monitor/],
    ['learn',/feedback|outcome|retrospective|improvement/]
  ];
  const matches=signals.filter(([,pattern])=>pattern.test(text)).map(([stage])=>stage);
  return {status:matches.length===1?'possible-match':matches.length?'ambiguous':'needs-human-orientation',candidateStages:matches,providedEvidence:description,authoritativeStatusSource:null,advisory:true,nextPrompt:'Compare this description with your authoritative work item or team process. Confirm the current stage and where that status is recorded; this assessment does not update it.'};
}
