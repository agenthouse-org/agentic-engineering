import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {generateKeyPairSync} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {assert,read,write,create,hash,inside,walk,exclusive,PACKAGE,VERSION,canonical,validated,safeId} from './io.js';
import {resolve} from './policy.js';
import {hookSettings} from './hooks.js';
import {bundledDependency,hookLock,bundledDependencies,SOURCES,checkDependencyPin,checkPresentPins} from './dependencies.js';
import {gitignoreBody} from './housekeep.js';
import {block,blocks} from './managed-blocks.js';
import {machineHome,runtimeDirectory,storeTree,skillDirectory,verifyTree} from './storage.js';

export const AGENTS={claude:'CLAUDE.md',codex:'AGENTS.md',opencode:'AGENTS.md',cursor:'.cursor/rules/agenthouse.mdc',windsurf:'.windsurf/rules/agenthouse.md',openclaw:'AGENTS.md'};
export function detect(root) {
  return Object.keys(AGENTS).filter(a=>fs.existsSync(path.join(root,'.'+(a==='claude'?'claude':a))) || fs.existsSync(path.join(os.homedir(),'.'+a)) || fs.existsSync(path.join(root,AGENTS[a])));
}
export function cachePayload(data=payload()) {
  verifyPayload(data);
  const digest=hash(data);
  const runtime=storeTree(`runtime/${data.version}-${digest}`,data.files);
  for(const {data:skill,lock} of bundledDependencies(data))storeTree(`skills/${lock.id}/${lock.digest}`,skill.files);
  return {storage:'machine',version:data.version,digest,runtime,home:machineHome()};
}
function centralLauncher() {
  return `import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const active=JSON.parse(fs.readFileSync(new URL('./active.json',import.meta.url),'utf8'));
if(!/^[a-f0-9]{64}$/.test(active.digest) || !/^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$/.test(active.version) || active.runtime!==\`runtime/\${active.version}-\${active.digest}\`)throw new Error('Invalid central runtime pin');
const home=process.env.AGENTHOUSE_HOME || path.join(os.homedir(),'.agenthouse');
if(!path.isAbsolute(home))throw new Error('AGENTHOUSE_HOME must be an absolute path');
const target=path.join(home,active.runtime,'bin/ah-engineering.js');
if(!fs.existsSync(target))throw new Error('Exact central runtime missing; run ah-engineering restore from the matching package or original offline bundle');
await import(pathToFileURL(target).href);
`;
}
export function projectContext(root) {
  const state=installationStatus(root),runtime=runtimeDirectory(root);
  const data=payload(runtime);
  const ids=new Set(Object.keys(data.files).flatMap(file=>file.match(/^skills\/([^/]+)\/SKILL.md$/)?.slice(1) || []));
  for(const {lock} of bundledDependencies(data))ids.add(lock.id);
  const imports=inside(root,'.agenthouse/skills.json');
  if(fs.existsSync(imports))for(const id of Object.keys(read(imports)))ids.add(id);
  return {root,version:state.version,storage:state.storage || 'project',integration:state.integration || 'shared',
    instructions:'Read the lifecycle and applicable skills at the paths below. Run the project launcher from the target repository root. Resolve relative skill resources against the containing skill directory; central files are immutable. Use usability setup/run for the bundled audit tool instead of installing dependencies into a skill directory. Repository policy takes precedence over personal preferences. Skills are advisory; never invent evidence or governance approval.',
    lifecycle:inside(runtime,'docs/lifecycle.md'),commands:inside(runtime,'docs/agent-commands.md'),
    skills:Object.fromEntries([...ids].sort().map(id=>[id,inside(skillDirectory(root,id),'SKILL.md')]))};
}
export function payload(source=PACKAGE) {
  const metadata=read(path.join(source,'package.json'));
  const files={};
  for(const name of ['bin','src','schemas','skills','modules','templates','adapters','docs','dependencies']) {
    if(fs.existsSync(path.join(source,name)))for(const file of walk(path.join(source,name)))files[`${name}/${file}`]=fs.readFileSync(path.join(source,name,file)).toString('base64');
  }
  for(const file of ['package.json','README.md','LICENSE','.codex-plugin/plugin.json','.claude-plugin/plugin.json','.claude-plugin/marketplace.json','.agents/plugins/marketplace.json']) if(fs.existsSync(path.join(source,file)))files[file]=fs.readFileSync(path.join(source,file)).toString('base64');
  return {schemaVersion:1,version:metadata.version,files};
}
export function verifyPayload(data) {
  assert(data.schemaVersion===1 && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(data.version) && data.files && typeof data.files==='object','Invalid bundle');
  assert(Object.keys(data.files).length<5000,'Bundle file limit exceeded');
  let total=0;
  for(const [name,content] of Object.entries(data.files)) {
    assert(/^(bin|src|schemas|skills|modules|templates|adapters|docs|dependencies)\//.test(name) || ['package.json','README.md','LICENSE','.codex-plugin/plugin.json','.claude-plugin/plugin.json','.claude-plugin/marketplace.json','.agents/plugins/marketplace.json'].includes(name),`Disallowed bundle path: ${name}`);
    inside(os.tmpdir(),name);
    assert(typeof content==='string' && Buffer.from(content,'base64').toString('base64')===content,'Invalid bundle encoding');
    total+=Buffer.byteLength(content,'base64');assert(total<50*1024*1024,'Bundle size limit exceeded');
  }
  assert(data.files['bin/ah-engineering.js'] && data.files['src/cli.js'],'Bundle missing runtime');
  assert(JSON.parse(Buffer.from(data.files['package.json'],'base64')).version===data.version,'Bundle version mismatch');
  bundledDependencies(data);
  hookLock(data);
  return data;
}
function journalPath(root){return inside(root,'.agenthouse/transaction.json');}
// Git can check out tracked text with different line endings on another OS.
// Ownership still rejects every change other than LF/CRLF conversion.
function ownedTextMatches(content,digest) {
  const lf=content.replace(/\r\n/g,'\n');
  return hash(content)===digest || hash(lf)===digest || hash(lf.replace(/\n/g,'\r\n'))===digest;
}
export function recover(root) {
  const file=journalPath(root);if(!fs.existsSync(file))return false;
  const journal=read(file);
  for(const entry of [...journal].reverse()) {
    const dest=inside(root,entry.path),current=fs.existsSync(dest)?fs.readFileSync(dest).toString('base64'):null;
    assert(current===entry.after || current===entry.before,`Recovery conflict: ${entry.path}`);
    if(entry.before===null) { if(fs.existsSync(dest))fs.unlinkSync(dest); }
    else write(dest,Buffer.from(entry.before,'base64'));
  }
  fs.unlinkSync(file);return true;
}
export function transact(root,changes,finish) {
  assert(!fs.existsSync(journalPath(root)),'Interrupted transaction found; run recover');
  const journal=changes.map(c=>({path:c.path,before:fs.existsSync(inside(root,c.path))?fs.readFileSync(inside(root,c.path)).toString('base64'):null,after:c.content===null?null:Buffer.from(c.content).toString('base64')}));
  write(journalPath(root),journal);
  try {
    for(const c of changes) {const file=inside(root,c.path);if(c.content===null){if(fs.existsSync(file))fs.unlinkSync(file);}else write(file,c.content);}
    if(finish) {
      const extra=finish();
      for(const c of extra)journal.push({path:c.path,before:fs.existsSync(inside(root,c.path))?fs.readFileSync(inside(root,c.path)).toString('base64'):null,after:Buffer.from(c.content).toString('base64')});
      write(journalPath(root),journal);
      for(const c of extra)write(inside(root,c.path),c.content);
    }
    fs.unlinkSync(journalPath(root));
  }catch(error){recover(root);throw error;}
}
function managed(root,desired,state) {
  const changes=[],ownership={};
  for(const [relative,entry] of Object.entries(desired)) {
    const file=inside(root,relative),existing=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null,prior=state.files?.[relative];
    let content=entry.content;
    if(entry.block) {
      const current=blocks(existing || '');
      assert(current.length<=1,`Duplicate managed block: ${relative}`);
      if(current.length) assert(prior?.block && ownedTextMatches(current[0],prior.digest),`Modified/unowned managed block: ${relative}`);
      else assert(!prior,`Managed block removed: ${relative}`);
      const b=block(content,relative);
      content=current.length?existing.replace(current[0],b):`${existing || ''}${existing?'\n\n':''}${b}\n`;
      ownership[relative]={block:true,digest:hash(b),created:prior?.created ?? existing===null};
    }else {
      if(existing!==null)assert(prior && ownedTextMatches(existing,prior.digest),`Existing or modified file: ${relative}`);
      ownership[relative]={block:false,digest:hash(content)};
    }
    changes.push({path:relative,content});
  }
  return {changes,ownership};
}
export function installationStatus(root) {
  const state=read(inside(root,'.agenthouse/installation.json'));
  const active=read(inside(root,'.agenthouse/active.json'));
  assert(active.version===state.version && active.digest===state.digest,'Active pin differs from installation');
  for(const [relative,entry] of Object.entries(state.files)) {
    const file=inside(root,relative);
    assert(fs.existsSync(file),`Missing managed file: ${relative}; run restore`);
    const content=fs.readFileSync(file,'utf8');
    const found=entry.block?blocks(content):null;
    assert(!entry.block || found?.length===1,`Missing/duplicate managed block: ${relative}`);
    assert(ownedTextMatches(entry.block?found[0]:content,entry.digest),`Modified managed file: ${relative}`);
  }
  if(active.storage==='machine') {
    const data=payload(runtimeDirectory(root,active));
    assert(hash(data)===active.digest,'Central runtime modified');
    verifyTree(runtimeDirectory(root,active),data.files);
  }
  return state;
}
export function restore(root,options={}) {
  const state=read(inside(root,'.agenthouse/installation.json'));
  const active=read(inside(root,'.agenthouse/active.json'));
  assert(active.version===state.version && active.digest===state.digest,'Active pin differs from installation');
  assert(Array.isArray(state.agents),'Installation is missing the recorded agent list');
  resolve(root,{frameworkVersion:state.version,frozen:true});
  const source=runtimeDirectory(root,active);
  let data;
  if(options.bundle)data=read(path.resolve(options.bundle));
  else if(fs.existsSync(source))data=payload(source);
  else data=payload();
  verifyPayload(data);
  assert(data.version===state.version && hash(data)===state.digest,'Exact pinned restore source unavailable or modified; supply --bundle with the original unsigned framework bundle');
  return install(root,{payload:data,agents:state.agents,expectedDigest:state.digest,restore:true,ignoreGenerated:options.ignoreGenerated});
}
export function install(root,options={}) {
  assert(!options.autonomy || ['supervised','bounded','delegated'].includes(options.autonomy),'Invalid autonomy profile');
  const project=options.project || path.basename(root).replace(/[^a-zA-Z0-9_.-]/g,'-').replace(/^[^a-zA-Z0-9]+/,'') || 'project';safeId(project);
  if(options.policy)validated('policy',read(path.resolve(options.policy)));
  fs.mkdirSync(root,{recursive:true});
  return exclusive(root,()=>{
    const stateFile=inside(root,'.agenthouse/installation.json'),state=fs.existsSync(stateFile)?read(stateFile):{files:{}};
    const data=verifyPayload(options.payload || payload());
    const dependencies=bundledDependencies(data),hooks=hookLock(data);
    if(hooks)checkDependencyPin(root,hooks);
    checkPresentPins(root,[...dependencies.map(d=>d.lock.id),...(hooks?[hooks.id]:[])]);
    for(const dependency of dependencies)checkDependencyPin(root,dependency.lock);
    if(options.expectedDigest)assert(state.digest===options.expectedDigest,'Installation changed during dependency update; retry');
    if(fs.existsSync(inside(root,'.agenthouse/config.json')))resolve(root,{frameworkVersion:data.version,persist:false,frozen:!!options.restore});
    const agents=options.agents || state.agents || detect(root);
    const storage=options.storage || state.storage || (state.version?'project':'machine');
    const integration=options.integration || state.integration || 'shared';
    assert(['project','machine'].includes(storage),'Invalid storage mode');
    assert(['shared','private'].includes(integration),'Choose shared or private integration');
    assert(integration!=='private' || storage==='machine','Private integration requires central storage');
    gitignoreBody(root,options.artifactPaths || []); // Validate configured paths before activation in either mode.
    assert(!state.version || !options.integration || options.integration===(state.integration || 'shared'),'Changing integration mode requires uninstall first; consumer data is preserved');
    if(integration==='private') {
      const tracked=spawnSync('git',['-C',root,'ls-files','-z','--','.agenthouse'],{encoding:'utf8',windowsHide:true});
      assert(tracked.status===0,'Private integration requires a Git repository');
      assert(!tracked.stdout,'Private integration cannot hide tracked .agenthouse files; keep shared integration or explicitly relocate existing project state');
    }
    const ignoreGenerated=options.ignoreGenerated ?? state.ignoreGenerated ?? !state.version;
    for(const a of agents)assert(Object.hasOwn(AGENTS,a),`Unsupported agent ${a}`);
    const digest=hash(data),runtime=`runtime/${data.version}-${storage==='machine'?digest:digest.slice(0,12)}`;
    const active={runtime,version:data.version,digest,...(storage==='machine'?{storage}:{})};
    const runtimePath=runtimeDirectory(root,active);
    if(storage==='machine') {
      const shared=machineHome(),target=path.resolve(root);
      assert(shared!==target && !shared.startsWith(target+path.sep),'AGENTHOUSE_HOME must be outside the target repository');
      assert(data.files['src/storage.js'],'This runtime does not support central storage; retain the legacy installation until a compatible release is available');
      cachePayload(data);
    }
    else for(const [rel,b64] of Object.entries(data.files)) {
      const file=inside(runtimePath,rel),bytes=Buffer.from(b64,'base64');
      if(fs.existsSync(file))assert(hash(fs.readFileSync(file))===hash(bytes),`Runtime modified: ${rel}`);
      else create(file,bytes);
    }
    const health=spawnSync(process.execPath,[inside(runtimePath,'bin/ah-engineering.js'),'--help'],{encoding:'utf8',timeout:10000,windowsHide:true});
    assert(health.status===0,`New runtime failed health check: ${health.stderr || health.error?.message}`);
    const guidance='## agenthouse engineering\nDiscover agent commands in `.agenthouse/agent-commands.md`; every CLI operation has an ah-prefixed skill. At task start run `node .agenthouse/run.mjs session` and read `.agenthouse/resolved.json` plus `.agenthouse/lifecycle.md`. Use the lifecycle record and its acceptance criteria; never invent approval or evidence. If work is too large for one ticket, warn and ask before creating split work items or related branches (`work branch` needs `git.branchNaming`). If a new ask is out of scope, warn, stop, and ask whether to open a new work item, expand recorded scope, or override with `fields.scopeNotes`. For UI changes read and follow `.agents/skills/frontend-acceptance/SKILL.md` from agenthouse-skills and inspect real screenshots, then run `node .agenthouse/run.mjs housekeep`. Use `node .agenthouse/run.mjs evaluate --profile pull-request --frozen` for the configured checks. These instructions are advisory; CI and signed decisions supply boundary controls.';
    const desired={
      '.agenthouse/run.mjs':{content:`import fs from 'node:fs';\nimport {fileURLToPath} from 'node:url';\nconst active=JSON.parse(fs.readFileSync(new URL('./active.json',import.meta.url),'utf8'));\nconst target=new URL('./'+active.runtime+'/bin/ah-engineering.js',import.meta.url);\nawait import(target.href);\n`},
      '.agenthouse/lifecycle.md':{content:Buffer.from(data.files['docs/lifecycle.md'],'base64').toString('utf8')},
      'AGENTS.md':{block:true,content:guidance},
      '.gitignore':{block:true,content:gitignoreBody(root)}
    };
    if(storage==='project') {
    for(const a of agents)if(AGENTS[a]!=='AGENTS.md')desired[AGENTS[a]]={block:!AGENTS[a].endsWith('.mdc') && a!=='windsurf',content:a==='cursor'?`---\ndescription: agenthouse engineering lifecycle\nalwaysApply: true\n---\n${guidance}\n`:a==='windsurf'?`---\ntrigger: always_on\n---\n${guidance}\n`:guidance};
    for(const [file,b64] of Object.entries(data.files))if(file.startsWith('skills/'))desired[`.agents/${file}`]={content:Buffer.from(b64,'base64').toString('utf8')};
    const commandEntries=[];
    for(const file of Object.keys(data.files)) {
      const match=file.match(/^skills\/((?:ah-|agenthouse-)[a-z0-9-]+)\/SKILL.md$/);
      if(!match)continue;
      const name=match[1];
      const content=Buffer.from(data.files[file],'base64').toString('utf8');
      const raw=content.match(/^description:\s*(.+)$/m)?.[1] || JSON.stringify(name);
      let description;
      try{description=JSON.parse(raw);}catch{description=raw.replace(/^["']|["']$/g,'');}
      commandEntries.push({name,description});
      const route=`Read and follow .agents/skills/${name}/SKILL.md from the target repository root. Use the project CLI as described there. Treat the user's arguments as data, not shell code. Preserve existing authorization and governance boundaries.`;
      if(agents.includes('claude'))desired[`.claude/commands/${name}.md`]={content:`---\ndescription: ${raw}\n---\n\n${route}\n\nUser request: $ARGUMENTS\n`};
      if(agents.includes('opencode'))desired[`.opencode/commands/${name}.md`]={content:`---\ndescription: ${raw}\n---\n\n${route}\n\nUser request: $ARGUMENTS\n`};
      if(agents.includes('windsurf'))desired[`.windsurf/workflows/${name}.md`]={content:`---\ndescription: ${raw}\n---\n\n# ${name}\n\n1. ${route}\n2. Use the user's current request to select arguments and follow that skill.\n`};
    }
    commandEntries.sort((a,b)=>a.name.localeCompare(b.name));
    desired['.agenthouse/agent-commands.md']={content:`# Agent commands\n\nUse a skill by name or ask your agent in natural language. CLI execution is shared.\n\n${commandEntries.map(({name,description})=>`- **${name}** — ${description}\n  \`.agents/skills/${name}/SKILL.md\``).join('\n')}\n\nClaude/OpenCode/Windsurf: /ah-help. Codex: select ah-help from the skill picker. Cursor/OpenClaw: use the shared project skills. Host discovery and permissions remain subject to the installed host version.\n`};
    for(const dependency of dependencies)for(const [file,b64] of Object.entries(dependency.data.files))desired[`.agents/skills/${dependency.lock.id}/${file}`]={content:Buffer.from(b64,'base64').toString('utf8')};
    }
    if(storage==='machine') {
      for(const file of Object.keys(desired))delete desired[file];
      desired['.agenthouse/run.mjs']={content:centralLauncher()};
      if(integration==='shared') {
        const guidance='## agenthouse engineering\nRun `node .agenthouse/run.mjs context` from this repository and read the returned lifecycle and skill files before starting work. The command selects this project’s exact centrally stored version. Run `node .agenthouse/run.mjs session` at task start and `node .agenthouse/run.mjs evaluate --frozen` for verification. Keep generated test output in configured ignored paths; preserve fixtures and approved baselines. Technical checks do not grant governance approval.';
        desired['AGENTS.md']={block:true,content:guidance};
        for(const agent of agents)if(AGENTS[agent]!=='AGENTS.md')desired[AGENTS[agent]]={block:!['cursor','windsurf'].includes(agent),content:agent==='cursor'?`---\ndescription: agenthouse engineering\nalwaysApply: true\n---\n${guidance}\n`:agent==='windsurf'?`---\ntrigger: always_on\n---\n${guidance}\n`:guidance};
        desired['.gitignore']={block:true,content:gitignoreBody(root,options.artifactPaths || [])};
        desired['.agenthouse/.gitignore']={content:'local/\nevidence/\nruntime/\nsessions/\ntransaction.json\nmutation.lock\nbrowser-assessment.json\n'};
      }else desired['.agenthouse/.gitignore']={content:'*\n'};
    }
    desired['.agenthouse/dependencies.lock.json']={content:JSON.stringify({schemaVersion:1,dependencies:Object.fromEntries(dependencies.map(d=>[d.lock.id,d.lock]))},null,2)+'\n'};
    if(storage==='project' && ignoreGenerated) {
      const generated=Object.keys(desired).filter(file=>/^\.(agents\/skills|claude\/commands|opencode\/commands|windsurf\/workflows)\//.test(file));
      desired['.gitignore'].content+='\n'+generated.sort().map(file=>'/'+file.replace(/[!*?\[\]\\ ]/g,character=>'\\'+character)).join('\n');
    }
    const adoption={...state,files:{...state.files}};
    // A previous uninstall deliberately retained this exclusion file with consumer state.
    const retainedIgnore=inside(root,'.agenthouse/.gitignore');
    if(!state.version && desired['.agenthouse/.gitignore'] && fs.existsSync(retainedIgnore) && fs.readFileSync(retainedIgnore,'utf8')===desired['.agenthouse/.gitignore'].content)
      adoption.files['.agenthouse/.gitignore']={block:false,digest:hash(desired['.agenthouse/.gitignore'].content)};
    if(storage==='project')for(const dependency of dependencies) {
    const skillDirectory=inside(root,`.agents/skills/${dependency.lock.id}`);
    if(fs.existsSync(skillDirectory))for(const file of walk(skillDirectory))assert(dependency.lock.files[file] || state.files[`.agents/skills/${dependency.lock.id}/${file}`],`Unowned dependency file: ${file}`);
    for(const [file,digest] of Object.entries(dependency.lock.files)) {
      const rel=`.agents/skills/${dependency.lock.id}/${file}`,dest=inside(root,rel);
      if(!adoption.files[rel] && fs.existsSync(dest) && hash(fs.readFileSync(dest))===digest)adoption.files[rel]={block:false,digest};
    }
    }
    const removed=[];
    for(const old of Object.keys(state.files))if(!desired[old] && (Object.keys(SOURCES).some(id=>old.startsWith('.agents/skills/'+id+'/')) || storage==='machine' && ['.agenthouse/lifecycle.md','.agenthouse/agent-commands.md'].includes(old) || /^\.(agents\/skills|claude\/commands|opencode\/commands|windsurf\/workflows)\/(?:ah-|agenthouse-)/.test(old))) {
      assert(ownedTextMatches(fs.readFileSync(inside(root,old),'utf8'),state.files[old].digest),`Modified dependency file: ${old}`);
      removed.push({path:old,content:null});
    }
    // Keep previously selected adapters on upgrade rather than orphaning their owned files.
    for(const old of Object.keys(state.files))assert(desired[old] || removed.some(c=>c.path===old),`Cannot drop installed adapter implicitly: ${old}; uninstall first`);
    const {changes,ownership}=managed(root,desired,adoption);
    if(options.restore) {
      for(const [relative,entry] of Object.entries(ownership)) {
        assert(state.files[relative] && (relative==='.gitignore' && options.ignoreGenerated!==undefined || hash(entry)===hash(state.files[relative])),`Restore projection differs from installation: ${relative}`);
      }
      assert(Object.keys(ownership).length===Object.keys(state.files).length,'Restore inventory differs from installation');
    }
    changes.push(...removed);
    // A rollback to a runtime without engineering hooks must not leave active
    // handlers pointing at a command that the restored runtime cannot execute.
    if(!hooks && !options.restore)changes.push(...hookSettings(root,{remove:true}).changes);
    const importFile=inside(root,'.agenthouse/skills.json');
    if(fs.existsSync(importFile) && !options.restore) {
      const imports=read(importFile);
      for(const dependency of dependencies)if(imports[dependency.lock.id]){delete imports[dependency.lock.id];changes.push({path:'.agenthouse/skills.json',content:JSON.stringify(imports,null,2)+'\n'});}
    }
    if(state.digest!==digest && fs.existsSync(inside(root,'.agenthouse/active.json')))changes.push({path:'.agenthouse/previous.json',content:JSON.stringify({state,active:read(inside(root,'.agenthouse/active.json'))})});
    changes.push({path:'.agenthouse/active.json',content:JSON.stringify(active)}, {path:'.agenthouse/installation.json',content:JSON.stringify({version:data.version,agents,files:ownership,digest,ignoreGenerated,storage,integration})});
    if(!fs.existsSync(inside(root,'.agenthouse/config.json'))) {
      const policySources=[];
      function initial(relative,value) {
        assert(!fs.existsSync(inside(root,relative)),`Existing initial configuration: ${relative}`);
        changes.push({path:relative,content:typeof value==='string'?value:JSON.stringify(value,null,2)+'\n'});
      }
      if(options.policy) {
        const policy=read(path.resolve(options.policy));initial('.agenthouse/organization.json',policy);policySources.push('.agenthouse/organization.json');
      }else {
        const {privateKey,publicKey}=generateKeyPairSync('ed25519');
        initial('.agenthouse/local/owner.key',privateKey.export({type:'pkcs8',format:'pem'}));
        initial('.agenthouse/policy.json',{schemaVersion:1,id:'project-policy',revision:'1',owner:'project-owner',authorities:{'project-owner':publicKey.export({type:'spki',format:'pem'})},rules:[]});
        policySources.push('.agenthouse/policy.json');
      }
      initial('.agenthouse/local/.gitignore','*\n');
      initial('.agenthouse/config.json',{schemaVersion:1,project,...(storage==='machine'?{artifacts:{outputs:options.artifactPaths || [],baselines:[],cleanup:[]}}:{}),...(options.policy?{}:{autonomy:options.autonomy || 'supervised',documentationAuthority:'git'}),policySources,
        evaluators:[{id:'readiness',kind:'work-item',file:'.agenthouse/work/first-change.json',stage:'plan'}],profiles:{'pull-request':{checks:[{evaluator:'readiness',required:true}]}}});
    }
    transact(root,changes,options.restore?undefined:()=>[{path:'.agenthouse/resolved.json',content:JSON.stringify(resolve(root,{frameworkVersion:data.version,persist:false}).snapshot,null,2)+'\n'}]);
    return {version:data.version,agents,root,storage,integration,advisoryAdapters:true};
  });
}
export function uninstall(root) {
  return exclusive(root,()=>{
    const file=inside(root,'.agenthouse/installation.json'),state=read(file),changes=[];
    for(const [rel,entry] of Object.entries(state.files)) {
      if(rel==='.agenthouse/.gitignore')continue; // Retained private state must stay private after uninstall.
      const dest=inside(root,rel);assert(fs.existsSync(dest),`Missing managed file: ${rel}`);
      const current=fs.readFileSync(dest,'utf8');
      if(entry.block) {
        const found=blocks(current);
        assert(found?.length===1 && ownedTextMatches(found[0],entry.digest),`Modified managed block: ${rel}`);
        const remaining=current.replace(found[0],'');
        changes.push({path:rel,content:entry.created && !remaining.trim()?null:remaining});
      }else {assert(ownedTextMatches(current,entry.digest),`Modified managed file: ${rel}`);changes.push({path:rel,content:null});}
    }
    changes.push({path:'.agenthouse/installation.json',content:null},{path:'.agenthouse/active.json',content:null});
    changes.push(...hookSettings(root,{remove:true}).changes);
    transact(root,changes);return {removed:true,preserved:'configuration, policies, keys, evidence, work records and cached runtime'};
  });
}
